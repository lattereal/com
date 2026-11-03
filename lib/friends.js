import { sql } from './db';

// Relationship of `me` to `other`: { status: 'none' | 'friends' | 'sent' | 'received', id }
export async function friendState(me, other) {
  if (!me || !other || me === other) return { status: 'none' };
  const [f] = await sql`
    select id, requester_id, status from friendships
    where (requester_id = ${me} and addressee_id = ${other}) or (requester_id = ${other} and addressee_id = ${me})`;
  if (!f) return { status: 'none' };
  if (f.status === 'accepted') return { status: 'friends', id: f.id };
  return { status: f.requester_id === me ? 'sent' : 'received', id: f.id };
}
