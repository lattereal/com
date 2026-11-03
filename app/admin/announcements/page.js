import { notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { isStaff } from '@/lib/roles';
import { saveAnnouncement } from '@/app/actions-admin';
import ActionForm from '@/components/ActionForm';

export const metadata = { title: 'Announcement' };
export const dynamic = 'force-dynamic';

export default async function Announcement() {
  const user = await getUser();
  if (!isStaff(user)) notFound();
  const [notice] = await sql`select message, enabled from site_announcement where id = 1`;
  return <div className="max-w-[680px]"><p className="mb-1 text-xs uppercase tracking-widest text-muted">administration</p><h1 className="text-2xl font-semibold">site announcement</h1><p className="mb-6 mt-2 text-sm text-muted">publish a short notice across the top of the site.</p><section className="rounded border border-line bg-surface p-5"><p className="mb-2 text-xs text-muted">preview</p><div className="mb-5 border-y border-line bg-[#19191b] px-4 py-3 text-sm">{notice?.enabled ? notice.message : 'no active announcement'}</div><ActionForm action={saveAnnouncement} label="save announcement" wrapClass="flex flex-col gap-4" footClass="flex justify-between"><textarea name="message" defaultValue={notice?.message || ''} maxLength={240} rows={3} placeholder="write an announcement..." className="w-full rounded border border-line bg-bg p-3 text-sm focus:border-accent focus:outline-none" /><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={notice?.enabled} /> publish announcement</label></ActionForm></section></div>;
}
