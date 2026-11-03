'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { logout } from '@/app/actions';
import Avatar from './Avatar';
import { nameOf } from '@/lib/util';

export default function AccountMenu({ user, isModerator, isStaffMember }) {
  const menu = useRef(null);
  const close = () => { if (menu.current) menu.current.open = false; };
  const item = 'block px-3 py-2 text-sm text-muted transition-colors hover:bg-[#1a1a1e] hover:text-fg';
  return (
    <details ref={menu} className="relative">
      <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-md border border-line px-2.5 hover:bg-[#1a1a1e]">
        <Avatar user={user} size={24} />
        <span className="hidden max-w-[100px] truncate text-[13px] sm:inline">{nameOf(user)}</span>
        <span className="text-muted">⌄</span>
      </summary>
      <div className="absolute right-0 mt-2 w-52 rounded-lg border border-line bg-surface py-1 shadow-xl">
        <Link href={`/u/${user.username}`} onClick={close} className={item}>My profile</Link>
        <Link href="/settings" onClick={close} className={item}>Settings</Link>
        {isModerator && <div className="my-1 border-t border-line pt-1">
          <Link href="/admin/reports" onClick={close} className={item}>Reports</Link>
          <Link href="/admin/members" onClick={close} className={item}>Members</Link>
          {isStaffMember && <><Link href="/admin/categories" onClick={close} className={item}>Categories</Link><Link href="/admin/announcements" onClick={close} className={item}>Announcement</Link></>}
        </div>}
        <form action={logout} className="mt-1 border-t border-line pt-1">
          <button onClick={close} className={`${item} w-full text-left`}>Sign out</button>
        </form>
      </div>
    </details>
  );
}
