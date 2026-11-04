// Database helpers (Cloudflare D1 = SQLite). Tables are created automatically on first use.

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export const TEAMS = [
  'coreTeam', 'techTeam', 'dataScienceTeam', 'creativeTeam',
  'mediaTeam', 'contentTeam', 'socialMediaTeam', 'managementTeam',
];

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT, team TEXT NOT NULL, is_lead INTEGER NOT NULL DEFAULT 0,
    name TEXT NOT NULL, role TEXT DEFAULT '', image TEXT DEFAULT '', linkedin TEXT DEFAULT '',
    github TEXT DEFAULT '', sort INTEGER NOT NULL DEFAULT 0)`,
  `CREATE INDEX IF NOT EXISTS idx_members_team ON members(team, is_lead, sort)`,
  `CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, tag TEXT NOT NULL DEFAULT 'AUTO',
    date TEXT DEFAULT '', timing TEXT DEFAULT '', venue TEXT DEFAULT '', description TEXT DEFAULT '',
    poster TEXT DEFAULT '', link TEXT DEFAULT '', reg_open INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL, name TEXT NOT NULL,
    email TEXT NOT NULL, phone TEXT DEFAULT '', course TEXT DEFAULT '', created_at INTEGER NOT NULL,
    UNIQUE(event_id, email))`,
  `CREATE TABLE IF NOT EXISTS stars (
    id INTEGER PRIMARY KEY AUTOINCREMENT, month TEXT NOT NULL, type TEXT NOT NULL, name TEXT NOT NULL,
    course TEXT DEFAULT '', team TEXT DEFAULT '', note TEXT DEFAULT '', image TEXT DEFAULT '',
    created_at INTEGER NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`,
  `CREATE TABLE IF NOT EXISTS images (id TEXT PRIMARY KEY, mime TEXT NOT NULL, data TEXT NOT NULL, created_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS rate (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL)`,
];

let ready = false;
export async function getDb(env) {
  if (!env.DB) {
    throw new HttpError(500, 'Database not connected. In Cloudflare: Settings > Bindings > add a D1 database with the variable name DB.');
  }
  if (!ready) {
    await env.DB.batch(SCHEMA.map((s) => env.DB.prepare(s)));
    ready = true;
  }
  return env.DB;
}

// ---------- small helpers ----------
export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } });

export async function readJson(request) {
  try { return (await request.json()) || {}; } catch { throw new HttpError(400, 'Invalid request'); }
}

export const str = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
export const safeUrl = (v) => { const s = str(v, 500); return /^https?:\/\//i.test(s) ? s : ''; };
// image field: our own uploads (/img/xxx), demo files (/mock/..) or an https link
export const safeImage = (v) => { const s = str(v, 500); return /^(\/img\/[a-z0-9]+|\/mock\/[\w.-]+|https:\/\/.+)$/i.test(s) ? s : ''; };
export const imageIdOf = (url) => { const m = /^\/img\/([a-z0-9]+)$/i.exec(url || ''); return m ? m[1] : null; };

export async function deleteImageByUrl(DB, url) {
  const id = imageIdOf(url);
  if (id) await DB.prepare('DELETE FROM images WHERE id = ?').bind(id).run();
}

export const todayIST = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);

export function eventTag(ev) {
  const t = ev.tag;
  if (t === 'UPCOMING' || t === 'ONGOING' || t === 'PAST') return t;
  if (!ev.date) return 'UPCOMING';
  const today = todayIST();
  return ev.date < today ? 'PAST' : ev.date === today ? 'ONGOING' : 'UPCOMING';
}

export const publicEvent = (e) => ({
  id: e.id, title: e.title, tag: eventTag(e), date: e.date, timing: e.timing, venue: e.venue,
  desc: e.description, poster: e.poster, link: e.link, regOpen: !!e.reg_open,
});

export const DEFAULT_SETTINGS = {
  logo: '',
  linkedin: 'https://www.linkedin.com/company/nsdc-jamia-hamdard/',
  hero_sub: 'A student-led community making data science education accessible, inclusive and impactful.',
  about:
    'The National Student Data Corps (NSDC) – Jamia Hamdard Chapter, established in 2025 and hosted by the Northeast Big Data Innovation Hub (NEBDHub), is a student-led community dedicated to making data science education accessible, inclusive, and impactful.\n\n' +
    'Our chapter provides students with opportunities to learn, connect, and grow through curated resources, mentorship, research, and career development. We aim to empower students to launch their data science journeys while fostering innovation, collaboration, and equity in the field.\n\n' +
    'As part of the global NSDC network — a community of over 9,000 members across 36 countries — we are committed to creating a supportive environment where learners from diverse backgrounds can thrive, explore data-driven solutions, and shape the future of technology and society.',
};

export async function getSettings(DB) {
  const { results } = await DB.prepare('SELECT key, value FROM settings').all();
  const out = { ...DEFAULT_SETTINGS };
  for (const r of results) out[r.key] = r.value;
  return out;
}
