import Link from 'next/link';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { isStaff } from '@/lib/roles';
import { fmt } from '@/lib/time';

export default async function Home() {
  const user = await getUser();
  const [cats, boards, [s]] = await Promise.all([
    sql`select id, name from categories order by position, id`,
    sql`select b.*,
          (select count(*) from threads t where t.board_id = b.id)::int as threads,
          (select count(*) from posts p join threads t on t.id = p.thread_id where t.board_id = b.id)::int as posts
        from boards b order by b.id`,
    sql`select (select count(*) from users)::int as members,
               (select count(*) from threads)::int as threads,
               (select count(*) from posts)::int as posts,
               (select username from users order by created_at desc limit 1) as newest`,
  ]);

  const groups = cats.map((c) => [c.name, boards.filter((b) => b.category_id === c.id)]);
  const loose = boards.filter((b) => !cats.some((c) => c.id === b.category_id));
  if (loose.length) groups.push(['Uncategorized', loose]);
  const shown = isStaff(user) ? groups : groups.filter(([, list]) => list.length);

  return (
    <div>
      <div className="mb-8 flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight">browse boards</h2>
        {isStaff(user) && <Link href="/admin/categories" className="text-[13px] text-muted hover:text-fg">Manage categories</Link>}
      </div>
      {shown.map(([cat, list]) => (
        <section key={cat} className="mb-8">
          <h2 className="category-label mb-3 text-[11px] font-semibold uppercase text-muted">{cat}</h2>
          <div className="flex flex-col gap-2">
            {list.length === 0 && <p className="text-[13px] text-muted">No boards in this category yet.</p>}
            {list.map((b) => (
              <Link key={b.id} href={`/b/${b.slug}`}
                className="board-card flex items-center justify-between gap-6 rounded-xl border border-line p-5">
                <div className="min-w-0">
                  <div className="text-base font-semibold tracking-tight">{b.name}</div>
                  <div className="mt-1 text-sm text-muted">{b.description}</div>
                </div>
                <div className="shrink-0 text-right text-[13px] text-muted tabular-nums">
                  <div>{fmt(b.threads)} threads</div>
                  <div>{fmt(b.posts)} posts</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
      <div className="stats-strip mt-9 grid grid-cols-3 gap-3 rounded-xl px-4 py-4 text-center sm:px-6">\n        <div><strong className="block text-xl sm:text-2xl">{fmt(s.members)}</strong><span className="mt-1 block text-[11px] text-muted">members</span></div>\n        <div><strong className="block text-xl sm:text-2xl">{fmt(s.threads)}</strong><span className="mt-1 block text-[11px] text-muted">threads</span></div>\n        <div><strong className="block text-xl sm:text-2xl">{fmt(s.posts)}</strong><span className="mt-1 block text-[11px] text-muted">replies</span></div>\n      </div>\n      <p className="mt-4 text-center text-[11px] text-muted">
        {fmt(s.members)} members · {fmt(s.threads)} threads · {fmt(s.posts)} posts
        {s.newest && <> · newest member: {s.newest}</>}
      </p>
    </div>
  );
}
