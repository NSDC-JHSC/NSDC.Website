// Admin login: one password (ADMIN_PASSWORD). Session = signed cookie, no user accounts needed.
import { HttpError } from './db.js';

const enc = new TextEncoder();
const b64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(msg))));
}

function same(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

const secretOf = (env) => {
  if (!env.ADMIN_PASSWORD) throw new HttpError(500, 'ADMIN_PASSWORD is not set. Add it in Cloudflare > Settings > Variables.');
  return 'nsdc:' + (env.SESSION_SECRET || env.ADMIN_PASSWORD);
};

export async function checkPassword(env, given) {
  const secret = secretOf(env);
  return same(await hmac(secret, 'pw:' + given), await hmac(secret, 'pw:' + env.ADMIN_PASSWORD));
}

export async function makeToken(env, days = 7) {
  const exp = String(Math.floor(Date.now() / 1000) + days * 86400);
  return `${exp}.${await hmac(secretOf(env), exp)}`;
}

function getCookie(request, name) {
  const m = (request.headers.get('Cookie') || '').match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : '';
}

export async function isAdmin(request, env) {
  const token = getCookie(request, 'nsdc_admin');
  const [exp, sig] = token.split('.');
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  return same(sig, await hmac(secretOf(env), exp));
}

export function sessionCookie(request, token, maxAge = 7 * 86400) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `nsdc_admin=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export const clientIp = (request) => request.headers.get('CF-Connecting-IP') || 'local';

// returns false when the limit is exceeded
export async function rateLimit(DB, key, max, windowSec) {
  const now = Math.floor(Date.now() / 1000);
  const row = await DB.prepare('SELECT count, reset_at FROM rate WHERE key = ?').bind(key).first();
  if (!row || row.reset_at < now) {
    await DB.prepare('INSERT OR REPLACE INTO rate (key, count, reset_at) VALUES (?, 1, ?)').bind(key, now + windowSec).run();
    return true;
  }
  if (row.count >= max) return false;
  await DB.prepare('UPDATE rate SET count = count + 1 WHERE key = ?').bind(key).run();
  return true;
}
