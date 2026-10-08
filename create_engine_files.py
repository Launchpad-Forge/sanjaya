import os

files = {
    "engine/requirements.txt": """fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.2
websockets==12.0
numpy==1.26.2""",
    "engine/.env.example": """ENGINE_SECRET=internal_engine_secret
SERVER_INTERNAL_URL=http://localhost:3000/api/internal
ENGINE_MODE=mock
VISER_PORT=8080""",
    "engine/Dockerfile": """FROM nvidia/cuda:12.1.1-cudnn8-runtime-ubuntu22.04
# TODO: install dependencies and setup entrypoint
""",
    "engine/modal_app.py": """# TODO: Modal deployment entry""",
    "engine/app/main.py": """from fastapi import FastAPI, WebSocket
import asyncio

app = FastAPI()

@app.get("/health")
def health():
    return {"ok": True}

@app.websocket("/ws/session/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str, token: str = None, role: str = "viewer"):
    await websocket.accept()
    if role == "viewer":
        # Start sending mock points for demonstration
        from app.adapters.mock_adapter import MockAdapter
        adapter = MockAdapter()
        try:
            while True:
                update = adapter.get_next_update()
                await websocket.send_json(update)
                await asyncio.sleep(0.2) # ~5 fps
        except Exception:
            pass
    else:
        # publisher logic
        try:
            while True:
                data = await websocket.receive_bytes()
        except Exception:
            pass
""",
    "engine/app/adapters/mock_adapter.py": """import math
import time
import random

class MockAdapter:
    # WORKING: returns a slowly growing fake point cloud + circular trajectory
    def __init__(self):
        self.points = []
        self.start_time = time.time()

    def get_next_update(self):
        t = time.time() - self.start_time
        
        # Circular trajectory
        r = 2.0
        x = r * math.cos(t)
        y = r * math.sin(t)
        z = 1.0 + 0.1 * math.sin(t * 3)
        pose = {"x": x, "y": y, "z": z}
        
        # Add a new point near the trajectory
        new_point = [
            x + random.uniform(-0.5, 0.5),
            y + random.uniform(-0.5, 0.5),
            z + random.uniform(-0.5, 0.5),
            random.randint(0, 255), # R
            random.randint(0, 255), # G
            random.randint(0, 255)  # B
        ]
        self.points.append(new_point)
        
        return {
            "type": "map_update",
            "newPoints": [new_point],
            "pose": pose,
            "fps": 5,
            "latencyMs": 15
        }
""",
    "engine/third_party/README.md": """# Third Party Submodules
Instructions to add as git submodules:
- `VGGT-SLAM`: `conda create -n vggt-slam python=3.11 && ./setup.sh`
- `lingbot-map`: `conda create -n lingbot-map python=3.10` (torch 2.8.0 cu128, pip install -e ".[vis]", get weights from HF robbyant/lingbot-map)
- `Hydra`: reference only
- `MASt3R-SLAM`: research-only benchmarking
""",
    "engine/third_party/LICENSES.md": """| Repo | Code License | Model License | Allowed Use |
|---|---|---|---|
| VGGT-SLAM | BSD-2 | SAM 3 (Open) | Commercial/Research |
| lingbot-map | Apache-2.0 | Apache-2.0 | Commercial/Research |
| Hydra | BSD-2 | N/A | Commercial/Research |
| MASt3R-SLAM | Unknown | Research-only | Non-commercial / Research |
"""
}

stub_files = [
    "engine/app/session_manager.py", "engine/app/protocol.py", "engine/app/adapters/base.py",
    "engine/app/adapters/vggt_slam_adapter.py", "engine/app/adapters/lingbot_adapter.py", "engine/app/adapters/mast3r_adapter.py",
    "engine/app/sources/phone_ws_source.py", "engine/app/semantics/lifter.py",
    "engine/app/mental_map/scene_graph.py", "engine/app/exporters/ply.py", "engine/app/exporters/scene_graph_json.py",
    "engine/scripts/offline_video_test.py", "engine/tests/test_mock_adapter.py"
]

for path, content in files.items():
    os.makedirs(os.path.dirname(path) if os.path.dirname(path) else ".", exist_ok=True)
    with open(path, "w") as f:
        f.write(content)

for path in stub_files:
    os.makedirs(os.path.dirname(path) if os.path.dirname(path) else ".", exist_ok=True)
    with open(path, "w") as f:
        if path == "engine/app/adapters/vggt_slam_adapter.py":
            f.write("# TODO (PRIMARY): run third_party/VGGT-SLAM real-time loop fed by sources/phone_ws_source.py\n")
        else:
            f.write("# TODO: " + os.path.basename(path) + "\n")

print("Engine files created.")
