"""Inspection layer tests on synthetic missions (no GPU, no models).

A tiny ray caster renders a box-shaped room with box objects from a few camera poses into
per-pixel 3D maps, and export.write_bundle packs them into a real mission bundle, so the
comparison runs on exactly the format the engine produces.
"""

import json
import os
import sys

import numpy as np
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sanjaya import inspection as I  # noqa: E402
from sanjaya.export import write_bundle  # noqa: E402

ROOM = (np.array([-3.0, -1.4, -5.0]), np.array([3.0, 1.2, 1.0]))
CHAIR = ("chair", (1.0, -1.15, -3.0), (0.25, 0.25, 0.25))
EXTINGUISHER = ("fire extinguisher", (-2.0, -1.1, -3.5), (0.15, 0.3, 0.15))
NEW_BOX = ("box", (-0.8, -1.2, -2.6), (0.2, 0.2, 0.2))
YAWS = [0, 15, -15, 0, 25, -25, 10, -10]
TEST_PARAMS = {"stride": 1}


def yaw(deg):
    a = np.radians(deg)
    return np.array([[np.cos(a), 0, np.sin(a)], [0, 1, 0], [-np.sin(a), 0, np.cos(a)]])


def pitch(deg):   # negative = looking down, as a phone held for scanning
    a = np.radians(deg)
    return np.array([[1, 0, 0], [0, np.cos(a), -np.sin(a)], [0, np.sin(a), np.cos(a)]])


def raycast(o, d, boxes):
    with np.errstate(divide="ignore", invalid="ignore"):
        tw = np.where(d > 0, (ROOM[1] - o) / d, (ROOM[0] - o) / d)
        tw[~np.isfinite(tw)] = np.inf
        t, axis, sid = tw.min(1), tw.argmin(1), np.zeros(len(d), int)
        for k, (_, c, h) in enumerate(boxes):
            t0, t1 = (np.subtract(c, h) - o) / d, (np.add(c, h) - o) / d
            tn, tf = np.fmin(t0, t1).max(1), np.fmax(t0, t1).min(1)
            hit = (tn <= tf) & (tn > 0) & (tn < t)
            t[hit], sid[hit] = tn[hit], k + 1
    return o + t[:, None] * d, sid, axis


def make_scan(path, boxes, objects=None, T=None, hw=(120, 160), f=125.0, marker=None, spread=0.1):
    """Render keyframes, express them in the scan's own frame (similarity T of the world),
    and write a mission bundle. ``objects`` defaults to every box (as if OWLv2 found them)."""
    T = T or I.IDENTITY
    h, w = hw
    K = np.array([[f, 0, w / 2], [0, f, h / 2], [0, 0, 1]])
    u, v = np.meshgrid(np.arange(w), np.arange(h))
    cam_dirs = np.stack([(u - w / 2) / f, -(v - h / 2) / f, -np.ones_like(u, float)], -1).reshape(-1, 3)
    palette = np.array([[180, 180, 170], [200, 60, 60], [60, 160, 220], [90, 200, 90], [200, 180, 40]])
    rgbs, xyzs, poses = [], [], []
    for i, a in enumerate(YAWS):
        R, c = yaw(a) @ pitch(-15), np.array([0.3 * np.sin(i), 0.0, -0.3 * i])
        pts, sid, axis = raycast(c, cam_dirs @ R.T, boxes)
        checker = ((np.floor(pts[:, 0] * 4) + np.floor(pts[:, 1] * 4) + np.floor(pts[:, 2] * 4)) % 2)
        rgb = (palette[np.minimum(sid, 4)] * (0.75 + 0.25 * checker[:, None])).astype(np.uint8)
        if marker is not None:   # ArUco on the back wall, centred at (0, 0), with a white margin
            img, L = marker
            back = (sid == 0) & (axis == 2) & (pts[:, 2] < -4.9)
            quiet = back & (np.abs(pts[:, 0]) < 0.7 * L) & (np.abs(pts[:, 1]) < 0.7 * L)
            rgb[quiet] = 255
            inside = back & (np.abs(pts[:, 0]) < L / 2) & (np.abs(pts[:, 1]) < L / 2)
            n = img.shape[0]
            px = np.clip(((pts[inside, 0] + L / 2) / L * n).astype(int), 0, n - 1)
            py = np.clip(((L / 2 - pts[inside, 1]) / L * n).astype(int), 0, n - 1)
            rgb[inside] = img[py, px][:, None]
        pose = np.eye(4)
        pose[:3, :3], pose[:3, 3] = T["R"] @ R, I.apply(T, c)
        rgbs.append(rgb.reshape(h, w, 3))
        xyzs.append(I.apply(T, pts).reshape(h, w, 3).astype(np.float32))
        poses.append(pose)
    objs = []
    for k, (label, c, half) in enumerate(boxes if objects is None else objects):
        objs.append({"id": f"obj_{k:03d}", "label": label, "score": 0.6, "views": 3, "frames": [0, 3, 6],
                     "position": [round(float(x), 3) for x in I.apply(T, c)],
                     "size": [round(2 * float(x) * T["s"], 3) for x in half],
                     "evidence": {"keyframe": 0, "frame": 0, "box": [10.0, 10.0, 40.0, 40.0]}})
    manifest = {"source": "synthetic", "unit": "m", "objects": objs,
                "stats": {"metric": True, "scale": {"scale": 1.0, "spread": spread, "pixels": 10000}}}
    kf = {"rgb": np.stack(rgbs), "xyz": np.stack(xyzs), "conf": np.ones((len(YAWS), h, w), np.float32),
          "frames": list(range(len(YAWS))), "K": np.repeat(K[None], len(YAWS), 0), "poses": np.stack(poses)}
    os.makedirs(path, exist_ok=True)
    return write_bundle(str(path), {}, manifest, kf, [])


