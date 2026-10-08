"""Sanjaya outputs: everything we build ON TOP of a LingBot-Map reconstruction.

The reconstruction itself comes from ``pipeline.py`` (community LingBot-Map Space,
Apache-2.0). This module turns its predictions into the files Sanjaya needs:

  * keyframe pack  - a few evenly spaced frames with a per-pixel 3D point map, so the
                     Node backend can turn "Gemini says: door at pixel (u, v)" into a
                     3D position without any GPU.
  * trajectory     - camera centres + poses in the SAME coordinates as scene.glb.
  * floor plan     - a top-down sketch (wall-height slice of the point cloud) with the
                     camera path drawn in Sanjaya amber. Beta, approximate scale.
  * bundle zip     - manifest.json + all of the above, one download for the backend.

Everything here runs on CPU.
"""

from __future__ import annotations

import io
import json
import os
import tempfile
import time
import zipfile
from typing import Dict, List, Optional

import numpy as np

import pipeline as P

ENGINE_VERSION = "sanjaya-engine 0.1.0"
TRACE_AMBER = "#F5A524"


# =============================================================================
# Coordinate helpers (everything is exported in scene.glb coordinates)
# =============================================================================

def _w2c_4x4(extrinsic: np.ndarray) -> np.ndarray:
    extr = np.asarray(extrinsic, dtype=np.float64)
    w2c = np.repeat(np.eye(4)[None], len(extr), axis=0)
    w2c[:, :3, :4] = extr
    return w2c


def scene_transform(extrinsic: np.ndarray) -> np.ndarray:
    """The exact 4x4 transform pipeline.build_glb_from_points applies to the scene."""
    return P._alignment_transform(_w2c_4x4(extrinsic))


def _apply(T: np.ndarray, pts: np.ndarray) -> np.ndarray:
    pts = np.asarray(pts, dtype=np.float64)
    return pts @ T[:3, :3].T + T[:3, 3]


def aligned_camera_poses(extrinsic: np.ndarray, T: np.ndarray) -> np.ndarray:
    """Camera-to-world poses [S,4,4] in scene.glb coordinates."""
    c2w = np.linalg.inv(_w2c_4x4(extrinsic))
    return np.einsum("ij,sjk->sik", T, c2w)


def up_vector(poses: np.ndarray) -> np.ndarray:
    """Average 'up' direction of the camera over the walk (OpenCV camera up = -Y)."""
    ups = poses[:, :3, :3] @ np.array([0.0, -1.0, 0.0])
    u = ups.mean(axis=0)
    n = np.linalg.norm(u)
    return u / n if n > 1e-9 else np.array([0.0, 1.0, 0.0])


# =============================================================================
# Keyframe pack (for Gemini labelling + 2D -> 3D lifting in the backend)
# =============================================================================

def _world_maps(vis: dict):
    if "world_points" in vis:
        world = np.asarray(vis["world_points"], np.float32)
        conf = np.asarray(vis.get("world_points_conf"), np.float32)
    else:
        world = np.asarray(
            P.unproject_depth_map_to_point_map(vis["depth"], vis["extrinsic"], vis["intrinsic"]),
            np.float32,
        )
        conf = np.asarray(vis["depth_conf"], np.float32)
    return world, conf


def _images_nhwc_uint8(vis: dict) -> np.ndarray:
    imgs = np.asarray(vis["images"])
    if imgs.ndim == 4 and imgs.shape[1] == 3:
        imgs = np.transpose(imgs, (0, 2, 3, 1))
    return np.clip(imgs * 255.0, 0, 255).astype(np.uint8)


def pick_keyframes(num_frames: int, k: int = 8) -> List[int]:
    k = max(1, min(k, num_frames))
    return sorted({int(round(x)) for x in np.linspace(0, num_frames - 1, k)})


