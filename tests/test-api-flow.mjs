import { chromium } from "playwright";

const BASE = "https://rifa-carlos.vercel.app";
const SENHA = "Br@cinho2026";

let ok = 0, fail = 0;

function assert(condition, msg) {
  if (condition) { ok++; console.log(`  ✅ ${msg}`); }
  else { fail++; console.log(`  ❌ ${msg}`); }
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

async function run() {
  // ── Flow 1: Reserve numbers via API ──
  console.log("\n🌐 Flow 1: Reservar números via API");
  const { status, ok: ok1, data: data1 } = await apiFetch("/api/reservar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cliente_nome: "QA Teste",
      cliente_telefone: "11988887777",
      numeros: [42, 77, 99],
    }),
  });
  
  // Check field names
  const reqBody = { cliente_nome: "QA Teste", cliente_telefone: "11988887777", numeros: [42, 77, 99] };
  console.log("  ℹ️  Enviado:", JSON.stringify(reqBody));
  console.log("  ℹ️  Resposta:", JSON.stringify(data1));
  assert(data1.error === "Nome, telefone e números são obrigatórios", "API espera 'nome' e 'telefone' (não 'cliente_nome')");
  // This is expected - the API uses 'nome' and 'telefone' fields

  // ── Flow 1b: Correct field names ──
  console.log("\n🌐 Flow 1b: Reservar com campos corretos");
  const r2 = await apiFetch("/api/reservar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome: "QA Teste", telefone: "11988887777", numeros: [42, 77, 99] }),
  });
  assert(r2.ok, `Reserva retornou status ${r2.status}`);
  assert(r2.data.success === true, "Reserva bem-sucedida");
  assert(r2.data.pedidoId, "Pedido ID gerado");
  const pedidoId = r2.data.pedidoId;
  console.log(`  ℹ️  Pedido ID: ${pedidoId}`);

  // ── Flow 2: Anti-collision ──
  console.log("\n🛡️ Flow 2: Anti-collision");
  const r3 = await apiFetch("/api/reservar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome: "QA Concorrente", telefone: "11966665555", numeros: [42, 77] }),
  });
  assert(!r3.ok && r3.status === 409, `Retornou 409 (status: ${r3.status})`);
  assert(r3.data.error, "Mensagem de erro presente");

  // ── Flow 3: Admin check ──
  console.log("\n🔐 Flow 3: Admin - verificar status");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/painel-admin`, { waitUntil: "networkidle" });
  await page.locator("input[type=password]").fill(SENHA);
  await page.locator("button:has-text('Entrar')").click();
  await page.waitForTimeout(1500);

  const tableRows = page.locator("table:has(th:has-text('Nº')) tbody tr");
  const rowCount = await tableRows.count();
  let found42 = false, found77 = false, found99 = false;
  for (let i = 0; i < rowCount; i++) {
    const rowText = await tableRows.nth(i).textContent();
    if (rowText.includes("042") && rowText.includes("reservado")) found42 = true;
    if (rowText.includes("077") && rowText.includes("reservado")) found77 = true;
    if (rowText.includes("099") && rowText.includes("reservado")) found99 = true;
  }
  assert(found42, "Número 042 como reservado na tabela");
  assert(found77, "Número 077 como reservado na tabela");
  assert(found99, "Número 099 como reservado na tabela");

  // ── Flow 4: Confirm payment ──
  console.log("\n✅ Flow 4: Confirmar pagamento");
  const r4 = await apiFetch("/api/admin/confirmar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pedidoId }),
  });
  assert(r4.ok, `Pagamento confirmado (${r4.status})`);

  // ── Flow 5: Verify payment confirmed ──
  console.log("\n🔄 Flow 5: Verificar pago");
  await page.goto(`${BASE}/painel-admin`, { waitUntil: "networkidle" });
  await page.locator("input[type=password]").fill(SENHA);
  await page.locator("button:has-text('Entrar')").click();
  await page.waitForTimeout(1500);

  const tableRows2 = page.locator("table:has(th:has-text('Nº')) tbody tr");
  const rc2 = await tableRows2.count();
  let found42pago = false;
  for (let i = 0; i < rc2; i++) {
    if ((await tableRows2.nth(i).textContent()).includes("042") && 
        (await tableRows2.nth(i).textContent()).includes("pago")) found42pago = true;
  }
  assert(found42pago, "Número 042 como pago após confirmação");

  // ── Flow 6: Release number ──
  console.log("\n🔄 Flow 6: Liberar número");
  const adminRes = await fetch(`${BASE}/api/admin/numeros`);
  const adminData = await adminRes.json();
  const num42 = adminData.numeros.find(n => n.numero === 42);
  assert(num42 !== undefined, "Número 042 encontrado na API admin");

  const r6 = await apiFetch("/api/admin/liberar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ numeroId: num42.id }),
  });
  assert(r6.ok, `Liberação (${r6.status})`);

  // ── Flow 7: Verify released ──
  console.log("\n🔄 Flow 7: Verificar liberado");
  await page.goto(`${BASE}/painel-admin`, { waitUntil: "networkidle" });
  await page.locator("input[type=password]").fill(SENHA);
  await page.locator("button:has-text('Entrar')").click();
  await page.waitForTimeout(1500);

  const tableRows3 = page.locator("table:has(th:has-text('Nº')) tbody tr");
  const rc3 = await tableRows3.count();
  let found42disp = false;
  for (let i = 0; i < rc3; i++) {
    if ((await tableRows3.nth(i).textContent()).includes("042") && 
        (await tableRows3.nth(i).textContent()).includes("disponivel")) found42disp = true;
  }
  assert(found42disp, "Número 042 disponível após liberação");

  // ── Summary ──
  console.log(`\n${"=".repeat(40)}`);
  console.log(`API Flow: ${ok} passaram, ${fail} falharam`);
  console.log(`${"=".repeat(40)}`);

  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
}

run().catch(err => { console.error("Fatal:", err); process.exit(1); });
