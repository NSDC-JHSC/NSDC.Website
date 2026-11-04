// Serves uploaded photos stored in the database:  /img/<id>
import { getDb } from '../_lib/db.js';

export async function onRequestGet(context) {
  const { request, env, params, waitUntil } = context;
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  if (cache) {
    const hit = await cache.match(request);
    if (hit) return hit;
  }
  const DB = await getDb(env);
  const row = await DB.prepare('SELECT mime, data FROM images WHERE id = ?').bind(String(params.id)).first();
  if (!row) return new Response('Not found', { status: 404 });

  const bin = atob(row.data);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

  const res = new Response(bytes, {
    headers: {
      'Content-Type': row.mime,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
  if (cache) (waitUntil || context.waitUntil).call(context, cache.put(request, res.clone()));
  return res;
}
