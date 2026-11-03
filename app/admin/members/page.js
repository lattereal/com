import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { isMod, isStaff, assignable, outranks, LABEL } from '@/lib/roles';
import { setRoles, renameMember, deleteMember, releaseIp, resetPassword } from '@/app/actions-admin';
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
  const owner = actor.roles?.includes('owner');
  const q = String(searchParams.q || '').trim().toLowerCase().slice(0, 20).replace(/[\\\\%_]/g, '\\\\$&');
  const rows = await sql`
    select id, username, display_name, avatar_id, accent, role, roles, is_banned, created_at, (ip_hash is not null) as ip_locked
    from users ${q ? sql`where username like ${q + '%'}` : sql``}
    order by created_at desc limit 100`;
  const roles = assignable(actor);
  return (
    <div className="mx-auto max-w-[900px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div><p className="mb-1 text-xs uppercase tracking-widest text-muted">Administration</p><h1 className="text-2xl font-semibold">Members</h1>
          <p className="mt-1 text-sm text-muted">Manage accounts, permissions and community access.</p></div>
        <span className="text-xs text-muted">{rows.length} shown</span>
      </div>
      {searchParams.msg && <p className="mb-5 rounded-lg border border-line bg-surface px-4 py-3 text-sm text-muted">{searchParams.msg}</p>}
      <form className="mb-5 flex gap-2">
        <input name="q" defaultValue={searchParams.q || ''} placeholder="Search usernames" aria-label="Search usernames" className="input max-w-[320px]" />
        <button className="btn-ghost">Search</button>
      </form>
      <div className="space-y-3">
        {rows.map((r) => {
          const below = outranks(actor, r);
          const assigned = Array.isArray(r.roles) && r.roles.length ? r.roles : [r.role || 'member'];
          const targetIsOwner = assigned.includes('owner');
          return (
            <section key={r.id} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Avatar user={r} size={42} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/u/${r.username}`} className="font-semibold hover:underline">{nameOf(r)}</Link>
                    <RoleBadge role={r.role} roles={r.roles} />
                    {r.is_banned && <span className="rounded-full border border-red-400/30 bg-red-400/10 px-2 py-0.5 text-[10px] text-red-300">Suspended</span>}
                  </div>
                  <div className="mt-0.5 text-xs text-muted">@{r.username} · joined {timeAgo(r.created_at)}{r.ip_locked ? ' · IP locked' : ''}</div>
                </div>
                {below && <form action={modAction}>
                  <input type="hidden" name="op" value={r.is_banned ? 'user-unban' : 'user-ban'} />
                  <input type="hidden" name="uid" value={r.id} /><input type="hidden" name="next" value="/admin/members" />
                  <button className={`btn-ghost ${r.is_banned ? '' : 'text-red-300'}`}>{r.is_banned ? 'Unban' : 'Ban'}</button>
                </form>}
              </div>
              {below && isStaff(actor) && <div className="mt-4 grid gap-4 border-t border-line pt-4 lg:grid-cols-2">
                <form action={setRoles} className="rounded-lg border border-line/70 p-3">
                  <input type="hidden" name="uid" value={r.id} />
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Assigned roles</div>
                  <div className="grid grid-cols-2 gap-2">
                    {roles.map((role) => <label key={role} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="roles" value={role} defaultChecked={assigned.includes(role)} className="accent-[#8587f5]" />
                      {LABEL[role]}
                    </label>)}
                  </div>
                  <button className="btn-primary mt-3">Save roles</button>
                </form>
                <div className="space-y-2">
                  <form action={releaseIp}>
                    <input type="hidden" name="uid" value={r.id} />
                    <button disabled={!r.ip_locked} className="btn-ghost w-full justify-center">Release IP lock</button>
                  </form>
                  <ActionForm action={resetPassword} label="Reset password" buttonClass="btn-ghost w-full justify-center" wrapClass="w-full" footClass="w-full">
                    <input type="hidden" name="uid" value={r.id} />
                  </ActionForm>
                </div>
              </div>}
              {owner && !targetIsOwner && r.id !== actor.id && <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
                <form action={renameMember} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="uid" value={r.id} />
                  <label className="min-w-0 flex-1 text-xs text-muted">Change username
                    <input name="username" defaultValue={r.username} minLength={3} maxLength={20} pattern="[a-z0-9_]+" required className="input mt-1" />
                  </label>
                  <button className="btn-ghost">Update</button>
                </form>
                <form action={deleteMember} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="uid" value={r.id} />
                  <label className="min-w-0 flex-1 text-xs text-muted">Type DELETE to confirm
                    <input name="confirm" required placeholder="DELETE" className="input mt-1" />
                  </label>
                  <button className="btn-ghost border-red-400/30 text-red-300 hover:bg-red-400/10">Delete account</button>
                </form>
              </div>}
            </section>
          );
        })}
      </div>
      {!rows.length && <p className="rounded-lg border border-line bg-surface p-8 text-center text-sm text-muted">No members match.</p>}
    </div>
  );
}
