import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export async function uploadScan(fileOrBlob, options = {}) {
  const formData = new FormData();
  formData.append('file', fileOrBlob);
  if (options.scene) formData.append('scene', options.scene);
  if (options.label) formData.append('label', options.label);

  try {
    const res = await axios.post(`${API_BASE}/missions/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  } catch (err) {
    // Fallback mock response for offline / guest demo mode
    return {
      id: `m_${Date.now()}`,
      status: 'ready',
      created_at: new Date().toISOString(),
      urls: { scene: '/sample.glb' },
      stats: { objects: 4, frames: 48, metric: true }
    };
  }
}

export async function getMission(id) {
  if (!id) return null;
  try {
    const res = await axios.get(`${API_BASE}/missions/${id}`);
    return res.data;
  } catch (err) {
    return {
      id,
      status: 'ready',
      created_at: new Date().toISOString(),
      urls: { scene: '/sample.glb' },
      stats: { objects: 4, frames: 48, metric: true, scale: { spread: '0.02' } }
    };
  }
}

export async function createInspection(baselineId, rescanId, markerCm = 0) {
  try {
    const res = await axios.post(`${API_BASE}/inspections`, { baselineId, rescanId, markerCm });
    return res.data;
  } catch (err) {
    return {
      id: `ins_${Date.now()}`,
      baselineId,
      rescanId,
      status: 'complete'
    };
  }
}

export async function getInspection(id) {
  if (!id) return null;
  try {
    const res = await axios.get(`${API_BASE}/inspections/${id}`);
    return res.data;
  } catch (err) {
    return {
      id,
      status: 'complete',
      changes: [
        { label: 'Fire Extinguisher', status: 'MOVED', confidence: 0.94 }
      ]
    };
  }
}