def similarity(deg=5.0, t=(0.2, 0.0, 0.1), s=1.05):
    return {"s": s, "R": yaw(deg), "t": np.array(t)}


@pytest.fixture(scope="module")
def baseline(tmp_path_factory):
    return make_scan(tmp_path_factory.mktemp("base"), [CHAIR, EXTINGUISHER])


def run(baseline, tmp_path, boxes, **kw):
    cur = make_scan(tmp_path / "cur", boxes, T=similarity(), **kw)
    return I.compare(baseline, cur, params=TEST_PARAMS)


def types(res):
    return sorted(c["type"] for c in res["changes"])


# ---------------------------------------------------------------- bundle + transforms

def test_bundle_parsing(baseline):
    b = I.load_bundle(baseline)
    assert len(b["keyframes"]) == len(YAWS) and b["metric"]
    kf = b["keyframes"][0]
    assert kf["xyz"].shape == (120, 160, 3) and kf["conf"].shape == (120, 160)
    assert kf["pose"].shape == (4, 4) and kf["K"].shape == (3, 3)
    assert [o["label"] for o in b["objects"]] == ["chair", "fire extinguisher"]
    assert b["created_utc"].endswith("Z")


def test_umeyama_and_inverse_recover_similarity():
    rng = np.random.default_rng(0)
    p = rng.normal(size=(200, 3))
    T = similarity(20, (1.0, -0.5, 2.0), 1.3)
    s, R, t = I.umeyama(p, I.apply(T, p))
    assert s == pytest.approx(1.3) and np.allclose(R, T["R"]) and np.allclose(t, T["t"])
    assert np.allclose(I.apply(I.invert(T), I.apply(T, p)), p)
    assert np.allclose(I.apply(I.compose(T, I.invert(T)), p), p)


def test_projection_matches_rendering(baseline):
    kf = I.load_bundle(baseline)["keyframes"][2]
    u, v, _ = I._project(kf, kf["xyz"][60, 100].astype(float))
    assert (round(u), round(v)) == (100, 60)


# ---------------------------------------------------------------- alignment

def test_unchanged_scene_aligns_and_reports_nothing(baseline, tmp_path):
    res = run(baseline, tmp_path, [CHAIR, EXTINGUISHER])
    a = res["alignment"]
    assert res["status"] == "ok" and a["method"] == "shared_start+icp"
    expected = I.invert(similarity())
    M = np.array(a["matrix_current_to_baseline"])
    assert np.allclose(M[:3, :3], expected["s"] * expected["R"], atol=0.01)
    assert np.allclose(M[:3, 3], expected["t"], atol=0.02)
    assert a["confidence"] > 0.9 and a["rmse"] < 0.03
    assert res["changes"] == [], res["changes"]


def test_alignment_failure_claims_nothing(baseline, tmp_path):
    far = {"s": 1.0, "R": np.eye(3), "t": np.array([30.0, 0, 0])}
    cur = make_scan(tmp_path / "cur", [CHAIR], T=far)
    res = I.compare(baseline, cur, params=TEST_PARAMS)
    assert res["status"] == "alignment_failed" and res["changes"] == []
    assert any("aligned" in w for w in res["warnings"])


def test_marker_anchor_aligns_and_checks_scale(tmp_path):
    import cv2
    L = 0.8
    img = cv2.aruco.generateImageMarker(cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50), 7, 120)
    hw, f = (240, 320), 250.0
    # the baseline's estimated metric scale is 10 % too large; the marker reveals it
    base = make_scan(tmp_path / "b", [CHAIR], T={"s": 1.1, "R": np.eye(3), "t": np.zeros(3)},
                     hw=hw, f=f, marker=(img, L))
    cur = make_scan(tmp_path / "c", [CHAIR], T=similarity(), hw=hw, f=f, marker=(img, L))
    anchor = I.find_anchor(I.load_bundle(base), L)
    assert anchor["id"] == 7 and anchor["s"] == pytest.approx(1.1, rel=0.03)
    res = I.compare(base, cur, marker_size=L, params={"stride": 2})
    a = res["alignment"]
    assert a["method"] == "anchor+icp" and a["anchor"]["marker_id"] == 7
    assert a["metres_per_unit"] == pytest.approx(1 / 1.1, rel=0.03)
    assert res["changes"] == []


