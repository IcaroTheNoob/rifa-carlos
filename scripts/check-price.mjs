import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

const rifa = await sql`SELECT id, titulo, valor_numero, total_numeros, whatsapp, status FROM rifas`;
console.log(JSON.stringify(rifa, null, 2));

// Update price to 5
await sql`UPDATE rifas SET valor_numero = 5 WHERE id = 1`;
console.log('Preço atualizado para R$ 5,00');

const rifa2 = await sql`SELECT id, titulo, valor_numero, total_numeros, whatsapp, status FROM rifas`;
console.log(JSON.stringify(rifa2, null, 2));
