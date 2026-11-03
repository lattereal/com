import Link from 'next/link';
import { sql } from '@/lib/db';
import { isMod, isStaff } from '@/lib/roles';
import AccountMenu from './AccountMenu';

export default async function Nav({ user }) {
  let pending = 0;
  if (user) [{ n: pending }] = await sql`select count(*)::int as n from friendships where addressee_id = ${user.id} and status = 'pending'`;
  const navLink = 'whitespace-nowrap rounded-md px-3 py-2 text-[13px] text-muted transition-colors hover:bg-[#1b1b20] hover:text-fg';
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
      <div className="mx-auto flex min-h-14 max-w-[1100px] items-center gap-3 px-4 sm:px-5">
        <Link href="/" className="shrink-0 text-[15px] font-semibold tracking-tight">comforums.com</Link>
        <nav aria-label="Main navigation" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link href="/" className={navLink}>Boards</Link>
          <Link href="/profiles" className={navLink}>Profiles</Link>
          <Link href="/ranks" className={navLink}>Ranks</Link>
          {user && <>
            <Link href="/chat" className={navLink}>Chat</Link>
            <Link href="/messages" className={navLink}>Messages</Link>
            <Link href="/friends" className={navLink}>Friends{pending > 0 && <span className="ml-1.5 rounded-full bg-accent px-1.5 py-0.5 text-[10px] text-white">{pending}</span>}</Link>
          </>}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <form action="/search" className="hidden lg:block">
            <input name="q" type="search" aria-label="Search" placeholder="Search" className="h-8 w-36 rounded-md border border-line bg-surface px-3 text-sm placeholder:text-muted focus:border-accent focus:outline-none" />
          </form>
          {user ? <AccountMenu user={user} isModerator={isMod(user)} isStaffMember={isStaff(user)} /> : (
            <div className="flex gap-1.5"><Link href="/login" className="btn-ghost">Sign in</Link><Link href="/register" className="btn-primary">Register</Link></div>
          )}
        </div>
      </div>
    </header>
  );
}
