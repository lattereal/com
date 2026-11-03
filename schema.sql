-- ComForums v2 schema. Safe to run repeatedly, and upgrades a v1 database in place
-- (v1 admins become owners; email columns and the email_tokens table are dropped).

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null check (username ~ '^[a-z0-9_]{3,20}$'),
  password_hash text not null,
  created_at timestamptz not null default now(),
  is_banned boolean not null default false
);

alter table users add column if not exists role text not null default 'member';
alter table users add column if not exists roles text[] not null default array['member']::text[];
alter table users alter column roles set default array['member']::text[];
update users set roles = array[role] where roles is null or (roles = array['member']::text[] and role <> 'member');
create index if not exists users_roles_gin_idx on users using gin (roles);
alter table users add column if not exists display_name text;
alter table users add column if not exists bio text not null default '';
alter table users add column if not exists accent text not null default '#6366f1';
alter table users add column if not exists avatar_id uuid;
alter table users add column if not exists ip_hash text;   -- HMAC of the signup IP, never the raw IP

do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = current_schema() and table_name = 'users' and column_name = 'is_admin') then
    update users set role = 'owner' where is_admin;
  end if;
end $$;

alter table users drop column if exists email;
alter table users drop column if exists email_verified;
alter table users drop column if exists is_admin;
drop table if exists email_tokens;

alter table users drop constraint if exists users_role_check;
alter table users add constraint users_role_check
  check (role in ('member','rich','known','respected','mod','co_owner','owner'));

-- one account per network
create unique index if not exists users_ip_hash_key on users (ip_hash) where ip_hash is not null;

/* ---------- media (avatars, songs, uploads, chat attachments) stored in Postgres ---------- */

create table if not exists media (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  mime text not null,
  size int not null,
  data bytea not null,
  created_at timestamptz not null default now()
);

alter table users drop constraint if exists users_avatar_fk;
alter table users add constraint users_avatar_fk foreign key (avatar_id) references media(id) on delete set null;

/* ---------- categories + boards ---------- */

create table if not exists categories (
  id serial primary key,
  name text unique not null,
  position int not null default 0
);

create table if not exists boards (
  id serial primary key,
  slug text unique not null,
  name text not null,
  description text not null,
  category_id int references categories(id) on delete restrict
);
alter table boards add column if not exists category_id int references categories(id) on delete restrict;

-- v1 stored the category as plain text on each board; convert it
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = current_schema() and table_name = 'boards' and column_name = 'category') then
    insert into categories (name, position)
      select category, (row_number() over (order by min(id)))::int from boards group by category
      on conflict (name) do nothing;
    update boards b set category_id = c.id from categories c where c.name = b.category and b.category_id is null;
    alter table boards drop column category;
  end if;
end $$;

create table if not exists threads (
  id serial primary key,
  board_id int not null references boards(id),
  author_id uuid not null references users(id),
  title text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  locked boolean not null default false,
  pinned boolean not null default false,
  view_count int not null default 0
);

create table if not exists posts (
  id serial primary key,
  thread_id int not null references threads(id) on delete cascade,
  author_id uuid not null references users(id),
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists reports (
  id serial primary key,
  reporter_id uuid not null references users(id),
  target_type text not null check (target_type in ('thread','post')),
  target_id int not null,
  reason text not null default '',
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

/* ---------- profiles ---------- */

create table if not exists profile_tags (
  user_id uuid not null references users(id) on delete cascade,
  tag text not null check (tag ~ '^[a-z0-9_]{2,24}$'),
  primary key (user_id, tag)
);

create table if not exists profile_songs (
  id serial primary key,
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  artist text not null default '',
  media_id uuid not null references media(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- content a member shares from their page: public, or behind a password
create table if not exists uploads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  title text not null,
  description text not null default '',
  media_id uuid not null references media(id) on delete cascade,
  visibility text not null check (visibility in ('public','password')),
  pass_hash text,
  created_at timestamptz not null default now()
);

/* ---------- friends, DMs, chat ---------- */

create table if not exists friendships (
  id serial primary key,
  requester_id uuid not null references users(id) on delete cascade,
  addressee_id uuid not null references users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  check (requester_id <> addressee_id)
);
create unique index if not exists friendships_pair_key
  on friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index if not exists friendships_addressee_idx on friendships (addressee_id, status);

create table if not exists dm_messages (
  id bigserial primary key,
  sender_id uuid not null references users(id) on delete cascade,
  recipient_id uuid not null references users(id) on delete cascade,
  body text not null default '',
  media_id uuid references media(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists dm_pair_idx on dm_messages (recipient_id, sender_id, id);

create table if not exists chat_messages (
  id bigserial primary key,
  room text not null default 'lounge',
  author_id uuid not null references users(id) on delete cascade,
  body text not null default '',
  media_id uuid references media(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists chat_room_idx on chat_messages (room, id);

create index if not exists threads_board_idx on threads (board_id);
create index if not exists threads_author_idx on threads (author_id);
create index if not exists posts_thread_idx on posts (thread_id);
create index if not exists posts_author_idx on posts (author_id);
create index if not exists reports_open_idx on reports (resolved, created_at);
create index if not exists profile_tags_tag_idx on profile_tags (tag);
create index if not exists uploads_owner_idx on uploads (owner_id, created_at desc);
create index if not exists media_owner_idx on media (owner_id);

/* ---------- seed (fresh installs only) ---------- */

insert into categories (name, position)
select * from (values ('Community', 1), ('Technical', 2), ('Site', 3)) v(name, position)
where not exists (select 1 from categories);

insert into boards (slug, name, description, category_id)
select v.slug, v.name, v.description, c.id
from (values
  ('general',  'general',  'general discussion, introductions, off-topic', 'Community'),
  ('tech',     'tech',     'software, hardware, systems, tooling',         'Technical'),
  ('security', 'security', 'ctf writeups, research, reverse engineering, bug bounty', 'Technical'),
  ('meta',     'meta',     'site news, feedback, rules',                   'Site')
) v(slug, name, description, cat)
join categories c on c.name = v.cat
where not exists (select 1 from boards);

-- The first account to register becomes the owner automatically.
-- To promote someone by hand:  update users set role = 'owner' where username = 'yourname';
