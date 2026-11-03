import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { limitPersistent } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

const pages = [
  [/^\/$/, 'the homepage'],
  [/^\/u\//, 'a profile'],
  [/^\/t\//, 'a thread'],
  [/^\/b\//, 'a board'],
  [/^\/chat/, 'the chat'],
  [/^\/messages/, 'messages'],
  [/^\/settings/, 'settings'],
  [/^\/g\//, 'a group'],
  [/^\/friends/, 'the friends page'],
];

export async function POST(req) {
  const user = await getUser();
  if (!user || user.is_banned) return NextResponse.json({ ok: false }, { status: 401 });
  if (!await limitPersistent(`presence:${user.id}`, 1, 45 * 1000)) return NextResponse.json({ ok: true });
  const path = req.headers.get('x-current-path') || '/';
  const page = pages.find(([re]) => re.test(path))?.[1] || 'the site';
  await sql`update users set last_seen_at = now(), last_page = ${page} where id = ${user.id}`;
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
