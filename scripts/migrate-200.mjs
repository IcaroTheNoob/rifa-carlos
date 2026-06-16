import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

// Adicionar números 101 a 200
for (let i = 101; i <= 200; i++) {
  await sql`
    INSERT INTO numeros (rifa_id, numero, status)
    VALUES (1, ${i}, 'disponivel')
    ON CONFLICT (rifa_id, numero) DO NOTHING
  `;
}

await sql`
  UPDATE rifas SET total_numeros = 200, numeros_restantes = 200 WHERE id = 1
`;

console.log('200 números configurados!');
