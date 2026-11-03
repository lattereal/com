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
import { userRoles } from '@/lib/roles';
import PremiumName from '@/components/PremiumName';

const PER = 20;

export async function generateMetadata({ params }) { return { title: `@${params.username}` }; }

function FriendButtons({ state, username }) {
  const op = (name, label, cls = 'btn-ghost') => (
    <form action={friendOp}><input type="hidden" name="op" value={name} /><input type="hidden" name="id" value={state.id ?? ''} /><input type="hidden" name="username" value={username} /><button className={cls}>{label}</button></form>
  );
  if (state.status === 'friends') return <><Link href={`/messages/${username}`} className="btn-primary">message</Link>{op('remove', 'unfriend')}</>;
  if (state.status === 'sent') return op('cancel', 'request sent · cancel');
  if (state.status === 'received') return <>{op('accept', 'accept request', 'btn-primary')}{op('decline', 'decline')}</>;
  return op('add', 'add friend', 'btn-primary');
}

export default async function Profile({ params, searchParams }) {
  const viewer = await getUser();
  const [u] = await sql`select id, username, display_name, bio, accent, avatar_id, banner_id, role, roles, name_color, name_effect, profile_theme, socials, created_at, is_banned from users where username = ${params.username.toLowerCase()}`;
  if (!u) notFound();
  const own = viewer?.id === u.id;
  const premium = userRoles(u).some((r) => ['rich', 'respected', 'known', 'owner'].includes(r));
  const theme = premium && ['midnight', 'rose', 'forest', 'ocean'].includes(u.profile_theme) ? u.profile_theme : 'default';
  const socials = premium && u.socials && typeof u.socials === 'object' ? Object.entries(u.socials).filter(([, url]) => typeof url === 'string' && /^https?:\/\//i.test(url)) : [];
  const tab = searchParams.tab === 'content' ? 'content' : 'threads';
  const page = Math.max(1, parseInt(searchParams.page) || 1);
  const [[c], songs, fs] = await Promise.all([
    sql`select (select count(*) from threads where author_id = ${u.id})::int as threads, (select count(*) from posts where author_id = ${u.id})::int as posts, (select count(*) from uploads where owner_id = ${u.id})::int as uploads`,
    sql`select id, title, artist, media_id from profile_songs where user_id = ${u.id} order by id`,
    viewer && !own && !viewer.is_banned ? friendState(viewer.id, u.id) : { status: 'none' },
  ]);
  let rows = [];
  if (tab === 'threads') rows = await sql`select ${THREAD_COLS(sql)} from threads t join users u on u.id = t.author_id where t.author_id = ${u.id} order by t.created_at desc limit ${PER} offset ${(page - 1) * PER}`;
  else rows = await sql`select up.id, up.title, up.visibility, up.media_id, m.mime from uploads up join media m on m.id = up.media_id where up.owner_id = ${u.id} order by up.created_at desc limit 60`;
  const tabCls = (on) => `border-b-2 pb-2 text-sm ${on ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg'}`;
  return (
    <div>
      <section className={`mb-8 overflow-hidden rounded border border-line profile-theme-${theme}`}>
        <div className="relative isolate h-32 overflow-hidden bg-[#141416] sm:h-44" style={{ background: `linear-gradient(120deg, ${u.accent}47, ${u.accent}0d 75%)` }}>
          {u.banner_id && <img src={`/m/${u.banner_id}`} alt="" className="absolute inset-0 z-0 h-full w-full object-cover" />}
        </div>
        <div className="relative z-10 px-6 pb-6">
          <div className="-mt-10 flex items-end justify-between gap-4">
            <div className="h-[88px] w-[88px] shrink-0 overflow-hidden rounded-full border-4 border-surface bg-surface"><Avatar user={u} size={80} /></div>
            <div className="flex flex-wrap justify-end gap-2 pb-1">{own && <Link href="/settings" className="btn-ghost">edit profile</Link>}{viewer && !own && !viewer.is_banned && <FriendButtons state={fs} username={u.username} />}</div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1"><h1 className="text-xl font-medium"><PremiumName user={u} premium={premium}>{nameOf(u)}</PremiumName></h1><RoleBadge role={u.role} roles={u.roles} />{u.is_banned && <span className="text-xs text-red-400">suspended</span>}</div>
          <p className="mt-0.5 text-[13px] text-muted">@{u.username} · joined {new Date(u.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} · {fmt(c.threads + c.posts)} contributions</p>
          {socials.length > 0 && <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">{socials.map(([key, url]) => <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="text-muted underline-offset-4 hover:text-fg hover:underline">{key}</a>)}</div>}
          {u.bio && <p className="mt-4 max-w-[620px] whitespace-pre-wrap break-words text-[15px] leading-relaxed">{u.bio}</p>}
        </div>
        {songs.length > 0 && <div className="border-t border-line px-6 py-3"><SongPlayer accent={u.accent} songs={songs.map((s) => ({ id: s.id, title: s.title, artist: s.artist, src: `/m/${s.media_id}` }))} /></div>}
      </section>
      <div className="mb-4 flex gap-6 border-b border-line"><Link href={`/u/${u.username}`} className={tabCls(tab === 'threads')}>threads</Link><Link href={`/u/${u.username}?tab=content`} className={tabCls(tab === 'content')}>content{c.uploads ? ` · ${c.uploads}` : ''}</Link></div>
      {tab === 'content' ? <>{own && <details className="mb-6 rounded border border-line bg-surface"><summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium">upload content</summary><div className="border-t border-line p-4"><ActionForm action={createUpload} label="upload" wrapClass="flex max-w-[480px] flex-col gap-3" footClass="flex justify-end"><input name="title" required maxLength={100} placeholder="title" aria-label="title" className="input" /><textarea name="description" maxLength={500} rows={2} placeholder="description (optional)" aria-label="description" className="w-full rounded border border-line bg-bg p-3 text-sm placeholder:text-muted focus:border-accent focus:outline-none" /><input name="file" type="file" required accept="image/png,image/jpeg,image/gif,image/webp,audio/*,video/mp4,video/webm" aria-label="file" className="text-sm text-muted" /><fieldset className="flex flex-col gap-2 text-sm"><label className="flex items-center gap-2"><input type="radio" name="visibility" value="public" defaultChecked className="accent-[#6366f1]" /> public — anyone with the link</label><label className="flex items-center gap-2"><input type="radio" name="visibility" value="password" className="accent-[#6366f1]" /> password protected</label></fieldset><input name="password" type="password" minLength={4} maxLength={100} autoComplete="off" placeholder="password (only if protected)" aria-label="password for protected content" className="input" /><p className="text-xs text-muted">images, audio and video up to 4 mb. titles are always visible on your profile; the file itself is locked.</p></ActionForm></div></details>}{rows.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{rows.map((r) => <Link key={r.id} href={`/c/${r.id}`} className="group block"><div className="relative flex aspect-square items-center justify-center overflow-hidden rounded border border-line bg-surface transition-colors group-hover:border-[#3a3a3f]">{r.visibility === 'public' && r.mime.startsWith('image/') ? <img src={`/m/${r.media_id}`} alt="" loading="lazy" className="h-full w-full object-cover" /> : r.visibility === 'password' ? <LockIcon width={28} height={28} className="text-muted" /> : r.mime.startsWith('video/') ? <FilmIcon width={28} height={28} className="text-muted" /> : <MusicIcon width={28} height={28} className="text-muted" />}{r.visibility === 'password' && <span className="absolute right-2 top-2 rounded-full bg-bg/80 p-1.5 text-muted"><LockIcon width={12} height={12} /></span>}</div><div className="mt-2 truncate text-sm">{r.title}</div></Link>)}</div> : <p className="text-muted">{own ? 'nothing uploaded yet. use “upload content” above.' : 'nothing here yet.'}</p>}</> : rows.length ? <><List>{rows.map((r) => <ThreadRow key={r.id} t={r} />)}</List><Pagination page={page} pages={Math.ceil(c.threads / PER)} base={`/u/${u.username}?tab=${tab}`} /></> : <p className="text-muted">nothing here yet.</p>}
    </div>
  );
}
