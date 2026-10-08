"""Inspection: compare a baseline mission with a rescan and report what changed, where.

Input is two mission bundles (sanjaya_mission.zip, written by export.write_bundle). Runs on
CPU from the bundle alone: the per-keyframe 3D maps (keyframes/*_xyz.f32, Sanjaya frame),
camera poses, intrinsics and the fused objects in manifest.json. No model is re-run.

  1 align     current scan -> baseline frame. Both scans already share a frame if they
              start at the same spot facing the same way (origin = first camera). Optional
              ArUco anchor (DICT_4X4_50) seen in a keyframe gives a common origin and an
              absolute scale check. Similarity ICP then refines; its fitness is the
              alignment confidence.
  2 objects   Hungarian matching on label + 3D distance -> moved / appeared / disappeared.
  3 geometry  voxel occupancy difference, clustered -> geometry_added / geometry_removed.
  4 verify    every appeared / disappeared / geometry claim must be backed by the OTHER scan
              having looked through that spot and seen free space behind it. If the other
              scan never looked there, or saw a surface there (detector miss), the finding is
              listed under "unverified", never as a change.

Uncertainty and confidence (all signals are measured, none are guessed by a model):
  sigma_loc(o)  = max(0.05 m, 0.25 * median(size)) / sqrt(views)       object localisation
  sigma         = sqrt(sigma_loc(a)^2 + sigma_loc(b)^2 + icp_rmse^2)
  moved         if d > max(K * sigma, MIN_MOVE)          (K = 3, MIN_MOVE = 0.10 m)
  obs(o)        = 1 - (1 - detector_score)^views          multi-view detection support
  align         = ICP fitness (share of current points within INLIER of the baseline)
  moved conf    = align * min(obs(a), obs(b)) * (1 - exp(-z^2 / 2K^2)),   z = d / sigma
  appear/disap. = align * obs(o) * free / (free + surface) * (1 - 0.5^free)
  geometry conf = align * (1 - 0.5^free) * (1 - 0.5^own_views)
where free / surface count the other scan's keyframes that saw free space / a surface at
the location, and own_views counts own-scan keyframes that agree the surface is there.
Displacements carry a +/- range from the scale uncertainty (marker check if anchored,
otherwise half the baseline's metric-scale spread).
"""

from __future__ import annotations

import json
import zipfile
from typing import List, Optional

import numpy as np
from scipy import ndimage
from scipy.optimize import linear_sum_assignment
from scipy.spatial import cKDTree

FORMAT = "sanjaya.inspection/0.1"

DEFAULTS = {
    "k_sigma": 3.0,          # moved if displacement > k * combined uncertainty
    "min_move": 0.10,        # m, never report moves below this
    "match_gate": 2.0,       # m, same-label objects further apart are not the same object
    "inlier": 0.10,          # m, ICP inlier distance used for fitness / rmse
    "min_fitness": 0.30,     # below this, alignment failed and no change is claimed
    "voxel": 0.10,           # m, geometry comparison cell
    "min_cluster": 15,       # voxels, smaller changed regions are treated as noise
    "max_clusters": 20,
    "stride": 2,             # keyframe 3D-map subsampling
}
# ponytail: fixed safety-label list; make it per-site configuration when a site needs it
HIGH_PRIORITY_LABELS = {"fire extinguisher", "exit sign", "first aid kit", "door", "staircase"}
IDENTITY = {"s": 1.0, "R": np.eye(3), "t": np.zeros(3)}


# =============================================================================
# Bundle
# =============================================================================

def load_bundle(path: str) -> dict:
    with zipfile.ZipFile(path) as z:
        man = json.loads(z.read("manifest.json"))
        kfs = []
        for e in man.get("keyframes", []):
            h, w = int(e["height"]), int(e["width"])
            kfs.append({**e,
                        "xyz": np.frombuffer(z.read(e["xyz"]), "<f4").reshape(h, w, 3),
                        "conf": np.frombuffer(z.read(e["conf"]), "<f4").reshape(h, w),
                        "K": np.asarray(e["intrinsics"], np.float64),
                        "pose": np.asarray(e["camera_to_world"], np.float64)})
    stats = man.get("stats", {})
    return {"path": path, "manifest": man, "objects": man.get("objects", []), "keyframes": kfs,
            "metric": bool(stats.get("metric")), "scale": stats.get("scale"),
            "created_utc": man.get("created_utc")}


