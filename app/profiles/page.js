import Link from 'next/link';
import { sql } from '@/lib/db';
import Avatar from '@/components/Avatar';
import RoleBadge from '@/components/RoleBadge';
import { nameOf } from '@/lib/util';
import { fmt } from '@/lib/time';

export const metadata = { title: 'Profiles' };
export const dynamic = 'force-dynamic';

export default async function Profiles({ searchParams }) {
  const q = String(searchParams?.q || '').trim().toLowerCase().slice(0, 20).replace(/[\\\\%_]/g, '\\\\$&');
  const members = await sql`
    select u.id, u.username, u.display_name, u.bio, u.avatar_id, u.accent, u.role, u.roles,
      (select count(*)::int from threads t where t.author_id = u.id) +
      (select count(*)::int from posts p where p.author_id = u.id) as activity
    from users u
    where not u.is_banned and (${q ? sql`u.username like ${'%' + q + '%'} or coalesce(u.display_name, '') ilike ${'%' + q + '%'}` : sql`true`})
    order by
      case when u.roles @> array['owner']::text[] then 7
           when u.roles @> array['co_owner']::text[] then 6
           when u.roles @> array['mod']::text[] then 5
           when u.roles @> array['respected']::text[] then 4
           when u.roles @> array['known']::text[] then 3
           when u.roles @> array['rich']::text[] then 2 else 1 end desc,
      u.created_at asc
    limit 100
  `;
  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div><p className="mb-1 text-xs font-medium uppercase tracking-[.16em] text-muted">Community</p><h1 className="text-2xl font-semibold">Profiles</h1>
          <p className="mt-1 text-sm text-muted">Meet the people behind the conversations.</p></div>
        <form className="flex w-full gap-2 sm:w-auto">
          <input name="q" defaultValue={searchParams?.q || ''} placeholder="Find a member..." aria-label="Find a member" className="input sm:w-64" />
          <button className="btn-ghost">Search</button>
        </form>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => (
          <Link key={m.id} href={`/u/${m.username}`} className="group relative overflow-hidden rounded-xl border border-line bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-[#45454d] hover:bg-[#19191e]">
            <div className="absolute inset-x-0 top-0 h-1 opacity-80" style={{background:m.accent || '#6366f1'}} />
            <div className="flex items-center gap-3">
              <Avatar user={m} size={48} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold group-hover:text-white">{nameOf(m)}</div>
                <div className="truncate text-xs text-muted">@{m.username}</div>
              </div>
              <span className="text-muted transition-transform group-hover:translate-x-0.5">↗</span>
            </div>
            <div className="mt-3 min-h-10 text-[13px] leading-relaxed text-muted">{m.bio ? (m.bio.length > 90 ? m.bio.slice(0, 90) + '…' : m.bio) : 'No bio added yet.'}</div>
            <div className="mt-3 flex min-h-6 flex-wrap items-center gap-1.5">
              <RoleBadge role={m.role} roles={m.roles} />
              {!m.roles?.some((r) => r !== 'member') && <span className="text-[11px] text-muted">Member</span>}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-[11px] text-muted">
              <span>Community activity</span><span className="tabular-nums">{fmt(m.activity || 0)}</span>
            </div>
          </Link>
        ))}
      </div>
      {!members.length && <p className="rounded-lg border border-line bg-surface p-8 text-center text-sm text-muted">No profiles found.</p>}
      {members.length === 100 && <p className="mt-5 text-center text-xs text-muted">Showing the first 100 members.</p>}
    </div>
  );
}