def build_keyframe_pack(vis: dict, k: int = 8, stride: int = 2) -> dict:
    """Small, GPU-free payload: K frames with RGB + per-pixel 3D points (world coords,
    NOT yet aligned) + confidence, plus every frame's extrinsic for the trajectory."""
    world, conf = _world_maps(vis)
    imgs = _images_nhwc_uint8(vis)
    idx = pick_keyframes(world.shape[0], k)
    intr = np.asarray(vis.get("intrinsic"), np.float32) if vis.get("intrinsic") is not None else None
    pack = {
        "idx": idx,
        "rgb": np.ascontiguousarray(imgs[idx, ::stride, ::stride]),
        "xyz": np.ascontiguousarray(world[idx, ::stride, ::stride]),
        "conf": np.ascontiguousarray(conf[idx, ::stride, ::stride]),
        "extrinsic": np.asarray(vis["extrinsic"], np.float32),
        "stride": stride,
        "full_hw": [int(world.shape[1]), int(world.shape[2])],
    }
    if intr is not None:
        K = intr[idx].copy()
        K[:, :2, :] /= stride
        pack["intrinsic"] = K
    return pack


# =============================================================================
# Floor plan (beta)
# =============================================================================

def floor_plan_png(rec: dict, T: np.ndarray, poses: np.ndarray, out_path: str,
                   conf_pct: float = 50.0, size_px: int = 900) -> Optional[str]:
    """Top-down sketch: keep a wall-height slice of the cloud (drops floor + ceiling),
    project it onto the ground plane, and draw the camera path in amber."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    pts = np.asarray(rec["points"], np.float64)
    conf = np.asarray(rec["conf"], np.float64)
    if len(pts) < 100:
        return None
    thr = np.percentile(conf, conf_pct)
    pts = _apply(T, pts[conf >= thr])

    up = up_vector(poses)
    fwd = poses[0, :3, 2]                                  # first camera's viewing direction
    e1 = fwd - up * fwd.dot(up)
    if np.linalg.norm(e1) < 1e-6:
        e1 = np.cross(up, [1.0, 0.0, 0.0])
    e1 /= np.linalg.norm(e1)
    e2 = np.cross(e1, up)                                  # camera's right, so the plan isn't mirrored

    h = pts @ up
    lo, hi = np.percentile(h, 2), np.percentile(h, 98)
    band = (h > lo + 0.2 * (hi - lo)) & (h < lo + 0.85 * (hi - lo))
    xy = np.stack([pts[band] @ e2, pts[band] @ e1], axis=1)
    cam = poses[:, :3, 3]
    cam_xy = np.stack([cam @ e2, cam @ e1], axis=1)
    if len(xy) < 50:
        return None

    pad_lo = np.minimum(np.percentile(xy, 1, axis=0), cam_xy.min(0))
    pad_hi = np.maximum(np.percentile(xy, 99, axis=0), cam_xy.max(0))
    span = (pad_hi - pad_lo).max() * 1.08
    centre = (pad_lo + pad_hi) / 2
    lo2, hi2 = centre - span / 2, centre + span / 2
    bins = 320
    H, xe, ye = np.histogram2d(xy[:, 0], xy[:, 1], bins=bins, range=[[lo2[0], hi2[0]], [lo2[1], hi2[1]]])
    img = np.log1p(H.T)
    if img.max() > 0:
        img = img / np.percentile(img[img > 0], 99)

    fig = plt.figure(figsize=(size_px / 100, size_px / 100), dpi=100, facecolor="black")
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_facecolor("black")
    ax.imshow(np.clip(img, 0, 1), origin="lower", cmap="gray",
              extent=[lo2[0], hi2[0], lo2[1], hi2[1]], interpolation="nearest")
    ax.plot(cam_xy[:, 0], cam_xy[:, 1], color=TRACE_AMBER, linewidth=2.5)
    ax.scatter(cam_xy[0, 0], cam_xy[0, 1], s=60, color="white", zorder=3)
    ax.scatter(cam_xy[-1, 0], cam_xy[-1, 1], s=60, color=TRACE_AMBER, zorder=3)
    ax.text(0.02, 0.02, "Start: white dot.  End: amber dot.  Approximate scale.",
            transform=ax.transAxes, color="#6E6E73", fontsize=9)
    ax.set_axis_off()
    fig.savefig(out_path, facecolor="black")
    plt.close(fig)
    return out_path


# =============================================================================
# Stats + bundle
# =============================================================================

def mission_stats(rec: dict, poses: np.ndarray, T: np.ndarray, kept: int, total: int,
                  n_frames: int, hw, t_infer: float) -> dict:
    cam = poses[:, :3, 3]
    path_len = float(np.linalg.norm(np.diff(cam, axis=0), axis=1).sum()) if len(cam) > 1 else 0.0
    pts = _apply(T, np.asarray(rec["points"])[:: max(1, len(rec["points"]) // 200_000)])
    extent = (np.percentile(pts, 98, axis=0) - np.percentile(pts, 2, axis=0)).tolist() if len(pts) else [0, 0, 0]
    return {
        "frames": int(n_frames),
        "frame_size": {"width": int(hw[1]), "height": int(hw[0])},
        "points_total": int(total),
        "points_kept": int(kept),
        "path_length_units": round(path_len, 3),
        "scene_extent_units": [round(float(x), 3) for x in extent],
        "inference_seconds": round(float(t_infer), 2),
        "units_note": "Single-camera scale is learned by the model and approximate (roughly metres).",
    }


def write_bundle(glb_path: str, floorplan_path: Optional[str], pack: dict, T: np.ndarray,
                 poses: np.ndarray, stats: dict, source: str, settings: dict) -> str:
    """One zip for the backend. All 3D data is in scene.glb coordinates.

    keyframes/kf_XXX.jpg        RGB, h x w
    keyframes/kf_XXX_xyz.f32    float32 little-endian, shape [h, w, 3], row-major
    keyframes/kf_XXX_conf.f32   float32 little-endian, shape [h, w]
    """
    from PIL import Image

    out_dir = tempfile.mkdtemp(prefix="sanjaya_bundle_")
    zip_path = os.path.join(out_dir, "sanjaya_mission.zip")
    keyframes = []
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as z:
        z.write(glb_path, "scene.glb")
        if floorplan_path:
            z.write(floorplan_path, "floorplan.png")
        for j, fi in enumerate(pack["idx"]):
            name = f"keyframes/kf_{j:03d}"
            buf = io.BytesIO()
            Image.fromarray(pack["rgb"][j]).save(buf, format="JPEG", quality=88)
            z.writestr(f"{name}.jpg", buf.getvalue())
            xyz = _apply(T, pack["xyz"][j].reshape(-1, 3)).astype("<f4").reshape(pack["xyz"][j].shape)
            z.writestr(f"{name}_xyz.f32", xyz.tobytes(order="C"))
            z.writestr(f"{name}_conf.f32", np.asarray(pack["conf"][j], "<f4").tobytes(order="C"))
            h, w = pack["rgb"][j].shape[:2]
            entry = {
                "frame_index": int(fi),
                "image": f"{name}.jpg",
                "xyz": f"{name}_xyz.f32",
                "conf": f"{name}_conf.f32",
                "height": int(h),
                "width": int(w),
                "camera_to_world": poses[fi].round(6).tolist(),
            }
            if "intrinsic" in pack:
                entry["intrinsics"] = np.asarray(pack["intrinsic"][j]).round(4).tolist()
            keyframes.append(entry)

        trajectory = {
            "frame": "scene.glb coordinates",
            "up": up_vector(poses).round(6).tolist(),
            "camera_centers": poses[:, :3, 3].round(5).tolist(),
            "camera_to_world": poses.round(6).tolist(),
        }
        z.writestr("trajectory.json", json.dumps(trajectory))
        manifest = {
            "engine": ENGINE_VERSION,
            "model": {"name": "LingBot-Map", "checkpoint": settings.get("checkpoint"),
                      "license": "Apache-2.0", "source": "https://github.com/Robbyant/lingbot-map"},
            "created_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "source": source,
            "settings": settings,
            "stats": stats,
            "files": {"scene": "scene.glb", "floorplan": "floorplan.png" if floorplan_path else None,
                      "trajectory": "trajectory.json"},
            "keyframes": keyframes,
            "title": None,
            "description": None,
        }
        z.writestr("manifest.json", json.dumps(manifest, indent=2))
    return zip_path