def scan_points(scan: dict, stride: int = 2) -> np.ndarray:
    """Confident points from every keyframe's 3D map (top half by confidence)."""
    out = []
    for kf in scan["keyframes"]:
        p = kf["xyz"][::stride, ::stride].reshape(-1, 3)
        c = kf["conf"][::stride, ::stride].reshape(-1)
        ok = np.isfinite(p).all(axis=1) & (c >= np.median(c))
        out.append(p[ok])
    return np.concatenate(out).astype(np.float64) if out else np.zeros((0, 3))


# =============================================================================
# Transforms  (T = {"s", "R", "t"}: p' = s * R @ p + t)
# =============================================================================

def umeyama(src: np.ndarray, dst: np.ndarray, with_scale: bool = True):
    """Least-squares similarity dst ~ s * R @ src + t (Umeyama 1991)."""
    mu_s, mu_d = src.mean(0), dst.mean(0)
    xs, xd = src - mu_s, dst - mu_d
    U, S, Vt = np.linalg.svd(xd.T @ xs / len(src))
    D = np.eye(3)
    if np.linalg.det(U) * np.linalg.det(Vt) < 0:
        D[2, 2] = -1
    R = U @ D @ Vt
    s = float((S * np.diag(D)).sum() / xs.var(0).sum()) if with_scale else 1.0
    return s, R, mu_d - s * R @ mu_s


def apply(T: dict, p) -> np.ndarray:
    return T["s"] * np.asarray(p, np.float64) @ T["R"].T + T["t"]


def invert(T: dict) -> dict:
    Ri = T["R"].T
    return {"s": 1.0 / T["s"], "R": Ri, "t": -(Ri @ T["t"]) / T["s"]}


def compose(A: dict, B: dict) -> dict:
    """A after B."""
    return {"s": A["s"] * B["s"], "R": A["R"] @ B["R"], "t": A["s"] * A["R"] @ B["t"] + A["t"]}


def _voxel_down(p: np.ndarray, v: float) -> np.ndarray:
    if not len(p):
        return p
    _, idx = np.unique(np.floor(p / v).astype(np.int64), axis=0, return_index=True)
    return p[idx]


def icp(src: np.ndarray, dst: np.ndarray, T: dict, inlier: float, iters: int = 50) -> dict:
    """Similarity ICP from an initial guess, with a shrinking correspondence radius."""
    tree = cKDTree(dst)
    radius = max(0.5, 5 * inlier)
    T = {k: T[k] for k in "sRt"}
    for _ in range(iters):
        d, j = tree.query(apply(T, src), distance_upper_bound=radius)
        ok = np.isfinite(d)
        if ok.sum() < 30:
            break
        s, R, t = umeyama(src[ok], dst[j[ok]])
        s = float(np.clip(s, 0.8 * T["s"], 1.25 * T["s"]))
        step = abs(s - T["s"]) + np.abs(R - T["R"]).max() + np.abs(t - T["t"]).max()
        T = {"s": s, "R": R, "t": t}
        radius = max(2 * inlier, radius * 0.8)
        if step < 1e-7 and radius <= 2 * inlier:
            break
    d, _ = tree.query(apply(T, src))
    inl = d < inlier
    T["fitness"] = float(inl.mean()) if len(d) else 0.0
    T["rmse"] = float(np.sqrt(np.mean(d[inl] ** 2))) if inl.any() else float("inf")
    return T


# =============================================================================
# Anchor (optional ArUco marker, DICT_4X4_50)
# =============================================================================

