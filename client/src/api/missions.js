// Inspection API (server/src/routes/missions.js + inspections.js).
// Errors are thrown, never replaced with sample data: a failed scan must look failed.
const configuredApi = import.meta.env.VITE_API_URL;
const isRemoteBrowser = !['localhost', '127.0.0.1'].includes(window.location.hostname);
const pointsToLoopback = configuredApi && /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/)/.test(configuredApi);
const API = isRemoteBrowser && pointsToLoopback ? '/api' : configuredApi || '/api';

export async function call(path, options) {
  const res = await fetch(`${API}${path}`, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

/** Upload a recorded scan. Returns { id, status: "processing" }. */
export const uploadScan = (video, { scene = 'Indoor', label } = {}) => {
  const q = new URLSearchParams({ scene, ...(label ? { label } : {}) });
  return call(`/missions?${q}`, { method: 'POST', headers: { 'Content-Type': video.type.split(';')[0] || 'video/webm' }, body: video });
};

export const getMission = (id) => call(`/missions/${id}`);

export const createInspection = (baselineId, currentId, markerSizeCm = 0) =>
  call('/inspections', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ baselineId, currentId, markerSizeCm }),
  });

export const getInspection = (id) => call(`/inspections/${id}`);
export const explainInspection = (id) => call(`/inspections/${id}/explain`, { method: 'POST' });


export async function uploadPhotos(files, { scene = 'Indoor', label } = {}) {
  if (files.length < 3 || files.length > 96) throw new Error('Choose between 3 and 96 overlapping photos.');
  if (files.some(f => f.size > 10 * 1024 * 1024) || files.reduce((sum, f) => sum + f.size, 0) > 80 * 1024 * 1024) throw new Error('Use photos under 10 MB each and 80 MB total.');
  const { zipSync } = await import('fflate');
  const entries = {};
  for (const [index, file] of files.entries()) {
    const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type];
    if (!extension) throw new Error('Choose JPG, PNG, or WebP photos.');
    entries[`${String(index).padStart(3, '0')}.${extension}`] = new Uint8Array(await file.arrayBuffer());
  }
  const query = new URLSearchParams({ scene, ...(label ? { label } : {}) });
  return call(`/missions/images?${query}`, { method: 'POST', headers: { 'Content-Type': 'application/zip' }, body: zipSync(entries, { level: 0 }) });
}
export const createPairing = () => call('/capture-sessions', { method: 'POST' });
export const getPairing = (id, token) => call(`/capture-sessions/${id}`, { headers: { 'X-Pairing-Token': token } });
export const uploadPairedScan = (id, token, video, scene) => call(`/capture-sessions/${id}/scan?${new URLSearchParams({ scene })}`, { method: 'POST', headers: { 'Content-Type': video.type.split(';')[0] || 'video/webm', 'X-Pairing-Token': token }, body: video });
