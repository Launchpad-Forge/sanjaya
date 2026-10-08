from fastapi import FastAPI, WebSocket
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
