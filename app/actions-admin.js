'use server';

import crypto from 'node:crypto';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { isStaff, assignable, outranks } from '@/lib/roles';
import { UUID, cleanLine } from '@/lib/util';

const str = (fd, k) => String(fd.get(k) ?? '');
const SLUG = /^[a-z0-9-]{2,24}$/;

async function staff() {
  const u = await getUser();
  return isStaff(u) ? u : null;
}

function back(path, msg) {
  revalidatePath('/', 'layout');
  redirect(`${path}?msg=${encodeURIComponent(msg)}`);
}

/* ---------- categories & boards (co-owner, owner) ---------- */

export async function createCategory(_, fd) {
  if (!(await staff())) return { error: 'Not allowed.' };
  const name = cleanLine(str(fd, 'name'), 40);
  if (name.length < 2) return { error: 'Category name must be 2–40 characters.' };
  try {
    await sql`insert into categories (name, position)
              values (${name}, coalesce((select max(position) from categories), 0) + 1)`;
  } catch (e) {
    if (e.code === '23505') return { error: 'A category with that name already exists.' };
    throw e;
  }
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Category added.' };
}

export async function renameCategory(fd) {
  if (!(await staff())) return;
  const name = cleanLine(str(fd, 'name'), 40);
  if (name.length < 2) return back('/admin/categories', 'Category name must be 2–40 characters.');
  try {
    await sql`update categories set name = ${name} where id = ${Number(fd.get('id'))}`;
  } catch (e) {
    if (e.code === '23505') return back('/admin/categories', 'That name is already used.');
    throw e;
  }
  back('/admin/categories', 'Category renamed.');
}

export async function moveCategory(fd) {
  if (!(await staff())) return;
  const id = Number(fd.get('id'));
  const up = str(fd, 'dir') === 'up';
  const cats = await sql`select id from categories order by position, id`;
  const i = cats.findIndex((c) => c.id === id);
  const j = up ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= cats.length) return;
  [cats[i], cats[j]] = [cats[j], cats[i]];
  await sql.begin(async (tx) => {
    for (let k = 0; k < cats.length; k++) await tx`update categories set position = ${k + 1} where id = ${cats[k].id}`;
  });
  back('/admin/categories', 'Order updated.');
}

export async function deleteCategory(fd) {
  if (!(await staff())) return;
  const id = Number(fd.get('id'));
  const [{ n }] = await sql`select count(*)::int as n from boards where category_id = ${id}`;
  if (n) return back('/admin/categories', 'Move or delete the boards in this category first.');
  await sql`delete from categories where id = ${id}`;
  back('/admin/categories', 'Category deleted.');
}

export async function createBoard(_, fd) {
  if (!(await staff())) return { error: 'Not allowed.' };
  const slug = str(fd, 'slug').trim().toLowerCase();
  const name = cleanLine(str(fd, 'name'), 40);
  const description = cleanLine(str(fd, 'description'), 200);
  const categoryId = Number(fd.get('category_id'));
  if (!SLUG.test(slug)) return { error: 'Slug: 2–24 characters, lowercase letters, numbers and dashes.' };
  if (name.length < 2) return { error: 'Board name must be 2–40 characters.' };
  try {
    await sql`insert into boards (slug, name, description, category_id) values (${slug}, ${name}, ${description}, ${categoryId})`;
  } catch (e) {
    if (e.code === '23505') return { error: 'That slug is already used.' };
    if (e.code === '23503') return { error: 'Pick a valid category.' };
    throw e;
  }
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Board created.' };
}

export async function updateBoard(fd) {
  if (!(await staff())) return;
  const name = cleanLine(str(fd, 'name'), 40);
  if (name.length < 2) return back('/admin/categories', 'Board name must be 2–40 characters.');
  await sql`update boards set name = ${name}, description = ${cleanLine(str(fd, 'description'), 200)},
            category_id = ${Number(fd.get('category_id'))} where id = ${Number(fd.get('id'))}`;
  back('/admin/categories', 'Board updated.');
}

export async function deleteBoard(fd) {
  if (!(await staff())) return;
  const id = Number(fd.get('id'));
  const [{ n }] = await sql`select count(*)::int as n from threads where board_id = ${id}`;
  if (n && str(fd, 'confirm') !== 'yes')
    return back('/admin/categories', `That board has ${n} thread(s). Tick "delete threads too" to confirm.`);
  await sql`delete from boards where id = ${id}`; // threads -> posts removed by cascade
  back('/admin/categories', 'Board deleted.');
}

