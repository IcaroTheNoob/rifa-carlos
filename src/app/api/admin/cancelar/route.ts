import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(request: Request) {
  const { pedidoId } = await request.json();
  if (!pedidoId) {
    return NextResponse.json({ error: 'pedidoId é obrigatório' }, { status: 400 });
  }

  const [pedido] = await sql`
    SELECT id, rifa_id FROM pedidos WHERE id = ${pedidoId} AND status = 'reservado'
  `;

  if (!pedido) {
    return NextResponse.json({ error: 'Pedido não encontrado ou já processado' }, { status: 404 });
  }

  await sql`
    UPDATE numeros SET
      status = 'disponivel',
      cliente_nome = NULL,
      cliente_telefone = NULL,
      pedido_id = NULL,
      reservado_em = NULL
    WHERE pedido_id = ${pedidoId}
  `;

  await sql`
    UPDATE pedidos SET status = 'cancelado' WHERE id = ${pedidoId}
  `;

  return NextResponse.json({ success: true });
}