def find_anchor(scan: dict, marker_size: float, marker_id: Optional[int] = None) -> Optional[dict]:
    """Marker -> scan similarity from the first keyframe that shows the marker. Its four
    corners are looked up in that keyframe's 3D map, so no separate pose solve is needed.
    s = marker size in the scan's units / true size (1.0 = the scan's metric scale is right)."""
    import cv2

    det = cv2.aruco.ArucoDetector(cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50),
                                  cv2.aruco.DetectorParameters())
    L = float(marker_size)
    model = np.array([[-L / 2, L / 2, 0], [L / 2, L / 2, 0], [L / 2, -L / 2, 0], [-L / 2, -L / 2, 0]])
    with zipfile.ZipFile(scan["path"]) as z:
        for kf in scan["keyframes"]:
            img = cv2.imdecode(np.frombuffer(z.read(kf["image"]), np.uint8), cv2.IMREAD_GRAYSCALE)
            corners, ids, _ = det.detectMarkers(img)
            if ids is None:
                continue
            for c, i in zip(corners, ids.ravel()):
                if marker_id is not None and int(i) != int(marker_id):
                    continue
                px = c.reshape(4, 2)
                P = _marker_corners_3d(kf, px)
                if P is None:
                    continue
                s, R, t = umeyama(model, P)
                resid = float(np.linalg.norm(s * model @ R.T + t - P, axis=1).mean() / s)
                return {"id": int(i), "keyframe": int(kf["frame_index"]), "s": s, "R": R, "t": t,
                        "residual_m": resid, "corners_px": np.round(px, 1).tolist(), "image": kf["image"]}
    return None


def _marker_corners_3d(kf: dict, px: np.ndarray) -> Optional[np.ndarray]:
    """Fit a plane to the 3D points inside the marker, then intersect each sub-pixel corner's
    camera ray with it (more precise and less noisy than reading four single pixels)."""
    import cv2

    h, w = kf["conf"].shape
    mask = np.zeros((h, w), np.uint8)
    cv2.fillConvexPoly(mask, np.round(px).astype(np.int32), 1)
    P = kf["xyz"][mask.astype(bool)].astype(np.float64)
    P = P[np.isfinite(P).all(axis=1)]
    if len(P) < 20:
        return None
    mu = P.mean(0)
    n = np.linalg.svd(P - mu, full_matrices=False)[2][2]
    K, R, o = kf["K"], kf["pose"][:3, :3], kf["pose"][:3, 3]
    out = []
    for u, v in px:
        d = R @ np.array([(u - K[0, 2]) / K[0, 0], -(v - K[1, 2]) / K[1, 1], -1.0])
        if abs(n @ d) < 1e-6:
            return None
        out.append(o + (n @ (mu - o)) / (n @ d) * d)
    return np.array(out)


# =============================================================================
# Visibility: did a scan look through a 3D location?
# =============================================================================

def _project(kf: dict, p: np.ndarray):
    """Point in the scan's frame -> (u, v, depth) in the keyframe (OpenGL pose, OpenCV K)."""
    q = kf["pose"][:3, :3].T @ (p - kf["pose"][:3, 3])
    z = -q[2]
    if z < 0.05:
        return None
    K = kf["K"]
    return K[0, 0] * q[0] / z + K[0, 2], -K[1, 1] * q[1] / z + K[1, 2], z


def _lookup(kf: dict, u: float, v: float, r: int = 2):
    """Median 3D point in a (2r+1)^2 patch of the keyframe's 3D map, or None."""
    h, w = kf["conf"].shape
    iu, iv = int(round(u)), int(round(v))
    if not (0 <= iu < w and 0 <= iv < h):
        return None
    patch = kf["xyz"][max(0, iv - r):iv + r + 1, max(0, iu - r):iu + r + 1].reshape(-1, 3)
    patch = patch[np.isfinite(patch).all(axis=1)]
    return np.median(patch, axis=0) if len(patch) else None


def look_through(scan: dict, p: np.ndarray, tol: float, margin: float = 4) -> dict:
    """Count keyframes of ``scan`` that saw free space at p (the observed surface is clearly
    behind it), a surface at p, or were blocked in front of p. p is in the scan's own frame."""
    out = {"free": 0, "surface": 0, "occluded": 0, "views": []}
    for kf in scan["keyframes"]:
        pr = _project(kf, p)
        if pr is None:
            continue
        u, v, z = pr
        h, w = kf["conf"].shape
        if not (margin <= u < w - margin and margin <= v < h - margin):
            continue
        obs = _lookup(kf, u, v)
        if obs is None:
            continue
        zo = -(kf["pose"][:3, :3].T @ (obs - kf["pose"][:3, 3]))[2]
        kind = "occluded" if zo < z - tol else "surface" if zo <= z + tol else "free"
        out[kind] += 1
        out["views"].append({"keyframe": int(kf["frame_index"]), "image": kf["image"],
                             "pixel": [round(float(u), 1), round(float(v), 1)], "seen": kind})
    return out


