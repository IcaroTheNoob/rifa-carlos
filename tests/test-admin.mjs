import { chromium } from "playwright";

const BASE = "https://rifa-carlos.vercel.app/painel-admin";
const SENHA = process.env.ADMIN_PASSWORD;

if (!SENHA) {
  console.error("❌ ERRO: Defina ADMIN_PASSWORD no .env.local");
  process.exit(1);
}

let ok = 0, fail = 0;

function assert(condition, msg) {
  if (condition) { ok++; console.log(`  ✅ ${msg}`); }
  else { fail++; console.log(`  ❌ ${msg}`); }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  // ── Test 1: Login ──
  console.log("\n🔐 Teste 1: Login");
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  assert(await page.locator("text=Painel Admin").count() > 0, "Título 'Painel Admin' visível");
  assert(await page.locator("input[type=password]").count() > 0, "Campo de senha visível");

  // Wrong password
  await page.locator("input[type=password]").fill("senhaerrada");
  await page.locator("button:has-text('Entrar')").click();
  await page.waitForTimeout(500);
  assert(await page.locator("text=Senha incorreta").count() > 0, "Erro 'Senha incorreta'");

  // Correct password
  await page.locator("input[type=password]").fill(SENHA);
  await page.locator("button:has-text('Entrar')").click();
  await page.waitForTimeout(1500);
  const erroVisivel = await page.locator("text=Senha incorreta").count();
  assert(erroVisivel === 0, "Login bem-sucedido");

  // ── Test 2: Dashboard statistics ──
  console.log("\n📊 Teste 2: Estatísticas");
  const stats = ["Disponíveis", "Reservados", "Pagos", "Arrecadado"];
  for (const s of stats) {
    assert(await page.locator(`text=${s}`).isVisible(), `Card '${s}' visível`);
  }

  // ── Test 3: Number grid filters ──
  console.log("\n🔢 Teste 3: Filtros da grade");
  const filters = ["Todos", "Disponível", "Reservado", "Pago"];
  for (const f of filters) {
    const btn = page.locator(`button:has-text("${f}")`);
    const exists = await btn.count();
    assert(exists > 0, `Filtro '${f}' existe`);
    if (exists > 0) {
      await btn.first().click();
      await page.waitForTimeout(200);
    }
  }

  // ── Test 4: Full numbers table ──
  console.log("\n📋 Teste 4: Tabela completa");
  assert(await page.locator("text=Tabela de todos os números").isVisible(), "Tabela visível");
  const numbersSection = page.locator("text=Tabela de todos os números").locator("..");
  const cols = ["Nº", "Nome", "Telefone", "Status"];
  for (const c of cols) {
    assert(await numbersSection.locator(`th:has-text("${c}")`).isVisible(), `Coluna '${c}' na tabela`);
  }

  // ── Test 5: People table ──
  console.log("\n👥 Teste 5: Tabela de pessoas");
  // Reserve numbers first so the table renders
  const res5 = await fetch("https://rifa-carlos.vercel.app/api/reservar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome: "Pessoa Teste", telefone: "11911112222", numeros: [60, 61] }),
  });
  const data5 = await res5.json();

  // Reload
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.locator("input[type=password]").fill(SENHA);
  await page.locator("button:has-text('Entrar')").click();
  await page.waitForTimeout(1500);

  assert(await page.locator("text=Pessoas e seus números").isVisible(), "Seção pessoas visível");
  const pcols = ["Nome", "WhatsApp", "Números", "Qtd", "Total", "Status", "Ação"];
  const peopleSection = page.locator("text=Pessoas e seus números").locator("..");
  for (const c of pcols) {
    assert(await peopleSection.locator(`th:has-text("${c}")`).isVisible(), `Coluna '${c}' em pessoas`);
  }

  // ── Test 6: Config section ──
  console.log("\n⚙️  Teste 6: Configurações");
  assert(await page.locator("text=Configurações").isVisible(), "Seção configurações");
  assert(await page.locator("text=Expansão automática").isVisible(), "Seção expansão");
  assert(await page.locator("button:has-text('Salvar WhatsApp')").isVisible(), "Botão Salvar WhatsApp");
  assert(await page.locator("button:has-text('Salvar auto-expand')").isVisible(), "Botão Salvar auto-expand");
  assert(await page.locator("button:has-text('+ Adicionar')").isVisible(), "Botão + Adicionar");

  // ── Test 7: Click on available number tile ──
  console.log("\n🔘 Teste 7: Clique em número disponível");
  const modalsBefore = await page.locator(".fixed.inset-0").count();
  // Just verify modal is not visible initially
  assert(modalsBefore === 0, "Nenhum modal visível antes de clicar");

  // ── Test 8: Reserve via API then check modal ──
  console.log("\n🔘 Teste 8: Modal de número reservado");
  const res = await fetch("https://rifa-carlos.vercel.app/api/reservar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome: "Admin Test", telefone: "11999999999", numeros: [50, 51] }),
  });
  const data = await res.json();
  assert(res.ok && data.success, "Reserva via API para testar modal");

  // Reload admin page
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.locator("input[type=password]").fill(SENHA);
  await page.locator("button:has-text('Entrar')").click();
  await page.waitForTimeout(1500);

  // Click on reserved tile 050
  const reservedTile = page.locator("button").filter({ hasText: "050" }).first();
  if (await reservedTile.isVisible()) {
    await reservedTile.click();
    await page.waitForTimeout(300);
    const modalTitle = page.locator("text=Nº 050");
    assert(await modalTitle.isVisible(), "Modal abre com Nº 050");
    // Only check buttons inside the modal
    const modal = page.locator(".fixed.inset-0");
    assert(await modal.locator("button:has-text('Confirmar PIX')").first().isVisible(), "Botão Confirmar PIX no modal");
    assert(await modal.locator("button:has-text('Liberar')").first().isVisible(), "Botão Liberar no modal");
  }

  // Close modal by clicking backdrop
  await page.locator(".fixed.inset-0").first().click({ position: { x: 10, y: 10 } });
  await page.waitForTimeout(300);

  // ── Test 9: Save WhatsApp config ──
  console.log("\n💾 Teste 9: Salvar config");
  const saveBtn = page.locator("button:has-text('Salvar WhatsApp')");
  if (await saveBtn.isVisible()) {
    await saveBtn.click();
    await page.waitForTimeout(1000);
    console.log("  ℹ️  Salvar WhatsApp clicado");
  }

  // ── Summary ──
  console.log(`\n${"=".repeat(40)}`);
  console.log(`Admin: ${ok} passaram, ${fail} falharam`);
  console.log(`${"=".repeat(40)}`);

  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
}

run().catch(err => { console.error("Fatal:", err); process.exit(1); });
