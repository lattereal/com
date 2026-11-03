import Link from 'next/link';
import { sql } from '@/lib/db';
import RoleBadge from '@/components/RoleBadge';
import { nameOf } from '@/lib/util';
import { fmt } from '@/lib/time';

export const metadata = { title: 'Profiles' };
export const dynamic = 'force-dynamic';

const groups = [
  ['owner', 'Owners'], ['co_owner', 'Co-owners'], ['mod', 'Moderators'],
  ['respected', 'Respected'], ['known', 'Known'], ['rich', 'Rich'], ['member', 'Members'],
];

export default async function Profiles({ searchParams }) {
  const q = String(searchParams?.q || '').trim().toLowerCase().slice(0, 20).replace(/[\\\\%_]/g, '\\\\$&');
  const members = await sql`
    select u.id, u.username, u.display_name, u.role, u.roles, u.created_at,
      (select count(*)::int from threads t where t.author_id = u.id) as threads,
      (select count(*)::int from posts p where p.author_id = u.id) as replies
    from users u
    where not u.is_banned and (${q ? sql`u.username ilike ${'%' + q + '%'} or coalesce(u.display_name, '') ilike ${'%' + q + '%'}` : sql`true`})
    order by u.created_at asc limit 500
  `;
  const rolesFor = (m) => [...new Set([...(Array.isArray(m.roles) ? m.roles : []), m.role || 'member'])];
  const filtered = groups.map(([key, label]) => ({ key, label, people: members.filter((m) => rolesFor(m).includes(key) && (key !== 'member' || !rolesFor(m).some((r) => r !== 'member'))) })).filter((g) => g.people.length);
  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div><p className="mb-1 text-xs uppercase tracking-widest text-muted">community directory</p><h1 className="text-2xl font-semibold">profiles</h1><p className="mt-1 text-sm text-muted">members, ordered by role.</p></div>
        <form className="flex w-full gap-2 sm:w-auto">
          <input name="q" defaultValue={searchParams?.q || ''} placeholder="search members" aria-label="search members" className="input sm:w-64" />
          <button className="btn-ghost">search</button>
        </form>
      </div>
      <div className="space-y-8">
        {filtered.map((group) => (
          <section key={group.key}>
            <div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-medium">{group.label}</h2><span className="text-xs tabular-nums text-muted">{group.people.length}</span></div>
            <div className="overflow-hidden border-y border-line">
              <div className="grid grid-cols-[minmax(0,1fr)_72px_72px_100px] gap-3 bg-[#19191b] px-3 py-2 text-[11px] text-muted sm:grid-cols-[minmax(0,1fr)_90px_90px_120px]">
                <span>user</span><span className="text-right">threads</span><span className="text-right">replies</span><span className="text-right">joined</span>
              </div>
              {group.people.map((m) => (
                <Link key={m.id} href={`/u/${m.username}`} className="grid grid-cols-[minmax(0,1fr)_72px_72px_100px] items-center gap-3 border-t border-line bg-bg px-3 py-2 text-[12px] transition-colors hover:bg-[#19191b] sm:grid-cols-[minmax(0,1fr)_90px_90px_120px]">
                  <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1"><span className="truncate font-medium">{nameOf(m)}</span><span className="truncate text-muted">@{m.username}</span><RoleBadge role={m.role} roles={m.roles} /></span>
                  <span className="text-right tabular-nums">{fmt(m.threads)}</span><span className="text-right tabular-nums">{fmt(m.replies)}</span>
                  <span className="text-right text-muted">{new Date(m.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
      {!members.length && <p className="border-y border-line py-10 text-center text-sm text-muted">no profiles found.</p>}
      {members.length === 500 && <p className="mt-5 text-center text-xs text-muted">showing the first 500 profiles.</p>}
    </div>
  );
}
