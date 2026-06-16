import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(request: Request) {
  const body = await request.json();
  const { nome, telefone, numeros: numerosIds } = body;

  if (!nome || !telefone || !numerosIds?.length) {
    return NextResponse.json({ error: 'Nome, telefone e números são obrigatórios' }, { status: 400 });
  }

  const rifas = await sql`SELECT * FROM rifas WHERE status = 'ativa' LIMIT 1`;
  if (rifas.length === 0) {
    return NextResponse.json({ error: 'Nenhuma rifa ativa' }, { status: 400 });
  }

  const rifa = rifas[0] as any;

  const jaReservados = await sql`
    SELECT numero FROM numeros
    WHERE rifa_id = ${rifa.id}
    AND numero = ANY(${numerosIds}::int[])
    AND status != 'disponivel'
  `;

  if (jaReservados.length > 0) {
    const ocupados = jaReservados.map((n: any) => n.numero);
    return NextResponse.json({
      error: `Número(s) já reservado(s): ${ocupados.join(', ')}`,
      ocupados,
    }, { status: 409 });
  }

  const pedidoId = crypto.randomUUID();

  await sql`
    UPDATE numeros SET
      status = 'reservado',
      cliente_nome = ${nome},
      cliente_telefone = ${telefone},
      pedido_id = ${pedidoId},
      reservado_em = NOW()
    WHERE rifa_id = ${rifa.id}
    AND numero = ANY(${numerosIds}::int[])
    AND status = 'disponivel'
  `;

  const updatedRows = await sql`
    SELECT COUNT(*) as count FROM numeros
    WHERE rifa_id = ${rifa.id}
    AND numero = ANY(${numerosIds}::int[])
    AND status = 'reservado'
    AND pedido_id = ${pedidoId}
  `;

  const confirmed = (updatedRows[0] as any).count;

  if (confirmed !== numerosIds.length) {
    await sql`
      UPDATE numeros SET
        status = 'disponivel',
        cliente_nome = NULL,
        cliente_telefone = NULL,
        pedido_id = NULL,
        reservado_em = NULL
      WHERE pedido_id = ${pedidoId}
    `;
    return NextResponse.json({ error: 'Conflito ao reservar. Tente novamente.' }, { status: 409 });
  }

  const valorTotal = Number(rifa.valor_numero) * numerosIds.length;

  const rifas2 = await sql`SELECT whatsapp FROM rifas WHERE id = ${rifa.id} LIMIT 1`;
  const whatsapp = (rifas2[0] as any)?.whatsapp || '';

  await sql`
    INSERT INTO pedidos (id, rifa_id, cliente_nome, cliente_telefone, numeros, quantidade, valor_total, status)
    VALUES (${pedidoId}, ${rifa.id}, ${nome}, ${telefone}, ${numerosIds}::int[], ${numerosIds.length}, ${valorTotal}, 'reservado')
  `;

  const numerosStr = numerosIds.join(', ');
  const mensagem = encodeURIComponent(
    `Olá, sou ${nome} e escolhi os números: ${numerosStr}.\n` +
    `Poderia me passar a chave PIX para que eu faça o pagamento e garanta minha reserva?`
  );

  return NextResponse.json({
    success: true,
    pedidoId,
    whatsappLink: `https://wa.me/${whatsapp}?text=${mensagem}`,
    valorTotal,
    numeros: numerosIds,
  });
}
