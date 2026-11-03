import Link from 'next/link';
import Markdown from './Markdown';
import Avatar from './Avatar';
import RoleBadge from './RoleBadge';
import { timeAgo } from '@/lib/time';
import { report, modAction } from '@/app/actions';
import { isMod, outranks } from '@/lib/roles';
import { nameOf } from '@/lib/util';

function ModBtn({ op, id, uid, next, label, danger }) {
  return (
    <form action={modAction} className="inline">
      <input type="hidden" name="op" value={op} />
      <input type="hidden" name="id" value={id ?? ''} />
      {uid && <input type="hidden" name="uid" value={uid} />}
      <input type="hidden" name="next" value={next} />
      <button className={`text-xs ${danger ? 'text-red-400' : 'text-muted'} hover:underline`}>{label}</button>
    </form>
  );
}

// author: { username, display_name, avatar_id, role, accent }
export default function PostBlock({ kind, id, threadId, author, authorId, createdAt, content, viewer }) {
  const next = `/t/${threadId}`;
  const mod = isMod(viewer);
  return (
    <article id={`${kind}-${id}`} className="group block-card">
      <div className="flex items-center gap-3">
        <Avatar user={author} size={32} />
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <Link href={`/u/${author.username}`} className="text-sm font-medium hover:underline">{nameOf(author)}</Link>
          {author.display_name && <span className="text-[13px] text-muted">@{author.username}</span>}
          <RoleBadge role={author.role} />
          <time className="text-[13px] text-muted" dateTime={new Date(createdAt).toISOString()}>{timeAgo(createdAt)}</time>
        </div>
      </div>
      <div className="mt-3"><Markdown>{content}</Markdown></div>
      <div className="mt-3 flex flex-wrap items-center gap-4 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
        {viewer && (
          <details className="relative">
            <summary className="cursor-pointer list-none text-xs text-muted hover:text-fg">Report</summary>
            <form action={report} className="mt-2 flex gap-2">
              <input type="hidden" name="type" value={kind} />
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="thread" value={threadId} />
              <input name="reason" maxLength={500} placeholder="Reason" aria-label="Report reason" className="input h-8 w-56 text-xs" />
              <button className="btn-ghost text-xs">Send</button>
            </form>
          </details>
        )}
        {mod && (
          <>
            {kind === 'post' && <ModBtn op="post-delete" id={id} next={next} label="Delete" danger />}
            {outranks(viewer, author) && <ModBtn op="user-ban" uid={authorId} next={next} label="Ban user" danger />}
          </>
        )}
      </div>
    </article>
  );
}
