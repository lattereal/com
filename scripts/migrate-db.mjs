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
  await sql`do $ begin
    if not exists (select 1 from pg_constraint where conname = 'users_banner_fk') then
      alter table users add constraint users_banner_fk foreign key (banner_id) references media(id) on delete set null;
    end if;
  end $`;
  console.log('Database migrations complete: roles and profile banners are ready.');
} finally {
  await sql.end();
}
