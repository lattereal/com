import { sql } from '@/lib/db';
import { getUser, unlockedIds } from '@/lib/auth';
import { UUID } from '@/lib/util';
import { isMod } from '@/lib/roles';

export const dynamic = 'force-dynamic';

const deny = (s = 404) => new Response('Not found', { status: s });

// Every stored file is served from here. Access is decided by what the file is attached to:
// avatars, songs and public uploads are open; password uploads need the owner or an unlock cookie;
// chat files need a login; DM files only go to the two people in the conversation.
export async function GET(req, { params }) {
  const id = params.id;
  if (!UUID.test(id)) return deny();

  const [m] = await sql`select id, owner_id, mime, size from media where id = ${id}`;
  if (!m) return deny();

  const user = await getUser();
  const uid = user && !user.is_banned ? user.id : null;
  const [ref] = await sql`
    select
      exists (select 1 from users where avatar_id = ${id}) as avatar,
      exists (select 1 from profile_songs where media_id = ${id}) as song,
      exists (select 1 from chat_messages where media_id = ${id}) as chat,
      exists (select 1 from dm_messages where media_id = ${id}
              and (sender_id = ${uid}::uuid or recipient_id = ${uid}::uuid)) as dm,
      (select id from uploads where media_id = ${id}) as upload_id,
      (select visibility from uploads where media_id = ${id}) as visibility`;

  let allowed = false;
  let cache = 'private, no-store';
  if (ref.avatar || ref.song || ref.visibility === 'public') {
    allowed = true;
    cache = 'public, max-age=86400';
  } else if (ref.visibility === 'password') {
    allowed = (uid && m.owner_id === uid) || isMod(user) || (await unlockedIds()).includes(ref.upload_id);
  } else if (ref.chat) {
    allowed = !!uid;
    cache = 'private, max-age=3600';
  } else if (ref.dm) {
    allowed = true;
    cache = 'private, max-age=3600';
  } else {
    allowed = !!uid && m.owner_id === uid; // not attached to anything yet
  }
  if (!allowed) return deny();

  const [{ data }] = await sql`select data from media where id = ${id}`;
  const total = data.length;
  const headers = {
    'Content-Type': m.mime,
    'Accept-Ranges': 'bytes',
    'Cache-Control': cache,
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; sandbox",
    'Content-Disposition': 'inline',
  };

  // Range support: Safari won't play audio/video without it
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get('range') || '');
  if (range && (range[1] || range[2])) {
    let start = range[1] ? parseInt(range[1], 10) : Math.max(0, total - parseInt(range[2], 10));
    let end = range[1] && range[2] ? parseInt(range[2], 10) : total - 1;
    end = Math.min(end, total - 1);
    if (start > end || start >= total) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${total}` } });
    return new Response(data.subarray(start, end + 1), {
      status: 206,
      headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${total}`, 'Content-Length': String(end - start + 1) },
    });
  }
  return new Response(data, { headers: { ...headers, 'Content-Length': String(total) } });
}