/* ---------- members (co-owner, owner) ---------- */

export async function setRoles(fd) {
  const actor = await staff();
  const uid = str(fd, 'uid');
  if (!actor || !UUID.test(uid)) return;
  const [target] = await sql`select id, role, roles from users where id = ${uid}`;
  if (!target || !outranks(actor, target)) return back('/admin/members', 'You can only change roles for members below your rank.');
  const allowed = assignable(actor);
  const requested = [...new Set(fd.getAll('roles').map(String).filter((r) => allowed.includes(r)))];
  const roles = requested.length ? requested : ['member'];
  const highest = roles.reduce((best, r) => ['member','rich','known','respected','mod','co_owner','owner'].indexOf(r) > ['member','rich','known','respected','mod','co_owner','owner'].indexOf(best) ? r : best, 'member');
  await sql`update users set roles = ${roles}, role = ${highest} where id = ${uid}`;
  back('/admin/members', 'Roles updated.');
}

export async function releaseIp(fd) {
  const actor = await staff();
  const uid = str(fd, 'uid');
  if (!actor || !UUID.test(uid)) return;
  const [target] = await sql`select id, role, roles from users where id = ${uid}`;
  if (!target || !outranks(actor, target)) return back('/admin/members', 'You can only release IP locks for members below your rank.');
  await sql`update users set ip_hash = null where id = ${uid}`;
  back('/admin/members', 'IP lock released. A new account can now register from that network.');
}

export async function resetPassword(_, fd) {
  const actor = await staff();
  const uid = str(fd, 'uid');
  if (!actor || !UUID.test(uid)) return { error: 'Not allowed.' };
  const [t] = await sql`select username, role from users where id = ${uid}`;
  if (!t || !outranks(actor, t)) return { error: 'You can only reset passwords for members below your rank.' };
  const temp = crypto.randomBytes(9).toString('base64url');
  await sql`update users set password_hash = ${await bcrypt.hash(temp, 12)} where id = ${uid}`;
  return { ok: true, message: `Temporary password for @${t.username}: ${temp} (send it privately; they can change it in Settings)` };
}


/* ---------- owner account controls ---------- */
export async function renameMember(fd) {
  const actor = await getUser();
  const uid = str(fd, 'uid');
  const username = str(fd, 'username').trim().toLowerCase();
  if (!actor || !actor.roles?.includes('owner') || !UUID.test(uid)) return;
  if (!/^[a-z0-9_]{3,20}$/.test(username)) return back('/admin/members', 'Username must be 3–20 lowercase letters, numbers or underscores.');
  const [target] = await sql`select id, role, roles from users where id = ${uid}`;
  if (!target || (target.id !== actor.id && ((target.roles || []).includes('owner') || target.role === 'owner'))) return back('/admin/members', 'You cannot rename another owner.');
  if (target.id !== actor.id && !outranks(actor, target)) return back('/admin/members', 'You can only rename members below your rank.');
  try {
    await sql`update users set username = ${username} where id = ${uid}`;
  } catch (e) {
    if (e.code === '23505') return back('/admin/members', 'That username is already taken.');
    throw e;
  }
  revalidatePath('/', 'layout');
  redirect('/admin/members?msg=' + encodeURIComponent('Username updated.'));
}

export async function deleteMember(fd) {
  const actor = await getUser();
  const uid = str(fd, 'uid');
  if (!actor || !actor.roles?.includes('owner') || !UUID.test(uid) || uid === actor.id || str(fd, 'confirm') !== 'DELETE') return;
  const [target] = await sql`select id, role, roles from users where id = ${uid}`;
  if (!target || ((target.roles || []).includes('owner') || target.role === 'owner')) return back('/admin/members', 'Owner accounts cannot be deleted here.');
  await sql.begin(async (tx) => {
    await tx`delete from threads where author_id = ${uid}`;
    await tx`delete from posts where author_id = ${uid}`;
    await tx`delete from reports where reporter_id = ${uid}`;
    await tx`delete from friendships where requester_id = ${uid} or addressee_id = ${uid}`;
    await tx`delete from dm_messages where sender_id = ${uid} or recipient_id = ${uid}`;
    await tx`delete from chat_messages where author_id = ${uid}`;
    await tx`delete from users where id = ${uid}`;
  });
  back('/admin/members', 'Account and associated content deleted.');
}