# =============================================================================
# Helpers
# =============================================================================

def _sigma_loc(o: dict) -> float:
    return max(0.05, 0.25 * float(np.median(o["size"]))) / np.sqrt(max(1, int(o.get("views", 1))))


def _obs(o: dict) -> float:
    return 1.0 - (1.0 - float(o.get("score", 0.0))) ** max(1, int(o.get("views", 1)))


def _r(x, n=3):
    return [round(float(v), n) for v in np.ravel(x)] if np.ndim(x) else round(float(x), n)


def _obj_evidence(scan_name: str, scan: dict, o: dict) -> List[dict]:
    ev, kfs = o.get("evidence", {}), scan["keyframes"]
    j = ev.get("keyframe")
    out = []
    if ev.get("crop"):
        out.append({"scan": scan_name, "kind": "object_crop", "image": ev["crop"], "box": None,
                    "pixel": None, "note": f"best view of {o['label']} ({o.get('views', 1)} views)"})
    if j is not None and j < len(kfs):
        out.append({"scan": scan_name, "kind": "keyframe", "image": kfs[j]["image"], "box": ev.get("box"),
                    "pixel": None, "note": f"detected as {o['label']}, score {o.get('score', 0):.2f}"})
    return out


def _view_evidence(scan_name: str, look: dict, want: str, note: str) -> List[dict]:
    return [{"scan": scan_name, "kind": "keyframe", "image": v["image"], "box": None, "pixel": v["pixel"],
             "note": note} for v in look["views"] if v["seen"] == want][:3]


def _severity(kind: str, label: Optional[str], magnitude: float) -> str:
    if label in HIGH_PRIORITY_LABELS:
        return "high"
    if kind in ("object_appeared", "object_disappeared"):
        return "medium"
    if kind == "object_moved":
        return "medium" if magnitude >= 0.5 else "low"
    return "medium" if magnitude >= 0.1 else "low"     # geometry: volume in m^3


def _event(kind, label, base_pos, cur_pos, uncertainty, evidence, support, confidence, severity, **extra):
    """The ChangeEvent shape. Every change in a result has exactly these keys (+ id, sessions)."""
    return {"type": kind, "label": label, "baseline_position": base_pos, "current_position": cur_pos,
            "displacement_m": extra.pop("displacement_m", None),
            "displacement_range_m": extra.pop("displacement_range_m", None),
            "uncertainty_m": uncertainty, "region": extra.pop("region", None), "evidence": evidence,
            "support": support, "confidence": confidence, "severity": severity}


# =============================================================================
# Comparison
# =============================================================================

def _align(base: dict, cur: dict, P: dict, marker_size: Optional[float], pb, pc, warnings: List[str]):
    db, dc = _voxel_down(pb, P["voxel"] / 2), _voxel_down(pc, P["voxel"] / 2)
    if len(db) < 100 or len(dc) < 100:
        return None, None
    T0 = dict(IDENTITY)
    if not (base["metric"] and cur["metric"]):   # different model units: match robust sizes
        T0["s"] = float(np.median(np.linalg.norm(db, axis=1)) / max(1e-9, np.median(np.linalg.norm(dc, axis=1))))
    anchor = None
    if marker_size:
        ab, ac = find_anchor(base, marker_size), find_anchor(cur, marker_size)
        if ab and ac and ab["id"] == ac["id"]:
            T0 = compose({k: ab[k] for k in "sRt"}, invert({k: ac[k] for k in "sRt"}))
            side = lambda a: {"keyframe": a["keyframe"], "scale_ratio": _r(a["s"], 4),
                              "residual_m": _r(a["residual_m"], 4), "image": a["image"],
                              "corners_px": a["corners_px"]}
            anchor = {"marker_id": ab["id"], "marker_size_m": float(marker_size),
                      "baseline": side(ab), "current": side(ac)}
        else:
            warnings.append("Anchor marker not found in both scans; aligned from the shared start pose instead.")
    return icp(dc, db, T0, P["inlier"]), anchor


