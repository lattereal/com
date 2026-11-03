// Order matters: a higher index outranks a lower one.
// rich / known / respected are cosmetic badges only. Powers start at mod.
export const ROLES = ['member', 'rich', 'known', 'respected', 'mod', 'co_owner', 'owner'];

export const LABEL = {
  member: 'Member',
  rich: 'Rich',
  known: 'Known',
  respected: 'Respected',
  mod: 'Mod',
  co_owner: 'Co-owner',
  owner: 'Owner',
};

export const rank = (role) => Math.max(0, ROLES.indexOf(role));
export const isMod = (u) => !!u && !u.is_banned && rank(u.role) >= rank('mod');
export const isStaff = (u) => !!u && !u.is_banned && rank(u.role) >= rank('co_owner'); // categories, roles, members
export const outranks = (actor, target) => rank(actor?.role) > rank(target?.role ?? target);

// Roles `actor` may hand out: strictly below their own. Nobody can create an owner from the UI.
export const assignable = (actor) =>
  isStaff(actor) ? ROLES.filter((r) => rank(r) < rank(actor.role) && r !== 'owner') : [];
