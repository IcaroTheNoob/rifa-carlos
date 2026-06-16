import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
console.log('Tabelas:', tables.map(t => t.table_name));

const rifas = await sql`SELECT * FROM rifas`;
console.log('Rifas:', rifas);
