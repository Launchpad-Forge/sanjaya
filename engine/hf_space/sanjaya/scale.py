"""Stage 2 - real-world scale.

A single moving camera recovers shape but not absolute size. LingBot-Map's depth is in
its own units, so we compare it, pixel by pixel on a few keyframes, with Depth Anything
V2 Metric (Indoor or Outdoor, small models, ~25M parameters each), which predicts depth
in metres from one image. The median ratio over confident pixels is one global scale
for the whole map. Robust because thousands of pixels vote; the spread of the ratios is
reported as a quality signal.

Depth Anything V2: Yang et al., 2024 (arXiv:2406.09414).
"""

from __future__ import annotations

from typing import Dict, Optional

import numpy as np
import torch

MODEL_IDS = {
    "indoor": "depth-anything/Depth-Anything-V2-Metric-Indoor-Small-hf",
    "outdoor": "depth-anything/Depth-Anything-V2-Metric-Outdoor-Small-hf",
}
_MEAN = torch.tensor([0.485, 0.456, 0.406]).view(1, 3, 1, 1)
_STD = torch.tensor([0.229, 0.224, 0.225]).view(1, 3, 1, 1)


class MetricDepth:
    def __init__(self):
        from transformers import AutoModelForDepthEstimation
        self.models: Dict[str, torch.nn.Module] = {
            k: AutoModelForDepthEstimation.from_pretrained(v).eval() for k, v in MODEL_IDS.items()
        }

    @torch.no_grad()
    def predict(self, images: torch.Tensor, scene: str = "indoor") -> np.ndarray:
        """images [K,3,H,W] in [0,1] (H, W multiples of 14) -> metric depth [K,H,W]."""
        model = self.models.get(scene, self.models["indoor"])
        device = next(model.parameters()).device
        x = (images.to(device).float() - _MEAN.to(device)) / _STD.to(device)
        out = []
        for i in range(x.shape[0]):
            d = model(pixel_values=x[i:i + 1]).predicted_depth          # [1, h, w]
            d = torch.nn.functional.interpolate(d[:, None], size=images.shape[-2:],
                                                mode="bilinear", align_corners=False)[0, 0]
            out.append(d.float().cpu())
        return torch.stack(out).numpy()

    def to(self, device):
        for m in self.models.values():
            m.to(device)
        return self


def estimate_scale(model_depth: np.ndarray, conf: np.ndarray, metric_depth: np.ndarray,
                   min_depth: float = 0.2, max_depth: float = 20.0) -> Optional[dict]:
    """All inputs [K,H,W]. Returns {scale, spread, pixels} or None if unreliable.

    scale  = median(metric / model) over pixels that are confident in both models
    spread = (p75 - p25) / median of the ratios: < 0.25 tight, > 0.5 shaky
    """
    md = np.asarray(model_depth, np.float64)
    mt = np.asarray(metric_depth, np.float64)
    cf = np.asarray(conf, np.float64)
    ratios = []
    for i in range(md.shape[0]):
        thr = np.percentile(cf[i], 50)
        ok = (cf[i] >= thr) & (md[i] > 1e-4) & np.isfinite(md[i]) & \
             (mt[i] > min_depth) & (mt[i] < max_depth) & np.isfinite(mt[i])
        if ok.sum() > 200:
            ratios.append(mt[i][ok] / md[i][ok])
    if not ratios:
        return None
    r = np.concatenate(ratios)
    med = float(np.median(r))
    if not np.isfinite(med) or med <= 0:
        return None
    q1, q3 = np.percentile(r, [25, 75])
    return {"scale": med, "spread": float((q3 - q1) / med), "pixels": int(r.size)}
