import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

const reservados = await sql`SELECT COUNT(*) as c FROM numeros WHERE status = 'reservado'`;
console.log('Reservados:', reservados[0].c);

const pagos = await sql`SELECT COUNT(*) as c FROM numeros WHERE status = 'pago'`;
console.log('Pagos:', pagos[0].c);

// Liberar todos os números reservados e pagos (testes)
await sql`UPDATE numeros SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, pedido_id = NULL, reservado_em = NULL WHERE status IN ('reservado', 'pago')`;

// Limpar todos os pedidos de teste
await sql`DELETE FROM pedidos`;

console.log('Números de teste liberados!');

const disp = await sql`SELECT COUNT(*) as c FROM numeros WHERE status = 'disponivel'`;
console.log('Disponíveis agora:', disp[0].c);
