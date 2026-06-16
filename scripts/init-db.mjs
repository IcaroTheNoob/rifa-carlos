import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

const sql = neon(process.env.DATABASE_URL);
const initSql = readFileSync('sql/init.sql', 'utf8');

const statements = initSql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0);

for (const stmt of statements) {
  try {
    await sql.unsafe(stmt + ';');
    console.log('OK:', stmt.substring(0, 60));
  } catch (e) {
    console.error('ERRO:', e.message);
  }
}

console.log('Banco inicializado!');