def compare(baseline_zip: str, current_zip: str, marker_size: Optional[float] = None,
            params: Optional[dict] = None, baseline_id: str = "baseline", current_id: str = "current") -> dict:
    """Two mission bundles -> InspectionResult dict (format sanjaya.inspection/0.1).
    All positions are in the BASELINE scan's Sanjaya frame, so they can be drawn on its scene.glb."""
    P = {**DEFAULTS, **(params or {})}
    base, cur = load_bundle(baseline_zip), load_bundle(current_zip)
    warnings: List[str] = []
    metric = base["metric"] and cur["metric"]
    if not metric:
        warnings.append("At least one scan has no real-world scale; distances are in model units.")
    pb, pc = scan_points(base, P["stride"]), scan_points(cur, P["stride"])
    T, anchor = _align(base, cur, P, marker_size, pb, pc, warnings)

    result = {
        "format": FORMAT, "status": "ok", "unit": "m" if metric else "units",
        "baseline": {"id": baseline_id, "created_utc": base["created_utc"], "metric": base["metric"],
                     "scale": base["scale"], "objects": len(base["objects"])},
        "current": {"id": current_id, "created_utc": cur["created_utc"], "metric": cur["metric"],
                    "scale": cur["scale"], "objects": len(cur["objects"])},
        "alignment": None, "changes": [], "unverified": [],
        "summary": {"changes": 0, "high": 0, "by_type": {}, "unverified": 0},
        "warnings": warnings, "params": P, "limitations": [
            "Single-camera reconstruction: positions are estimates; see each change's uncertainty.",
            "Only objects named in the scan's search list can be reported as objects.",
            "Areas seen in only one scan cannot be compared and are never reported as changes.",
            "Findings are decision support for a human inspector, not a verdict.",
        ]}
    if T is None or T["fitness"] < P["min_fitness"]:
        result["status"] = "alignment_failed"
        if T is not None:
            result["alignment"] = {"fitness": _r(T["fitness"]), "rmse": _r(T["rmse"])}
        warnings.append("The two scans could not be aligned (too little overlap), so no changes are claimed. "
                        "Rescan starting from the same spot as the baseline"
                        + (" with the marker in view." if marker_size else "."))
        return result

    align_conf = T["fitness"]
    # metres per baseline unit: a marker of known size overrides the estimated metric scale
    to_m = 1.0 / anchor["baseline"]["scale_ratio"] if anchor else 1.0
    if anchor:
        rel_err = float(np.clip(anchor["baseline"]["residual_m"] / marker_size + 0.02, 0.02, 0.5))
    else:
        rel_err = float(np.clip(0.5 * float((base["scale"] or {}).get("spread", 1.0)), 0.02, 0.5))
    rmse_m = T["rmse"] * to_m
    result["alignment"] = {
        "method": "anchor+icp" if anchor else "shared_start+icp",
        "matrix_current_to_baseline": np.round(np.vstack([np.hstack([T["s"] * T["R"], T["t"][:, None]]),
                                                          [0, 0, 0, 1]]), 5).tolist(),
        "relative_scale": _r(T["s"], 4), "fitness": _r(T["fitness"]), "rmse": _r(rmse_m),
        "confidence": _r(align_conf), "anchor": anchor, "metres_per_unit": _r(to_m, 4),
        "relative_scale_uncertainty": _r(rel_err)}
    Tinv = invert(T)
    changes, unverified = [], []

    # ---- objects ---------------------------------------------------------------
    bo = base["objects"]
    co = [{**o, "position": _r(apply(T, o["position"])), "size": _r(np.asarray(o["size"]) * T["s"])}
          for o in cur["objects"]]
    big = 1e6
    cost = np.full((len(bo), len(co)), big)
    for i, a in enumerate(bo):
        for j, b in enumerate(co):
            if a["label"] == b["label"]:
                d = float(np.linalg.norm(np.subtract(a["position"], b["position"]))) * to_m
                if d < P["match_gate"]:
                    cost[i, j] = d
    rows, cols = linear_sum_assignment(cost) if cost.size else ([], [])
    pairs = [(i, j) for i, j in zip(rows, cols) if cost[i, j] < big]
    matched_b, matched_c = {i for i, _ in pairs}, {j for _, j in pairs}

    for i, j in pairs:
        a, b, d = bo[i], co[j], cost[i, j]
        sigma = float(np.sqrt((_sigma_loc(a) ** 2 + _sigma_loc(b) ** 2) * to_m ** 2 + rmse_m ** 2))
        if d <= max(P["k_sigma"] * sigma, P["min_move"]):
            continue
        z = d / sigma
        geometric = 1.0 - np.exp(-z ** 2 / (2 * P["k_sigma"] ** 2))
        changes.append(_event(
            "object_moved", a["label"], a["position"], b["position"], _r(sigma),
            _obj_evidence("baseline", base, a) + _obj_evidence("current", cur, cur["objects"][j]),
            {"sigma_ratio": _r(z, 2), "geometric": _r(geometric), "baseline_detection": _r(_obs(a)),
             "current_detection": _r(_obs(b)), "baseline_views": a.get("views", 1),
             "current_views": b.get("views", 1), "alignment": _r(align_conf)},
            _r(align_conf * min(_obs(a), _obs(b)) * geometric), _severity("object_moved", a["label"], d),
            displacement_m=_r(d, 2) if metric else None,
            displacement_range_m=_r([d * (1 - rel_err), d * (1 + rel_err)], 2) if metric else None))

    def presence(o, raw, own, own_name, other, other_name, to_other, kind):
        tol = max(0.2, 0.6 * float(np.max(o["size"]))) / to_m * to_other["s"]
        look = look_through(other, apply(to_other, o["position"]), tol)
        f, s_ = look["free"], look["surface"]
        sup = {"free_space_views": f, "surface_views": s_, "occluded_views": look["occluded"],
               "detection": _r(_obs(o)), "views": o.get("views", 1), "alignment": _r(align_conf)}
        if f >= 1 and f >= s_:
            support = f / (f + s_) * (1 - 0.5 ** f)
            changes.append(_event(
                kind, o["label"], o["position"] if own_name == "baseline" else None,
                o["position"] if own_name == "current" else None, _r(_sigma_loc(o) * to_m),
                _obj_evidence(own_name, own, raw) +
                _view_evidence(other_name, look, "free", f"{other_name} scan looked here and saw empty space"),
                sup, _r(align_conf * _obs(o) * support), _severity(kind, o["label"], 0)))
        else:
            unverified.append({"type": kind, "label": o["label"], "position": o["position"], "support": sup,
                               "reason": "the other scan saw a surface here (probably a detector miss)"
                               if s_ > f else "the other scan never looked at this spot"})

    for i, a in enumerate(bo):
        if i not in matched_b:
            presence(a, a, base, "baseline", cur, "current", Tinv, "object_disappeared")
    for j, b in enumerate(co):
        if j not in matched_c:
            presence(b, cur["objects"][j], cur, "current", base, "baseline", IDENTITY, "object_appeared")

    # ---- geometry --------------------------------------------------------------
    for g in _geometry_changes(base, cur, pb, apply(T, pc), Tinv, P, to_m, align_conf):
        half = (np.subtract(g["bbox_max"], g["bbox_min"]) / 2) + 0.3 / to_m
        hit = next((c for c in changes if c["type"].startswith("object_") and any(
            p is not None and np.all(np.abs(np.subtract(p, g["center"])) <= half)
            for p in (c["baseline_position"], c["current_position"]))), None)
        if hit is not None:   # this region is the object's own footprint: count it as support
            hit["support"].setdefault("geometry_regions", []).append(
                {"type": g["type"], "volume_m3": g["volume_m3"], "voxels": g["voxels"]})
        elif g["verified"]:
            changes.append(_event(
                g["type"], None, g["center"] if g["type"] == "geometry_removed" else None,
                g["center"] if g["type"] == "geometry_added" else None, _r(P["voxel"] + rmse_m),
                g["evidence"], g["support"], g["confidence"], _severity(g["type"], None, g["volume_m3"]),
                region={k: g[k] for k in ("bbox_min", "bbox_max", "volume_m3", "voxels")}))
        else:
            unverified.append({"type": g["type"], "label": None, "position": g["center"],
                               "reason": g["reason"], "support": g["support"]})

    order = {"high": 0, "medium": 1, "low": 2}
    changes.sort(key=lambda c: (order[c["severity"]], -c["confidence"]))
    stamp = {"baseline_session": baseline_id, "current_session": current_id,
             "baseline_time": base["created_utc"], "current_time": cur["created_utc"]}
    for k, c in enumerate(changes):
        c.update({"id": f"chg_{k:03d}", **stamp})
    result["changes"], result["unverified"] = changes, unverified
    result["summary"] = {"changes": len(changes), "high": sum(c["severity"] == "high" for c in changes),
                         "by_type": {t: sum(c["type"] == t for c in changes) for t in sorted({c["type"] for c in changes})},
                         "unverified": len(unverified)}
    return result


