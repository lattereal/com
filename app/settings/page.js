import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import SettingsClient from '@/components/SettingsClient';

export const metadata = { title: 'Settings' };

export default async function Settings() {
  const user = await getUser();
  if (!user) redirect('/login');
  const [[profile], songs] = await Promise.all([
    sql`select bio from users where id = ${user.id}`,
    sql`select id, title, artist from profile_songs where user_id = ${user.id} order by id`,
  ]);
  return <SettingsClient user={user} bio={profile?.bio || ''} songs={songs} />;
}
