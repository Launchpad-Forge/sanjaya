# Real-time Protocol

## Pairing
- Laptop calls `POST /api/sessions` -> returns `{ sessionId, pairingCode, engineWsUrl, viewerToken }`.
- Laptop shows QR code: `${CLIENT_URL}/capture/${sessionId}?code=${pairingCode}`.
- Phone opens it, calls `POST /api/sessions/:id/pair` -> gets `publisherToken`.

## WebSocket (wss://ENGINE/ws/session/{id}?token=...&role=publisher|viewer)
- **Publisher -> Engine**: `frame` (binary JPEG <= 640px, ~5 fps, with header {ts, seq, imu?}), `stop`.
- **Engine -> All**: `map_update` {newPoints, pose, fps, latencyMs}, `entities` [...], `status` {queuePosition, mode}.

## HTTP (Engine -> Server)
- **Engine -> Server**: `POST /api/internal/keyframes` every ~2s -> Server calls Gemini -> Returns labels -> Engine lifts to 3D.