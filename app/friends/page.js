import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { addFriend, friendOp } from '@/app/actions-social';
import ActionForm from '@/components/ActionForm';
import Avatar from '@/components/Avatar';
import RoleBadge from '@/components/RoleBadge';
import { nameOf } from '@/lib/util';

export const metadata = { title: 'Friends' };
export const dynamic = 'force-dynamic';

function Op({ op, id, label, primary }) {
  return (
    <form action={friendOp}>
      <input type="hidden" name="op" value={op} />
      <input type="hidden" name="id" value={id} />
      <button className={primary ? 'btn-primary' : 'btn-ghost'}>{label}</button>
    </form>
  );
}

function Row({ u, children }) {
  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <Link href={`/u/${u.username}`} className="flex min-w-0 items-center gap-3">
        <Avatar user={u} size={36} />
        <div className="min-w-0">
          <div className="flex items-center gap-2"><span className="truncate text-[15px] font-medium">{nameOf(u)}</span><RoleBadge role={u.role} /></div>
          <div className="truncate text-[13px] text-muted">@{u.username}</div>
        </div>
      </Link>
      <div className="flex shrink-0 gap-2">{children}</div>
    </li>
  );
}

const H = ({ children }) => <h2 className="mb-1 mt-10 text-xs uppercase tracking-[0.5px] text-muted">{children}</h2>;

export default async function Friends() {
  const me = await getUser();
  if (!me) redirect('/login');

  const rows = await sql`
    select f.id, f.status, f.requester_id = ${me.id} as outgoing,
           u.username, u.display_name, u.avatar_id, u.accent, u.role
    from friendships f
    join users u on u.id = case when f.requester_id = ${me.id} then f.addressee_id else f.requester_id end
    where (f.requester_id = ${me.id} or f.addressee_id = ${me.id}) and not u.is_banned
    order by f.created_at desc`;
  const incoming = rows.filter((r) => r.status === 'pending' && !r.outgoing);
  const outgoing = rows.filter((r) => r.status === 'pending' && r.outgoing);
  const friends = rows.filter((r) => r.status === 'accepted');

  return (
    <div className="max-w-[640px]">
      <h1 className="mb-6 text-2xl font-medium text-muted">Friends</h1>
      <ActionForm action={addFriend} label="Send request" wrapClass="flex flex-wrap items-start gap-2" footClass="">
        <input name="username" required maxLength={21} placeholder="Add a friend by username" aria-label="Username" className="input max-w-[300px]" />
      </ActionForm>
      <p className="mt-2 text-[13px] text-muted">Once they accept, you can message each other.</p>

      {incoming.length > 0 && (
        <>
          <H>Requests · {incoming.length}</H>
          <ul className="divide-y divide-line border-y border-line">
            {incoming.map((r) => (
              <Row key={r.id} u={r}>
                <Op op="accept" id={r.id} label="Accept" primary />
                <Op op="decline" id={r.id} label="Decline" />
              </Row>
            ))}
          </ul>
        </>
      )}

      <H>Friends · {friends.length}</H>
      {friends.length ? (
        <ul className="divide-y divide-line border-y border-line">
          {friends.map((r) => (
            <Row key={r.id} u={r}>
              <Link href={`/messages/${r.username}`} className="btn-ghost">Message</Link>
              <Op op="remove" id={r.id} label="Remove" />
            </Row>
          ))}
        </ul>
      ) : (
        <p className="text-muted">No friends yet. Send a request above, or find people through <Link href="/g" className="link">groups</Link>.</p>
      )}

      {outgoing.length > 0 && (
        <>
          <H>Sent · {outgoing.length}</H>
          <ul className="divide-y divide-line border-y border-line">
            {outgoing.map((r) => (
              <Row key={r.id} u={r}><Op op="cancel" id={r.id} label="Cancel" /></Row>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
