"""The Sanjaya coordinate frame.

Everything we export (scene.glb, trajectory, objects, mental map, keyframe 3D maps)
uses ONE frame so the backend and viewers never have to convert:

  origin  first camera position
  +Y      up (opposite gravity, estimated from how the phone was held over the walk)
  -Z      the first camera's forward direction, flattened onto the ground
  +X      right
  units   metres after metric scaling (see scale.py); model units before

This is the glTF convention (Y up, right-handed), so 3D viewers show it upright.
"""

from __future__ import annotations

import numpy as np


def w2c_to_c2w(w2c: np.ndarray) -> np.ndarray:
    w2c = np.asarray(w2c, dtype=np.float64)
    m = np.repeat(np.eye(4)[None], len(w2c), axis=0)
    m[:, :3, :4] = w2c[:, :3, :4]
    return np.linalg.inv(m)


class SanjayaFrame:
    def __init__(self, w2c: np.ndarray):
        c2w = w2c_to_c2w(w2c)
        self.c2w_model = c2w
        self.origin = c2w[0, :3, 3].copy()

        # OpenCV camera: +x right, +y down, +z forward. Camera "up" in the world = -y axis.
        ups = c2w[:, :3, :3] @ np.array([0.0, -1.0, 0.0])
        up = ups.mean(axis=0)
        up = up / (np.linalg.norm(up) or 1.0)

        fwd = c2w[0, :3, :3] @ np.array([0.0, 0.0, 1.0])
        fwd = fwd - up * fwd.dot(up)
        if np.linalg.norm(fwd) < 1e-6:
            fwd = np.cross(up, [1.0, 0.0, 0.0])
        fwd = fwd / np.linalg.norm(fwd)

        z = -fwd
        x = np.cross(up, z)
        x = x / np.linalg.norm(x)
        self.R = np.stack([x, up, z])          # rows: world -> sanjaya axes
        self.scale = 1.0
        self.up_consistency = float(np.linalg.norm(ups.mean(axis=0)))  # 1.0 = phone held steadily upright

    def set_scale(self, s: float):
        self.scale = float(s)

    def points(self, p: np.ndarray) -> np.ndarray:
        p = np.asarray(p, dtype=np.float64)
        shape = p.shape
        q = (p.reshape(-1, 3) - self.origin) @ self.R.T * self.scale
        return q.reshape(shape).astype(np.float32)

    def camera_poses(self) -> np.ndarray:
        """Camera-to-world 4x4 poses in the Sanjaya frame, OpenGL camera axes
        (x right, y up, looking down -z) so viewers can use them directly."""
        flip = np.diag([1.0, -1.0, -1.0])
        out = np.repeat(np.eye(4)[None], len(self.c2w_model), axis=0)
        out[:, :3, :3] = self.R @ self.c2w_model[:, :3, :3] @ flip
        out[:, :3, 3] = (self.c2w_model[:, :3, 3] - self.origin) @ self.R.T * self.scale
        return out

    def camera_centers(self) -> np.ndarray:
        return self.camera_poses()[:, :3, 3]

    def camera_depth(self, w2c: np.ndarray, world_pts: np.ndarray) -> np.ndarray:
        """Depth along each camera's viewing axis for per-pixel world points
        (model units). world_pts [H,W,3] for one frame, w2c [3,4]."""
        p = world_pts.reshape(-1, 3).astype(np.float64)
        z = p @ np.asarray(w2c[2, :3], np.float64) + float(w2c[2, 3])
        return z.reshape(world_pts.shape[:-1])