def _geometry_changes(base, cur, pb, pc_in_b, Tinv, P, to_m, align_conf) -> List[dict]:
    """Occupied-voxel difference (one-voxel tolerance), clustered, then verified: the other
    scan must have seen free space there and at least two own-scan keyframes the surface."""
    if not len(pb) or not len(pc_in_b):
        return []
    v = P["voxel"] / to_m
    lo = np.minimum(pb.min(0), pc_in_b.min(0))
    hi = np.maximum(pb.max(0), pc_in_b.max(0))
    while np.prod(np.ceil((hi - lo) / v) + 1) > 4e7:   # ponytail: coarser cells on huge scenes
        v *= 1.5
    shape = tuple((np.ceil((hi - lo) / v) + 1).astype(int))

    def occ(p):
        g = np.zeros(shape, np.int32)
        np.add.at(g, tuple(((p - lo) / v).astype(int).T), 1)
        return g >= 2

    A, B = occ(pb), occ(pc_in_b)
    ring = np.ones((3, 3, 3), bool)
    tol = max(0.15, 2 * P["voxel"]) / to_m
    out = []
    for kind, diff, own, own_T, other, other_T in (
            ("geometry_added", B & ~ndimage.binary_dilation(A, ring), cur, Tinv, base, IDENTITY),
            ("geometry_removed", A & ~ndimage.binary_dilation(B, ring), base, IDENTITY, cur, Tinv)):
        lab, n = ndimage.label(diff, structure=ring)
        if not n:
            continue
        sizes = ndimage.sum(diff, lab, range(1, n + 1))
        own_name, other_name = ("current", "baseline") if own is cur else ("baseline", "current")
        for i in np.argsort(-sizes)[:P["max_clusters"]]:
            if sizes[i] < P["min_cluster"]:
                break
            pts = lo + (np.argwhere(lab == i + 1) + 0.5) * v
            center = pts.mean(0)
            other_look = look_through(other, apply(other_T, center), tol * other_T["s"])
            own_look = look_through(own, apply(own_T, center), tol * own_T["s"])
            f, s_, mine = other_look["free"], other_look["surface"], own_look["surface"]
            verified = f >= 1 and f >= s_ and mine >= 2
            out.append({
                "type": kind, "center": _r(center), "bbox_min": _r(pts.min(0) - v / 2),
                "bbox_max": _r(pts.max(0) + v / 2), "voxels": int(len(pts)),
                "volume_m3": _r(len(pts) * (v * to_m) ** 3, 4), "verified": verified,
                "reason": None if verified else (
                    "seen by fewer than two keyframes of its own scan (likely a reconstruction artefact)"
                    if mine < 2 else "the other scan saw a surface here" if s_ > f
                    else "the other scan never looked at this spot"),
                "support": {"free_space_views": f, "surface_views": s_, "own_views": mine,
                            "alignment": _r(align_conf)},
                "confidence": _r(align_conf * (1 - 0.5 ** f) * (1 - 0.5 ** mine)),
                "evidence": _view_evidence(own_name, own_look, "surface", f"{own_name} scan sees a surface here")
                + _view_evidence(other_name, other_look, "free", f"{other_name} scan saw empty space here")})
    return out
