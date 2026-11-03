import { notFound, redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { createThread } from '@/app/actions';
import ActionForm from '@/components/ActionForm';

export const metadata = { title: 'New thread' };

export default async function NewThread({ params }) {
  const user = await getUser();
  if (!user) redirect('/login');
  const [board] = await sql`select slug, name from boards where slug = ${params.slug}`;
  if (!board) notFound();

  return (
    <div className="max-w-[720px]">
      <h1 className="mb-6 text-[28px] font-medium">New thread in {board.name}</h1>
      <ActionForm action={createThread} label="Post thread" wrapClass="flex flex-col gap-3" footClass="flex justify-end">
        <input type="hidden" name="slug" value={board.slug} />
        <input name="title" required minLength={3} maxLength={200} placeholder="Title" aria-label="Title" className="input" />
        <textarea name="content" required maxLength={20000} rows={12} placeholder="Write your post…" aria-label="Body"
          className="w-full rounded border border-line bg-bg p-3 text-[15px] leading-relaxed placeholder:text-muted focus:border-accent focus:outline-none" />
        <p className="text-xs text-muted">Markdown supported. Images and raw HTML are not.</p>
      </ActionForm>
    </div>
  );
}
