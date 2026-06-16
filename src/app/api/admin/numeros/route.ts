import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const rifas = await sql`SELECT * FROM rifas WHERE status = 'ativa' LIMIT 1`;
  if (rifas.length === 0) return NextResponse.json({ error: 'Nenhuma rifa ativa' }, { status: 404 });

  const rifa = rifas[0] as any;

  const numeros = await sql`
    SELECT id, numero, status, cliente_nome, cliente_telefone, pedido_id, reservado_em
    FROM numeros WHERE rifa_id = ${rifa.id}
    ORDER BY numero ASC
  `;

  const pedidos = await sql`
    SELECT * FROM pedidos WHERE rifa_id = ${rifa.id} ORDER BY created_at DESC
  `;

  return NextResponse.json({
    rifa: {
      id: rifa.id,
      titulo: rifa.titulo,
      valor_numero: Number(rifa.valor_numero),
      total_numeros: rifa.total_numeros,
      numeros_restantes: rifa.numeros_restantes,
      auto_expand_percent: rifa.auto_expand_percent,
      auto_expand_qtd: rifa.auto_expand_qtd,
      whatsapp: rifa.whatsapp,
    },
    numeros: numeros.map((n: any) => ({
      id: n.id,
      numero: n.numero,
      status: n.status,
      cliente_nome: n.cliente_nome,
      cliente_telefone: n.cliente_telefone,
      pedido_id: n.pedido_id,
      reservado_em: n.reservado_em,
    })),
    pedidos: pedidos.map((p: any) => ({
      id: p.id,
      cliente_nome: p.cliente_nome,
      cliente_telefone: p.cliente_telefone,
      numeros: p.numeros,
      quantidade: p.quantidade,
      valor_total: Number(p.valor_total),
      status: p.status,
      created_at: p.created_at,
    })),
  });
}
