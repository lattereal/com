import { sql } from '@/lib/db';
import { List, ThreadRow, PostRow, THREAD_COLS } from '@/components/Rows';

export const metadata = { title: 'Search' };

export default async function Search({ searchParams }) {
  const q = String(searchParams.q || '').trim().slice(0, 100);
  if (!q) return <p className="text-muted">Enter a search term in the bar above.</p>;
  const pat = `%${q.replace(/[\\%_]/g, '\\$&')}%`;

  const [threads, posts] = await Promise.all([
    sql`select ${THREAD_COLS(sql)} from threads t join users u on u.id = t.author_id
        where t.title ilike ${pat} or t.content ilike ${pat} order by t.created_at desc limit 20`,
    sql`select p.id, p.thread_id, p.content, p.created_at, u.username, t.title as thread_title
        from posts p join users u on u.id = p.author_id join threads t on t.id = p.thread_id
        where p.content ilike ${pat} order by p.created_at desc limit 20`,
  ]);

  return (
    <div>
      <h1 className="mb-8 text-2xl font-medium text-muted">Results for “{q}”</h1>
      <h2 className="mb-3 text-xs uppercase tracking-[0.5px] text-muted">Threads</h2>
      {threads.length ? <List>{threads.map((t) => <ThreadRow key={t.id} t={t} />)}</List> : <p className="text-muted">No matching threads.</p>}
      <h2 className="mb-3 mt-10 text-xs uppercase tracking-[0.5px] text-muted">Posts</h2>
      {posts.length ? <List>{posts.map((p) => <PostRow key={p.id} p={p} />)}</List> : <p className="text-muted">No matching posts.</p>}
    </div>
  );
}
