"""Frame sampling on real browser recordings (Chromium MediaRecorder).

MediaRecorder WebM has no frame count (OpenCV reports a huge negative number) and, from a
camera or canvas, often a 1000 fps timebase. Before the fix, sample_video counted frames
starting from that negative number and kept a single frame, so every WebM scan was rejected.

Fixtures: mediarecorder_chrome.* = 6 s moving canvas; loop_corridor* = the "loop" sequence
from LingBot-Map's examples (Apache-2.0), 237 frames at 16 fps, as H.264 MP4 and as a canvas
MediaRecorder WebM (the path a phone camera recording takes)."""

import os
import sys

import pytest

pytest.importorskip("torch")   # frames.py imports torch at module level
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sanjaya.frames import sample_video  # noqa: E402

FIX = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fixtures")


@pytest.mark.parametrize("name,seconds", [("mediarecorder_chrome.webm", 6), ("mediarecorder_chrome.mp4", 6),
                                          ("loop_corridor_chrome.webm", 14.8), ("loop_corridor.mp4", 14.8)])
def test_browser_recording_is_sampled_at_the_requested_rate(name, seconds, tmp_path):
    frames = sample_video(os.path.join(FIX, name), fps=6, max_frames=96, out_dir=str(tmp_path))
    assert abs(len(frames) - 6 * seconds) <= 0.15 * 6 * seconds    # ~6 frames per second of video
    assert all(os.path.getsize(f) > 0 for f in frames)
