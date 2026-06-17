import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const rifas = await sql`SELECT * FROM rifas WHERE status = 'ativa' LIMIT 1`;
  if (rifas.length === 0) {
    return NextResponse.json({ error: 'Nenhuma rifa ativa' }, { status: 404 });
  }

  const rifa = rifas[0] as any;

  const pagos = await sql`
    SELECT n.numero, n.cliente_nome, n.cliente_telefone, n.reservado_em
    FROM numeros n
    WHERE n.rifa_id = ${rifa.id}
    AND n.status = 'pago'
    ORDER BY n.numero ASC
  `;

  return NextResponse.json({
    rifa: {
      titulo: rifa.titulo,
      descricao: rifa.descricao,
      valor_numero: Number(rifa.valor_numero),
      total_numeros: rifa.total_numeros,
    },
    total_pagos: pagos.length,
    numeros_pagos: pagos.map((n: any) => ({
      numero: n.numero,
      cliente: n.cliente_nome,
      telefone: n.cliente_telefone,
    })),
  });
}
