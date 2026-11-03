import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { friendState } from '@/lib/friends';
import { friendOp, createUpload } from '@/app/actions-social';
import { List, ThreadRow, THREAD_COLS } from '@/components/Rows';
import Pagination from '@/components/Pagination';
import Avatar from '@/components/Avatar';
import RoleBadge from '@/components/RoleBadge';
import SongPlayer from '@/components/SongPlayer';
import ActionForm from '@/components/ActionForm';
import { LockIcon, MusicIcon, FilmIcon } from '@/components/Icons';
import { fmt } from '@/lib/time';
import { nameOf } from '@/lib/util';

const PER = 20;

export async function generateMetadata({ params }) {
  return { title: `@${params.username}` };
}

function FriendButtons({ state, username }) {
  const op = (name, label, cls = 'btn-ghost') => (
    <form action={friendOp}>
      <input type="hidden" name="op" value={name} />
      <input type="hidden" name="id" value={state.id ?? ''} />
      <input type="hidden" name="username" value={username} />
      <button className={cls}>{label}</button>
    </form>
  );
  if (state.status === 'friends')
    return (
      <>
        <Link href={`/messages/${username}`} className="btn-primary">Message</Link>
        {op('remove', 'Unfriend')}
      </>
    );
  if (state.status === 'sent') return op('cancel', 'Request sent · Cancel');
  if (state.status === 'received')
    return (
      <>
        {op('accept', 'Accept request', 'btn-primary')}
        {op('decline', 'Decline')}
      </>
    );
  return op('add', 'Add friend', 'btn-primary');
}

