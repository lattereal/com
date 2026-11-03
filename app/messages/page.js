import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import Avatar from '@/components/Avatar';
import { timeAgo } from '@/lib/time';
import { nameOf } from '@/lib/util';

export const metadata = { title: 'Messages' };
export const dynamic = 'force-dynamic';

export default async function Messages() {
  const me = await getUser();
  if (!me) redirect('/login');

  const rows = await sql`
    select u.username, u.display_name, u.avatar_id, u.accent,
      (select coalesce(nullif(d.body, ''), 'Attachment') from dm_messages d
        where (d.sender_id = u.id and d.recipient_id = ${me.id}) or (d.sender_id = ${me.id} and d.recipient_id = u.id)
        order by d.id desc limit 1) as preview,
      (select d.created_at from dm_messages d
        where (d.sender_id = u.id and d.recipient_id = ${me.id}) or (d.sender_id = ${me.id} and d.recipient_id = u.id)
        order by d.id desc limit 1) as last_at
    from friendships f
    join users u on u.id = case when f.requester_id = ${me.id} then f.addressee_id else f.requester_id end
    where f.status = 'accepted' and (f.requester_id = ${me.id} or f.addressee_id = ${me.id}) and not u.is_banned
    order by last_at desc nulls last, u.username`;

  return (
    <div className="max-w-[640px]">
      <h1 className="mb-8 text-2xl font-medium text-muted">Messages</h1>
      {rows.length ? (
        <ul className="divide-y divide-line border-y border-line">
          {rows.map((r) => (
            <li key={r.username}>
              <Link href={`/messages/${r.username}`} className="flex items-center gap-3 px-2 py-3 transition-colors hover:bg-[#14141a]">
                <Avatar user={r} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[15px] font-medium">{nameOf(r)}</span>
                    {r.last_at && <span className="shrink-0 text-xs text-muted">{timeAgo(r.last_at)}</span>}
                  </div>
                  <div className="truncate text-[13px] text-muted">{r.preview || 'No messages yet'}</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted">You can message people once they accept your friend request. <Link href="/friends" className="link">Go to friends</Link></p>
      )}
    </div>
  );
}
