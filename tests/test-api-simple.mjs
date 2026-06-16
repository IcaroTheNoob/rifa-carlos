const BASE = "https://rifa-carlos.vercel.app";

async function main() {
  console.log("1. Testando reserva...");
  const res = await fetch(`${BASE}/api/reservar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome: "QA Test",
      telefone: "11988887777",
      numeros: [42, 77, 99],
    }),
  });
  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Resposta:", JSON.stringify(data, null, 2));

  if (res.ok) {
    console.log("\n2. Verificando admin...");
    const res2 = await fetch(`${BASE}/api/admin/numeros`);
    const data2 = await res2.json();
    const nums = data2.numeros.filter(n => [42, 77, 99].includes(n.numero));
    console.log("Números reservados:", nums.map(n => ({ numero: n.numero, status: n.status, nome: n.cliente_nome })));

    console.log("\n3. Confirmando pagamento...");
    const res3 = await fetch(`${BASE}/api/admin/confirmar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pedidoId: data.pedidoId }),
    });
    console.log("Status:", res3.status);
    const data3 = await res3.json();
    console.log("Resposta:", JSON.stringify(data3));

    console.log("\n4. Verificando após confirmação...");
    const res4 = await fetch(`${BASE}/api/admin/numeros`);
    const data4 = await res4.json();
    const nums4 = data4.numeros.filter(n => [42, 77, 99].includes(n.numero));
    console.log("Números após confirmação:", nums4.map(n => ({ numero: n.numero, status: n.status })));
  }
}

main().catch(console.error);
