import fs from 'node:fs';
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });
await sql.unsafe(fs.readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
console.log('Schema applied.');
await sql.end();
