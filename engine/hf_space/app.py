"""Sanjaya Engine - one ordinary camera, a 3D mental map.

Hugging Face Space (Gradio, ZeroGPU). Pipeline:
  1 geometry     LingBot-Map          video -> 3D points + camera path
  2 scale        Depth Anything V2    model units -> metres
  3 objects      OWLv2 + our fusion   doors, stairs, people ... placed in 3D
  4 mental map   our places graph     what a person or robot reasons with (Hydra-inspired)
  5 coverage     our frontier grid    what has been seen, and where the map ends
"""

import spaces  # must be imported before torch touches CUDA (ZeroGPU)

import json
import os
import time

import gradio as gr
import torch
from huggingface_hub import hf_hub_download

from sanjaya import __version__
from sanjaya import engine as E
from sanjaya import export as X
from sanjaya import frames as F
from sanjaya import geometry as G
from sanjaya.objects import DEFAULT_QUERIES, parse_queries

# -----------------------------------------------------------------------------
# Config
# -----------------------------------------------------------------------------
CKPT_REPO, CKPT_FILE = "robbyant/lingbot-map", "lingbot-map-long.pt"
NUM_SCALE_FRAMES = 8
KEYFRAME_INTERVAL = 1
MAX_FRAMES = 128
SAMPLES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "samples")

# -----------------------------------------------------------------------------
# Startup: load every model on CPU once. Only geometry is mandatory.
# -----------------------------------------------------------------------------
print(f"[startup] Sanjaya Engine {__version__}")
LINGBOT = G.build_lingbot(hf_hub_download(CKPT_REPO, CKPT_FILE), device="cpu",
                          use_sdpa=True, num_scale_frames=NUM_SCALE_FRAMES)
_BF16 = {"done": False}

try:
    from sanjaya.scale import MetricDepth
    DEPTH = MetricDepth()
    print("[startup] metric depth ready")
except Exception as e:  # noqa: BLE001
    DEPTH = None
    print(f"[startup] metric depth unavailable: {e}")

try:
    from sanjaya.objects import Detector
    DETECTOR = Detector()
    print("[startup] object detector ready")
except Exception as e:  # noqa: BLE001
    DETECTOR = None
    print(f"[startup] object detector unavailable: {e}")


def _gpu_seconds(images, *args, **kwargs):
    return int(min(120, 30 + 0.4 * int(images.shape[0])))


@spaces.GPU(duration=_gpu_seconds)
def gpu_stage(images, scene, queries, num_keyframes):
    """Everything that needs the GPU, in one reservation."""
    t0 = time.time()
    warnings = []
    LINGBOT.to("cuda")
    if not _BF16["done"] and getattr(LINGBOT, "aggregator", None) is not None:
        # bf16 on Ampere+ (ZeroGPU, A100, L4); fp16 on older GPUs such as Colab's T4
        low = torch.bfloat16 if torch.cuda.get_device_capability()[0] >= 8 else torch.float16
        LINGBOT.aggregator = LINGBOT.aggregator.to(dtype=low)
        _BF16["done"] = True
    geo = G.run_lingbot(LINGBOT, images, NUM_SCALE_FRAMES, KEYFRAME_INTERVAL)
    kf = F.pick_keyframes(images.shape[0], num_keyframes)
    out = {
        "compact": G.compact_points(geo),
        "w2c": geo["w2c"], "K": geo["K"], "kf": kf, "hw": list(images.shape[-2:]),
        "kf_xyz": geo["world_points"][kf], "kf_conf": geo["conf"][kf], "kf_rgb": geo["rgb"][kf],
    }
    del geo
    torch.cuda.empty_cache()
    kf_images = images[kf]

    if DEPTH is not None:
        try:
            DEPTH.to("cuda")
            out["kf_metric"] = DEPTH.predict(kf_images, scene)
        except Exception as e:  # noqa: BLE001
            warnings.append(f"Metric depth failed on GPU ({type(e).__name__}); distances in model units.")
    if DETECTOR is not None and queries:
        try:
            DETECTOR.to("cuda")
            out["detections"] = DETECTOR.detect(kf_images, queries)
        except Exception as e:  # noqa: BLE001
            warnings.append(f"Object detection failed on GPU ({type(e).__name__}); map shown without objects.")
    elif DETECTOR is None:
        warnings.append("Object detector unavailable; map shown without objects.")
    out["warnings"] = warnings
    out["gpu_seconds"] = time.time() - t0
    return out


