import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(request: Request) {
  const body = await request.json();
  const { total_numeros, whatsapp } = body;

  const rifas = await sql`SELECT * FROM rifas WHERE status = 'ativa' LIMIT 1`;
  if (rifas.length === 0) {
    return NextResponse.json({ error: 'Nenhuma rifa ativa' }, { status: 404 });
  }

  const rifa = rifas[0] as any;

  if (total_numeros && total_numeros > rifa.total_numeros) {
    const inicio = rifa.total_numeros + 1;

    const novosNumeros = [];
    for (let i = inicio; i <= total_numeros; i++) {
      novosNumeros.push(i);
    }

    for (const num of novosNumeros) {
      await sql`
        INSERT INTO numeros (rifa_id, numero, status)
        VALUES (${rifa.id}, ${num}, 'disponivel')
        ON CONFLICT (rifa_id, numero) DO NOTHING
      `;
    }

    await sql`
      UPDATE rifas SET
        total_numeros = ${total_numeros},
        numeros_restantes = numeros_restantes + ${total_numeros - rifa.total_numeros}
      WHERE id = ${rifa.id}
    `;
  }

  if (whatsapp !== undefined) {
    await sql`UPDATE rifas SET whatsapp = ${whatsapp} WHERE id = ${rifa.id}`;
  }

  return NextResponse.json({ success: true });
}
