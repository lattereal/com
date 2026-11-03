import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import Avatar from '@/components/Avatar';
import RoleBadge from '@/components/RoleBadge';
import { nameOf } from '@/lib/util';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  return { title: `#${params.tag}` };
}

export default async function Group({ params }) {
  const tag = params.tag.toLowerCase();
  if (!/^[a-z0-9_]{2,24}$/.test(tag)) notFound();
  const members = await sql`
    select u.username, u.display_name, u.avatar_id, u.accent, u.role
    from profile_tags t join users u on u.id = t.user_id
    where t.tag = ${tag} and not u.is_banned order by u.created_at limit 200`;
  if (!members.length) notFound();

  return (
    <div>
      <nav className="mb-2 text-[13px] text-muted"><Link href="/g" className="hover:text-fg">Groups</Link></nav>
      <h1 className="mb-1 text-[28px] font-medium leading-tight">#{tag}</h1>
      <p className="mb-8 text-sm text-muted">{members.length} {members.length === 1 ? 'member' : 'members'}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {members.map((m) => (
          <Link key={m.username} href={`/u/${m.username}`} className="flex items-center gap-3 rounded border border-line bg-surface p-4 transition-colors hover:border-[#3a3a3f] hover:bg-[#1a1a1e]">
            <Avatar user={m} size={40} />
            <div className="min-w-0">
              <div className="flex items-center gap-2"><span className="truncate font-medium">{nameOf(m)}</span><RoleBadge role={m.role} /></div>
              <div className="truncate text-[13px] text-muted">@{m.username}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
