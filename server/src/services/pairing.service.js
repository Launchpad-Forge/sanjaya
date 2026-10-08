import { randomBytes, randomUUID, createHash, timingSafeEqual } from 'node:crypto';
import { getJson, putJson } from './storage.service.js';
import { createMission } from './mission.service.js';
const digest = value => createHash('sha256').update(value).digest();
const path = id => `capture-sessions/${id}.json`;
const busy = new Set();
const fail = (status, message) => Object.assign(new Error(message), { status });

export function tokenMatches(token, hash) {
  return typeof token === 'string' && token.length === 64 && typeof hash === 'string' && /^[0-9a-f]{64}$/.test(hash) && timingSafeEqual(digest(token), Buffer.from(hash, 'hex'));
}
export async function createPairing() {
  const captureToken = randomBytes(32).toString('hex'), viewerToken = randomBytes(32).toString('hex');
  const session = { id: randomUUID(), expiresAt: Date.now() + 30 * 60_000, status: 'waiting', missionId: null, captureHash: digest(captureToken).toString('hex'), viewerHash: digest(viewerToken).toString('hex') };
  await putJson(path(session.id), session);
  return { id: session.id, captureToken, viewerToken, expiresAt: session.expiresAt };
}
async function authorize(id, token, role) {
  const session = await getJson(path(id));
  if (!tokenMatches(token, session[`${role}Hash`])) throw fail(403, 'This pairing link is not valid.');
  if (session.expiresAt < Date.now()) throw fail(410, 'This pairing link has expired. Create a new connection.');
  return session;
}
export async function getPairing(id, token) {
  const session = await authorize(id, token, 'viewer');
  return { id, status: session.status, missionId: session.missionId, expiresAt: session.expiresAt };
}
export async function uploadPairedScan(id, token, video, mime, options) {
  const session = await authorize(id, token, 'capture');
  if (session.status !== 'waiting' || busy.has(id)) throw fail(409, 'This phone connection has already received a scan.');
  busy.add(id);
  try {
    const mission = await createMission(video, mime, { ...options, source: 'phone' });
    await putJson(path(id), { ...session, status: 'processing', missionId: mission.id });
    return mission;
  } finally { busy.delete(id); }
}
