"""Stage 4 + 5 - the mental map and coverage.

Mental map (inspired by Hydra's layered 3D scene graphs, Hughes et al., RSS 2022 /
IJRR 2024, MIT SPARK Lab): instead of millions of points, keep what a person or robot
needs to reason with:
  places   nodes every ~0.75 m along the walked path (space known to be free)
  edges    place-to-place connectivity, including loop closures where the path returns
  objects  each attached to its nearest place
Rooms (Hydra's next layer) are on the roadmap.

Coverage: a top-down grid that separates walls, floor that was actually seen, and the
FRONTIER - seen floor that touches never-seen space. Frontiers are where the map ends
and where a team or robot should look next (classic frontier exploration, Yamauchi 1997).
"""

from __future__ import annotations

import json
from typing import List, Optional

import numpy as np


# =============================================================================
# Places graph
# =============================================================================

def resample_path(centers: np.ndarray, spacing: float) -> List[int]:
    """Indices of frames roughly every ``spacing`` along the path (always first + last)."""
    if len(centers) == 0:
        return []
    keep, acc = [0], 0.0
    for i in range(1, len(centers)):
        acc += float(np.linalg.norm(centers[i] - centers[i - 1]))
        if acc >= spacing:
            keep.append(i)
            acc = 0.0
    if keep[-1] != len(centers) - 1:
        keep.append(len(centers) - 1)
    return keep


def build_mental_map(centers: np.ndarray, objects: List[dict], spacing: float = 0.75,
                     metric: bool = True) -> dict:
    idx = resample_path(centers, spacing)
    places = [{"id": f"place_{i:03d}", "frame": int(f),
               "position": [round(float(v), 3) for v in centers[f]]} for i, f in enumerate(idx)]
    P = np.array([p["position"] for p in places]) if places else np.zeros((0, 3))
    edges = [{"from": places[i]["id"], "to": places[i + 1]["id"], "kind": "path"}
             for i in range(len(places) - 1)]
    # shortcuts: the path passes close to an earlier place, so the two are connected
    for i in range(len(places)):
        for j in range(i + 3, len(places)):
            if np.linalg.norm(P[i] - P[j]) < spacing * 0.9:
                edges.append({"from": places[i]["id"], "to": places[j]["id"], "kind": "shortcut"})
    returned = bool(len(P) > 3 and np.linalg.norm(P[-1] - P[0]) < max(1.0, 1.4 * spacing))
    obj_nodes = []
    for o in objects:
        pos = np.array(o["position"])
        if len(P):
            d = np.linalg.norm(P[:, [0, 2]] - pos[[0, 2]], axis=1)
            k = int(np.argmin(d))
            near, dist = places[k]["id"], float(d[k])
        else:
            near, dist = None, None
        obj_nodes.append({"id": o["id"], "label": o["label"], "position": o["position"],
                          "confidence": o["score"], "views": o["views"],
                          "place": near, "distance_to_place": None if dist is None else round(dist, 2)})
        if near:
            edges.append({"from": o["id"], "to": near, "kind": "near"})
    path_len = float(np.linalg.norm(np.diff(centers, axis=0), axis=1).sum()) if len(centers) > 1 else 0.0
    return {
        "format": "sanjaya.mental_map/0.2",
        "frame": "Sanjaya frame: origin first camera, +Y up, -Z first forward",
        "units": "metres (approximate)" if metric else "model units",
        "layers": {"places": places, "objects": obj_nodes},
        "edges": edges,
        "summary": {"places": len(places), "objects": len(obj_nodes),
                    "shortcuts": sum(e["kind"] == "shortcut" for e in edges),
                    "returned_to_start": returned,
                    "path_length": round(path_len, 2)},
    }


def json_size_bytes(obj: dict) -> int:
    return len(json.dumps(obj, separators=(",", ":")).encode("utf-8"))


# =============================================================================
# Coverage grid (top-down: x right, -z forward)
# =============================================================================

