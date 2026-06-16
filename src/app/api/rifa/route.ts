import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const rifas = await sql`SELECT * FROM rifas WHERE status = 'ativa' LIMIT 1`;
  if (rifas.length === 0) return NextResponse.json({ error: 'Nenhuma rifa ativa' }, { status: 404 });

  const rifa = rifas[0] as any;
  const numeros = await sql`
    SELECT id, numero, status, cliente_nome FROM numeros
    WHERE rifa_id = ${rifa.id}
    ORDER BY numero ASC
  `;

  return NextResponse.json({
    rifa: {
      id: rifa.id,
      titulo: rifa.titulo,
      descricao: rifa.descricao,
      valor_numero: Number(rifa.valor_numero),
      total_numeros: rifa.total_numeros,
      numeros_restantes: rifa.numeros_restantes,
    },
    numeros: numeros.map((n: any) => ({
      id: n.id,
      numero: n.numero,
      status: n.status,
    })),
  });
}
