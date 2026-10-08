import os

files = {
    "server/package.json": """{
  "name": "sanjaya-server",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "node src/index.js",
    "lint": "eslint . --ext js",
    "db:push": "prisma db push",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "zod": "^3.22.4",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "@prisma/client": "^5.6.0"
  },
  "devDependencies": {
    "prisma": "^5.6.0"
  }
}""",
    "server/.env.example": """PORT=3000
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgres://postgres:postgres@localhost:5432/sanjaya
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=supersecret
ENGINE_SECRET=internal_engine_secret""",
    "server/prisma/schema.prisma": """generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  RESEARCHER
  ADMIN
}

enum SessionStatus {
  PAIRING
  STREAMING
  ENDED
}

enum IdeaCategory {
  RESEARCH
  FEATURE
  DATASET
  USE_CASE
}

enum IdeaStatus {
  OPEN
  ACCEPTED
  IN_PROGRESS
  DONE
}

model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String
  role         Role     @default(USER)
  createdAt    DateTime @default(now())

  LiveSession  LiveSession[]
  Mission      Mission[]
  Idea         Idea[]
  IdeaVote     IdeaVote[]
  AuditLog     AuditLog[]
}

model LiveSession {
  id          String        @id @default(uuid())
  userId      String?
  status      SessionStatus @default(PAIRING)
  pairingCode String?
  engineMode  String        @default("mock")
  startedAt   DateTime      @default(now())
  endedAt     DateTime?

  User        User?         @relation(fields: [userId], references: [id])
}

model Mission {
  id             String   @id @default(uuid())
  userId         String
  title          String
  siteName       String?
  sessionId      String?
  pointCloudUrl  String?
  sceneGraphJson String?
  stats          Json?
  createdAt      DateTime @default(now())

  User           User     @relation(fields: [userId], references: [id])
  Entity         Entity[]
}

model Entity {
  id               String   @id @default(uuid())
  missionId        String
  label            String
  x                Float
  y                Float
  z                Float
  confidence       Float
  evidenceFrameUrl String?
  confirmed        Boolean  @default(false)
  firstSeen        DateTime @default(now())
  lastSeen         DateTime @default(now())

  Mission          Mission  @relation(fields: [missionId], references: [id])
}

model Idea {
  id        String       @id @default(uuid())
  userId    String
  title     String
  body      String
  category  IdeaCategory
  status    IdeaStatus   @default(OPEN)
  createdAt DateTime     @default(now())

  User      User         @relation(fields: [userId], references: [id])
  IdeaVote  IdeaVote[]
}

model IdeaVote {
  userId String
  ideaId String
  User   User   @relation(fields: [userId], references: [id])
  Idea   Idea   @relation(fields: [ideaId], references: [id])

  @@id([userId, ideaId])
}

model AuditLog {
  id        String   @id @default(uuid())
  userId    String?
  action    String
  target    String
  meta      Json?
  createdAt DateTime @default(now())

  User      User?    @relation(fields: [userId], references: [id])
}""",
    "server/src/index.js": """import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
""",
    "server/src/services/gemini.service.js": """// TODO: label keyframes (points/boxes) + "ask the map" — key from env only
export async function labelKeyframe(imageBuffer) {
  return { label: 'TODO' };
}""",
    "server/src/services/session.service.js": """// TODO: create live session, issue short-lived engine token + pairing code
export async function createSession() { return {}; }"""
}

stub_files = [
    "server/src/config/env.js", "server/src/middleware/auth.js", "server/src/middleware/requireRole.js",
    "server/src/middleware/validate.js", "server/src/middleware/rateLimit.js", "server/src/middleware/errorHandler.js",
    "server/src/middleware/internalAuth.js",
    "server/src/routes/auth.js", "server/src/routes/users.js", "server/src/routes/sessions.js",
    "server/src/routes/missions.js", "server/src/routes/ideas.js", "server/src/routes/ai.js",
    "server/src/routes/internal.js", "server/src/routes/health.js",
    "server/src/controllers/auth.controller.js", "server/src/controllers/users.controller.js",
    "server/src/controllers/sessions.controller.js", "server/src/controllers/missions.controller.js",
    "server/src/controllers/ideas.controller.js", "server/src/controllers/ai.controller.js",
    "server/src/controllers/internal.controller.js",
    "server/src/services/storage.service.js",
    "server/src/validators/auth.validator.js", "server/src/utils/jwt.js", "server/src/utils/password.js", "server/src/utils/logger.js"
]

for path, content in files.items():
    os.makedirs(os.path.dirname(path) if os.path.dirname(path) else ".", exist_ok=True)
    with open(path, "w") as f:
        f.write(content)

for path in stub_files:
    os.makedirs(os.path.dirname(path) if os.path.dirname(path) else ".", exist_ok=True)
    with open(path, "w") as f:
        f.write("// TODO: " + os.path.basename(path) + "\n")

print("Server files created.")
