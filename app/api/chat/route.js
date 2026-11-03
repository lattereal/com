import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { limitPersistent } from '@/lib/ratelimit';
import { saveMedia } from '@/lib/media';
import { isMod } from '@/lib/roles';

export const dynamic = 'force-dynamic';

const json = (o, status = 200) => NextResponse.json(o, { status, headers: { 'Cache-Control': 'no-store' } });
const sameOrigin = (req) => {
  const o = req.headers.get('origin');
  if (!o) return true;
  try { return new URL(o).host === req.headers.get('host'); } catch { return false; }
};

async function purgeExpiredMessages() {
  await sql`with expired as (
    delete from chat_messages where created_at < now() - interval '15 hours' returning media_id
  ) delete from media where id in (select media_id from expired where media_id is not null)`;
  await sql`with expired as (
    delete from dm_messages where created_at < now() - interval '15 hours' returning media_id
  ) delete from media where id in (select media_id from expired where media_id is not null)`;
}

const COLS = (sql) => sql`
  m.id::int as id, m.body, m.created_at, m.media_id, md.mime,
  u.username, u.display_name, u.avatar_id, u.role, u.accent`;

// ?dm=username -> a private chat with an accepted friend; otherwise the public lounge.
async function resolve(user, sp) {
  const dm = sp.get('dm');
  if (!dm) return { room: 'lounge' };
  const [o] = await sql`select id from users where username = ${dm.toLowerCase()} and not is_banned`;
  if (!o) return null;
  const [f] = await sql`
    select 1 from friendships where status = 'accepted'
    and ((requester_id = ${user.id} and addressee_id = ${o.id}) or (requester_id = ${o.id} and addressee_id = ${user.id}))`;
  return f ? { other: o.id } : null;
}

export async function GET(req) {
  const user = await getUser();
  if (!user || user.is_banned) return json({ error: 'Sign in.' }, 401);
  await purgeExpiredMessages();
  const sp = req.nextUrl.searchParams;
  const sc = await resolve(user, sp);
  if (!sc) return json({ error: 'Not found.' }, 404);
  const after = Math.max(0, parseInt(sp.get('after')) || 0);

  let rows;
  if (sc.room) {
    rows = after
      ? await sql`select ${COLS(sql)} from chat_messages m join users u on u.id = m.author_id
                  left join media md on md.id = m.media_id
                  where m.room = ${sc.room} and m.id > ${after} order by m.id limit 100`
      : (await sql`select ${COLS(sql)} from chat_messages m join users u on u.id = m.author_id
                   left join media md on md.id = m.media_id
                   where m.room = ${sc.room} order by m.id desc limit 50`).reverse();
  } else {
    const pair = sql`((m.sender_id = ${user.id} and m.recipient_id = ${sc.other}) or (m.sender_id = ${sc.other} and m.recipient_id = ${user.id}))`;
    rows = after
      ? await sql`select ${COLS(sql)} from dm_messages m join users u on u.id = m.sender_id
                  left join media md on md.id = m.media_id
                  where ${pair} and m.id > ${after} order by m.id limit 100`
      : (await sql`select ${COLS(sql)} from dm_messages m join users u on u.id = m.sender_id
                   left join media md on md.id = m.media_id
                   where ${pair} order by m.id desc limit 50`).reverse();
  }
  return json({ messages: rows });
}

export async function POST(req) {
  if (!sameOrigin(req)) return json({ error: 'Bad origin.' }, 403);
  const user = await getUser();
  if (!user || user.is_banned) return json({ error: 'Sign in.' }, 401);
  await purgeExpiredMessages();
  const sc = await resolve(user, req.nextUrl.searchParams);
  if (!sc) return json({ error: 'Not found.' }, 404);
  if (!await limitPersistent(`chat:${user.id}`, 12, 15 * 1000) || !await limitPersistent(`chat-minute:${user.id}`, 60, 60 * 1000)) return json({ error: 'You are sending too fast.' }, 429);

  let fd;
  try { fd = await req.formData(); } catch { return json({ error: 'Bad request.' }, 400); }
  const body = String(fd.get('body') ?? '').replace(/\r/g, '').replace(/[\u0000-\u0009\u000b-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, '').trim();
  const file = fd.get('file');
  if (body.length > 2000) return json({ error: 'Messages are limited to 2,000 characters.' }, 400);
  const hasFile = file && typeof file === 'object' && file.size > 0;
  if (!body && !hasFile) return json({ error: 'Nothing to send.' }, 400);

  let mediaId = null;
  if (hasFile) {
    const r = await saveMedia(file, user.id);
    if (r.error) return json({ error: r.error }, 400);
    mediaId = r.id;
  }
  if (sc.room)
    await sql`insert into chat_messages (room, author_id, body, media_id) values (${sc.room}, ${user.id}, ${body}, ${mediaId})`;
  else
    await sql`insert into dm_messages (sender_id, recipient_id, body, media_id) values (${user.id}, ${sc.other}, ${body}, ${mediaId})`;
  return json({ ok: true });
}

export async function DELETE(req) {
  if (!sameOrigin(req)) return json({ error: 'Bad origin.' }, 403);
  const user = await getUser();
  if (!user || user.is_banned) return json({ error: 'Sign in.' }, 401);
  if (!await limitPersistent(`chat-delete:${user.id}`, 10, 60 * 1000)) return json({ error: 'You are deleting messages too quickly.' }, 429);
  const sp = req.nextUrl.searchParams;
  const id = parseInt(sp.get('id'));
  if (!id) return json({ error: 'Bad request.' }, 400);

  let row;
  if (sp.get('dm')) [row] = await sql`delete from dm_messages where id = ${id} and sender_id = ${user.id} returning media_id`;
  else [row] = await sql`delete from chat_messages where id = ${id} and (author_id = ${user.id} or ${isMod(user)}) returning media_id`;
  if (row?.media_id) await sql`delete from media where id = ${row.media_id}`;
  return json({ ok: true });
}