export default async function Profile({ params, searchParams }) {
  const viewer = await getUser();
  const [u] = await sql`
    select id, username, display_name, bio, accent, avatar_id, banner_id, role, roles, created_at, is_banned
    from users where username = ${params.username.toLowerCase()}`;
  if (!u) notFound();

  const own = viewer?.id === u.id;
  const tab = searchParams.tab === 'content' ? 'content' : 'threads';
  const page = Math.max(1, parseInt(searchParams.page) || 1);

  const [[c], songs, fs] = await Promise.all([
    sql`select (select count(*) from threads where author_id = ${u.id})::int as threads,
               (select count(*) from posts where author_id = ${u.id})::int as posts,
               (select count(*) from uploads where owner_id = ${u.id})::int as uploads`,
    sql`select id, title, artist, media_id from profile_songs where user_id = ${u.id} order by id`,
    viewer && !own && !viewer.is_banned ? friendState(viewer.id, u.id) : { status: 'none' },
  ]);

  let rows = [];
  if (tab === 'threads')
    rows = await sql`select ${THREAD_COLS(sql)} from threads t join users u on u.id = t.author_id
                     where t.author_id = ${u.id} order by t.created_at desc limit ${PER} offset ${(page - 1) * PER}`;
  else if (tab === 'posts')
    rows = await sql`select p.id, p.thread_id, p.content, p.created_at, u.username, t.title as thread_title
                     from posts p join users u on u.id = p.author_id join threads t on t.id = p.thread_id
                     where p.author_id = ${u.id} order by p.created_at desc limit ${PER} offset ${(page - 1) * PER}`;
  else
    rows = await sql`select up.id, up.title, up.visibility, up.media_id, m.mime from uploads up
                     join media m on m.id = up.media_id where up.owner_id = ${u.id} order by up.created_at desc limit 60`;

  const tabCls = (on) => `border-b-2 pb-2 text-sm ${on ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg'}`;
  const total = c.threads;

  return (
    <div>
      <section className="mb-8 overflow-hidden rounded border border-line bg-surface">
        <div className="relative h-32 sm:h-44" style={{ background: `linear-gradient(120deg, ${u.accent}47, ${u.accent}0d 75%)` }}>
          {u.banner_id && <img src={`/m/${u.banner_id}`} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        </div>
        <div className="px-6 pb-6">
          <div className="-mt-10 flex items-end justify-between gap-4">
            <div className="rounded-full border-4 border-surface"><Avatar user={u} size={80} /></div>
            <div className="flex flex-wrap justify-end gap-2 pb-1">
              {own && <Link href="/settings" className="btn-ghost">Edit profile</Link>}
              {viewer && !own && !viewer.is_banned && <FriendButtons state={fs} username={u.username} />}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-xl font-medium">{nameOf(u)}</h1>
            <RoleBadge role={u.role} roles={u.roles} />
            {u.is_banned && <span className="text-xs text-red-400">suspended</span>}
          </div>
          <p className="mt-0.5 text-[13px] text-muted">
            @{u.username} · Joined {new Date(u.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} · {fmt(c.threads + c.posts)} posts
          </p>
          {u.bio && <p className="mt-4 max-w-[620px] whitespace-pre-wrap break-words text-[15px] leading-relaxed">{u.bio}</p>}        </div>
        {songs.length > 0 && (
          <div className="border-t border-line px-6 py-3">
            <SongPlayer accent={u.accent} songs={songs.map((s) => ({ id: s.id, title: s.title, artist: s.artist, src: `/m/${s.media_id}` }))} />
          </div>
        )}
      </section>

      <div className="mb-4 flex gap-6 border-b border-line">
        <Link href={`/u/${u.username}`} className={tabCls(tab === 'threads')}>Threads</Link>
        <Link href={`/u/${u.username}?tab=content`} className={tabCls(tab === 'content')}>Content{c.uploads ? ` · ${c.uploads}` : ''}</Link>
      </div>

      {tab === 'content' ? (
        <>
          {own && (
            <details className="mb-6 rounded border border-line bg-surface">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium">Upload content</summary>
              <div className="border-t border-line p-4">
                <ActionForm action={createUpload} label="Upload" wrapClass="flex max-w-[480px] flex-col gap-3" footClass="flex justify-end">
                  <input name="title" required maxLength={100} placeholder="Title" aria-label="Title" className="input" />
                  <textarea name="description" maxLength={500} rows={2} placeholder="Description (optional)" aria-label="Description"
                    className="w-full rounded border border-line bg-bg p-3 text-sm placeholder:text-muted focus:border-accent focus:outline-none" />
                  <input name="file" type="file" required accept="image/png,image/jpeg,image/gif,image/webp,audio/*,video/mp4,video/webm" aria-label="File" className="text-sm text-muted file:mr-3 file:rounded file:border file:border-line file:bg-bg file:px-3 file:py-1.5 file:text-sm file:text-fg" />
                  <fieldset className="flex flex-col gap-2 text-sm">
                    <label className="flex items-center gap-2"><input type="radio" name="visibility" value="public" defaultChecked className="accent-[#6366f1]" /> Public — anyone with the link</label>
                    <label className="flex items-center gap-2"><input type="radio" name="visibility" value="password" className="accent-[#6366f1]" /> Password protected</label>
                  </fieldset>
                  <input name="password" type="password" minLength={4} maxLength={100} autoComplete="off" placeholder="Password (only if protected)" aria-label="Password for protected content" className="input" />
                  <p className="text-xs text-muted">Images, audio and video up to 4 MB. Titles are always visible on your profile; the file itself is locked.</p>
                </ActionForm>
              </div>
            </details>
          )}
          {rows.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {rows.map((r) => (
                <Link key={r.id} href={`/c/${r.id}`} className="group block">
                  <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded border border-line bg-surface transition-colors group-hover:border-[#3a3a3f]">
                    {r.visibility === 'public' && r.mime.startsWith('image/') ? (
                      <img src={`/m/${r.media_id}`} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : r.visibility === 'password' ? (
                      <LockIcon width={28} height={28} className="text-muted" />
                    ) : r.mime.startsWith('video/') ? (
                      <FilmIcon width={28} height={28} className="text-muted" />
                    ) : (
                      <MusicIcon width={28} height={28} className="text-muted" />
                    )}
                    {r.visibility === 'password' && (
                      <span className="absolute right-2 top-2 rounded-full bg-bg/80 p-1.5 text-muted"><LockIcon width={12} height={12} /></span>
                    )}
                  </div>
                  <div className="mt-2 truncate text-sm">{r.title}</div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted">{own ? 'Nothing uploaded yet. Use “Upload content” above.' : 'Nothing here yet.'}</p>
          )}
        </>
      ) : rows.length ? (
        <>
          <List>{rows.map((r) => <ThreadRow key={r.id} t={r} />)}</List>
          <Pagination page={page} pages={Math.ceil(total / PER)} base={`/u/${u.username}?tab=${tab}`} />
        </>
      ) : (
        <p className="text-muted">Nothing here yet.</p>
      )}
    </div>
  );
}
