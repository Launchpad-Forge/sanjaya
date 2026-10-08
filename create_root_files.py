import os

files = {
    "package.json": """{
  "name": "sanjaya",
  "version": "0.1.0",
  "private": true,
  "workspaces": ["client", "server"],
  "scripts": {
    "dev": "concurrently \\"npm run dev -w client\\" \\"npm run dev -w server\\"",
    "dev:engine": "cd engine && uvicorn app.main:app --reload --port 8000",
    "lint": "npm run lint -w client && npm run lint -w server",
    "build": "npm run build -w client"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}""",
    "docker-compose.yml": """version: '3.8'
services:
  server:
    build:
      context: ./server
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    depends_on:
      - engine
  engine:
    build:
      context: ./engine
    ports:
      - "8000:8000"
    environment:
      - ENGINE_MODE=mock""",
    ".gitignore": """node_modules/
dist/
.env
__pycache__/
*.pyc
.DS_Store""",
    ".editorconfig": """root = true
[*]
charset = utf-8
indent_style = space
indent_size = 2
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true""",
    ".nvmrc": """20""",
    "README.md": """# SANJAYA
Single-camera 3D mapping engine.

A user opens the web app on their phone, streams frames to a GPU engine, which rebuilds the scene in 3D from pixels using monocular geometric foundation models.

## Deploy Steps
- Client: Vercel
- Server: Render
- DB: Supabase
- Engine: Modal / RunPod""",
    "CLAUDE.md": """# SANJAYA Context for Coding Agents

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
10. Deploy.""",
    "CONTRIBUTING.md": """# Contributing to SANJAYA\nTODO: instructions on issues, branches, PR checklist, and DCO sign-off.""",
    "CODE_OF_CONDUCT.md": """# Code of Conduct\nContributor Covenant 2.1 applies here.""",
    "SECURITY.md": """# Security Policy\nTODO: responsible vulnerability disclosure.""",
    "RESPONSIBLE_USE.md": """# Responsible Use Policy\nHuman-in-the-loop, no weapons targeting, privacy constraints.""",
    "CITATION.cff": """cff-version: 1.2.0
message: "If you use this software, please cite it as below."
authors:
  - family-names: "SANJAYA"
    given-names: "Contributors"
title: "SANJAYA: Single-Camera 3D Mapping Engine"
version: 0.1.0""",
    "LICENSE": """Apache License 2.0\nTODO: Insert full text.""",
    ".github/workflows/ci.yml": """name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run lint
      - run: npm run build""",
    ".github/ISSUE_TEMPLATE/bug_report.md": """---\nname: Bug report\nabout: Create a report to help us improve\ntitle: ''\nlabels: ''\nassignees: ''\n---\nTODO: Bug template""",
    ".github/ISSUE_TEMPLATE/feature_request.md": """---\nname: Feature request\nabout: Suggest an idea for this project\ntitle: ''\nlabels: ''\nassignees: ''\n---\nTODO: Feature template""",
    ".github/ISSUE_TEMPLATE/research_idea.md": """---\nname: Research Idea\nabout: Propose a research extension\ntitle: ''\nlabels: ''\nassignees: ''\n---\nTODO: Research idea template""",
    ".github/PULL_REQUEST_TEMPLATE.md": """# Pull Request\nTODO: PR checklist.""",
    "docs/architecture.md": """# Architecture\nTODO: data flow phone -> engine -> viewers.""",
    "docs/realtime-protocol.md": """# Real-time Protocol

## Pairing
- Laptop calls `POST /api/sessions` -> returns `{ sessionId, pairingCode, engineWsUrl, viewerToken }`.
- Laptop shows QR code: `${CLIENT_URL}/capture/${sessionId}?code=${pairingCode}`.
- Phone opens it, calls `POST /api/sessions/:id/pair` -> gets `publisherToken`.

## WebSocket (wss://ENGINE/ws/session/{id}?token=...&role=publisher|viewer)
- **Publisher -> Engine**: `frame` (binary JPEG <= 640px, ~5 fps, with header {ts, seq, imu?}), `stop`.
- **Engine -> All**: `map_update` {newPoints, pose, fps, latencyMs}, `entities` [...], `status` {queuePosition, mode}.

## HTTP (Engine -> Server)
- **Engine -> Server**: `POST /api/internal/keyframes` every ~2s -> Server calls Gemini -> Returns labels -> Engine lifts to 3D.""",
    "docs/research/related-work.md": """# Related Work\nTODO: VGGT-SLAM 2.0 (RSS 2026), FOUND-IT, Hydra, Kimera, MASt3R-SLAM, LingBot-Map, MapAnything, VGGT, Depth Anything 3, ConceptGraphs.""",
    "docs/benchmarks.md": """# Benchmarks\n| Dataset | ATE | Chamfer | FPS |\n|---|---|---|---|""",
    "docs/dev-https.md": """# HTTPS Development
Phone cameras require HTTPS context.
Use Cloudflare tunnels for local dev:
`cloudflared tunnel --url http://localhost:5173`
`cloudflared tunnel --url http://localhost:8000`"""
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path) if os.path.dirname(path) else ".", exist_ok=True)
    with open(path, "w") as f:
        f.write(content)
print("Root files created.")
