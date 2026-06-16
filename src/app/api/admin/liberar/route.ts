import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(request: Request) {
  const body = await request.json();
  const { numeroId } = body;

  if (!numeroId) {
    return NextResponse.json({ error: 'numeroId é obrigatório' }, { status: 400 });
  }

  const nums = await sql`SELECT * FROM numeros WHERE id = ${numeroId} LIMIT 1`;

  if (nums.length === 0) {
    return NextResponse.json({ error: 'Número não encontrado' }, { status: 404 });
  }

  const num = nums[0] as any;
  const pedidoId = num.pedido_id;

  await sql`
    UPDATE numeros SET
      status = 'disponivel',
      cliente_nome = NULL,
      cliente_telefone = NULL,
      pedido_id = NULL,
      reservado_em = NULL
    WHERE id = ${numeroId}
  `;

  if (pedidoId) {
    const restantes = await sql`
      SELECT COUNT(*) as count FROM numeros
      WHERE pedido_id = ${pedidoId} AND status != 'disponivel'
    `;
    const count = (restantes[0] as any).count;

    if (count === 0) {
      await sql`UPDATE pedidos SET status = 'cancelado' WHERE id = ${pedidoId}`;
    }
  }

  return NextResponse.json({ success: true });
}