def coverage_grid(points: np.ndarray, conf: np.ndarray, centers: np.ndarray,
                  metric: bool = True, cam_height_guess: float = 1.4) -> Optional[dict]:
    """points [N,3] in the Sanjaya frame. Returns masks + numbers, or None if too sparse."""
    if len(points) < 500:
        return None
    thr = np.percentile(conf, 40)
    p = points[conf >= thr]
    if len(p) > 1_500_000:
        p = p[np.random.default_rng(0).choice(len(p), 1_500_000, replace=False)]
    h = p[:, 1]
    cam_h = float(np.median(centers[:, 1]))
    floor_h = float(np.percentile(h, 3))
    floor_guessed = False
    above = cam_h - floor_h
    lo_ok, hi_ok = (0.6, 2.4) if metric else (0.0, np.inf)
    if not (lo_ok <= above <= hi_ok):
        floor_h = cam_h - cam_height_guess
        floor_guessed = True
    room_h = max(1.0, float(np.percentile(h, 97)) - floor_h)

    floor_sel = np.abs(h - floor_h) < (0.12 if metric else 0.04 * room_h)
    wall_sel = (h > floor_h + 0.18 * room_h) & (h < floor_h + 0.85 * room_h)

    xz = np.stack([p[:, 0], -p[:, 2]], axis=1)          # top-down, forward = up in the image
    cam_xz = np.stack([centers[:, 0], -centers[:, 2]], axis=1)
    pool = np.concatenate([xz[floor_sel | wall_sel], cam_xz])
    lo = np.minimum(np.percentile(pool, 1, axis=0), cam_xz.min(0)) - 0.5
    hi = np.maximum(np.percentile(pool, 99, axis=0), cam_xz.max(0)) + 0.5
    extent = float((hi - lo).max())
    cell = max(0.1, extent / 300.0) if metric else extent / 200.0
    nx, ny = int(np.ceil((hi[0] - lo[0]) / cell)), int(np.ceil((hi[1] - lo[1]) / cell))

    def bin2d(sel):
        q = ((xz[sel] - lo) / cell).astype(int)
        ok = (q[:, 0] >= 0) & (q[:, 0] < nx) & (q[:, 1] >= 0) & (q[:, 1] < ny)
        g = np.zeros((ny, nx), np.int32)
        np.add.at(g, (q[ok, 1], q[ok, 0]), 1)
        return g

    walls_cnt, floor_cnt = bin2d(wall_sel), bin2d(floor_sel)
    wall_thr = max(3, np.percentile(walls_cnt[walls_cnt > 0], 30)) if (walls_cnt > 0).any() else 3
    from scipy import ndimage
    walls = walls_cnt >= wall_thr
    # seal gaps between wall samples (< ~0.4 m) but keep real doorways (~0.8 m+) open
    seal = max(1, int(round((0.2 if metric else 0.01 * extent) / cell)))
    walls = ndimage.binary_closing(walls, structure=np.ones((3, 3)), iterations=seal) | walls
    floor = (floor_cnt >= 2) & ~walls

    # the walked path is free space by definition
    path = np.zeros_like(walls)
    q = ((cam_xz - lo) / cell).astype(int)
    q = q[(q[:, 0] >= 0) & (q[:, 0] < nx) & (q[:, 1] >= 0) & (q[:, 1] < ny)]
    path[q[:, 1], q[:, 0]] = True
    r = max(1, int(round((0.3 if metric else 0.02 * extent) / cell)))
    path = ndimage.binary_dilation(path, iterations=r)
    floor = (floor | path) & ~walls
    floor = ndimage.binary_closing(floor, iterations=2) & ~walls

    # Unknown space only counts if it is a real region (>= ~0.5 m x 0.5 m), not a gap
    # between sample points; small gaps surrounded by floor are filled in as floor.
    unknown = ~(floor | walls)
    ulab, un = ndimage.label(unknown)
    usz = ndimage.sum(unknown, ulab, range(1, un + 1)) if un else np.array([])
    min_region = max(4, int(round((0.25 if metric else (0.03 * extent) ** 2) / (cell * cell))))
    big_unknown = np.isin(ulab, [i + 1 for i, s in enumerate(usz) if s >= min_region])
    floor = floor | (unknown & ~big_unknown)
    unknown = big_unknown

    frontier = floor & ndimage.binary_dilation(unknown, structure=np.ones((3, 3)))
    labels, n = ndimage.label(frontier, structure=np.ones((3, 3)))
    sizes = ndimage.sum(frontier, labels, range(1, n + 1)) if n else np.array([])
    min_cells = max(3, int(round((0.4 if metric else 0.03 * extent) / cell)))
    big = [i + 1 for i, s in enumerate(sizes) if s >= min_cells]
    frontier = np.isin(labels, big)
    centroids = [ndimage.center_of_mass(frontier, labels, i) for i in big]
    frontier_points = [[round(float(lo[0] + (c[1] + 0.5) * cell), 2), round(float(lo[1] + (c[0] + 0.5) * cell), 2)]
                       for c in centroids]

    return {
        "lo": lo, "cell": cell, "shape": (ny, nx), "walls": walls, "floor": floor,
        "frontier": frontier, "floor_h": floor_h, "floor_guessed": floor_guessed,
        "floor_area": float(floor.sum() * cell * cell), "frontier_count": len(big),
        "frontier_points_topdown": frontier_points, "metric": metric,
    }
