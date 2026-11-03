import { notFound } from 'next/navigation';
import Link from 'next/link';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { modAction } from '@/app/actions';
import { timeAgo, snippet } from '@/lib/time';
import { isMod } from '@/lib/roles';

export const metadata = { title: 'Reports' };

function Btn({ op, id, uid, report, label, danger }) {
  return (
    <form action={modAction}>
      <input type="hidden" name="op" value={op} />
      <input type="hidden" name="id" value={id ?? ''} />
      {uid && <input type="hidden" name="uid" value={uid} />}
      <input type="hidden" name="report" value={report} />
      <input type="hidden" name="next" value="/admin/reports" />
      <button className={`btn-ghost ${danger ? 'text-red-400' : ''}`}>{label}</button>
    </form>
  );
}

export default async function Reports() {
  const user = await getUser();
  if (!isMod(user)) notFound();

  const rows = await sql`
    select r.id, r.target_type, r.target_id, r.reason, r.created_at, ru.username as reporter,
           t.title as t_title, t.content as t_content, t.author_id as t_author_id, tu.username as t_author,
           p.content as p_content, p.thread_id as p_thread, p.author_id as p_author_id, pu.username as p_author
    from reports r
    join users ru on ru.id = r.reporter_id
    left join threads t on r.target_type = 'thread' and t.id = r.target_id
    left join users tu on tu.id = t.author_id
    left join posts p on r.target_type = 'post' and p.id = r.target_id
    left join users pu on pu.id = p.author_id
    where not r.resolved order by r.created_at`;

  return (
    <div>
      <h1 className="mb-8 text-2xl font-medium text-muted">Reports</h1>
      {!rows.length && <p className="text-muted">No open reports.</p>}
      <div className="flex flex-col gap-2">
        {rows.map((r) => {
          const isThread = r.target_type === 'thread';
          const exists = isThread ? r.t_title !== null : r.p_content !== null;
          const author = isThread ? r.t_author : r.p_author;
          const authorId = isThread ? r.t_author_id : r.p_author_id;
          const threadId = isThread ? r.target_id : r.p_thread;
          return (
            <div key={r.id} className="block-card bg-surface">
              <div className="text-[13px] text-muted">
                {r.target_type} · reported by @{r.reporter} · {timeAgo(r.created_at)}
              </div>
              {r.reason && <p className="mt-2 text-sm">“{r.reason}”</p>}
              {exists ? (
                <p className="mt-2 text-sm text-muted">
                  <Link href={`/t/${threadId}`} className="link">{isThread ? r.t_title : 'View thread'}</Link>
                  {' '}— @{author}: {snippet(isThread ? r.t_content : r.p_content, 200)}
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted">Content already removed.</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {exists && <Btn op={isThread ? 'thread-delete' : 'post-delete'} id={r.target_id} report={r.id} label="Delete" danger />}
                {exists && <Btn op="user-ban" uid={authorId} report={r.id} label="Ban author" danger />}
                {exists && <Btn op="thread-lock" id={threadId} report={r.id} label="Lock thread" />}
                <Btn op="dismiss" report={r.id} label="Dismiss" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
