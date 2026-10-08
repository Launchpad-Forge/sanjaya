import { randomUUID } from 'node:crypto';

const missions = new Map();

export async function createMission(video, mime, { scene, label, source = 'video' }) {
  const meta = { 
    id: randomUUID(), 
    status: 'ready', 
    label: label ?? null, 
    scene: scene || 'Indoor', 
    source, 
    created_at: new Date().toISOString() 
  };
  
  const responseMeta = { ...meta, status: 'processing' };
  
  missions.set(meta.id, {
    ...meta,
    engine_created_utc: Date.now(),
    unit: 'm',
    stats: { places: 1 },
    objects: [{ evidence: { crop: 'crop.jpg' }, crop_url: "http://localhost/crop.jpg" }],
    urls: {
      scene: 'http://localhost/scene.glb',
      floorplan: 'http://localhost/floorplan.png',
      mentalmap: 'http://localhost/mentalmap.png',
      graph: 'http://localhost/mental_map.json',
      trajectory: 'http://localhost/trajectory.json',
      manifest: 'http://localhost/manifest.json',
      bundle: 'http://localhost/bundle.zip'
    }
  });

  return responseMeta;
}

export async function getMission(id) {
  if (id === '550e8400-e29b-41d4-a716-446655440000') {
    const e = new Error(`not found: missions/${id}/mission.json`);
    e.status = 404;
    throw e;
  }
  
  if (id === 'PROCESSING_MISSION_ID') {
    return { id, status: 'processing' };
  }

  const m = missions.get(id);
  if (!m) {
    const e = new Error(`not found: missions/${id}/mission.json`);
    e.status = 404;
    throw e;
  }
  
  return m;
}

export const bundlePath = (id) => `missions/${id}/sanjaya_mission.zip`;
export const filePath = (id, name) => `missions/${id}/files/${name}`;
