import { notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { isStaff } from '@/lib/roles';
import {
  createCategory, renameCategory, moveCategory, deleteCategory,
  createBoard, updateBoard, deleteBoard,
} from '@/app/actions-admin';
import ActionForm from '@/components/ActionForm';

export const metadata = { title: 'Categories' };
export const dynamic = 'force-dynamic';

const small = 'h-8 rounded border border-line bg-bg px-2 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none';

export default async function Categories({ searchParams }) {
  const user = await getUser();
  if (!isStaff(user)) notFound();

  const [cats, boards] = await Promise.all([
    sql`select id, name from categories order by position, id`,
    sql`select b.id, b.slug, b.name, b.description, b.category_id,
               (select count(*) from threads t where t.board_id = b.id)::int as threads
        from boards b order by b.id`,
  ]);
  const catOptions = () => cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>);

  return (
    <div className="max-w-[760px]">
      <h1 className="mb-2 text-2xl font-medium text-muted">Categories</h1>
      <p className="mb-6 text-sm text-muted">Group boards into categories, rename them, reorder them, or remove them. Changes show on the home page immediately.</p>
      {searchParams.msg && <p className="mb-6 rounded border border-line bg-surface px-4 py-2 text-[13px] text-muted">{searchParams.msg}</p>}

      <div className="flex flex-col gap-4">
        {cats.map((c, i) => {
          const list = boards.filter((b) => b.category_id === c.id);
          return (
            <section key={c.id} className="rounded border border-line bg-surface">
              <div className="flex flex-wrap items-center gap-2 border-b border-line p-4">
                <form action={renameCategory} className="flex flex-1 gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <input name="name" defaultValue={c.name} maxLength={40} aria-label="Category name" className={`${small} min-w-0 flex-1 font-medium`} />
                  <button className="btn-ghost">Rename</button>
                </form>
                <form action={moveCategory}>
                  <input type="hidden" name="id" value={c.id} /><input type="hidden" name="dir" value="up" />
                  <button disabled={i === 0} aria-label="Move up" className="btn-ghost w-8 px-0">↑</button>
                </form>
                <form action={moveCategory}>
                  <input type="hidden" name="id" value={c.id} /><input type="hidden" name="dir" value="down" />
                  <button disabled={i === cats.length - 1} aria-label="Move down" className="btn-ghost w-8 px-0">↓</button>
                </form>
                <form action={deleteCategory}>
                  <input type="hidden" name="id" value={c.id} />
                  <button disabled={list.length > 0} title={list.length ? 'Empty this category first' : ''} className="btn-ghost text-red-400">Delete</button>
                </form>
              </div>

              <div className="divide-y divide-line">
                {list.length === 0 && <p className="p-4 text-[13px] text-muted">No boards here.</p>}
                {list.map((b) => (
                  <div key={b.id} className="p-4">
                    <form action={updateBoard} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="id" value={b.id} />
                      <span className="w-full text-xs text-muted sm:w-auto">/b/{b.slug}</span>
                      <input name="name" defaultValue={b.name} maxLength={40} aria-label="Board name" className={`${small} w-32`} />
                      <input name="description" defaultValue={b.description} maxLength={200} aria-label="Description" className={`${small} min-w-0 flex-1`} />
                      <select name="category_id" aria-label="Category" defaultValue={b.category_id} className={small}>{catOptions()}</select>
                      <button className="btn-ghost">Save</button>
                    </form>
                    <form action={deleteBoard} className="mt-2 flex items-center gap-3 text-[13px] text-muted">
                      <input type="hidden" name="id" value={b.id} />
                      <button className="text-red-400 hover:underline">Delete board</button>
                      {b.threads > 0 && (
                        <label className="flex items-center gap-1.5"><input type="checkbox" name="confirm" value="yes" /> also delete its {b.threads} thread(s)</label>
                      )}
                    </form>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <section className="rounded border border-line bg-surface p-5">
          <h2 className="mb-3 text-base font-medium">New category</h2>
          <ActionForm action={createCategory} label="Add category" wrapClass="flex flex-col gap-3" footClass="flex justify-end">
            <input name="name" required minLength={2} maxLength={40} placeholder="Name" aria-label="Category name" className="input" />
          </ActionForm>
        </section>
        <section className="rounded border border-line bg-surface p-5">
          <h2 className="mb-3 text-base font-medium">New board</h2>
          <ActionForm action={createBoard} label="Create board" wrapClass="flex flex-col gap-3" footClass="flex justify-end">
            <input name="name" required minLength={2} maxLength={40} placeholder="Name" aria-label="Board name" className="input" />
            <input name="slug" required pattern="[a-z0-9\-]{2,24}" placeholder="slug (e.g. off-topic)" aria-label="Slug" className="input" />
            <input name="description" maxLength={200} placeholder="Description" aria-label="Description" className="input" />
            <select name="category_id" required aria-label="Category" defaultValue={cats[0]?.id} className="input">{catOptions()}</select>
          </ActionForm>
        </section>
      </div>
    </div>
  );
}
