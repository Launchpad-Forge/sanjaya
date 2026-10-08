import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pathToFileURL } from 'node:url';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import inspections from './routes/inspections.js';
import missions from './routes/missions.js';
import captureSessions from './routes/captureSessions.js';

export const app = express();
app.set('trust proxy', 1); // Render / Vercel proxies: rate limits use the client IP
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL.split(',').map((s) => s.trim()) }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/missions', missions);
app.use('/api/capture-sessions', captureSessions);
app.use('/api/inspections', inspections);
app.use(errorHandler);

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  app.listen(env.PORT, () => console.log(`Server running on port ${env.PORT}`));
}
