"""Stage 3 - objects: open-vocabulary detection, lifted to 3D and fused across views.

* Detection: OWLv2 (Minderer et al., 2023, Apache-2.0) finds any object named in plain
  words ("door", "staircase", "fire extinguisher") on each keyframe.
* Lifting: each detection box looks up the keyframe's per-pixel 3D map from the
  geometry stage; the median of the confident points in the box centre is the object's
  3D position, their spread its approximate size.
* Fusion: detections of the same label that land close together in 3D are merged into
  one object, counting how many views saw it (the idea behind ConceptGraphs,
  Gu et al., 2024).

Preprocessing and box decoding are done here directly (no torchvision, and robust to
transformers API changes): OWLv2 pads the image to a square, resizes to 960x960, and
predicts boxes as (cx, cy, w, h) relative to that padded square.
"""

from __future__ import annotations

from typing import List, Sequence

import numpy as np
import torch

OWL_ID = "google/owlv2-base-patch16-ensemble"

DEFAULT_QUERIES = [
    "door", "window", "staircase", "person", "chair", "table", "sofa", "bed",
    "cabinet", "shelf", "computer monitor", "laptop", "backpack", "bag", "box",
    "fire extinguisher", "exit sign", "car", "motorcycle", "bicycle",
    "potted plant", "trash can", "refrigerator", "sink", "toilet",
]

_CLIP_MEAN = torch.tensor([0.48145466, 0.4578275, 0.40821073]).view(1, 3, 1, 1)
_CLIP_STD = torch.tensor([0.26862954, 0.26130258, 0.27577711]).view(1, 3, 1, 1)


def parse_queries(text: str) -> List[str]:
    items = [q.strip().lower() for q in (text or "").replace("\n", ",").split(",")]
    items = [q for q in items if q]
    return items[:40] or list(DEFAULT_QUERIES)


class Detector:
    def __init__(self):
        from transformers import AutoTokenizer, Owlv2ForObjectDetection
        self.model = Owlv2ForObjectDetection.from_pretrained(OWL_ID).eval()
        self.tokenizer = AutoTokenizer.from_pretrained(OWL_ID)
        self.size = int(getattr(self.model.config.vision_config, "image_size", 960))

    def to(self, device):
        self.model.to(device)
        return self

    @torch.no_grad()
    def detect(self, images: torch.Tensor, queries: Sequence[str], threshold: float = 0.2,
               nms_iou: float = 0.5) -> List[List[dict]]:
        """images [K,3,H,W] in [0,1] -> per image a list of
        {label, score, box: [x0, y0, x1, y1] in pixels of the H x W image}."""
        device = next(self.model.parameters()).device
        tok = self.tokenizer(list(queries), padding="max_length", max_length=16,
                             truncation=True, return_tensors="pt")
        input_ids = tok["input_ids"].to(device)
        attn = tok["attention_mask"].to(device)
        k, _, h, w = images.shape
        side = max(h, w)
        results = []
        for i in range(k):
            img = images[i:i + 1].to(device).float()
            canvas = torch.full((1, 3, side, side), 0.5, device=device)
            canvas[:, :, :h, :w] = img
            x = torch.nn.functional.interpolate(canvas, size=(self.size, self.size),
                                                mode="bilinear", align_corners=False)
            x = (x - _CLIP_MEAN.to(device)) / _CLIP_STD.to(device)
            out = self.model(input_ids=input_ids, attention_mask=attn, pixel_values=x)
            logits = out.logits[0].float()                      # [P, Q]
            boxes = out.pred_boxes[0].float()                   # [P, 4] cx, cy, w, h in [0,1]
            probs = torch.sigmoid(logits)
            score, qidx = probs.max(dim=-1)
            keep = score >= threshold
            dets = []
            if keep.any():
                b = boxes[keep] * side
                xyxy = torch.stack([b[:, 0] - b[:, 2] / 2, b[:, 1] - b[:, 3] / 2,
                                    b[:, 0] + b[:, 2] / 2, b[:, 1] + b[:, 3] / 2], dim=-1)
                xyxy[:, 0::2] = xyxy[:, 0::2].clamp(0, w - 1)
                xyxy[:, 1::2] = xyxy[:, 1::2].clamp(0, h - 1)
                for s_, q_, bb in zip(score[keep].cpu().numpy(), qidx[keep].cpu().numpy(),
                                      xyxy.cpu().numpy()):
                    bw_, bh_ = bb[2] - bb[0], bb[3] - bb[1]
                    if bw_ < 4 or bh_ < 4 or bw_ * bh_ > 0.9 * w * h:
                        continue
                    dets.append({"label": queries[int(q_)], "score": float(s_), "box": bb.tolist()})
            results.append(nms(dets, nms_iou))
        return results


