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
        <h1 className="text-2xl font-medium text-muted">Boards</h1>
        {isStaff(user) && <Link href="/admin/categories" className="text-[13px] text-muted hover:text-fg">Manage categories</Link>}
      </div>
      {shown.map(([cat, list]) => (
        <section key={cat} className="mb-8">
          <h2 className="mb-3 text-xs uppercase tracking-[0.5px] text-muted">{cat}</h2>
          <div className="flex flex-col gap-2">
            {list.length === 0 && <p className="text-[13px] text-muted">No boards in this category yet.</p>}
            {list.map((b) => (
              <Link key={b.id} href={`/b/${b.slug}`}
                className="flex items-center justify-between gap-6 rounded border border-line bg-surface p-5 transition-colors hover:border-[#3a3a3f] hover:bg-[#1a1a1e]">
                <div className="min-w-0">
                  <div className="text-base font-medium">{b.name}</div>
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
      <p className="mt-10 text-[13px] text-muted">
        {fmt(s.members)} members · {fmt(s.threads)} threads · {fmt(s.posts)} posts
        {s.newest && <> · newest member: {s.newest}</>}
      </p>
    </div>
  );
}
