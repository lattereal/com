import postgres from 'postgres';

const g = globalThis;
export const sql =
  g.__sql ||
  (g.__sql = postgres(process.env.DATABASE_URL, {
    ssl: process.env.DATABASE_SSL === 'off' ? false : 'require',
    max: 5,
    prepare: false, // required for Neon/Supabase poolers
  }));
