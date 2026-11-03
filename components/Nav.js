import Link from 'next/link';
import { logout } from '@/app/actions';
import { sql } from '@/lib/db';
import { isMod, isStaff } from '@/lib/roles';
import { nameOf } from '@/lib/util';
import Avatar from './Avatar';

export default async function Nav({ user }) {
  let pending = 0;
  if (user) [{ n: pending }] = await sql`select count(*)::int as n from friendships where addressee_id = ${user.id} and status = 'pending'`;
  const navLink = 'whitespace-nowrap rounded-md px-3 py-2 text-[13px] text-muted transition-colors hover:bg-[#1b1b20] hover:text-fg';
  const menuLink = 'block px-3 py-2 hover:bg-[#1a1a1e]';
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
      <div className="mx-auto flex min-h-14 max-w-[1100px] items-center gap-3 px-4 sm:px-5">
        <Link href="/" className="shrink-0 text-[15px] font-semibold tracking-tight">ComForums</Link>
        <nav aria-label="Main navigation" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link href="/" className={navLink}>Boards</Link>
          <Link href="/profiles" className={navLink}>Profiles</Link>
          <Link href="/chat" className={navLink}>Chat</Link>
          <Link href="/g" className={navLink}>Groups</Link>
          {user && <>
            <Link href="/messages" className={navLink}>Messages</Link>
            <Link href="/friends" className={navLink}>
              Friends{pending > 0 && <span className="ml-1.5 rounded-full bg-accent px-1.5 py-0.5 text-[10px] text-white">{pending}</span>}
            </Link>
          </>}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <form action="/search" className="hidden lg:block">
            <input name="q" type="search" aria-label="Search" placeholder="Search"
              className="h-8 w-36 rounded-md border border-line bg-surface px-3 text-sm placeholder:text-muted focus:border-accent focus:outline-none" />
          </form>
          {user ? (
            <details className="relative">
              <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-md border border-line px-2.5 hover:bg-[#1a1a1e]">
                <Avatar user={user} size={24} />
                <span className="hidden max-w-[100px] truncate text-[13px] sm:inline">{nameOf(user)}</span>
                <span className="text-muted">⌄</span>
              </summary>
              <div className="absolute right-0 mt-2 w-52 rounded-lg border border-line bg-surface py-1 text-sm shadow-xl">
                <Link href={`/u/${user.username}`} className={menuLink}>My profile</Link>
                <Link href="/settings" className={menuLink}>Settings</Link>
                {isMod(user) && <div className="my-1 border-t border-line pt-1">
                  <Link href="/admin/reports" className={menuLink}>Reports</Link>
                  <Link href="/admin/members" className={menuLink}>Members</Link>
                  {isStaff(user) && <Link href="/admin/categories" className={menuLink}>Categories</Link>}
                </div>}
                <form action={logout} className="mt-1 border-t border-line pt-1">
                  <button className="block w-full px-3 py-2 text-left hover:bg-[#1a1a1e]">Sign out</button>
                </form>
              </div>
            </details>
          ) : <div className="flex gap-1.5">
            <Link href="/login" className="btn-ghost">Sign in</Link>
            <Link href="/register" className="btn-primary">Register</Link>
          </div>}
        </div>
      </div>
    </header>
  );
}
