import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(request: Request) {
  const body = await request.json();
  const { pedidoId } = body;

  if (!pedidoId) {
    return NextResponse.json({ error: 'pedidoId é obrigatório' }, { status: 400 });
  }

  const pedidos = await sql`SELECT * FROM pedidos WHERE id = ${pedidoId} LIMIT 1`;
  if (pedidos.length === 0) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
  }

  const pedido = pedidos[0] as any;

  await sql`
    UPDATE numeros SET status = 'pago'
    WHERE pedido_id = ${pedidoId} AND status = 'reservado'
  `;

  await sql`
    UPDATE pedidos SET status = 'pago'
    WHERE id = ${pedidoId}
  `;

  return NextResponse.json({ success: true });
}