# -----------------------------------------------------------------------------
# Handlers
# -----------------------------------------------------------------------------
def map_space(image_files, video_file, scene, things, fps, max_frames, keyframes, conf_pct, min_score):
    max_frames = int(min(max_frames, MAX_FRAMES))
    if video_file:
        paths = F.sample_video(video_file, fps=fps, max_frames=max_frames)
        source = f"video, {len(paths)} frames"
    else:
        paths = F.spread(F.list_images(image_files), max_frames)
        source = f"{len(paths)} photos"
    if not paths:
        raise gr.Error("Add a short video or a few photos first.")
    if len(paths) < 3:
        raise gr.Error("Add at least 3 frames. Mapping needs the camera to move between views.")

    images = F.preprocess(paths)
    queries = parse_queries(things)
    gpu = gpu_stage(images, "outdoor" if scene == "Outdoor" else "indoor", queries, int(keyframes))
    settings = {"fps": float(fps), "max_frames": max_frames, "scene": scene, "queries": queries,
                "keyframes": int(keyframes), "conf_pct": float(conf_pct), "min_score": float(min_score),
                "checkpoint": CKPT_FILE}
    res = E.run_cpu_stages(gpu, settings, source)
    status = E.status_markdown(res["stats"], source)
    return (res["glb"], res["plan"], res["mental_map_img"], res["gallery"], status,
            res["bundle"], res["state"], res["stats"])


def rerender(state, conf_pct, show_path, show_objects):
    if not state:
        return None
    return X.build_glb(state["points"], state["colors"], state["conf"], state["centers"],
                       state["objects"], conf_pct=conf_pct, show_path=show_path,
                       show_objects=show_objects, metric=state["metric"])


# -----------------------------------------------------------------------------
# Sample missions (pre-computed, no GPU)
# -----------------------------------------------------------------------------
def load_samples():
    out = []
    if not os.path.isdir(SAMPLES_DIR):
        return out
    for name in sorted(os.listdir(SAMPLES_DIR)):
        d = os.path.join(SAMPLES_DIR, name)
        if not os.path.isfile(os.path.join(d, "scene.glb")):
            continue
        meta = {}
        if os.path.isfile(os.path.join(d, "manifest.json")):
            with open(os.path.join(d, "manifest.json")) as f:
                meta = json.load(f)
        pick = lambda *names: next((os.path.join(d, n) for n in names if os.path.isfile(os.path.join(d, n))), None)
        out.append({"title": meta.get("title") or name.replace("-", " ").capitalize(),
                    "description": meta.get("description") or "", "stats": meta.get("stats", {}),
                    "glb": os.path.join(d, "scene.glb"), "plan": pick("floorplan.png"),
                    "mm": pick("mentalmap.png"), "video": pick("input.mp4", "input.mov", "input.webm")})
    return out


SAMPLES = load_samples()


def show_sample(title):
    s = next((x for x in SAMPLES if x["title"] == title), None)
    if not s:
        return None, None, None, None, ""
    st = s["stats"]
    info = [f"### {s['title']}", s["description"]]
    if st:
        u = st.get("unit", "units")
        info.append(f"{st.get('frames', '?')} frames · path {st.get('path_length', 0)} {u} · "
                    f"{st.get('objects', 0)} objects · {st.get('unexplored_edges', 0)} unexplored edges · "
                    f"GPU {st.get('gpu_seconds', 0)} s")
    return s["glb"], s["plan"], s["mm"], s["video"], "\n\n".join(x for x in info if x)


