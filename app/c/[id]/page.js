import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import { getUser, unlockedIds } from '@/lib/auth';
import { unlockContent, deleteUpload } from '@/app/actions-social';
import ActionForm from '@/components/ActionForm';
import MediaView from '@/components/MediaView';
import Avatar from '@/components/Avatar';
import { LockIcon } from '@/components/Icons';
import { timeAgo } from '@/lib/time';
import { UUID, nameOf } from '@/lib/util';
import { isMod } from '@/lib/roles';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Content', robots: { index: false } };

export default async function Content({ params }) {
  if (!UUID.test(params.id)) notFound();
  const [c] = await sql`
    select up.id, up.title, up.description, up.visibility, up.created_at, up.media_id, up.owner_id, m.mime,
           u.username, u.display_name, u.avatar_id, u.accent
    from uploads up join media m on m.id = up.media_id join users u on u.id = up.owner_id
    where up.id = ${params.id}`;
  if (!c) notFound();

  const viewer = await getUser();
  const own = viewer?.id === c.owner_id;
  const mod = isMod(viewer);
  const open = c.visibility === 'public' || own || mod || (await unlockedIds()).includes(c.id);

  if (!open)
    return (
      <div className="mx-auto mt-8 w-full max-w-[380px] rounded border border-line bg-surface p-8">
        <LockIcon width={22} height={22} className="mb-4 text-muted" />
        <h1 className="text-xl font-medium">{c.title}</h1>
        <p className="mt-1 text-[13px] text-muted">
          Shared by <Link href={`/u/${c.username}`} className="hover:text-fg hover:underline">{nameOf(c)}</Link>. Enter the password to view.
        </p>
        <ActionForm action={unlockContent} label="Unlock" buttonClass="btn-primary h-10 w-full" wrapClass="mt-5 flex flex-col gap-3" footClass="mt-1">
          <input type="hidden" name="id" value={c.id} />
          <input name="password" type="password" required autoComplete="off" placeholder="Password" aria-label="Password" className="input" />
        </ActionForm>
      </div>
    );

  return (
    <div className="max-w-[720px]">
      <nav className="mb-3 text-[13px] text-muted">
        <Link href={`/u/${c.username}?tab=content`} className="hover:text-fg">{nameOf(c)}</Link> / content
      </nav>
      <h1 className="mb-1 flex items-center gap-2 text-[28px] font-medium leading-tight">
        {c.visibility === 'password' && <LockIcon width={18} height={18} className="shrink-0 text-muted" />}
        <span className="min-w-0 break-words">{c.title}</span>
      </h1>
      <div className="mb-6 flex items-center gap-2 text-[13px] text-muted">
        <Avatar user={c} size={20} />
        <Link href={`/u/${c.username}`} className="hover:text-fg hover:underline">@{c.username}</Link>
        <span>· {timeAgo(c.created_at)}</span>
        {c.visibility === 'password' && <span>· password protected</span>}
      </div>
      <MediaView id={c.media_id} mime={c.mime} />
      {c.description && <p className="mt-5 whitespace-pre-wrap break-words text-[15px] leading-relaxed">{c.description}</p>}
      {(own || mod) && (
        <form action={deleteUpload} className="mt-8">
          <input type="hidden" name="id" value={c.id} />
          <button className="text-[13px] text-red-400 hover:underline">{own ? 'Delete this upload' : 'Delete (moderator)'}</button>
        </form>
      )}
    </div>
  );
}
