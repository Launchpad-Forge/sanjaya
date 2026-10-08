"""scene.glb and the mission bundle (everything in the Sanjaya frame)."""

from __future__ import annotations

import io
import json
import os
import tempfile
import time
import zipfile
from typing import List, Optional

import numpy as np

from .render import AMBER, label_color

ENGINE = "sanjaya-engine 0.2.0"


def _hex_rgba(h: str):
    return [int(h[i:i + 2], 16) for i in (1, 3, 5)] + [255]


def build_glb(points: np.ndarray, colors: np.ndarray, conf: np.ndarray, centers: np.ndarray,
              objects: List[dict], out_path: Optional[str] = None, conf_pct: float = 50.0,
              show_path: bool = True, show_objects: bool = True, display_max: int = 800_000,
              metric: bool = True) -> str:
    import trimesh

    out_path = out_path or os.path.join(tempfile.mkdtemp(prefix="sanjaya_glb_"), "scene.glb")
    pts, cols, cf = points, colors, conf
    if len(cf) and conf_pct > 0:
        keep = cf >= np.percentile(cf, conf_pct)
        pts, cols = pts[keep], cols[keep]
    if len(pts) > display_max:
        sel = np.random.default_rng(0).choice(len(pts), display_max, replace=False)
        pts, cols = pts[sel], cols[sel]
    if len(pts) == 0:
        pts, cols = np.zeros((1, 3)), np.array([[255, 255, 255]])

    scene = trimesh.Scene()
    scene.add_geometry(trimesh.PointCloud(vertices=pts, colors=cols), node_name="map")
    extent = float(np.linalg.norm(np.percentile(pts, 98, axis=0) - np.percentile(pts, 2, axis=0))) or 1.0

    if show_path and len(centers) > 1:
        radius = max(extent * 0.003, 0.01 if metric else 1e-4)
        segs = []
        for i in range(len(centers) - 1):
            if np.linalg.norm(centers[i + 1] - centers[i]) < 1e-9:
                continue
            seg = trimesh.creation.cylinder(radius=radius, segment=centers[i:i + 2], sections=8)
            seg.visual.vertex_colors = _hex_rgba(AMBER)
            segs.append(seg)
        if segs:
            scene.add_geometry(trimesh.util.concatenate(segs), node_name="path")
        start = trimesh.creation.icosphere(subdivisions=2, radius=radius * 4)
        start.apply_translation(centers[0])
        start.visual.vertex_colors = [255, 255, 255, 255]
        scene.add_geometry(start, node_name="start")

    if show_objects:
        r = max(extent * 0.008, 0.04 if metric else 1e-3)
        for o in objects:
            m = trimesh.creation.icosphere(subdivisions=2, radius=r)
            m.apply_translation(o["position"])
            m.visual.vertex_colors = _hex_rgba(label_color(o["label"]))
            scene.add_geometry(m, node_name=o["id"])
    scene.export(out_path)
    return out_path


def crop_evidence(rgb_keyframes: np.ndarray, objects: List[dict], out_dir: str) -> List[tuple]:
    """Save a crop per object (from its best view). Returns [(path, caption)]."""
    from PIL import Image

    os.makedirs(out_dir, exist_ok=True)
    gallery = []
    for o in objects:
        ev = o["evidence"]
        img = rgb_keyframes[ev["keyframe"]]
        h, w = img.shape[:2]
        x0, y0, x1, y1 = ev["box"]
        pad_x, pad_y = (x1 - x0) * 0.15, (y1 - y0) * 0.15
        box = (max(0, int(x0 - pad_x)), max(0, int(y0 - pad_y)),
               min(w, int(x1 + pad_x)), min(h, int(y1 + pad_y)))
        crop = Image.fromarray(np.ascontiguousarray(img)).crop(box)
        if min(crop.size) < 96:
            s = 96 / min(crop.size)
            crop = crop.resize((int(crop.size[0] * s), int(crop.size[1] * s)))
        path = os.path.join(out_dir, f"{o['id']}.jpg")
        crop.save(path, quality=90)
        o["evidence"]["crop"] = f"crops/{o['id']}.jpg"
        gallery.append((path, o))
    return gallery


def write_bundle(out_dir: str, files: dict, manifest: dict, keyframes: dict,
                 crops: List[tuple]) -> str:
    """files: name -> local path (scene.glb, floorplan.png, mentalmap.png).
    keyframes: {"rgb": [K,H,W,3] u8, "xyz": [K,H,W,3] f32 (Sanjaya frame), "conf": [K,H,W],
                "frames": [...], "K": [K,3,3], "poses": [K,4,4]}"""
    from PIL import Image

    zpath = os.path.join(out_dir, "sanjaya_mission.zip")
    entries = []
    with zipfile.ZipFile(zpath, "w", compression=zipfile.ZIP_DEFLATED) as z:
        for name, path in files.items():
            if path and os.path.isfile(path):
                z.write(path, name)
        for j, f in enumerate(keyframes["frames"]):
            base = f"keyframes/kf_{j:03d}"
            buf = io.BytesIO()
            Image.fromarray(np.ascontiguousarray(keyframes["rgb"][j])).save(buf, format="JPEG", quality=88)
            z.writestr(f"{base}.jpg", buf.getvalue())
            z.writestr(f"{base}_xyz.f32", np.ascontiguousarray(keyframes["xyz"][j], dtype="<f4").tobytes())
            z.writestr(f"{base}_conf.f32", np.ascontiguousarray(keyframes["conf"][j], dtype="<f4").tobytes())
            h, w = keyframes["rgb"][j].shape[:2]
            entries.append({"frame_index": int(f), "image": f"{base}.jpg", "xyz": f"{base}_xyz.f32",
                            "conf": f"{base}_conf.f32", "height": int(h), "width": int(w),
                            "intrinsics": np.round(keyframes["K"][j], 4).tolist(),
                            "camera_to_world": np.round(keyframes["poses"][j], 6).tolist()})
        for path, o in crops:
            z.write(path, f"crops/{o['id']}.jpg")
        manifest = {**manifest, "keyframes": entries, "engine": ENGINE,
                    "created_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
        z.writestr("manifest.json", json.dumps(manifest, indent=2))
    return zpath
