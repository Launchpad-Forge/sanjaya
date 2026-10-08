// Inspection API (server/src/routes/missions.js + inspections.js).
// Errors are thrown, never replaced with sample data: a failed scan must look failed.
const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function call(path, options) {
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
