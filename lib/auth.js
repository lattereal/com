import { cache } from 'react';
import crypto from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { sql } from './db';

const COOKIE = 'cf_session';
const UNLOCK = 'cf_unlock';
const prod = process.env.NODE_ENV === 'production';
const key = () => new TextEncoder().encode(process.env.AUTH_SECRET);

export async function createSession(userId) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(key());
  cookies().set(COOKIE, token, { httpOnly: true, secure: prod, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 });
}

export function destroySession() {
  cookies().delete(COOKIE);
}

// Loaded fresh from the DB on every request so bans and role changes apply immediately.
export const getUser = cache(async () => {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    if (!payload.sub) return null;
    const [u] = await sql`
      select id, username, display_name, avatar_id, accent, role, created_at, is_banned
      from users where id = ${payload.sub}`;
    return u || null;
  } catch {
    return null;
  }
});

// A signed-in, not-banned member (or null).
export async function currentMember() {
  const u = await getUser();
  return u && !u.is_banned ? u : null;
}

export function clientIp() {
  const h = headers();
  return (h.get('x-forwarded-for') || '').split(',')[0].trim() || h.get('x-real-ip') || 'unknown';
}

// IPv6 users can rotate through a whole /64, so lock on the /64 prefix instead of the full address.
function normalizeIp(ip) {
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) return mapped[1];
  if (!ip.includes(':')) return ip;
  const [head, tail = ''] = ip.split('::');
  const h = head ? head.split(':') : [];
  const t = tail ? tail.split(':') : [];
  const full = [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill('0'), ...t];
  return full.slice(0, 4).map((g) => g.padStart(4, '0')).join(':');
}

// Keyed hash so the database never holds a raw IP. null = lock disabled (IP_LOCK=off) or IP unknown.
export function ipLockHash() {
  if (process.env.IP_LOCK === 'off') return null;
  const ip = clientIp();
  if (ip === 'unknown') return null;
  return crypto.createHmac('sha256', process.env.AUTH_SECRET).update(normalizeIp(ip)).digest('hex');
}

/* ---------- password-protected content unlocks (signed cookie, 12h) ---------- */

export async function unlockedIds() {
  const t = cookies().get(UNLOCK)?.value;
  if (!t) return [];
  try {
    const { payload } = await jwtVerify(t, key());
    return Array.isArray(payload.ids) ? payload.ids : [];
  } catch {
    return [];
  }
}

export async function addUnlock(id) {
  const ids = [...(await unlockedIds()).filter((x) => x !== id), id].slice(-30);
  const token = await new SignJWT({ ids }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('12h').sign(key());
  cookies().set(UNLOCK, token, { httpOnly: true, secure: prod, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 12 });
}
