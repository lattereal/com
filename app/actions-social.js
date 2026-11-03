'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { currentMember, addUnlock, clientIp } from '@/lib/auth';
import { limitPersistent } from '@/lib/ratelimit';
import { saveMedia } from '@/lib/media';
import { isMod, userRoles } from '@/lib/roles';
import { ACCENTS, UUID, cleanLine, cleanText } from '@/lib/util';

const str = (fd, k) => String(fd.get(k) ?? '');
const MB = 1024 * 1024;

/* ---------- friends ---------- */

async function addFriendInner(me, rawName) {
  const username = rawName.trim().toLowerCase().replace(/^@/, '');
  if (!await limitPersistent(`friend:${me.id}`, 10, 60 * 1000)) return { error: 'Slow down a little.' };
  const [t] = await sql`select id, username from users where username = ${username} and not is_banned`;
  if (!t) return { error: 'No member with that username.' };
  if (t.id === me.id) return { error: "You can't add yourself." };

  const [f] = await sql`
    select id, requester_id, status from friendships
    where (requester_id = ${me.id} and addressee_id = ${t.id}) or (requester_id = ${t.id} and addressee_id = ${me.id})`;
  if (f) {
    if (f.status === 'accepted') return { error: `You and @${t.username} are already friends.` };
    if (f.requester_id === me.id) return { error: `You already sent @${t.username} a request.` };
    await sql`update friendships set status = 'accepted' where id = ${f.id}`; // they asked first: just accept
    return { ok: true, message: `You and @${t.username} are now friends.`, username: t.username };
  }
  try {
    await sql`insert into friendships (requester_id, addressee_id) values (${me.id}, ${t.id})`;
  } catch (e) {
    if (e.code !== '23505') throw e;
  }
  return { ok: true, message: `Friend request sent to @${t.username}.`, username: t.username };
}

export async function addFriend(_, fd) {
  const me = await currentMember();
  if (!me) return { error: 'Sign in first.' };
  const r = await addFriendInner(me, str(fd, 'username'));
  revalidatePath('/friends');
  return r;
}

// Plain-button actions: add (from a profile), accept, decline, cancel, remove
export async function friendOp(fd) {
  const me = await currentMember();
  if (!me) return;
  if (!await limitPersistent(`friend-op:${me.id}`, 20, 60 * 1000)) return;
  const op = str(fd, 'op');
  const id = Number(fd.get('id'));

  if (op === 'add') await addFriendInner(me, str(fd, 'username'));
  else if (op === 'accept')
    await sql`update friendships set status = 'accepted' where id = ${id} and addressee_id = ${me.id} and status = 'pending'`;
  else if (op === 'decline' || op === 'cancel' || op === 'remove')
    await sql`delete from friendships where id = ${id} and (requester_id = ${me.id} or addressee_id = ${me.id})`;

  revalidatePath('/', 'layout');
}

/* ---------- profile ---------- */

const PREMIUM_ROLES = ['rich', 'respected', 'known', 'owner'];
const PREMIUM_EFFECTS = ['sparkle', 'glow', 'gradient', 'shimmer', 'none'];
const PREMIUM_THEMES = ['default', 'midnight', 'rose', 'forest', 'ocean'];
const SOCIAL_FIELDS = ['website', 'discord', 'github', 'telegram', 'instagram', 'youtube', 'tiktok', 'x'];

