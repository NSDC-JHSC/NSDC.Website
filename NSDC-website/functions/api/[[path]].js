// The whole backend: one Cloudflare Pages Function that handles every /api/* request.
import {
  HttpError, TEAMS, getDb, json, readJson, str, safeUrl, safeImage, imageIdOf, deleteImageByUrl,
  eventTag, publicEvent, getSettings, DEFAULT_SETTINGS,
} from '../_lib/db.js';
import { checkPassword, makeToken, isAdmin, sessionCookie, clientIp, rateLimit } from '../_lib/auth.js';
import { DEMO_MEMBERS, DEMO_EVENTS, DEMO_STARS } from '../_lib/demo.js';

const routes = [];
const add = (method, pattern, handler, admin = false) =>
  routes.push({ method, admin, handler, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '/?$') });

const num = (v) => { const n = Number(v); return Number.isInteger(n) && n > 0 ? n : null; };
const need = (cond, msg) => { if (!cond) throw new HttpError(400, msg); };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ====================== PUBLIC ======================
add('GET', '/health', () => json({ status: 'OK' }));

add('GET', '/settings', async ({ DB }) => json({ settings: await getSettings(DB) }));

add('GET', '/events', async ({ DB }) => {
  const { results } = await DB.prepare('SELECT * FROM events').all();
  const list = results.map(publicEvent);
  const live = list.filter((e) => e.tag !== 'PAST').sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
  const past = list.filter((e) => e.tag === 'PAST').sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return json({ events: [...live, ...past] });
});

add('GET', '/team/:slug', async ({ DB, params }) => {
  need(TEAMS.includes(params.slug), 'Unknown team');
  const { results } = await DB.prepare('SELECT * FROM members WHERE team = ? ORDER BY is_lead DESC, sort, id').bind(params.slug).all();
  const shape = (r) => ({ id: r.id, name: r.name, role: r.role, image: r.image, linkedin: r.linkedin, github: r.github });
  return json({ leads: results.filter((r) => r.is_lead).map(shape), members: results.filter((r) => !r.is_lead).map(shape) });
});

add('GET', '/stars', async ({ DB }) => {
  const { results } = await DB.prepare("SELECT * FROM stars ORDER BY month DESC, CASE type WHEN 'lead' THEN 0 ELSE 1 END, id").all();
  return json({ stars: results });
});

add('POST', '/events/:id/register', async ({ DB, request, params }) => {
  const body = await readJson(request);
  if (body.website) return json({ success: true }); // honeypot: bots fill this hidden field
  const ev = await DB.prepare('SELECT * FROM events WHERE id = ?').bind(num(params.id)).first();
  if (!ev) throw new HttpError(404, 'Event not found');
  if (!ev.reg_open) throw new HttpError(400, 'Registration is not open for this event');
  if (eventTag(ev) === 'PAST') throw new HttpError(400, 'This event is already over');
  const name = str(body.name, 80), email = str(body.email, 120).toLowerCase();
  need(name.length >= 2, 'Please enter your name');
  need(EMAIL.test(email), 'Please enter a valid email');
  if (!(await rateLimit(DB, `reg:${clientIp(request)}`, 15, 3600))) throw new HttpError(429, 'Too many attempts. Try again later.');
  try {
    await DB.prepare('INSERT INTO registrations (event_id, name, email, phone, course, created_at) VALUES (?,?,?,?,?,?)')
      .bind(ev.id, name, email, str(body.phone, 20), str(body.course, 120), Date.now()).run();
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) throw new HttpError(409, 'You are already registered for this event');
    throw e;
  }
  return json({ success: true, message: `You are registered for "${ev.title}"!` }, 201);
});

// ====================== ADMIN ======================
add('POST', '/admin/login', async ({ DB, request, env }) => {
  const ip = clientIp(request);
  if (!(await rateLimit(DB, `login:${ip}`, 8, 900))) throw new HttpError(429, 'Too many attempts. Wait 15 minutes.');
  const { password } = await readJson(request);
  if (typeof password !== 'string' || !(await checkPassword(env, password))) throw new HttpError(401, 'Wrong password');
  return json({ success: true }, 200, { 'Set-Cookie': sessionCookie(request, await makeToken(env)) });
});

add('POST', '/admin/logout', ({ request }) => json({ success: true }, 200, { 'Set-Cookie': sessionCookie(request, '', 0) }));

add('GET', '/admin/me', ({ env }) => json({ admin: true, demo: env.DEMO === 'true' }), true);

