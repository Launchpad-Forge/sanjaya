"""Video / photo input -> ordered, model-ready frames.

The preprocessing reproduces LingBot-Map's ``load_and_preprocess_images`` (crop mode)
without torchvision, which the ZeroGPU base image does not ship. This approach was
first used in the community LingBot-Map Space by WilliamQM (Apache-2.0).
"""

from __future__ import annotations

import os
import tempfile
from typing import List, Optional, Sequence

import numpy as np
import torch

IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".bmp", ".webp", ".heic", ".heif")

try:  # iPhone photos (HEIC) - optional, needs pillow-heif
    import pillow_heif
    pillow_heif.register_heif_opener()
except Exception:  # noqa: BLE001
    pass


def spread(paths: Sequence[str], n: int) -> List[str]:
    """Keep at most n items, spread evenly from first to last (never just the first n)."""
    paths = list(paths)
    if len(paths) <= n:
        return paths
    idx = sorted({int(round(x)) for x in np.linspace(0, len(paths) - 1, n)})
    return [paths[i] for i in idx]


def sample_video(video_path: str, fps: float = 6, max_frames: int = 80,
                 out_dir: Optional[str] = None) -> List[str]:
    """Pick up to ``max_frames`` frames spread evenly over the WHOLE video, at no more
    than ``fps`` frames per second, so a long walk is covered end to end."""
    import cv2

    out_dir = out_dir or tempfile.mkdtemp(prefix="sanjaya_frames_")
    cap = cv2.VideoCapture(video_path)
    src_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    if total <= 0:
        while cap.grab():
            total += 1
        cap.release()
        cap = cv2.VideoCapture(video_path)
    total = max(total, 1)

    n_at_fps = max(2, int(round(total * float(fps) / max(1.0, src_fps))))
    n = max(2, min(int(max_frames), n_at_fps, total))
    wanted = {int(round(x)) for x in np.linspace(0, total - 1, n)}

    saved, idx = [], 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        if idx in wanted:
            path = os.path.join(out_dir, f"{len(saved):06d}.jpg")
            cv2.imwrite(path, frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
            saved.append(path)
        idx += 1
    cap.release()
    return saved


def _is_image(path: str) -> bool:
    if path.lower().endswith(IMAGE_EXTS):
        return True
    try:  # API uploads can arrive without a name or extension (e.g. ".../blob")
        from PIL import Image
        with Image.open(path) as im:
            im.verify()
        return True
    except Exception:  # noqa: BLE001
        return False


def list_images(files: Optional[Sequence]) -> List[str]:
    """Gradio upload (paths or file objects) -> ordered image paths.

    If every file has a distinct image file name (000.jpg, 001.jpg, ...), frames are
    sorted by name. Otherwise (API uploads often arrive as nameless "blob" files) the
    upload order is kept, so callers must send frames in walking order."""
    if not files:
        return []
    paths = []
    for f in files:
        p = f if isinstance(f, str) else getattr(f, "name", None) or getattr(f, "path", None)
        if p and os.path.isfile(p) and _is_image(p):
            paths.append(p)
    names = [os.path.basename(p) for p in paths]
    if len(set(names)) == len(names) and all(n.lower().endswith(IMAGE_EXTS) for n in names):
        paths = sorted(paths, key=lambda p: os.path.basename(p))
    return paths


def preprocess(paths: Sequence[str], image_size: int = 518, patch_size: int = 14) -> torch.Tensor:
    """Images -> float tensor [S, 3, H, W] in [0, 1]: width ``image_size``, height a
    multiple of ``patch_size``, centre-cropped to at most ``image_size``."""
    from PIL import Image, ImageOps

    tensors = []
    for p in paths:
        img = ImageOps.exif_transpose(Image.open(p))
        if img.mode == "RGBA":
            bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
            img = Image.alpha_composite(bg, img)
        img = img.convert("RGB")
        w, h = img.size
        new_w = image_size
        new_h = max(patch_size, round(h * (new_w / w) / patch_size) * patch_size)
        img = img.resize((new_w, new_h), Image.Resampling.BICUBIC)
        t = torch.from_numpy(np.array(img, dtype=np.uint8)).permute(2, 0, 1).float().div_(255.0)
        if new_h > image_size:
            top = (new_h - image_size) // 2
            t = t[:, top:top + image_size, :]
        tensors.append(t.contiguous())

    shapes = {tuple(t.shape[1:]) for t in tensors}
    if len(shapes) > 1:  # mixed aspect ratios: pad with white to the largest
        max_h = max(s[0] for s in shapes)
        max_w = max(s[1] for s in shapes)
        padded = []
        for t in tensors:
            ph, pw = max_h - t.shape[1], max_w - t.shape[2]
            t = torch.nn.functional.pad(t, (pw // 2, pw - pw // 2, ph // 2, ph - ph // 2), value=1.0)
            padded.append(t)
        tensors = padded
    return torch.stack(tensors)


def pick_keyframes(num_frames: int, k: int = 8) -> List[int]:
    k = max(1, min(int(k), num_frames))
    return sorted({int(round(x)) for x in np.linspace(0, num_frames - 1, k)})
