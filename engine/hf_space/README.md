---
title: Sanjaya Engine
emoji: 🛰️
colorFrom: gray
colorTo: yellow
sdk: gradio
sdk_version: 5.50.0
app_file: app.py
pinned: true
license: apache-2.0
models:
  - robbyant/lingbot-map
  - depth-anything/Depth-Anything-V2-Metric-Indoor-Small-hf
  - depth-anything/Depth-Anything-V2-Metric-Outdoor-Small-hf
  - google/owlv2-base-patch16-ensemble
tags:
  - 3d-reconstruction
  - slam
  - scene-graph
  - open-vocabulary-detection
  - computer-vision
short_description: One ordinary camera, a 3D mental map. Open research engine.
---

# Sanjaya engine

**One ordinary camera, a 3D mental map.** Upload a short walk-through video or a few
photos. Sanjaya rebuilds the space in 3D at real-world scale, finds doors, stairs, people
and other objects, keeps a compact mental map, and shows where the map ends.

The open research engine of **Sanjaya**: turning any camera into a shared 3D mental map
for teams entering unknown spaces (disaster response, inspection, situational awareness;
never targeting).

## Pipeline
| Stage | Model / method | Adds |
|---|---|---|
| 1. Geometry | LingBot-Map streaming reconstruction | 3D points + camera path |
| 2. Scale | Depth Anything V2 Metric + pixel-vote alignment (ours) | metres |
| 3. Objects | OWLv2 open-vocabulary detection + 3D lifting and multi-view fusion (ours) | objects in 3D with evidence |
| 4. Mental map | places graph, Hydra-inspired (ours) | KB-sized map for people and robots |
| 5. Coverage | frontier grid (ours) | floor seen, unexplored edges |

Code: `sanjaya/` (one module per stage) and `app.py` (GPU stage + interface).

## Mission bundle (`sanjaya_mission.zip`)
All 3D data in one frame: origin = first camera, +Y up, -Z = first forward direction, metres.
- `scene.glb` point cloud, camera path, object markers
- `mental_map.json` places, objects, edges (`path`, `shortcut`, `near`)
- `trajectory.json` camera centres and poses
- `manifest.json` stats, objects (position, size, views, evidence box), frontiers, settings
- `crops/` best view of each object; `keyframes/` RGB + per-pixel 3D map (`*_xyz.f32`, float32 `[h,w,3]`)
- `floorplan.png`, `mentalmap.png`

## API
```js
import { Client, handle_file } from "@gradio/client";
const app = await Client.connect("netha01/sanjaya-engine", { hf_token: process.env.HF_TOKEN });
const r = await app.predict("/map", {
  image_files: [], video_file: { video: handle_file(videoUrl) },
  scene: "Indoor", things: "door, staircase, person, fire extinguisher",
  fps: 6, max_frames: 96, keyframes: 12, conf_pct: 50, min_score: 0.3,
});
// r.data: [scene.glb, floorplan, mentalmap, objects gallery, status, bundle.zip, stats]
```

## Limits
Scale from one camera is estimated (see the reported spread). Up to 128 frames per run.
Glass, mirrors, blank walls and darkness reduce quality. Rooms and live streaming are next.

## Credits
LingBot-Map (Robbyant, Apache-2.0) · Depth Anything V2 (Yang et al. 2024) · OWLv2 (Minderer et al. 2023, Apache-2.0) ·
ideas from Hydra (MIT SPARK), ConceptGraphs, frontier exploration (Yamauchi 1997) · torchvision-free preprocessing and
ZeroGPU pattern following the community LingBot-Map Space by WilliamQM (Apache-2.0). Sanjaya Engine: Apache-2.0.
