import Link from 'next/link';
import { logout } from '@/app/actions';
import { sql } from '@/lib/db';
import { isMod, isStaff } from '@/lib/roles';
import { nameOf } from '@/lib/util';
import Avatar from './Avatar';

export default async function Nav({ user }) {
  let pending = 0;
  if (user) [{ n: pending }] = await sql`select count(*)::int as n from friendships where addressee_id = ${user.id} and status = 'pending'`;
  const item = 'block px-3 py-1.5 hover:bg-[#1a1a1e]';
  const link = 'hidden text-muted transition-colors hover:text-fg sm:inline';

  return (
    <header className="sticky top-0 z-20 h-14 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-full max-w-[960px] items-center gap-5 px-5 text-sm">
        <Link href="/" className="font-medium">ComForums</Link>
        {user && (
          <nav className="flex items-center gap-5">
            <Link href="/chat" className={link}>Chat</Link>
            <Link href="/g" className={link}>Groups</Link>
            <Link href="/messages" className={link}>Messages</Link>
            <Link href="/friends" className={`${link} relative`}>
              Friends
              {pending > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-white">{pending}</span>
              )}
            </Link>
          </nav>
        )}
        <div className="flex-1" />
        <form action="/search" className="hidden md:block">
          <input name="q" type="search" aria-label="Search" placeholder="Search"
            className="h-8 w-[200px] rounded border border-line bg-surface px-3 text-sm placeholder:text-muted focus:border-accent focus:outline-none" />
        </form>
        {user ? (
          <details className="relative">
            <summary className="flex h-8 cursor-pointer list-none items-center gap-2 rounded border border-line pl-1 pr-3 hover:border-[#3a3a3f] hover:bg-[#1a1a1e]">
              <Avatar user={user} size={24} />
              <span className="max-w-[110px] truncate">{nameOf(user)}</span>
              {pending > 0 && <span className="h-2 w-2 rounded-full bg-accent sm:hidden" />}
            </summary>
            <div className="absolute right-0 mt-2 w-48 rounded border border-line bg-surface py-1 text-sm shadow-lg">
              <Link href={`/u/${user.username}`} className={item}>Profile</Link>
              <Link href="/settings" className={item}>Settings</Link>
              <div className="sm:hidden">
                <Link href="/chat" className={item}>Chat</Link>
                <Link href="/g" className={item}>Groups</Link>
                <Link href="/messages" className={item}>Messages</Link>
                <Link href="/friends" className={item}>Friends{pending > 0 && ` (${pending})`}</Link>
              </div>
              {isMod(user) && (
                <div className="my-1 border-t border-line pt-1">
                  <Link href="/admin/reports" className={item}>Reports</Link>
                  <Link href="/admin/members" className={item}>Members</Link>
                  {isStaff(user) && <Link href="/admin/categories" className={item}>Categories</Link>}
                </div>
              )}
              <form action={logout} className="mt-1 border-t border-line pt-1">
                <button className="block w-full px-3 py-1.5 text-left hover:bg-[#1a1a1e]">Sign out</button>
              </form>
            </div>
          </details>
        ) : (
          <div className="flex gap-2">
            <Link href="/login" className="btn-ghost">Sign in</Link>
            <Link href="/register" className="btn-primary">Register</Link>
          </div>
        )}
      </div>
    </header>
  );
}
