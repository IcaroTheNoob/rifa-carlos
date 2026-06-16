import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(request: Request) {
  const body = await request.json();
  const { percent, quantidade } = body;

  if (!percent || !quantidade) {
    return NextResponse.json({ error: 'percent e quantidade são obrigatórios' }, { status: 400 });
  }

  const rifas = await sql`SELECT * FROM rifas WHERE status = 'ativa' LIMIT 1`;
  if (rifas.length === 0) {
    return NextResponse.json({ error: 'Nenhuma rifa ativa' }, { status: 404 });
  }

  const rifa = rifas[0] as any;

  await sql`
    UPDATE rifas SET
      auto_expand_percent = ${percent},
      auto_expand_qtd = ${quantidade}
    WHERE id = ${rifa.id}
  `;

  return NextResponse.json({ success: true });
}