def _iou(a, b) -> float:
    x0, y0 = max(a[0], b[0]), max(a[1], b[1])
    x1, y1 = min(a[2], b[2]), min(a[3], b[3])
    inter = max(0.0, x1 - x0) * max(0.0, y1 - y0)
    ua = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter
    return inter / ua if ua > 0 else 0.0


def nms(dets: List[dict], iou: float = 0.5) -> List[dict]:
    """Per-label non-maximum suppression."""
    dets = sorted(dets, key=lambda d: -d["score"])
    kept: List[dict] = []
    for d in dets:
        if all(not (k["label"] == d["label"] and _iou(k["box"], d["box"]) > iou) for k in kept):
            kept.append(d)
    return kept


def lift(dets_per_frame: List[List[dict]], xyz: np.ndarray, conf: np.ndarray,
         frame_ids: Sequence[int]) -> List[dict]:
    """Boxes -> 3D observations using each keyframe's per-pixel 3D map.

    xyz [K,H,W,3] in the Sanjaya frame (metres), conf [K,H,W]."""
    obs = []
    for j, dets in enumerate(dets_per_frame):
        h, w = xyz.shape[1:3]
        cthr = np.percentile(conf[j], 40)
        for d in dets:
            x0, y0, x1, y1 = d["box"]
            bw, bh = x1 - x0, y1 - y0
            ix0, ix1 = int(x0 + 0.3 * bw), int(np.ceil(x1 - 0.3 * bw))
            iy0, iy1 = int(y0 + 0.3 * bh), int(np.ceil(y1 - 0.3 * bh))
            ix1, iy1 = max(ix1, ix0 + 1), max(iy1, iy0 + 1)
            core = xyz[j, iy0:iy1, ix0:ix1].reshape(-1, 3)
            cc = conf[j, iy0:iy1, ix0:ix1].reshape(-1)
            good = np.isfinite(core).all(axis=1) & (cc >= cthr)
            if good.sum() < 5:
                good = np.isfinite(core).all(axis=1)
            if good.sum() < 5:
                continue
            pos = np.median(core[good], axis=0)
            full = xyz[j, int(y0):int(np.ceil(y1)), int(x0):int(np.ceil(x1))].reshape(-1, 3)
            full = full[np.isfinite(full).all(axis=1)]
            if len(full) > 20:
                d_ = np.linalg.norm(full - pos, axis=1)
                full = full[d_ < np.percentile(d_, 70) * 2.0]
            size = (np.percentile(full, 90, axis=0) - np.percentile(full, 10, axis=0)) if len(full) > 20 \
                else np.array([0.3, 0.3, 0.3])
            obs.append({
                "label": d["label"], "score": d["score"], "position": pos.astype(float),
                "size": np.clip(size, 0.05, 6.0).astype(float), "keyframe": j,
                "frame": int(frame_ids[j]), "box": [float(v) for v in d["box"]],
            })
    return obs


def fuse(obs: List[dict], min_score: float = 0.3, merge_dist: float = 0.8) -> List[dict]:
    """Merge observations of the same label that are close in 3D into objects."""
    objects: List[dict] = []
    for o in sorted(obs, key=lambda d: -d["score"]):
        best, best_d = None, 1e9
        for ob in objects:
            if ob["label"] != o["label"]:
                continue
            reach = max(merge_dist, 0.6 * float(np.max(ob["size"])))
            dist = float(np.linalg.norm(ob["position"] - o["position"]))
            if dist < reach and dist < best_d:
                best, best_d = ob, dist
        if best is None:
            objects.append({**o, "views": 1, "frames": [o["frame"]], "_w": o["score"]})
        else:
            wsum = best["_w"] + o["score"]
            best["position"] = (best["position"] * best["_w"] + o["position"] * o["score"]) / wsum
            best["size"] = np.maximum(best["size"], o["size"])
            best["_w"] = wsum
            best["views"] += 1
            if o["frame"] not in best["frames"]:
                best["frames"].append(o["frame"])
    out = []
    for i, ob in enumerate(o for o in objects if o["score"] >= min_score or o["views"] >= 2):
        out.append({
            "id": f"obj_{i:03d}", "label": ob["label"], "score": round(float(ob["score"]), 3),
            "views": int(ob["views"]), "frames": sorted(ob["frames"]),
            "position": [round(float(v), 3) for v in ob["position"]],
            "size": [round(float(v), 3) for v in ob["size"]],
            "evidence": {"keyframe": int(ob["keyframe"]), "frame": int(ob["frame"]),
                         "box": [round(v, 1) for v in ob["box"]]},
        })
    return out
