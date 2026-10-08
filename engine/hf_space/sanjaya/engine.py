"""CPU half of the pipeline: everything after the GPU models have run.

Input is the GPU stage's result (model-frame geometry + keyframe metric depth + raw
detections). Each stage after geometry is guarded: if it fails, the map is still
returned and a plain-language warning says what was skipped.
"""

from __future__ import annotations

import os
import tempfile
import traceback
from typing import List

import numpy as np

from . import export, mental_map, objects as objmod, render
from .frame import SanjayaFrame
from .scale import estimate_scale


def _warn(warnings: List[str], msg: str, exc: Exception = None):
    if exc is not None:
        traceback.print_exc()
        msg = f"{msg} ({type(exc).__name__}: {exc})"
    print("[warning]", msg)
    warnings.append(msg)


def run_cpu_stages(gpu: dict, settings: dict, source: str) -> dict:
    warnings = list(gpu.get("warnings", []))
    out_dir = tempfile.mkdtemp(prefix="sanjaya_mission_")
    compact = gpu["compact"]
    w2c, kf = gpu["w2c"], list(gpu["kf"])
    fr = SanjayaFrame(w2c)

    # ---- Stage 2: metric scale -------------------------------------------------
    metric, scale_info = False, None
    if gpu.get("kf_metric") is not None:
        try:
            model_depth = np.stack([fr.camera_depth(w2c[f], gpu["kf_xyz"][j]) for j, f in enumerate(kf)])
            scale_info = estimate_scale(model_depth, gpu["kf_conf"], gpu["kf_metric"])
            if scale_info and 1e-3 < scale_info["scale"] < 1e3:
                fr.set_scale(scale_info["scale"])
                metric = True
                if scale_info["spread"] > 0.5:
                    _warn(warnings, "Real-world scale is uncertain for this clip (depth estimates disagree); "
                                    "distances may be off by more than 20%.")
            else:
                _warn(warnings, "Could not estimate real-world scale; distances are in model units.")
        except Exception as e:  # noqa: BLE001
            _warn(warnings, "Scale stage failed; distances are in model units", e)
    else:
        _warn(warnings, "Metric depth model unavailable; distances are in model units.")

    points = fr.points(compact["points"])
    centers = fr.camera_centers()
    poses = fr.camera_poses()
    kf_xyz = fr.points(gpu["kf_xyz"])
    path_len = float(np.linalg.norm(np.diff(centers, axis=0), axis=1).sum()) if len(centers) > 1 else 0.0
    extent = np.percentile(points, 98, axis=0) - np.percentile(points, 2, axis=0) if len(points) else np.zeros(3)
    unit = "m" if metric else "units"

    # ---- Stage 3: objects ------------------------------------------------------
    objects = []
    if gpu.get("detections") is not None:
        try:
            obs = objmod.lift(gpu["detections"], kf_xyz, gpu["kf_conf"], kf)
            merge = 0.8 if metric else max(1e-3, 0.05 * float(np.max(extent)))
            objects = objmod.fuse(obs, min_score=settings.get("min_score", 0.3), merge_dist=merge)
        except Exception as e:  # noqa: BLE001
            _warn(warnings, "Object stage failed; the map is shown without objects", e)

    # ---- Stage 4: mental map ---------------------------------------------------
    mm = None
    try:
        spacing = 0.75 if metric else max(1e-3, path_len / 20)
        mm = mental_map.build_mental_map(centers, objects, spacing=spacing, metric=metric)
    except Exception as e:  # noqa: BLE001
        _warn(warnings, "Mental map stage failed", e)

    # ---- Stage 5: coverage -----------------------------------------------------
    grid = None
    try:
        grid = mental_map.coverage_grid(points, compact["conf"], centers, metric=metric)
        if grid and grid["floor_guessed"]:
            _warn(warnings, "Floor was not clearly visible; the floor plan assumes the phone was held at chest height.")
    except Exception as e:  # noqa: BLE001
        _warn(warnings, "Coverage stage failed", e)

    # ---- Outputs ---------------------------------------------------------------
    glb = export.build_glb(points, compact["colors"], compact["conf"], centers, objects,
                           out_path=os.path.join(out_dir, "scene.glb"),
                           conf_pct=settings.get("conf_pct", 50.0), metric=metric)
    plan = mm_img = None
    try:
        plan = render.floor_plan(grid, centers, objects, os.path.join(out_dir, "floorplan.png"))
    except Exception as e:  # noqa: BLE001
        _warn(warnings, "Could not draw the floor plan", e)
    try:
        mm_img = render.mental_map_image(mm, os.path.join(out_dir, "mentalmap.png"), metric=metric) if mm else None
    except Exception as e:  # noqa: BLE001
        _warn(warnings, "Could not draw the mental map", e)

    crops = []
    try:
        crops = export.crop_evidence(gpu["kf_rgb"], objects, os.path.join(out_dir, "crops"))
    except Exception as e:  # noqa: BLE001
        _warn(warnings, "Could not save object evidence crops", e)

    mm_bytes = mental_map.json_size_bytes(mm) if mm else 0
    glb_bytes = os.path.getsize(glb)
    stats = {
        "frames": int(len(w2c)),
        "frame_size": {"width": int(gpu["hw"][1]), "height": int(gpu["hw"][0])},
        "points_total": int(compact["n_total"]),
        "metric": metric,
        "scale": None if not scale_info else {k: round(v, 4) if isinstance(v, float) else v
                                               for k, v in scale_info.items()},
        "path_length": round(path_len, 2),
        "scene_extent": [round(float(x), 2) for x in extent],
        "unit": unit,
        "objects": len(objects),
        "floor_area_seen": None if not grid else round(grid["floor_area"], 1),
        "unexplored_edges": None if not grid else grid["frontier_count"],
        "mental_map_bytes": mm_bytes,
        "full_map_bytes": glb_bytes,
        "gpu_seconds": round(float(gpu.get("gpu_seconds", 0.0)), 1),
        "up_consistency": round(fr.up_consistency, 3),
        "warnings": warnings,
    }

    manifest = {
        "source": source,
        "settings": settings,
        "frame": "Sanjaya frame: origin = first camera, +Y up, -Z = first forward direction, right-handed",
        "unit": unit,
        "stats": stats,
        "objects": objects,
        "frontiers_topdown_xz": None if not grid else grid["frontier_points_topdown"],
        "files": {"scene": "scene.glb", "floorplan": "floorplan.png" if plan else None,
                  "mental_map_image": "mentalmap.png" if mm_img else None,
                  "mental_map": "mental_map.json", "trajectory": "trajectory.json"},
        "models": {
            "geometry": "LingBot-Map (robbyant/lingbot-map, Apache-2.0)",
            "metric_depth": "Depth Anything V2 Metric Small (depth-anything)",
            "objects": "OWLv2 (google/owlv2-base-patch16-ensemble, Apache-2.0)",
        },
        "title": None,
        "description": None,
    }
    import json
    mm_path = os.path.join(out_dir, "mental_map.json")
    with open(mm_path, "w") as f:
        json.dump(mm or {}, f)
    traj_path = os.path.join(out_dir, "trajectory.json")
    with open(traj_path, "w") as f:
        json.dump({"unit": unit, "camera_centers": np.round(centers, 4).tolist(),
                   "camera_to_world_opengl": np.round(poses, 5).tolist()}, f)
    keyframes = {"rgb": gpu["kf_rgb"], "xyz": kf_xyz, "conf": gpu["kf_conf"], "frames": kf,
                 "K": gpu["K"][kf], "poses": poses[kf]}
    bundle = export.write_bundle(out_dir, {"scene.glb": glb, "floorplan.png": plan, "mentalmap.png": mm_img,
                                           "mental_map.json": mm_path, "trajectory.json": traj_path},
                                 manifest, keyframes, crops)

    gallery = []
    for path, o in crops:
        d = float(np.linalg.norm(np.array(o["position"])[[0, 2]]))
        gallery.append((path, f"{o['label']} · {d:.1f} {unit} from start · seen {o['views']}× · "
                              f"confidence {o['score']:.2f}"))

    return {"glb": glb, "plan": plan, "mental_map_img": mm_img, "gallery": gallery,
            "bundle": bundle, "stats": stats, "objects": objects,
            "state": {"points": points, "colors": compact["colors"], "conf": compact["conf"],
                      "centers": centers, "objects": objects, "metric": metric}}


