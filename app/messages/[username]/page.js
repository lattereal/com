import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { friendState } from '@/lib/friends';
import Chat from '@/components/Chat';
import Avatar from '@/components/Avatar';
import RoleBadge from '@/components/RoleBadge';
import { nameOf } from '@/lib/util';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  return { title: `Chat with @${params.username}` };
}

export default async function DM({ params }) {
  const me = await getUser();
  if (!me || me.is_banned) redirect('/login');
  const [o] = await sql`select id, username, display_name, avatar_id, accent, role from users where username = ${params.username.toLowerCase()} and not is_banned`;
  if (!o) notFound();
  if ((await friendState(me.id, o.id)).status !== 'friends') redirect(`/u/${o.username}`);

  return (
    <div className="max-w-[720px]">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/messages" className="text-muted hover:text-fg" aria-label="Back to messages">←</Link>
        <Avatar user={o} size={32} />
        <Link href={`/u/${o.username}`} className="text-[15px] font-medium hover:underline">{nameOf(o)}</Link>
        <RoleBadge role={o.role} />
      </div>
      <Chat endpoint={`/api/chat?dm=${o.username}`} me={me.username} placeholder={`Message ${nameOf(o)}…`} />
    </div>
  );
}
