-- Multi-role support. Keep users.role as the highest role for backwards compatibility.
alter table users add column if not exists roles text[] not null default array['member']::text[];
update users set roles = array[role] where roles is null or roles = array['member']::text[] and role <> 'member';
create index if not exists users_roles_gin_idx on users using gin (roles);
