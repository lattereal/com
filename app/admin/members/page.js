import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { isMod, isStaff, assignable, outranks, LABEL } from '@/lib/roles';
import { setRole, releaseIp, resetPassword } from '@/app/actions-admin';
import { modAction } from '@/app/actions';
import ActionForm from '@/components/ActionForm';
import Avatar from '@/components/Avatar';
import RoleBadge from '@/components/RoleBadge';
import { timeAgo } from '@/lib/time';
import { nameOf } from '@/lib/util';

export const metadata = { title: 'Members' };
export const dynamic = 'force-dynamic';

export default async function Members({ searchParams }) {
  const actor = await getUser();
  if (!isMod(actor)) notFound();

  const q = String(searchParams.q || '').trim().toLowerCase().slice(0, 20).replace(/[\\%_]/g, '\\$&');
  const rows = await sql`
    select id, username, display_name, avatar_id, accent, role, is_banned, created_at, (ip_hash is not null) as ip_locked
    from users ${q ? sql`where username like ${q + '%'}` : sql``}
    order by created_at desc limit 50`;
  const roles = assignable(actor);

  return (
    <div className="max-w-[820px]">
      <h1 className="mb-6 text-2xl font-medium text-muted">Members</h1>
      {searchParams.msg && <p className="mb-6 rounded border border-line bg-surface px-4 py-2 text-[13px] text-muted">{searchParams.msg}</p>}
      <form className="mb-6 flex gap-2">
        <input name="q" defaultValue={searchParams.q || ''} placeholder="Search usernames" aria-label="Search usernames" className="input max-w-[280px]" />
        <button className="btn-ghost h-10">Search</button>
      </form>

      <ul className="divide-y divide-line border-y border-line">
        {rows.map((r) => {
          const below = outranks(actor, r);
          return (
            <li key={r.id} className="flex flex-col gap-3 py-4">
              <div className="flex items-center gap-3">
                <Avatar user={r} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/u/${r.username}`} className="font-medium hover:underline">{nameOf(r)}</Link>
                    <RoleBadge role={r.role} />
                    {r.is_banned && <span className="text-xs text-red-400">banned</span>}
                  </div>
                  <div className="text-[13px] text-muted">@{r.username} · joined {timeAgo(r.created_at)}{r.ip_locked ? ' · IP locked' : ''}</div>
                </div>
              </div>
              {below && (
                <div className="flex flex-wrap items-start gap-2 pl-12">
                  <form action={modAction}>
                    <input type="hidden" name="op" value={r.is_banned ? 'user-unban' : 'user-ban'} />
                    <input type="hidden" name="uid" value={r.id} />
                    <input type="hidden" name="next" value="/admin/members" />
                    <button className={`btn-ghost ${r.is_banned ? '' : 'text-red-400'}`}>{r.is_banned ? 'Unban' : 'Ban'}</button>
                  </form>
                  {isStaff(actor) && (
                    <>
                      <form action={setRole} className="flex gap-2">
                        <input type="hidden" name="uid" value={r.id} />
                        <select name="role" aria-label="Role" defaultValue={r.role} className="h-8 rounded border border-line bg-bg px-2 text-sm">
                          {!roles.includes(r.role) && <option value={r.role} disabled>{LABEL[r.role]}</option>}
                          {roles.map((x) => <option key={x} value={x}>{LABEL[x]}</option>)}
                        </select>
                        <button className="btn-ghost">Set role</button>
                      </form>
                      <form action={releaseIp}>
                        <input type="hidden" name="uid" value={r.id} />
                        <button disabled={!r.ip_locked} className="btn-ghost">Release IP lock</button>
                      </form>
                      <ActionForm action={resetPassword} label="Reset password" buttonClass="btn-ghost" wrapClass="" footClass="">
                        <input type="hidden" name="uid" value={r.id} />
                      </ActionForm>
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {!rows.length && <p className="text-muted">No members match.</p>}
    </div>
  );
}