# -----------------------------------------------------------------------------
# Interface
# -----------------------------------------------------------------------------
THEME = gr.themes.Base(
    primary_hue=gr.themes.colors.amber,
    neutral_hue=gr.themes.colors.zinc,
    font=[gr.themes.GoogleFont("Geist"), "system-ui", "sans-serif"],
).set(
    body_background_fill="#000000",
    body_background_fill_dark="#000000",
    button_primary_background_fill="#F5A524",
    button_primary_background_fill_dark="#F5A524",
    button_primary_text_color="#000000",
    button_primary_text_color_dark="#000000",
)
CSS = """
.gradio-container {max-width: 1280px !important; margin: 0 auto;}
#hero h1 {font-size: 44px; letter-spacing: -0.03em; font-weight: 600; margin: 8px 0 4px;}
#hero p {color: #A1A1A6; font-size: 17px; max-width: 72ch; margin: 0;}
footer {display: none !important;}
"""
FORCE_DARK = "() => { document.body.classList.add('dark'); }"

INTRO = """
<div id="hero">
<h1>Sanjaya engine</h1>
<p>One ordinary camera, a 3D mental map. Upload a short walk-through video or a few photos.
Sanjaya rebuilds the space in 3D at real-world scale, finds doors, stairs, people and other
objects, keeps a compact mental map, and shows where the map ends.</p>
</div>
"""
TIPS = """
**For a good map**
- Walk slowly forward or sideways. Don't spin in place: depth comes from movement.
- 10–40 seconds is plenty. Good light, no fast swings. End where you started for a loop closure.

**Privacy:** uploads are processed, then discarded. Temporary files are deleted within an hour.
"""
HOW = """
### How it works
| Stage | Model / method | What it adds |
|---|---|---|
| 1. Geometry | **LingBot-Map** (Robbyant, 2026) streaming 3D reconstruction | 3D points and the camera path from video |
| 2. Scale | **Depth Anything V2 Metric** (2024) + our pixel-vote alignment | real-world metres |
| 3. Objects | **OWLv2** open-vocabulary detection (Google, 2023) + our 3D lifting and multi-view fusion | doors, stairs, people… placed in 3D with evidence |
| 4. Mental map | our places graph, inspired by **Hydra** 3D scene graphs (MIT SPARK) | a map small enough for a weak radio link, simple enough for a robot to plan on |
| 5. Coverage | our frontier grid (classic frontier exploration) | what has been seen and where to look next |

Everything is exported in one coordinate frame (origin = first camera, Y up, metres) in the
mission bundle: `scene.glb`, `mental_map.json`, `trajectory.json`, objects with evidence crops,
and keyframes with per-pixel 3D maps.

### Honest limits
- Scale from one camera is estimated; check the "spread" number in the results.
- Up to 128 frames per run (GPU time limit). Glass, mirrors, blank walls and darkness hurt quality.
- Rooms (Hydra's next layer) and live streaming are on the roadmap.
"""
CREDITS = """
### Credits and licences
- **LingBot-Map**, Robbyant Team, Apache-2.0 - [code](https://github.com/Robbyant/lingbot-map) · [paper](https://arxiv.org/abs/2604.14141). Builds on VGGT and DINOv2.
- **Depth Anything V2**, Yang et al. 2024 - [paper](https://arxiv.org/abs/2406.09414) · metric small models by `depth-anything`.
- **OWLv2**, Minderer et al. 2023, Apache-2.0 - [paper](https://arxiv.org/abs/2306.09683).
- Ideas: **Hydra** (Hughes et al., MIT SPARK), **ConceptGraphs** (Gu et al. 2024), frontier exploration (Yamauchi 1997).
- Torchvision-free preprocessing and the ZeroGPU loading pattern follow the community
  [LingBot-Map Space by WilliamQM](https://huggingface.co/spaces/WilliamQM/craftbot-lingbot-map) (Apache-2.0).
- Sanjaya Engine code: Apache-2.0. Use policy: situational awareness, inspection and rescue. Never targeting.
"""


