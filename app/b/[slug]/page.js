import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { List, ThreadRow, THREAD_COLS } from '@/components/Rows';
import Pagination from '@/components/Pagination';

const PER = 20;

export async function generateMetadata({ params }) {
  return { title: params.slug };
}

export default async function BoardPage({ params, searchParams }) {
  const [board] = await sql`select * from boards where slug = ${params.slug}`;
  if (!board) notFound();
  const user = await getUser();
  const page = Math.max(1, parseInt(searchParams.page) || 1);
  const [{ n }] = await sql`select count(*)::int as n from threads where board_id = ${board.id}`;
  const threads = await sql`
    select ${THREAD_COLS(sql)}
    from threads t join users u on u.id = t.author_id
    where t.board_id = ${board.id}
    order by t.pinned desc, last_activity desc
    limit ${PER} offset ${(page - 1) * PER}`;

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-medium leading-tight">{board.name}</h1>
          <p className="mt-1 text-sm text-muted">{board.description}</p>
        </div>
        {user && <Link href={`/b/${board.slug}/new`} className="btn-primary shrink-0">New thread</Link>}
      </div>
      {threads.length ? (
        <List>{threads.map((t) => <ThreadRow key={t.id} t={t} />)}</List>
      ) : (
        <p className="text-muted">No threads yet.{user ? ' Start the first one.' : ' Sign in to start the first one.'}</p>
      )}
      <Pagination page={page} pages={Math.ceil(n / PER)} base={`/b/${board.slug}`} />
    </div>
  );
}
