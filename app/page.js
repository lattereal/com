import Link from 'next/link';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { isStaff } from '@/lib/roles';
import { fmt, timeAgo } from '@/lib/time';

export default async function Home() {
  const user = await getUser();
  const [cats, boards] = await Promise.all([
    sql`select id, name from categories order by position, id`,
    sql`select b.id, b.name, b.slug, b.description, b.category_id,
      (select count(*) from threads t where t.board_id = b.id)::int as threads,
      (select count(*) from posts p join threads t on t.id = p.thread_id where t.board_id = b.id)::int as posts,
      latest.title as latest_title, latest.username as latest_username, latest.last_activity
      from boards b
      left join lateral (
        select t.title, u.username,
          coalesce((select max(p.created_at) from posts p where p.thread_id = t.id), t.created_at) as last_activity
        from threads t join users u on u.id = t.author_id
        where t.board_id = b.id
        order by last_activity desc limit 1
      ) latest on true
      order by b.id`,
  ]);
  const groups = cats.map((c) => [c.name, boards.filter((b) => b.category_id === c.id)]);
  const loose = boards.filter((b) => !cats.some((c) => c.id === b.category_id));
  if (loose.length) groups.push(['Uncategorized', loose]);
  const shown = isStaff(user) ? groups : groups.filter(([, list]) => list.length);
  return (
    <div className="home-page">
      <div className="mb-6 flex items-center justify-between gap-4 border-b border-line pb-3">
        <h1 className="text-lg font-semibold tracking-tight">boards</h1>
        {isStaff(user) && <Link href="/admin/categories" className="text-[13px] text-muted hover:text-fg">manage categories</Link>}
      </div>
      {shown.map(([cat, list]) => (
        <section key={cat} className="mb-8">
          <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted">{cat}</h2>
          <div className="overflow-hidden rounded border border-line bg-surface">
            {list.length === 0 && <p className="px-4 py-5 text-sm text-muted">no boards in this category yet.</p>}
            {list.map((b, i) => (
              <div key={b.id} className={'flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between ' + (i ? 'border-t border-line' : '')}>
                <div className="min-w-0">
                  <Link href={'/b/' + b.slug} className="font-medium hover:underline">{b.name}</Link>
                  {b.description && <p className="mt-0.5 text-[13px] text-muted">{b.description}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-4 text-xs text-muted sm:w-[260px] sm:justify-end">
                  <span className="whitespace-nowrap">{fmt(b.threads)} threads</span>
                  <span className="whitespace-nowrap">{fmt(b.posts)} replies</span>
                  <span className="hidden min-w-0 truncate text-right sm:block sm:w-28" title={b.latest_title || 'no activity'}>
                    {b.latest_title ? <><span className="block truncate text-fg/80">{b.latest_title}</span><span className="block truncate">{b.latest_username} · {timeAgo(b.last_activity)}</span></> : 'no activity'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
      {!shown.length && <p className="text-sm text-muted">there aren't any boards yet.</p>}
    </div>
  );
}
