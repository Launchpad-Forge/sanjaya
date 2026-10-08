# SANJAYA Context for Coding Agents

**Project Goal**: Build a single-camera 3D mapping engine (working research prototype).

## Architecture
- **Client** (Phone/Laptop): React + Vite. Phone captures frames, Laptop views 3D map.
- **Server**: Node + Express. Handles auth, Prisma (Supabase), hands off to Gemini API.
- **Engine**: Python FastAPI worker. Receives frames over WS, builds map (VGGT-SLAM / LingBot / Mock), returns points to viewers.

## Rules
- **Gemini Key**: ONLY lives in `server/.env`. Engine asks server for AI labels.
- **Engine Modes**: `mock` (fake data for laptop dev), `vggt_slam` (primary), `lingbot`, `mast3r`.
- **Conventions**: JS (ES modules), Zod for validation, thin controllers/fat services. No secrets in code.

## Next Build Steps
1. Auth + Prisma migrations.
2. Session pairing + QR.
3. Phone capture -> engine (mock) -> laptop viewer.
4. Swap mock for VGGT-SLAM adapter (phone source + embedded Viser), LingBot-Map fallback.
5. Gemini labels -> 3D entities.
6. Mental-map view.
7. Missions save/replay.
8. Landing page content.
9. Ideas/community.
10. Deploy.