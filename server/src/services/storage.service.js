// Private Supabase Storage bucket. Layout:
//   missions/{id}/mission.json            status + stats + objects
//   missions/{id}/sanjaya_mission.zip     the engine's mission bundle (input to /compare)
//   missions/{id}/files/...               scene.glb, crops/, keyframes/*.jpg, *.png for the viewer
//   inspections/{id}.json                 status + inspection result + explanations
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const bucket = () => sb.storage.from(env.SUPABASE_BUCKET);

let ready;
const ensureBucket = () =>
  (ready ??= sb.storage.createBucket(env.SUPABASE_BUCKET, { public: false }).then(({ error }) => {
    if (error && !/exists/i.test(error.message)) {
      ready = undefined;
      throw error;
    }
  }));

export async function put(path, body, contentType) {
  await ensureBucket();
  const { error } = await bucket().upload(path, body, { contentType, upsert: true });
  if (error) throw new Error(`storage upload ${path}: ${error.message}`);
}

export async function get(path) {
  const { data, error } = await bucket().download(path);
  if (error) {
    const e = new Error(`not found: ${path}`);
    e.status = 404;
    throw e;
  }
  return Buffer.from(await data.arrayBuffer());
}

export const putJson = (path, obj) => put(path, Buffer.from(JSON.stringify(obj)), 'application/json');
export const getJson = async (path) => JSON.parse((await get(path)).toString('utf8'));

/** { path: signedUrl } for files the browser may load (1 hour). Missing files are omitted. */
export async function signedUrls(paths, seconds = 3600) {
  const unique = [...new Set(paths.filter(Boolean))];
  if (!unique.length) return {};
  const { data, error } = await bucket().createSignedUrls(unique, seconds);
  if (error) throw new Error(`storage sign: ${error.message}`);
  return Object.fromEntries(data.filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl]));
}