def status_markdown(stats: dict, source: str) -> str:
    u = stats["unit"]
    lines = [f"**Map ready.** Input: {source}.", ""]
    if stats["metric"]:
        sc = stats["scale"]
        lines.append(f"- Real-world scale: **on** (estimated from {sc['pixels']:,} pixels, "
                     f"spread {sc['spread']:.2f}; lower is better)")
    else:
        lines.append("- Real-world scale: **off**, distances are in model units")
    lines += [
        f"- Frames mapped: **{stats['frames']}** · camera path **{stats['path_length']:.1f} {u}** · "
        f"scene ≈ {' × '.join(f'{x:.1f}' for x in stats['scene_extent'])} {u}",
        f"- Objects found: **{stats['objects']}** · unexplored edges: **{stats['unexplored_edges']}**"
        + (f" · floor seen ≈ **{stats['floor_area_seen']} m²**" if stats['metric'] and stats['floor_area_seen'] else ""),
        f"- Mental map **{stats['mental_map_bytes'] / 1024:.1f} KB** vs full 3D map "
        f"**{stats['full_map_bytes'] / 1e6:.1f} MB**",
        f"- GPU time: **{stats['gpu_seconds']} s**",
    ]
    if stats["warnings"]:
        lines += ["", "**Notes**"] + [f"- {w}" for w in stats["warnings"]]
    return "\n".join(lines)
