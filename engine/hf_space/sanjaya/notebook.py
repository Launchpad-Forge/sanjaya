"""Helpers for running Sanjaya Engine in a notebook (Google Colab, Kaggle, Jupyter).

Colab use is notebook-native on purpose: missions are processed in cells and results are
shown inline and saved to Google Drive. Colab does not allow serving public web apps,
so the public demo stays on Hugging Face.

Input layout (e.g. in Google Drive):
    input/
      corridor-walk.mp4            one video = one mission
      office-room/                 one folder of photos = one mission
        000.jpg 001.jpg ...
Output: output/<mission>/ with scene.glb, floorplan.png, mentalmap.png, crops/,
status.md and sanjaya_mission.zip.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import zipfile
from typing import Dict, List, Optional

import numpy as np

from .frames import IMAGE_EXTS

VIDEO_EXTS = (".mp4", ".mov", ".m4v", ".webm", ".avi", ".mkv")


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "mission"


def find_missions(input_dir: str) -> List[Dict]:
    """Every video file and every folder of photos in input_dir is one mission."""
    missions = []
    if not os.path.isdir(input_dir):
        return missions
    for entry in sorted(os.listdir(input_dir)):
        path = os.path.join(input_dir, entry)
        if os.path.isfile(path) and entry.lower().endswith(VIDEO_EXTS):
            missions.append({"name": os.path.splitext(entry)[0], "video": path, "photos": None})
        elif os.path.isdir(path):
            photos = sorted(os.path.join(path, f) for f in os.listdir(path) if f.lower().endswith(IMAGE_EXTS))
            if len(photos) >= 3:
                missions.append({"name": entry, "video": None, "photos": photos})
    return missions


def run_mission(app, mission: Dict, output_dir: str, scene: str = "Indoor", things: Optional[str] = None,
                fps: float = 6, max_frames: int = 96, keyframes: int = 12, conf_pct: float = 50,
                min_score: float = 0.3) -> Dict:
    """Run the full pipeline (same code as the Space) and copy every output to output_dir/<slug>/."""
    from .objects import DEFAULT_QUERIES

    things = things or ", ".join(DEFAULT_QUERIES)
    glb, plan, mm, gallery, status, bundle, state, stats = app.map_space(
        mission["photos"], mission["video"], scene, things, fps, max_frames, keyframes, conf_pct, min_score)
    dest = os.path.join(output_dir, slugify(mission["name"]))
    os.makedirs(os.path.join(dest, "crops"), exist_ok=True)
    for src, name in ((glb, "scene.glb"), (plan, "floorplan.png"), (mm, "mentalmap.png"),
                      (bundle, "sanjaya_mission.zip")):
        if src and os.path.isfile(src):
            shutil.copy(src, os.path.join(dest, name))
    for path, caption in gallery:
        shutil.copy(path, os.path.join(dest, "crops", os.path.basename(path)))
    with open(os.path.join(dest, "status.md"), "w") as f:
        f.write(status)
    with open(os.path.join(dest, "stats.json"), "w") as f:
        json.dump(stats, f, indent=2)
    return {"dest": dest, "status": status, "stats": stats, "state": state, "gallery": gallery,
            "plan": os.path.join(dest, "floorplan.png") if plan else None,
            "mental_map": os.path.join(dest, "mentalmap.png") if mm else None}


def preview_3d(state: Dict, max_points: int = 150_000, height: int = 640):
    """Interactive 3D preview in the notebook (plotly): points, camera path, objects."""
    import plotly.graph_objects as go
    from .render import AMBER, label_color

    pts, cols, conf = state["points"], state["colors"], state["conf"]
    keep = conf >= np.percentile(conf, 50)
    pts, cols = pts[keep], cols[keep]
    if len(pts) > max_points:
        sel = np.random.default_rng(0).choice(len(pts), max_points, replace=False)
        pts, cols = pts[sel], cols[sel]
    # plot as (x, -z, y): ground plane flat, forward away from the viewer, up = up
    traces = [go.Scatter3d(x=pts[:, 0], y=-pts[:, 2], z=pts[:, 1], mode="markers",
                           marker=dict(size=1.2, color=[f"rgb({r},{g},{b})" for r, g, b in cols]),
                           name="map", hoverinfo="skip")]
    c = state["centers"]
    traces.append(go.Scatter3d(x=c[:, 0], y=-c[:, 2], z=c[:, 1], mode="lines",
                               line=dict(color=AMBER, width=6), name="camera path"))
    for o in state["objects"]:
        p = o["position"]
        traces.append(go.Scatter3d(x=[p[0]], y=[-p[2]], z=[p[1]], mode="markers+text", text=[o["label"]],
                                   marker=dict(size=6, color=label_color(o["label"])),
                                   textfont=dict(color=label_color(o["label"])), name=o["label"]))
    unit = "m" if state.get("metric") else "units"
    fig = go.Figure(traces)
    fig.update_layout(height=height, paper_bgcolor="black", font_color="#D1D1D6", showlegend=False,
                      margin=dict(l=0, r=0, t=0, b=0),
                      scene=dict(aspectmode="data", bgcolor="black",
                                 xaxis_title=f"x ({unit})", yaxis_title=f"forward ({unit})", zaxis_title=f"up ({unit})"))
    return fig


def make_sample(result_dest: str, video_or_photos, title: str, description: str, samples_dir: str,
                max_video_mb: float = 10.0) -> str:
    """Turn a processed mission into samples/<slug>/ for the Space's "Sample missions" tab.
    Videos are re-encoded to 1280 px wide, no audio, so they stay small."""
    slug = slugify(title)
    out = os.path.join(samples_dir, slug)
    os.makedirs(out, exist_ok=True)
    for name in ("scene.glb", "floorplan.png", "mentalmap.png"):
        if os.path.isfile(os.path.join(result_dest, name)):
            shutil.copy(os.path.join(result_dest, name), os.path.join(out, name))
    with zipfile.ZipFile(os.path.join(result_dest, "sanjaya_mission.zip")) as z:
        manifest = json.loads(z.read("manifest.json"))
    manifest.pop("keyframes", None)
    manifest["title"], manifest["description"] = title, description
    with open(os.path.join(out, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)
    if isinstance(video_or_photos, str) and os.path.isfile(video_or_photos):
        target = os.path.join(out, "input.mp4")
        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", video_or_photos, "-vf", "scale=1280:-2",
               "-c:v", "libx264", "-crf", "26", "-preset", "veryfast", "-an", target]
        subprocess.run(cmd, check=False)
        if os.path.isfile(target) and os.path.getsize(target) > max_video_mb * 1e6:
            subprocess.run(cmd[:-2] + ["-crf", "32", target], check=False)
    elif isinstance(video_or_photos, (list, tuple)) and video_or_photos:
        # photos -> short slideshow (6 photos per second) so the sample page can show the input
        listing = os.path.join(out, "_frames.txt")
        with open(listing, "w") as f:
            for p in video_or_photos:
                f.write(f"file '{os.path.abspath(p)}'\nduration {1 / 6:.4f}\n")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", listing,
                        "-vf", "scale=1280:-2,format=yuv420p", "-c:v", "libx264", "-crf", "26", "-r", "30",
                        "-an", os.path.join(out, "input.mp4")], check=False)
        os.remove(listing)
    return out
