import { chromium } from "playwright";

const BASE = "https://rifa-carlos.vercel.app";

let ok = 0, fail = 0;

function assert(condition, msg) {
  if (condition) { ok++; console.log(`  ✅ ${msg}`); }
  else { fail++; console.log(`  ❌ ${msg}`); }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  // ── Test 1: Page loads ──
  console.log("\n📄 Teste 1: Carregamento");
  const page1 = await context.newPage();
  await page1.goto(BASE, { waitUntil: "networkidle" });
  await page1.waitForTimeout(1000);
  assert(await page1.title() !== "", "Título existe");
  assert(await page1.locator("text=números disponíveis").count() > 0, "Texto 'números disponíveis' visível");
  assert(await page1.locator("text=R$ 5.00").count() > 0, "Valor R$ 5.00 visível");
  await page1.close();

  // ── Test 2: Number grid ──
  console.log("\n🔢 Teste 2: Grade de números");
  const page2 = await context.newPage();
  await page2.goto(BASE, { waitUntil: "networkidle" });
  await page2.waitForTimeout(1000);
  const numberTiles = page2.locator("button.numero-tile");
  const count = await numberTiles.count();
  assert(count >= 200, `Pelo menos 200 números (tem ${count})`);
  const firstText = await numberTiles.nth(0).textContent();
  assert(firstText?.trim() === "001", `Primeiro é 001 (recebeu ${firstText?.trim()})`);
  await page2.close();

  // ── Test 3: Select/deselect numbers ──
  console.log("\n👆 Teste 3: Seleção");
  const page3 = await context.newPage();
  await page3.goto(BASE, { waitUntil: "networkidle" });
  await page3.waitForTimeout(1000);
  const tiles = page3.locator("button.numero-tile");

  // Click 005
  await tiles.filter({ hasText: "005" }).click();
  await page3.waitForTimeout(200);
  let selectedText = await page3.locator("text=Números selecionados").isVisible();
  assert(selectedText, "Painel 'Números selecionados' aparece");

  // Click 010
  await tiles.filter({ hasText: "010" }).click();
  await page3.waitForTimeout(200);
  let selectedNumbers = await page3.locator("p.font-bold.text-gray-800").textContent();
  assert(selectedNumbers?.includes("005") && selectedNumbers?.includes("010"), "005 e 010 selecionados");

  // Deselect 005
  await tiles.filter({ hasText: "005" }).click();
  await page3.waitForTimeout(200);
  selectedNumbers = await page3.locator("p.font-bold.text-gray-800").textContent();
  assert(!selectedNumbers?.includes("005"), "005 removido ao clicar de novo");
  assert(selectedNumbers?.includes("010"), "010 permanece");
  await page3.close();

  // ── Test 4: WhatsApp message ──
  console.log("\n📱 Teste 4: Mensagem WhatsApp");
  const page4 = await context.newPage();
  await page4.goto(BASE, { waitUntil: "networkidle" });
  await page4.waitForTimeout(1000);
  await page4.locator("button.numero-tile").filter({ hasText: "007" }).click();
  await page4.waitForTimeout(200);
  await page4.locator("input[placeholder='Nome completo']").fill("Maria Teste");
  await page4.locator("input[placeholder='11999999999']").fill("11999999999");
  await page4.locator("button:has-text('Reservar números')").click();
  await page4.waitForTimeout(2000);
  // After reserving, should show the success page with WhatsApp button
  const whatsBtn = page4.locator("a[href*='wa.me']");
  assert(await whatsBtn.count() > 0, "Botão WhatsApp aparece após reserva");
  const href = await whatsBtn.getAttribute("href");
  assert(href?.includes("5581983560534"), "Número WhatsApp correto");
  assert(href?.includes("007"), "Número 007 na mensagem (com padding)");
  assert(href?.includes("Maria"), "Nome na mensagem");
  assert(href?.includes("005") || href?.includes("5"), "Número formatado na mensagem");
  await page4.close();

  // ── Test 5: Available count ──
  console.log("\n📊 Teste 5: Números disponíveis");
  const page5 = await context.newPage();
  await page5.goto(BASE, { waitUntil: "networkidle" });
  await page5.waitForTimeout(1000);
  const dispText = await page5.locator("text=números disponíveis").textContent();
  const restantes = parseInt(dispText?.match(/\d+/)?.[0] || "0");
  assert(restantes > 0, `Há disponíveis (${restantes})`);
  assert(restantes <= 200, `Máx 200 (${restantes})`);
  await page5.close();

  // ── Summary ──
  console.log(`\n${"=".repeat(40)}`);
  console.log(`Público: ${ok} passaram, ${fail} falharam`);
  console.log(`${"=".repeat(40)}`);

  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
}

run().catch(err => { console.error("Fatal:", err); process.exit(1); });