# ---------------------------------------------------------------- objects

def test_object_moved(baseline, tmp_path):
    moved = ("chair", (1.0, -1.15, -2.2), CHAIR[2])
    res = run(baseline, tmp_path, [moved, EXTINGUISHER])
    assert types(res) == ["object_moved"], res["changes"]
    c = res["changes"][0]
    assert c["label"] == "chair"
    assert c["displacement_m"] == pytest.approx(0.8, abs=0.08)
    lo, hi = c["displacement_range_m"]
    assert lo < c["displacement_m"] < hi
    assert np.allclose(c["baseline_position"], CHAIR[1], atol=0.05)
    assert np.allclose(c["current_position"], moved[1], atol=0.08)
    assert c["support"].get("geometry_regions"), "geometry should back the move"


def test_small_jitter_is_not_a_move(baseline, tmp_path):
    jitter = ("chair", (1.03, -1.15, -3.0), CHAIR[2])
    assert run(baseline, tmp_path, [jitter, EXTINGUISHER])["changes"] == []


def test_hungarian_matching_is_not_list_order(tmp_path):
    a, b = ("chair", (1.0, -1.15, -3.0), (0.25,) * 3), ("chair", (-1.0, -1.15, -3.0), (0.25,) * 3)
    base = make_scan(tmp_path / "b", [a, b])
    cur = make_scan(tmp_path / "c", [b, a], T=similarity())   # same chairs, reversed order
    assert I.compare(base, cur, params=TEST_PARAMS)["changes"] == []


def test_object_appeared(baseline, tmp_path):
    res = run(baseline, tmp_path, [CHAIR, EXTINGUISHER, NEW_BOX])
    assert types(res) == ["object_appeared"], res["changes"]
    c = res["changes"][0]
    assert c["label"] == "box" and c["baseline_position"] is None
    assert np.allclose(c["current_position"], NEW_BOX[1], atol=0.08)
    assert c["support"]["free_space_views"] >= 1


def test_object_disappeared_is_high_priority_for_safety_items(baseline, tmp_path):
    res = run(baseline, tmp_path, [CHAIR])
    assert types(res) == ["object_disappeared"], res["changes"]
    c = res["changes"][0]
    assert c["label"] == "fire extinguisher" and c["severity"] == "high"
    assert any(e["scan"] == "current" and e["pixel"] for e in c["evidence"])


def test_detector_miss_is_unverified_not_disappeared(baseline, tmp_path):
    # the extinguisher is still physically there, the detector just did not report it
    res = run(baseline, tmp_path, [CHAIR, EXTINGUISHER], objects=[CHAIR])
    assert res["changes"] == []
    u = [x for x in res["unverified"] if x["label"] == "fire extinguisher"]
    assert u and "surface" in u[0]["reason"]


# ---------------------------------------------------------------- geometry

def test_unlabelled_geometry_added(baseline, tmp_path):
    crate = ("crate", (0.3, -1.1, -4.2), (0.3, 0.3, 0.3))
    res = run(baseline, tmp_path, [CHAIR, EXTINGUISHER, crate], objects=[CHAIR, EXTINGUISHER])
    assert types(res) == ["geometry_added"], res["changes"]
    c = res["changes"][0]
    assert c["label"] is None and c["region"]["volume_m3"] > 0
    assert np.linalg.norm(np.subtract(c["current_position"], crate[1])) < 0.4


# ---------------------------------------------------------------- confidence + schema

EVENT_KEYS = {"id", "type", "label", "baseline_position", "current_position", "displacement_m",
              "displacement_range_m", "uncertainty_m", "region", "evidence", "support", "confidence",
              "severity", "baseline_session", "current_session", "baseline_time", "current_time"}


def test_confidence_grows_with_displacement(baseline, tmp_path):
    confs = []
    for dz in (0.35, 0.9):
        res = run(baseline, tmp_path / str(dz), [("chair", (1.0, -1.15, -3.0 + dz), CHAIR[2]), EXTINGUISHER])
        (c,) = res["changes"]
        assert 0 < c["confidence"] <= res["alignment"]["confidence"]
        confs.append(c["confidence"])
    assert confs[0] < confs[1]


def test_change_event_schema(baseline, tmp_path):
    res = run(baseline, tmp_path, [("chair", (1.0, -1.15, -2.2), CHAIR[2]), NEW_BOX])
    assert res["format"] == I.FORMAT and res["summary"]["changes"] == len(res["changes"]) >= 3
    json.dumps(res)
    for c in res["changes"]:
        assert set(c) == EVENT_KEYS
        assert c["severity"] in {"low", "medium", "high"} and 0 <= c["confidence"] <= 1
        assert c["evidence"] and all({"scan", "kind", "image", "box", "pixel", "note"} == set(e)
                                     for e in c["evidence"])
        assert c["baseline_position"] is not None or c["current_position"] is not None