// ---- images ----
const MIME_OK = /^image\/(png|jpeg|webp|gif)$/;
const MAX_IMAGE = 1.2 * 1024 * 1024;
add('POST', '/admin/images', async ({ DB, request }) => {
  let file;
  try { file = (await request.formData()).get('image'); } catch { throw new HttpError(400, 'Invalid upload'); }
  if (!file || typeof file === 'string') throw new HttpError(400, 'No image received');
  if (!MIME_OK.test(file.type)) throw new HttpError(400, 'Only PNG, JPG, WEBP or GIF images are allowed');
  if (file.size > MAX_IMAGE) throw new HttpError(413, 'Image is too big (max 1.2 MB). Try a smaller photo.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  await DB.prepare('INSERT INTO images (id, mime, data, created_at) VALUES (?,?,?,?)').bind(id, file.type, btoa(bin), Date.now()).run();
  return json({ url: `/img/${id}` }, 201);
}, true);

add('POST', '/admin/images/cleanup', async ({ DB }) => {
  // removes photos that were uploaded but are no longer used anywhere
  const r = await DB.prepare(`DELETE FROM images WHERE ('/img/' || id) NOT IN (
    SELECT image FROM members UNION SELECT poster FROM events UNION SELECT image FROM stars
    UNION SELECT value FROM settings WHERE key = 'logo')`).run();
  const total = await DB.prepare('SELECT COUNT(*) AS n FROM images').first();
  return json({ removed: r.meta.changes || 0, remaining: total.n });
}, true);

// ---- events ----
const eventFields = (b) => ({
  title: str(b.title, 150),
  tag: ['AUTO', 'UPCOMING', 'ONGOING', 'PAST'].includes(b.tag) ? b.tag : 'AUTO',
  date: /^\d{4}-\d{2}-\d{2}$/.test(b.date || '') ? b.date : '',
  timing: str(b.timing, 60), venue: str(b.venue, 120), description: str(b.desc ?? b.description, 1500),
  poster: safeImage(b.poster), link: safeUrl(b.link), reg_open: b.regOpen ? 1 : 0,
});

add('GET', '/admin/events', async ({ DB }) => {
  const { results } = await DB.prepare(
    'SELECT e.*, (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS reg_count FROM events e ORDER BY date DESC, id DESC').all();
  return json({ events: results.map((e) => ({ ...publicEvent(e), rawTag: e.tag, regCount: e.reg_count })) });
}, true);

add('POST', '/admin/events', async ({ DB, request }) => {
  const f = eventFields(await readJson(request));
  need(f.title, 'Title is required');
  const r = await DB.prepare('INSERT INTO events (title, tag, date, timing, venue, description, poster, link, reg_open, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .bind(f.title, f.tag, f.date, f.timing, f.venue, f.description, f.poster, f.link, f.reg_open, Date.now()).run();
  return json({ success: true, id: r.meta.last_row_id }, 201);
}, true);

add('PUT', '/admin/events/:id', async ({ DB, request, params }) => {
  const id = num(params.id);
  const old = await DB.prepare('SELECT poster FROM events WHERE id = ?').bind(id).first();
  if (!old) throw new HttpError(404, 'Event not found');
  const f = eventFields(await readJson(request));
  need(f.title, 'Title is required');
  await DB.prepare('UPDATE events SET title=?, tag=?, date=?, timing=?, venue=?, description=?, poster=?, link=?, reg_open=? WHERE id=?')
    .bind(f.title, f.tag, f.date, f.timing, f.venue, f.description, f.poster, f.link, f.reg_open, id).run();
  if (old.poster && old.poster !== f.poster) await deleteImageByUrl(DB, old.poster);
  return json({ success: true });
}, true);

add('DELETE', '/admin/events/:id', async ({ DB, params }) => {
  const id = num(params.id);
  const old = await DB.prepare('SELECT poster FROM events WHERE id = ?').bind(id).first();
  if (!old) throw new HttpError(404, 'Event not found');
  await DB.batch([
    DB.prepare('DELETE FROM registrations WHERE event_id = ?').bind(id),
    DB.prepare('DELETE FROM events WHERE id = ?').bind(id),
  ]);
  await deleteImageByUrl(DB, old.poster);
  return json({ success: true });
}, true);

add('GET', '/admin/events/:id/registrations', async ({ DB, params }) => {
  const { results } = await DB.prepare('SELECT * FROM registrations WHERE event_id = ? ORDER BY id DESC').bind(num(params.id)).all();
  return json({ registrations: results });
}, true);

add('GET', '/admin/events/:id/registrations.csv', async ({ DB, params }) => {
  const id = num(params.id);
  const ev = await DB.prepare('SELECT title FROM events WHERE id = ?').bind(id).first();
  const { results } = await DB.prepare('SELECT * FROM registrations WHERE event_id = ? ORDER BY id').bind(id).all();
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [['Name', 'Email', 'Phone', 'Course', 'Registered at (IST)'].map(q).join(',')];
  for (const r of results) {
    const when = new Date(r.created_at + 5.5 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 16);
    rows.push([r.name, r.email, r.phone, r.course, when].map(q).join(','));
  }
  const fname = (ev?.title || 'event').replace(/[^\w]+/g, '_');
  return new Response('﻿' + rows.join('\r\n'), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${fname}_registrations.csv"`, 'Cache-Control': 'no-store' },
  });
}, true);

add('DELETE', '/admin/registrations/:id', async ({ DB, params }) => {
  await DB.prepare('DELETE FROM registrations WHERE id = ?').bind(num(params.id)).run();
  return json({ success: true });
}, true);

// ---- team members ----
const memberFields = (b) => ({
  name: str(b.name, 80), role: str(b.role, 80), image: safeImage(b.image),
  linkedin: safeUrl(b.linkedin), github: safeUrl(b.github), is_lead: b.isLead ? 1 : 0,
});

add('POST', '/admin/team/:slug', async ({ DB, request, params }) => {
  need(TEAMS.includes(params.slug), 'Unknown team');
  const f = memberFields(await readJson(request));
  need(f.name, 'Name is required');
  const top = await DB.prepare('SELECT COALESCE(MAX(sort), 0) AS s FROM members WHERE team = ? AND is_lead = ?').bind(params.slug, f.is_lead).first();
  const r = await DB.prepare('INSERT INTO members (team, is_lead, name, role, image, linkedin, github, sort) VALUES (?,?,?,?,?,?,?,?)')
    .bind(params.slug, f.is_lead, f.name, f.role, f.image, f.linkedin, f.github, top.s + 1).run();
  return json({ success: true, id: r.meta.last_row_id }, 201);
}, true);

add('PUT', '/admin/members/:id', async ({ DB, request, params }) => {
  const id = num(params.id);
  const old = await DB.prepare('SELECT * FROM members WHERE id = ?').bind(id).first();
  if (!old) throw new HttpError(404, 'Member not found');
  const f = memberFields(await readJson(request));
  need(f.name, 'Name is required');
  let sort = old.sort;
  if (f.is_lead !== old.is_lead) {
    const top = await DB.prepare('SELECT COALESCE(MAX(sort), 0) AS s FROM members WHERE team = ? AND is_lead = ?').bind(old.team, f.is_lead).first();
    sort = top.s + 1;
  }
  await DB.prepare('UPDATE members SET name=?, role=?, image=?, linkedin=?, github=?, is_lead=?, sort=? WHERE id=?')
    .bind(f.name, f.role, f.image, f.linkedin, f.github, f.is_lead, sort, id).run();
  if (old.image && old.image !== f.image) await deleteImageByUrl(DB, old.image);
  return json({ success: true });
}, true);

add('DELETE', '/admin/members/:id', async ({ DB, params }) => {
  const id = num(params.id);
  const old = await DB.prepare('SELECT image FROM members WHERE id = ?').bind(id).first();
  if (!old) throw new HttpError(404, 'Member not found');
  await DB.prepare('DELETE FROM members WHERE id = ?').bind(id).run();
  await deleteImageByUrl(DB, old.image);
  return json({ success: true });
}, true);

add('POST', '/admin/members/:id/move', async ({ DB, request, params }) => {
  const id = num(params.id);
  const { dir } = await readJson(request);
  need(dir === 'up' || dir === 'down', 'Invalid direction');
  const me = await DB.prepare('SELECT team, is_lead FROM members WHERE id = ?').bind(id).first();
  if (!me) throw new HttpError(404, 'Member not found');
  const { results } = await DB.prepare('SELECT id FROM members WHERE team = ? AND is_lead = ? ORDER BY sort, id').bind(me.team, me.is_lead).all();
  const ids = results.map((r) => r.id);
  const i = ids.indexOf(id), j = dir === 'up' ? i - 1 : i + 1;
  if (j >= 0 && j < ids.length) [ids[i], ids[j]] = [ids[j], ids[i]];
  await DB.batch(ids.map((mid, k) => DB.prepare('UPDATE members SET sort = ? WHERE id = ?').bind(k + 1, mid)));
  return json({ success: true });
}, true);

// ---- stars of the month ----
const starFields = (b) => ({
  month: /^\d{4}-\d{2}$/.test(b.month || '') ? b.month : '',
  type: b.type === 'member' ? 'member' : 'lead',
  name: str(b.name, 80), course: str(b.course, 120), team: str(b.team, 60), note: str(b.note, 300), image: safeImage(b.image),
});

add('GET', '/admin/stars', async ({ DB }) => {
  const { results } = await DB.prepare('SELECT * FROM stars ORDER BY month DESC, id DESC').all();
  return json({ stars: results });
}, true);

add('POST', '/admin/stars', async ({ DB, request }) => {
  const f = starFields(await readJson(request));
  need(f.name, 'Name is required'); need(f.month, 'Pick a month');
  await DB.prepare('INSERT INTO stars (month, type, name, course, team, note, image, created_at) VALUES (?,?,?,?,?,?,?,?)')
    .bind(f.month, f.type, f.name, f.course, f.team, f.note, f.image, Date.now()).run();
  return json({ success: true }, 201);
}, true);

add('PUT', '/admin/stars/:id', async ({ DB, request, params }) => {
  const id = num(params.id);
  const old = await DB.prepare('SELECT image FROM stars WHERE id = ?').bind(id).first();
  if (!old) throw new HttpError(404, 'Not found');
  const f = starFields(await readJson(request));
  need(f.name, 'Name is required'); need(f.month, 'Pick a month');
  await DB.prepare('UPDATE stars SET month=?, type=?, name=?, course=?, team=?, note=?, image=? WHERE id=?')
    .bind(f.month, f.type, f.name, f.course, f.team, f.note, f.image, id).run();
  if (old.image && old.image !== f.image) await deleteImageByUrl(DB, old.image);
  return json({ success: true });
}, true);

add('DELETE', '/admin/stars/:id', async ({ DB, params }) => {
  const id = num(params.id);
  const old = await DB.prepare('SELECT image FROM stars WHERE id = ?').bind(id).first();
  await DB.prepare('DELETE FROM stars WHERE id = ?').bind(id).run();
  if (old) await deleteImageByUrl(DB, old.image);
  return json({ success: true });
}, true);

// ---- site settings (logo, about text ...) ----
add('PUT', '/admin/settings', async ({ DB, request }) => {
  const b = await readJson(request);
  const current = await getSettings(DB);
  const next = {};
  if ('logo' in b) next.logo = safeImage(b.logo);
  if ('about' in b) next.about = str(b.about, 4000);
  if ('hero_sub' in b) next.hero_sub = str(b.hero_sub, 300);
  if ('linkedin' in b) next.linkedin = safeUrl(b.linkedin) || DEFAULT_SETTINGS.linkedin;
  const entries = Object.entries(next);
  if (entries.length) {
    await DB.batch(entries.map(([k, v]) => DB.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').bind(k, v)));
  }
  if ('logo' in next && current.logo && current.logo !== next.logo) await deleteImageByUrl(DB, current.logo);
  return json({ success: true, settings: await getSettings(DB) });
}, true);

// ---- demo data (local testing only) ----
add('POST', '/admin/seed-demo', async ({ DB, env }) => {
  if (env.DEMO !== 'true') throw new HttpError(403, 'Demo data is only available on a local computer');
  const stmts = [];
  DEMO_MEMBERS.forEach((m, i) => stmts.push(DB.prepare('INSERT INTO members (team, is_lead, name, role, image, sort) VALUES (?,?,?,?,?,?)').bind(m.team, m.lead, m.name, m.role, m.image, i + 1)));
  DEMO_EVENTS.forEach((e) => stmts.push(DB.prepare('INSERT INTO events (title, tag, date, timing, venue, description, poster, link, reg_open, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(e.title, e.tag, e.date, e.timing, e.venue, e.description, e.poster, e.link, e.reg, Date.now())));
  DEMO_STARS.forEach((s) => stmts.push(DB.prepare('INSERT INTO stars (month, type, name, course, team, note, image, created_at) VALUES (?,?,?,?,?,?,?,?)').bind(s.month, s.type, s.name, s.course, s.team, s.note, s.image, Date.now())));
  await DB.batch(stmts);
  return json({ success: true });
}, true);

// ====================== ROUTER ======================
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, '') || '/';
  try {
    for (const r of routes) {
      if (r.method !== request.method) continue;
      const m = path.match(r.re);
      if (!m) continue;
      if (r.admin && !(await isAdmin(request, env))) throw new HttpError(401, 'Please login as admin');
      return await r.handler({ ...context, url, params: m.groups || {}, DB: await getDb(env) });
    }
    throw new HttpError(404, 'Not found');
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status);
    console.error(e);
    return json({ error: 'Server error' }, 500);
  }
}
