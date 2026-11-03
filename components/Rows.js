import Link from 'next/link';
import { PinIcon, LockIcon } from './Icons';
import { timeAgo, snippet } from '@/lib/time';

export function ThreadRow({ t }) {
  return (
    <li className="border-b border-line last:border-b-0 hover:bg-[#14141a]">
      <div className="flex items-center justify-between gap-4 px-2 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {t.pinned && <PinIcon className="shrink-0 text-muted" />}
            {t.locked && <LockIcon className="shrink-0 text-muted" />}
            <Link href={`/t/${t.id}`} className="truncate text-[15px] font-medium before:absolute before:inset-0 hover:text-white">
              {t.title}
            </Link>
          </div>
          <div className="mt-0.5 text-[13px] text-muted">@{t.username}</div>
        </div>
        <div className="flex shrink-0 gap-5 text-[13px] text-muted tabular-nums">
          <span className="hidden sm:inline">{t.replies} replies</span>
          <span className="hidden sm:inline">{t.view_count} views</span>
          <span>{timeAgo(t.last_activity)}</span>
        </div>
      </div>
    </li>
  );
}

export function PostRow({ p }) {
  return (
    <li className="border-b border-line last:border-b-0 hover:bg-[#14141a]">
      <div className="px-2 py-3">
        <Link href={`/t/${p.thread_id}`} className="text-[15px] font-medium">{snippet(p.content)}</Link>
        <div className="mt-0.5 text-[13px] text-muted">
          @{p.username} in {p.thread_title} · {timeAgo(p.created_at)}
        </div>
      </div>
    </li>
  );
}

export const List = ({ children }) => <ul className="relative border-y border-line [&>li]:relative">{children}</ul>;

export const THREAD_COLS = (sql) => sql`
  t.id, t.title, t.pinned, t.locked, t.view_count, t.created_at, u.username,
  (select count(*) from posts p where p.thread_id = t.id)::int as replies,
  coalesce((select max(p.created_at) from posts p where p.thread_id = t.id), t.created_at) as last_activity`;