export async function savePremiumProfile(_, fd) {
  const me = await currentMember();
  if (!me) return { error: 'Sign in first.' };
  if (!userRoles(me).some((r) => PREMIUM_ROLES.includes(r))) return { error: 'This customization is available to Rich, Respected, and Known members.' };
  if (!await limitPersistent(`premium-prof:${me.id}`, 6, 60 * 1000)) return { error: 'Slow down a little.' };

  const rawColor = str(fd, 'name_color').trim();
  const nameColor = /^#[0-9a-fA-F]{6}$/.test(rawColor) ? rawColor : '#ff3b3b';
  const effect = PREMIUM_EFFECTS.includes(str(fd, 'name_effect')) ? str(fd, 'name_effect') : 'sparkle';
  const theme = PREMIUM_THEMES.includes(str(fd, 'profile_theme')) ? str(fd, 'profile_theme') : 'default';
  const socials = {};
  for (const field of SOCIAL_FIELDS) {
    const raw = cleanLine(str(fd, `social_${field}`), 200);
    if (!raw) continue;
    try {
      const url = new URL(raw.startsWith('https://') || raw.startsWith('http://') ? raw : `https://${raw}`);
      if (!['https:', 'http:'].includes(url.protocol)) continue;
      socials[field] = url.toString();
    } catch {}
  }
  await sql`update users set name_color = ${nameColor}, name_effect = ${effect}, profile_theme = ${theme}, socials = ${JSON.stringify(socials)}::jsonb where id = ${me.id}`;
  revalidatePath('/settings');
  revalidatePath(`/u/${me.username}`);
  return { ok: true, message: 'Premium profile settings saved.' };
}


export async function saveProfile(_, fd) {
  const me = await currentMember();
  if (!me) return { error: 'Sign in first.' };
  if (!await limitPersistent(`prof:${me.id}`, 6, 60 * 1000)) return { error: 'Slow down a little.' };

  const display = cleanLine(str(fd, 'display_name'), 32) || null;
  const bio = cleanText(str(fd, 'bio'), 500);
  const accent = ACCENTS.includes(str(fd, 'accent')) ? str(fd, 'accent') : me.accent;
  await sql`update users set display_name = ${display}, bio = ${bio}, accent = ${accent} where id = ${me.id}`;
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Profile saved.' };
}

export async function setAvatar(_, fd) {
  const me = await currentMember();
  if (!me) return { error: 'Sign in first.' };
  if (!await limitPersistent(`profile-media:${me.id}`, 5, 60 * 1000)) return { error: 'Slow down a little.' };

  const r = await saveMedia(fd.get('file'), me.id, ['image'], 2 * MB);
  if (r.error) return r;
  const [old] = await sql`select avatar_id from users where id = ${me.id}`;
  await sql`update users set avatar_id = ${r.id} where id = ${me.id}`;
  if (old?.avatar_id) await sql`delete from media where id = ${old.avatar_id}`;
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Photo updated.' };
}

export async function removeAvatar() {
  const me = await currentMember();
  if (!me) return;
  if (!await limitPersistent(`profile-media:${me.id}`, 5, 60 * 1000)) return;
  const [old] = await sql`select avatar_id from users where id = ${me.id}`;
  await sql`update users set avatar_id = null where id = ${me.id}`;
  if (old?.avatar_id) await sql`delete from media where id = ${old.avatar_id}`;
  revalidatePath('/', 'layout');
}


export async function setBanner(_, fd) {
  const me = await currentMember();
  if (!me) return { error: 'Sign in first.' };
  if (!await limitPersistent(`profile-media:${me.id}`, 5, 60 * 1000)) return { error: 'Slow down a little.' };
  const r = await saveMedia(fd.get('file'), me.id, ['image'], 4 * MB);
  if (r.error) return r;
  const [old] = await sql`select banner_id from users where id = ${me.id}`;
  await sql`update users set banner_id = ${r.id} where id = ${me.id}`;
  if (old?.banner_id) await sql`delete from media where id = ${old.banner_id}`;
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Banner updated.' };
}

export async function removeBanner() {
  const me = await currentMember();
  if (!me) return;
  if (!await limitPersistent(`profile-media:${me.id}`, 5, 60 * 1000)) return;
  const [old] = await sql`select banner_id from users where id = ${me.id}`;
  await sql`update users set banner_id = null where id = ${me.id}`;
  if (old?.banner_id) await sql`delete from media where id = ${old.banner_id}`;
  revalidatePath('/', 'layout');
}

