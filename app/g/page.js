import Link from 'next/link';
import { sql } from '@/lib/db';

export const metadata = { title: 'Groups' };
export const dynamic = 'force-dynamic';

export default async function Groups() {
  const tags = await sql`
    select t.tag, count(*)::int as n from profile_tags t join users u on u.id = t.user_id
    where not u.is_banned group by t.tag order by n desc, t.tag limit 80`;
  return (
    <div>
      <h1 className="mb-2 text-2xl font-medium text-muted">Groups</h1>
      <p className="mb-8 text-sm text-muted">Hashtags members add to their profile. Add yours in Settings.</p>
      {tags.length ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <Link key={t.tag} href={`/g/${t.tag}`} className="rounded-full border border-line bg-surface px-4 py-1.5 text-sm transition-colors hover:border-[#3a3a3f] hover:bg-[#1a1a1e]">
              #{t.tag} <span className="ml-1 text-muted">{t.n}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-muted">No groups yet. Be the first to add a hashtag to your profile.</p>
      )}
    </div>
  );
}
