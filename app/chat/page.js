import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { isMod } from '@/lib/roles';
import Chat from '@/components/Chat';

export const metadata = { title: 'Chat' };
export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  const me = await getUser();
  if (!me || me.is_banned) redirect('/login');
  return (
    <div className="max-w-[760px]">
      <h1 className="text-2xl font-medium">Lounge</h1>
      <p className="mb-5 mt-1 text-sm text-muted">Open to every member. Send text, images, video, or hold the mic for a voice note.</p>
      <Chat endpoint="/api/chat" me={me.username} canModerate={isMod(me)} placeholder="Message the lounge…" />
    </div>
  );
}
