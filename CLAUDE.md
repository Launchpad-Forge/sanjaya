# SANJAYA: context for coding agents

**Product (hackathon):** Spatial Visual Intelligence for Autonomous Inspection. "Scan once. Build the world. Detect what changed."
Flow: record a scan → 3D reconstruction → save baseline → rescan → align → detect and localise changes → evidence → grounded AI explanation → report.

Code is the source of truth. If a doc disagrees with code that runs, fix the doc.

## What actually works (verified Oct 2026)

| Part | Status | Where |
|---|---|---|
| Mapping engine (batch) | WORKING, deployed as HF Space `netha01/sanjaya-engine` (Gradio, ZeroGPU A10G), API endpoint `/map` | `engine/hf_space/` |
| Inspection / change detection | WORKING on synthetic tests; NOT yet validated on a real baseline + rescan pair. Space endpoint `/compare` (CPU), not deployed yet | `engine/hf_space/sanjaya/inspection.py`, `engine/hf_space/tests/` |
| Colab notebook | Works only once `sanjaya/notebook.py` is pushed to the Space (it clones the Space) | `engine/colab/` |
| `engine/app/` FastAPI + WS | MOCK: random points from `MockAdapter`; every other file is a 1-line TODO. Not the engine. | `engine/app/` |
| `engine/third_party/` submodules | Reference only. Nothing imports VGGT-SLAM, Hydra or MASt3R; LingBot-Map is pip-installed from git | |
| Server | Inspection API WORKING (tests + live Supabase check; end-to-end blocked until `/compare` is deployed): `POST/GET /api/missions` (video → Space `/map` → bundle in Supabase Storage, private bucket `sanjaya`), `POST/GET /api/inspections`, `POST /api/inspections/:id/explain` (Gemini, numbers checked against evidence, template fallback). No DB use yet (state is JSON in Storage). `middleware/auth.js` not mounted. Tests: `npm test -w server` | `server/` |
| Client | Landing/marketing pages and Supabase auth context work. Inspection flow pages exist (`pages/inspect/`: `/inspect`, `/inspection/:id`, `/reports/:id`) but are NOT routed yet, and depend on `api/missions.js` + `components/viewer/MapViewer3D.jsx`. Other `pages/app/*`, `hooks/*`, `api/*` are stubs. | `client/` |
| Dead | `_to_delete/`, `create_*_files.py`, `setup_dirs.sh` (scaffold generators), `engine/modal_app.py`, `engine/Dockerfile` | |

## Engine pipeline (engine/hf_space)

`app.py:gpu_stage` (one `@spaces.GPU` reservation) → `sanjaya/engine.py:run_cpu_stages`:
1. `frames.sample_video` / `list_images` + `preprocess`: ≤128 frames, 518 px wide
2. `geometry.run_lingbot`: LingBot-Map gives world_points, conf, w2c, K, rgb; `compact_points` ≤3M
3. `frames.pick_keyframes`: 12 by default; frame 0 is always keyframe 0
4. `scale.MetricDepth` + `estimate_scale`: Depth Anything V2 Metric on keyframes, median ratio → one global scale; `spread` = quality
5. `frame.SanjayaFrame`: origin = first camera, +Y up, −Z first forward, metres
6. `objects.Detector` (OWLv2 on keyframes) → `lift` → `fuse` (greedy, same label within 0.8 m)
7. `mental_map.build_mental_map` (places graph) + `coverage_grid` (frontiers)
8. `export.build_glb`, `crop_evidence`, `write_bundle` → `sanjaya_mission.zip`

LingBot, depth and OWLv2 all sit on CUDA during `gpu_stage` (fine on ZeroGPU; no low-VRAM mode yet).

**Mission bundle** (the interchange format, keep it compatible): `scene.glb`, `manifest.json` (stats, objects with position/size/views/score/evidence, frontiers, keyframe entries with intrinsics + camera_to_world), `mental_map.json`, `trajectory.json`, `floorplan.png`, `mentalmap.png`, `crops/obj_NNN.jpg`, `keyframes/kf_NNN.jpg` + `_xyz.f32` (float32 [h,w,3], Sanjaya frame) + `_conf.f32`.

**Inspection** (`inspection.compare(baseline_zip, current_zip, marker_size=None)`) runs on CPU from two bundles: shared-start or ArUco (DICT_4X4_50) anchor → similarity ICP → Hungarian object matching → voxel geometry diff → free-space verification in the other scan. Every appeared/disappeared/geometry claim needs the other scan to have looked through that spot; otherwise it goes to `unverified`. The confidence formula is in the module docstring. All positions are in the baseline's frame.

Tests: `cd engine/hf_space && python -m pytest tests` (synthetic ray-cast bundles, no GPU).

## Rules

- **No rewrite.** Wrap the working engine with adapters; don't replace LingBot-Map, Depth Anything V2 or OWLv2 without a benchmark on real scans.
- Keep `/map` and the mission bundle backward compatible. The Space is the live demo.
- **Gemini is not a source of geometry.** It only explains structured evidence produced by `inspection.py`. Every number it says must come from that evidence. Its key lives only in `server/.env`.
- Never invent confidence. Derive it from measured signals (ICP fitness, scale spread, views, detector score, free-space views).
- Don't claim a capability (drone, ROS, RTSP, MQTT, realtime, SDK) until it runs. The SDK is roadmap only.
- Batch first (record → upload → process → result). Realtime streaming comes after the vertical slice works.
- Don't push raw frames through Node. Videos go to the engine job; Node orchestrates.
- JS: ES modules, Zod at trust boundaries, thin controllers. No secrets in code.

## Deployment (target)

Client on Vercel · Node/Express on Render · Postgres + Storage on Supabase · GPU engine stays on the HF ZeroGPU Space (Modal/RunPod later via the same bundle interface).

## Known debt / blockers

- CI runs `npm run lint`, but eslint isn't installed and has no config, so CI fails.
- `docker-compose.yml` references a missing `server/Dockerfile`; `engine/Dockerfile` is a stub.
- `client/src/lib/supabase.js` throws when `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are missing; they aren't in `client/.env.example`.
- Prisma `User.passwordHash` conflicts with Supabase Auth; no migrations exist.
- Fixed locally, not deployed: MediaRecorder `.webm` reports 1000 fps and no frame count. The live Space keeps 1 frame and rejects WebM scans; `sample_video` now measures real duration (`tests/test_frames.py`).
- `docs/realtime-protocol.md` describes endpoints that don't exist (planned only).

## Next priorities

1. Record a real baseline + rescan pair, run `/map` + `/compare`, keep it as the integration fixture, tune thresholds.
2. Server: `POST /api/scans` (video → Space `/map` → bundle to Supabase Storage), `POST /api/inspections` (→ `/compare`), `POST /api/inspections/:id/explain` (Gemini, evidence-only), `GET /api/inspections/:id`.
3. Client: `/inspect` (getUserMedia + MediaRecorder), `/inspection/:id` (r3f `useGLTF` + change markers), `/reports/:id` (print to PDF).
4. Docs (architecture, SDK roadmap), notebooks, optional LOW_VRAM mode (profile first).
