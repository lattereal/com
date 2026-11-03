import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { modAction, createPost } from '@/app/actions';
import ActionForm from '@/components/ActionForm';
import PostBlock from '@/components/PostBlock';
import Pagination from '@/components/Pagination';
import { PinIcon, LockIcon } from '@/components/Icons';
import { isMod } from '@/lib/roles';

const PER = 50;

export default async function ThreadPage({ params, searchParams }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();
  const [t] = await sql`
    update threads set view_count = view_count + 1 where id = ${id}
    returning id, title, content, created_at, locked, pinned, author_id, board_id`;
  if (!t) notFound();

  const user = await getUser();
  const page = Math.max(1, parseInt(searchParams.page) || 1);
  const [[board], [author], [{ n }]] = await Promise.all([
    sql`select slug, name from boards where id = ${t.board_id}`,
    sql`select username, display_name, avatar_id, role, accent from users where id = ${t.author_id}`,
    sql`select count(*)::int as n from posts where thread_id = ${id}`,
  ]);
  const posts = await sql`
    select p.id, p.content, p.created_at, p.author_id, u.username, u.display_name, u.avatar_id, u.role, u.accent
    from posts p join users u on u.id = p.author_id
    where p.thread_id = ${id} order by p.id limit ${PER} offset ${(page - 1) * PER}`;

  const next = `/t/${id}`;
  const modBtn = (op, label, danger, nextUrl = next) => (
    <form action={modAction} className="inline">
      <input type="hidden" name="op" value={op} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="next" value={nextUrl} />
      <button className={`text-[13px] hover:underline ${danger ? 'text-red-400' : 'text-muted'}`}>{label}</button>
    </form>
  );

  return (
    <div>
      <nav className="mb-2 text-[13px] text-muted">
        <Link href="/" className="hover:text-fg">Boards</Link> / <Link href={`/b/${board.slug}`} className="hover:text-fg">{board.name}</Link>
      </nav>
      <h1 className="mb-6 flex items-center gap-2 text-[28px] font-medium leading-tight">
        {t.pinned && <PinIcon className="text-muted" />}
        {t.locked && <LockIcon className="text-muted" />}
        <span className="min-w-0 break-words">{t.title}</span>
      </h1>

      {searchParams.reported && (
        <p className="mb-4 rounded border border-line bg-surface px-4 py-2 text-[13px] text-muted">Report sent. A moderator will review it.</p>
      )}
      {isMod(user) && (
        <div className="mb-4 flex gap-4">
          {modBtn(t.pinned ? 'thread-unpin' : 'thread-pin', t.pinned ? 'Unpin' : 'Pin')}
          {modBtn(t.locked ? 'thread-unlock' : 'thread-lock', t.locked ? 'Unlock' : 'Lock')}
          {modBtn('thread-delete', 'Delete thread', true, `/b/${board.slug}`)}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {page === 1 && (
          <PostBlock kind="thread" id={t.id} threadId={t.id} author={author} authorId={t.author_id}
            createdAt={t.created_at} content={t.content} viewer={user} />
        )}
        {posts.map((p) => (
          <PostBlock key={p.id} kind="post" id={p.id} threadId={t.id} author={p} authorId={p.author_id}
            createdAt={p.created_at} content={p.content} viewer={user} />
        ))}
      </div>
      <Pagination page={page} pages={Math.ceil(n / PER)} base={`/t/${id}`} />

      <div className="mt-8">
        {!user ? (
          <p className="text-muted"><Link href="/login" className="link">Sign in</Link> to reply.</p>
        ) : t.locked && !isMod(user) ? (
          <p className="text-muted">This thread is locked.</p>
        ) : (
          <ActionForm action={createPost} label="Post reply" wrapClass="flex flex-col" footClass="mt-3 flex justify-end">
            <input type="hidden" name="thread" value={t.id} />
            <textarea name="content" required maxLength={20000} rows={6} placeholder="Write a reply…" aria-label="Reply"
              className="w-full rounded border border-line bg-bg p-3 text-[15px] leading-relaxed placeholder:text-muted focus:border-accent focus:outline-none" />
          </ActionForm>
        )}
      </div>
    </div>
  );
}
