// Role order controls permission hierarchy. Cosmetic roles do not grant powers.
export const ROLES = ['member', 'rich', 'known', 'respected', 'mod', 'co_owner', 'owner'];
export const LABEL = {
  member: 'Member', rich: 'Rich', known: 'Known', respected: 'Respected',
  mod: 'Moderator', co_owner: 'Co-owner', owner: 'Owner',
};
export const userRoles = (u) => {
  const values = [...(Array.isArray(u?.roles) ? u.roles : []), u?.role || 'member'];
  return [...new Set(values.filter((r) => ROLES.includes(r)))];
};
export const rank = (role) => Math.max(0, ROLES.indexOf(role));
export const topRole = (u) => userRoles(u).reduce((best, r) => rank(r) > rank(best) ? r : best, 'member');
export const userRank = (u) => Math.max(...userRoles(u).map(rank), 0);
export const hasRole = (u, role) => userRoles(u).includes(role);
export const isMod = (u) => !!u && !u.is_banned && userRank(u) >= rank('mod');
export const isStaff = (u) => !!u && !u.is_banned && userRank(u) >= rank('co_owner');
export const outranks = (actor, target) => userRank(actor) > (typeof target === 'string' ? rank(target) : userRank(target));
// Nobody can assign owner through the interface. An owner can assign all other roles.
export const assignable = (actor) => isStaff(actor) ? ROLES.filter((r) => r !== 'owner' && rank(r) < userRank(actor)) : [];
