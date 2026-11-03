import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is required to apply the database migration during the Vercel build.');
}

const sql = postgres(url, {
  ssl: process.env.DATABASE_SSL === 'off' ? false : 'require',
  max: 1,
  prepare: false,
  connect_timeout: 15,
});

try {
  // This is intentionally a small, additive migration. Do not run the full
  // schema.sql during deployment because it also contains legacy cleanup.
  await sql`alter table users add column if not exists roles text[] not null default array['member']::text[]`;
  await sql`update users set roles = array[role]::text[] where roles is null or (roles = array['member']::text[] and role <> 'member')`;
  await sql`create index if not exists users_roles_gin_idx on users using gin (roles)`;
  await sql`alter table users add column if not exists banner_id uuid`;
  await sql`alter table users add column if not exists name_color text not null default ''`;
  await sql`alter table users add column if not exists name_effect text not null default 'none'`;
  await sql`alter table users add column if not exists profile_theme text not null default 'default'`;
  await sql`alter table users add column if not exists socials jsonb not null default '{}'::jsonb`;
  const [bannerFk] = await sql`select exists (select 1 from pg_constraint where conname = 'users_banner_fk') as present`;
  if (!bannerFk.present) {
    await sql.unsafe('alter table users add constraint users_banner_fk foreign key (banner_id) references media(id) on delete set null');
  }
  await sql`create table if not exists rate_limits (key text primary key, window_start timestamptz not null, hits integer not null default 0)`;\n  await sql`create index if not exists rate_limits_window_idx on rate_limits (window_start)`;\n  await sql`create table if not exists site_announcement (id smallint primary key default 1 check (id = 1), message text not null default '', enabled boolean not null default false, updated_at timestamptz not null default now(), updated_by uuid references users(id) on delete set null)`;
  await sql`insert into site_announcement (id, message, enabled) values (1, '', false) on conflict (id) do nothing`;
  console.log('Database migrations complete: roles, banners, profile customization, announcements and shared rate limits are ready.');
} finally {
  await sql.end();
}
