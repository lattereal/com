'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { getUser, currentMember, createSession, destroySession, clientIp, ipLockHash } from '@/lib/auth';
import { limit } from '@/lib/ratelimit';
import { isMod, outranks } from '@/lib/roles';
import { UUID } from '@/lib/util';

const USERNAME = /^[a-z0-9_]{3,20}$/;
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);
const str = (fd, k) => String(fd.get(k) ?? '');

/* ---------- auth: username + password only, one account per network ---------- */

export async function register(_, fd) {
  if (!limit(`reg:${clientIp()}`, 5, 60 * 60 * 1000))
    return { error: 'Too many sign-up attempts from this network. Try again in an hour.' };

  const username = str(fd, 'username').trim().toLowerCase();
  const password = str(fd, 'password');
  if (!USERNAME.test(username))
    return { error: 'Username must be 3–20 characters: lowercase letters, numbers and underscores.' };
  if (password.length < 8 || password.length > 200) return { error: 'Password must be at least 8 characters.' };

  try {
    const hash = await bcrypt.hash(password, 12);
    // The very first account becomes the owner.
    const [u] = await sql`
      insert into users (username, password_hash, ip_hash, role)
      values (${username}, ${hash}, ${ipLockHash()},
              case when exists (select 1 from users where role = 'owner') then 'member' else 'owner' end)
      returning id`;
    await createSession(u.id);
  } catch (e) {
    if (e.code === '23505')
      return {
        error:
          e.constraint_name === 'users_ip_hash_key'
            ? 'This network already has an account. Only one profile per IP is allowed.'
            : 'That username is already taken.',
      };
    console.error(e);
    return { error: 'Something went wrong. Try again.' };
  }
  redirect('/');
}

export async function login(_, fd) {
  const username = str(fd, 'username').trim().toLowerCase();
  if (!limit(`login:${clientIp()}`, 8, 10 * 60 * 1000) || !limit(`loginu:${username}`, 10, 10 * 60 * 1000))
    return { error: 'Too many attempts. Try again in a few minutes.' };

  const password = str(fd, 'password');
  const [u] = await sql`select id, password_hash from users where username = ${username}`;
  const ok = await bcrypt.compare(password, u?.password_hash || DUMMY_HASH);
  if (!u || !ok) return { error: 'Incorrect username or password.' };

  await createSession(u.id);
  redirect('/');
}

export async function logout() {
  destroySession();
  redirect('/');
}

export async function changePassword(_, fd) {
  const user = await currentMember();
  if (!user) return { error: 'Sign in first.' };
  if (!limit(`pw:${user.id}`, 5, 10 * 60 * 1000)) return { error: 'Too many attempts. Try again later.' };

  const current = str(fd, 'current');
  const next = str(fd, 'next');
  if (next.length < 8 || next.length > 200) return { error: 'New password must be at least 8 characters.' };
  const [row] = await sql`select password_hash from users where id = ${user.id}`;
  if (!(await bcrypt.compare(current, row.password_hash))) return { error: 'Current password is incorrect.' };

  await sql`update users set password_hash = ${await bcrypt.hash(next, 12)} where id = ${user.id}`;
  return { ok: true, message: 'Password updated.' };
}

/* ---------- posting ---------- */

function canPost(user) {
  if (!user) return 'Sign in to post.';
  if (user.is_banned) return 'Your account has been suspended.';
  if (!limit(`post:${user.id}`, 5, 60 * 1000)) return 'Too many requests. Wait a minute and try again.';
  return null;
}

export async function createThread(_, fd) {
  const user = await getUser();
  const err = canPost(user);
  if (err) return { error: err };

  const title = str(fd, 'title').trim();
  const content = str(fd, 'content').trim();
  if (title.length < 3 || title.length > 200) return { error: 'Title must be 3–200 characters.' };
  if (!content || content.length > 20000) return { error: 'Body must be 1–20,000 characters.' };

  const [board] = await sql`select id from boards where slug = ${str(fd, 'slug')}`;
  if (!board) return { error: 'Board not found.' };

  const [t] = await sql`
    insert into threads (board_id, author_id, title, content)
    values (${board.id}, ${user.id}, ${title}, ${content}) returning id`;
  redirect(`/t/${t.id}`);
}

export async function createPost(_, fd) {
  const user = await getUser();
  const err = canPost(user);
  if (err) return { error: err };

  const threadId = Number(fd.get('thread'));
  const content = str(fd, 'content').trim();
  if (!content || content.length > 20000) return { error: 'Reply must be 1–20,000 characters.' };

  const [t] = await sql`select id, locked from threads where id = ${threadId}`;
  if (!t) return { error: 'Thread not found.' };
  if (t.locked && !isMod(user)) return { error: 'This thread is locked.' };

  await sql`insert into posts (thread_id, author_id, content) values (${t.id}, ${user.id}, ${content})`;
  await sql`update threads set updated_at = now() where id = ${t.id}`;
  revalidatePath(`/t/${t.id}`);
  return { ok: true };
}

/* ---------- moderation (mod, co-owner, owner) ---------- */

export async function report(fd) {
  const user = await getUser();
  if (!user) redirect('/login');
  if (user.is_banned || !limit(`report:${user.id}`, 5, 60 * 1000)) return;

  const type = str(fd, 'type');
  const id = Number(fd.get('id'));
  const thread = Number(fd.get('thread'));
  if (!['thread', 'post'].includes(type) || !id) return;

  await sql`insert into reports (reporter_id, target_type, target_id, reason)
            values (${user.id}, ${type}, ${id}, ${str(fd, 'reason').slice(0, 500)})`;
  redirect(`/t/${thread}?reported=1`);
}

export async function modAction(fd) {
  const actor = await getUser();
  if (!isMod(actor)) return;

  const op = str(fd, 'op');
  const id = Number(fd.get('id'));
  const uid = str(fd, 'uid');

  if (op === 'thread-pin' || op === 'thread-unpin')
    await sql`update threads set pinned = ${op === 'thread-pin'} where id = ${id}`;
  else if (op === 'thread-lock' || op === 'thread-unlock')
    await sql`update threads set locked = ${op === 'thread-lock'} where id = ${id}`;
  else if (op === 'thread-delete') {
    await sql`delete from threads where id = ${id}`;
    await sql`update reports set resolved = true where target_type = 'thread' and target_id = ${id}`;
  } else if (op === 'post-delete') {
    await sql`delete from posts where id = ${id}`;
    await sql`update reports set resolved = true where target_type = 'post' and target_id = ${id}`;
  } else if ((op === 'user-ban' || op === 'user-unban') && UUID.test(uid)) {
    // you can only moderate people who rank below you
    const [target] = await sql`select role from users where id = ${uid}`;
    if (target && outranks(actor, target))
      await sql`update users set is_banned = ${op === 'user-ban'} where id = ${uid}`;
  }

  const reportId = Number(fd.get('report'));
  if (reportId) await sql`update reports set resolved = true where id = ${reportId}`;

  revalidatePath('/', 'layout');
  const next = str(fd, 'next');
  if (next.startsWith('/') && !next.startsWith('//')) redirect(next);
}