def build_demo():
    with gr.Blocks(title="Sanjaya engine", theme=THEME, css=CSS, js=FORCE_DARK,
                   delete_cache=(3600, 3600)) as demo:
        gr.HTML(INTRO)
        state = gr.State(None)
        with gr.Tabs():
            with gr.Tab("Map your space"):
                with gr.Row():
                    with gr.Column(scale=4):
                        video_in = gr.Video(label="Video (record or upload)", sources=["upload", "webcam"])
                        images_in = gr.File(label="…or photos, in walking order (000.jpg, 001.jpg, …)",
                                            file_count="multiple")
                        scene = gr.Radio(["Indoor", "Outdoor"], value="Indoor", label="Scene")
                        things = gr.Textbox(value=", ".join(DEFAULT_QUERIES), lines=3,
                                            label="Things to look for (comma-separated)")
                        with gr.Accordion("Settings", open=False):
                            fps = gr.Slider(1, 12, value=6, step=1, label="Frames per second of video to use")
                            max_frames = gr.Slider(3, MAX_FRAMES, value=96, step=1,
                                                   label="Most frames (spread over the whole video)")
                            keyframes = gr.Slider(4, 20, value=12, step=1,
                                                  label="Keyframes checked for objects")
                            min_score = gr.Slider(0.1, 0.6, value=0.3, step=0.05,
                                                  label="Object confidence needed (single sighting)")
                            conf_pct = gr.Slider(0, 95, value=50, step=1,
                                                 label="Hide the least certain % of map points")
                        run = gr.Button("Build 3D map", variant="primary")
                        gr.Markdown(TIPS)
                        vids = [[s["video"]] for s in SAMPLES if s["video"]]
                        if vids:
                            gr.Examples(vids, inputs=[video_in], label="Try one of our videos")
                    with gr.Column(scale=6):
                        model_out = gr.Model3D(label="3D map (drag to orbit)", height=520,
                                               clear_color=[0.0, 0.0, 0.0, 0.0],
                                               camera_position=(40, 40, None))
                        with gr.Row():
                            show_path = gr.Checkbox(value=True, label="Camera path")
                            show_objects = gr.Checkbox(value=True, label="Objects")
                        status = gr.Markdown()
                        with gr.Row():
                            plan_out = gr.Image(label="Floor plan and coverage", type="filepath", height=380)
                            mm_out = gr.Image(label="Mental map", type="filepath", height=380)
                        gallery = gr.Gallery(label="Objects found (best view of each)", columns=4, height=260)
                        bundle_out = gr.File(label="Mission bundle for developers (.zip)")
                        stats_out = gr.JSON(visible=False)

            with gr.Tab("Sample missions"):
                if SAMPLES:
                    pick = gr.Dropdown([s["title"] for s in SAMPLES], value=SAMPLES[0]["title"],
                                       label="Choose a mission")
                    with gr.Row():
                        with gr.Column(scale=6):
                            s_model = gr.Model3D(label="3D map", height=520, clear_color=[0.0, 0.0, 0.0, 0.0],
                                                 camera_position=(40, 40, None))
                            with gr.Row():
                                s_plan = gr.Image(label="Floor plan and coverage", type="filepath",
                                                  interactive=False, height=320)
                                s_mm = gr.Image(label="Mental map", type="filepath", interactive=False, height=320)
                        with gr.Column(scale=4):
                            s_info = gr.Markdown()
                            s_video = gr.Video(label="Original video", interactive=False)
                    outs = [s_model, s_plan, s_mm, s_video, s_info]
                    pick.change(show_sample, pick, outs, show_api=False)
                    demo.load(show_sample, pick, outs, show_api=False)
                else:
                    gr.Markdown("Sample missions will appear here soon.")

            with gr.Tab("How it works"):
                gr.Markdown(HOW)
            with gr.Tab("Credits"):
                gr.Markdown(CREDITS)

        run.click(map_space,
                  inputs=[images_in, video_in, scene, things, fps, max_frames, keyframes, conf_pct, min_score],
                  outputs=[model_out, plan_out, mm_out, gallery, status, bundle_out, state, stats_out],
                  api_name="map")
        for ctrl in (conf_pct, show_path, show_objects):
            ctrl.change(rerender, [state, conf_pct, show_path, show_objects], model_out, show_api=False)
    return demo


if __name__ == "__main__":
    build_demo().queue(max_size=20).launch(show_error=True)
