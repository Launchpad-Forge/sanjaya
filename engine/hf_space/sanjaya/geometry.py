"""Stage 1 - geometry: LingBot-Map streaming reconstruction.

LingBot-Map (Robbyant Team, Apache-2.0, https://github.com/Robbyant/lingbot-map) reads
frames one by one with a paged KV cache and predicts per-pixel 3D points, confidence
and camera poses. We import only the model and pose utilities (not ``lingbot_map.vis``,
whose __init__ pulls in the viser server).
"""

from __future__ import annotations

from typing import Optional

import numpy as np
import torch

from lingbot_map.models.gct_stream import GCTStream
from lingbot_map.utils.pose_enc import pose_encoding_to_extri_intri


def build_lingbot(ckpt_path: Optional[str], device: str = "cpu", use_sdpa: bool = True,
                  camera_num_iterations: int = 4, num_scale_frames: int = 8) -> GCTStream:
    """Same configuration as upstream demo.py. ``use_sdpa=True`` avoids FlashInfer."""
    model = GCTStream(
        img_size=518,
        patch_size=14,
        enable_3d_rope=True,
        max_frame_num=1024,
        kv_cache_sliding_window=64,
        kv_cache_scale_frames=num_scale_frames,
        kv_cache_cross_frame_special=True,
        kv_cache_include_scale_frames=True,
        use_sdpa=use_sdpa,
        camera_num_iterations=camera_num_iterations,
    )
    if ckpt_path:
        try:  # memory-mapped load keeps peak RAM low (Colab free tier has ~12 GB)
            ckpt = torch.load(ckpt_path, map_location="cpu", weights_only=False, mmap=True)
        except Exception:  # noqa: BLE001  (older checkpoint formats can't be memory-mapped)
            ckpt = torch.load(ckpt_path, map_location="cpu", weights_only=False)
        state = ckpt.get("model", ckpt)
        missing, unexpected = model.load_state_dict(state, strict=False)
        print(f"[geometry] checkpoint loaded (missing={len(missing)}, unexpected={len(unexpected)})")
    return model.to(device).eval()


def _squeeze(t):
    return t[0] if (t is not None and t.ndim >= 1 and t.shape[0] == 1) else t


@torch.no_grad()
def run_lingbot(model: GCTStream, images: torch.Tensor, num_scale_frames: int = 8,
                keyframe_interval: int = 1) -> dict:
    """images [S,3,H,W] in [0,1] -> NumPy dict (all on CPU):

    world_points [S,H,W,3] float32   points in the model's world frame (= first camera)
    conf         [S,H,W]   float32   point confidence
    w2c          [S,3,4]   float32   world-to-camera extrinsics (OpenCV convention)
    K            [S,3,3]   float32   intrinsics in pixels of the H x W input
    rgb          [S,H,W,3] uint8
    """
    device = next(model.parameters()).device
    images = images.to(device)
    s = int(images.shape[0])
    nsf = max(1, min(int(num_scale_frames), s))

    if device.type == "cuda":
        dtype = torch.bfloat16 if torch.cuda.get_device_capability()[0] >= 8 else torch.float16
        ctx = torch.amp.autocast("cuda", dtype=dtype)
    else:
        agg = getattr(model, "aggregator", None)
        low = agg is not None and next(agg.parameters()).dtype == torch.bfloat16
        ctx = torch.autocast("cpu", dtype=torch.bfloat16, enabled=low)

    with ctx:
        pred = model.inference_streaming(
            images,
            num_scale_frames=nsf,
            keyframe_interval=keyframe_interval,
            output_device=torch.device("cpu"),
        )

    pose_enc = pred["pose_enc"].float()
    extr, intr = pose_encoding_to_extri_intri(pose_enc, images.shape[-2:])

    if "world_points" in pred:
        world = _squeeze(pred["world_points"]).float()
        conf = _squeeze(pred.get("world_points_conf"))
    else:  # fall back to unprojecting depth with the predicted cameras
        from lingbot_map.utils.geometry import unproject_depth_map_to_point_map
        world = torch.from_numpy(unproject_depth_map_to_point_map(
            _squeeze(pred["depth"]).float().numpy(), _squeeze(extr).float().numpy(),
            _squeeze(intr).float().numpy()))
        conf = _squeeze(pred.get("depth_conf"))
    if conf is None:
        conf = torch.ones(world.shape[:-1])

    rgb = (images.detach().float().cpu().permute(0, 2, 3, 1).clamp(0, 1) * 255).to(torch.uint8)
    out = {
        "world_points": world.cpu().numpy().astype(np.float32),
        "conf": conf.float().cpu().numpy().astype(np.float32),
        "w2c": _squeeze(extr).float().cpu().numpy().astype(np.float32),
        "K": _squeeze(intr).float().cpu().numpy().astype(np.float32),
        "rgb": rgb.numpy(),
    }
    return out


def compact_points(geo: dict, max_points: int = 3_000_000, seed: int = 0) -> dict:
    """Flatten per-pixel maps into one bounded point set (keeps the payload small)."""
    pts = geo["world_points"].reshape(-1, 3)
    cols = geo["rgb"].reshape(-1, 3)
    conf = geo["conf"].reshape(-1)
    valid = np.isfinite(pts).all(axis=1) & (conf > 1e-5)
    pts, cols, conf = pts[valid], cols[valid], conf[valid]
    total = int(len(pts))
    if total > max_points:
        sel = np.random.default_rng(seed).choice(total, max_points, replace=False)
        pts, cols, conf = pts[sel], cols[sel], conf[sel]
    return {"points": pts.astype(np.float32), "colors": cols.astype(np.uint8),
            "conf": conf.astype(np.float32), "n_total": total}
