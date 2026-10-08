"""Images for people: the floor plan (with coverage) and the mental map."""

from __future__ import annotations

from typing import List, Optional

import numpy as np

AMBER = "#F5A524"
FRONTIER = "#4FA3FF"
FLOOR = (0.15, 0.15, 0.17)
BG = "#000000"
MUTED = "#8E8E93"

_PALETTE = ["#FF6B6B", "#4ECDC4", "#FFD93D", "#C77DFF", "#6BCB77", "#FF8FAB",
            "#4D96FF", "#F4A261", "#90E0EF", "#E9C46A"]


def label_color(label: str) -> str:
    return _PALETTE[sum(map(ord, label)) % len(_PALETTE)]


def _fig(size_px=900):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    fig = plt.figure(figsize=(size_px / 100, size_px / 100), dpi=100, facecolor=BG)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_facecolor(BG)
    ax.set_axis_off()
    return plt, fig, ax


def _scale_bar(ax, lo, span, metric: bool):
    if not metric:
        return
    length = 1.0 if span < 12 else (5.0 if span < 60 else 10.0)
    x0, y0 = lo[0] + span * 0.04, lo[1] + span * 0.07
    ax.plot([x0, x0 + length], [y0, y0], color="white", linewidth=2)
    ax.text(x0, y0 + span * 0.012, f"{length:g} m", color="white", fontsize=10)


def floor_plan(grid: dict, centers: np.ndarray, objects: List[dict], out_path: str,
               size_px: int = 900) -> Optional[str]:
    if grid is None:
        return None
    plt, fig, ax = _fig(size_px)
    ny, nx = grid["shape"]
    img = np.zeros((ny, nx, 3))
    img[grid["floor"]] = FLOOR
    img[grid["walls"]] = (0.92, 0.92, 0.94)
    fr = np.array([int(FRONTIER[i:i + 2], 16) / 255 for i in (1, 3, 5)])
    img[grid["frontier"]] = fr
    lo, cell = grid["lo"], grid["cell"]
    ext = [lo[0], lo[0] + nx * cell, lo[1], lo[1] + ny * cell]
    ax.imshow(img, origin="lower", extent=ext, interpolation="nearest")
    path = np.stack([centers[:, 0], -centers[:, 2]], axis=1)
    ax.plot(path[:, 0], path[:, 1], color=AMBER, linewidth=2.5)
    ax.scatter(*path[0], s=70, color="white", zorder=4)
    ax.scatter(*path[-1], s=70, color=AMBER, zorder=4)
    for o in objects:
        x, z = o["position"][0], -o["position"][2]
        c = label_color(o["label"])
        ax.scatter(x, z, s=36, color=c, zorder=5, edgecolors="black", linewidths=0.5)
        ax.text(x, z, f"  {o['label']}", color=c, fontsize=8, zorder=5, va="center")
    span = max(ext[1] - ext[0], ext[3] - ext[2])
    ax.set_xlim(ext[0], ext[0] + span)
    ax.set_ylim(ext[2], ext[2] + span)
    _scale_bar(ax, (ext[0], ext[2]), span, grid["metric"])
    ax.text(0.02, 0.02, "Walls: white.  Floor seen: grey.  Unexplored edges: blue.  "
            "Path: amber (start white).", transform=ax.transAxes, color=MUTED, fontsize=9)
    fig.savefig(out_path, facecolor=BG)
    plt.close(fig)
    return out_path


def mental_map_image(mm: dict, out_path: str, size_px: int = 900, metric: bool = True) -> Optional[str]:
    places = mm["layers"]["places"]
    if not places:
        return None
    plt, fig, ax = _fig(size_px)
    pos = {p["id"]: (p["position"][0], -p["position"][2]) for p in places}
    for o in mm["layers"]["objects"]:
        pos[o["id"]] = (o["position"][0], -o["position"][2])
    for e in mm["edges"]:
        a, b = pos.get(e["from"]), pos.get(e["to"])
        if a is None or b is None:
            continue
        style = {"path": dict(color="#5A5A60", linewidth=1.6),
                 "shortcut": dict(color="#48484E", linewidth=1.0, linestyle="--"),
                 "near": dict(color="#3A3A40", linewidth=0.8, linestyle=":")}[e["kind"]]
        ax.plot([a[0], b[0]], [a[1], b[1]], **style, zorder=1)
    P = np.array([pos[p["id"]] for p in places])
    ax.scatter(P[:, 0], P[:, 1], s=26, color="#D1D1D6", zorder=2)
    ax.scatter(*P[0], s=80, color="white", zorder=3)
    for o in mm["layers"]["objects"]:
        x, y = pos[o["id"]]
        c = label_color(o["label"])
        ax.scatter(x, y, s=90, color=c, zorder=4, edgecolors="black", linewidths=0.6)
        ax.text(x, y, f"  {o['label']}", color=c, fontsize=9, zorder=4, va="center")
    allp = np.array(list(pos.values()))
    lo, hi = allp.min(0), allp.max(0)
    span = float(max(hi - lo)) * 1.25 + 1e-6
    c = (lo + hi) / 2
    ax.set_xlim(c[0] - span / 2, c[0] + span / 2)
    ax.set_ylim(c[1] - span / 2, c[1] + span / 2)
    _scale_bar(ax, (c[0] - span / 2, c[1] - span / 2), span, metric)
    s = mm["summary"]
    loop = " · returned to start" if s.get("returned_to_start") else ""
    ax.text(0.02, 0.97, f"{s['places']} places · {s['objects']} objects · {s['shortcuts']} shortcuts{loop}",
            transform=ax.transAxes, color=MUTED, fontsize=10, va="top")
    fig.savefig(out_path, facecolor=BG)
    plt.close(fig)
    return out_path