export async function addSong(_, fd) {
  const me = await currentMember();
  if (!me) return { error: 'Sign in first.' };
  if (!await limitPersistent(`profile-media:${me.id}`, 5, 60 * 1000)) return { error: 'Slow down a little.' };

  const title = cleanLine(str(fd, 'title'), 80);
  const artist = cleanLine(str(fd, 'artist'), 60);
  if (!title) return { error: 'Give the song a title.' };
  const [{ n }] = await sql`select count(*)::int as n from profile_songs where user_id = ${me.id}`;
  if (n >= 5) return { error: 'You can have up to 5 songs. Remove one first.' };

  const r = await saveMedia(fd.get('file'), me.id, ['audio']);
  if (r.error) return r;
  await sql`insert into profile_songs (user_id, title, artist, media_id) values (${me.id}, ${title}, ${artist}, ${r.id})`;
  revalidatePath('/settings');
  revalidatePath(`/u/${me.username}`);
  return { ok: true, message: 'Song added.' };
}

export async function deleteSong(fd) {
  const me = await currentMember();
  if (!me) return;
  if (!await limitPersistent(`profile-media:${me.id}`, 5, 60 * 1000)) return;
  await sql`delete from media where id = (select media_id from profile_songs where id = ${Number(fd.get('id'))} and user_id = ${me.id})`;
  revalidatePath('/settings');
  revalidatePath(`/u/${me.username}`);
}

/* ---------- uploads: public, or behind a password ---------- */

export async function createUpload(_, fd) {
  const me = await currentMember();
  if (!me) return { error: 'Sign in first.' };
  if (!await limitPersistent(`profile-media:${me.id}`, 5, 60 * 1000)) return { error: 'Slow down a little.' };

  const title = cleanLine(str(fd, 'title'), 100);
  const description = cleanText(str(fd, 'description'), 500);
  const visibility = str(fd, 'visibility') === 'password' ? 'password' : 'public';
  const password = str(fd, 'password');
  if (!title) return { error: 'Give it a title.' };
  if (visibility === 'password' && (password.length < 4 || password.length > 100))
    return { error: 'Choose a password between 4 and 100 characters.' };

  const [{ n }] = await sql`select count(*)::int as n from uploads where owner_id = ${me.id}`;
  if (n >= 50) return { error: 'You have reached the 50 upload limit. Delete something first.' };

  const r = await saveMedia(fd.get('file'), me.id);
  if (r.error) return r;
  const passHash = visibility === 'password' ? await bcrypt.hash(password, 10) : null;
  const [u] = await sql`
    insert into uploads (owner_id, title, description, media_id, visibility, pass_hash)
    values (${me.id}, ${title}, ${description}, ${r.id}, ${visibility}, ${passHash}) returning id`;
  redirect(`/c/${u.id}`);
}

export async function deleteUpload(fd) {
  const me = await currentMember();
  if (!me) return;
  if (!await limitPersistent(`profile-media:${me.id}`, 5, 60 * 1000)) return;
  const id = str(fd, 'id');
  if (!UUID.test(id)) return;
  // the owner, or a moderator enforcing the rules
  const [row] = await sql`select owner_id, media_id from uploads where id = ${id}`;
  if (!row || (row.owner_id !== me.id && !isMod(me))) return;
  await sql`delete from media where id = ${row.media_id}`; // the upload row goes with it
  revalidatePath('/', 'layout');
  redirect(row.owner_id === me.id ? `/u/${me.username}?tab=content` : '/');
}

export async function unlockContent(_, fd) {
  const id = str(fd, 'id');
  if (!UUID.test(id)) return { error: 'Not found.' };
  if (!await limitPersistent(`unlock:${clientIp()}:${id}`, 5, 10 * 60 * 1000))
    return { error: 'Too many wrong attempts. Try again in a few minutes.' };

  const [c] = await sql`select pass_hash from uploads where id = ${id} and visibility = 'password'`;
  if (!c || !(await bcrypt.compare(str(fd, 'password'), c.pass_hash))) return { error: 'Wrong password.' };
  await addUnlock(id);
  redirect(`/c/${id}`);
}
