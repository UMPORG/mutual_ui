// Checks what unit tests cannot see (needs `bun serve.ts` running):
// FormField accessible names ("Nome (opcional)", "Nome (obrigatório)") both
// in Playwright's getByLabel and in Chromium's accessibility tree, the 44px
// hit area of the FilterChips and Tag buttons, that the header follows data-app,
// the invalid-field tint, that DataTable never widens the page at 150% text,
// that Checkbox/Switch/Radio labels name the focusable control in server
// HTML and after hydration (/ssr), and that DemoPreencher works inside open
// dialogs and never covers a long form's last actions (?pagina=demo).
// `node verificar.mjs` — exits 1 on the first failure.
import { chromium } from "file:///D:/Mutual/mutual_eventos/node_modules/@playwright/test/index.mjs";

const BASE = "http://localhost:5199/";
const b = await chromium.launch({ executablePath: process.env.LOCALAPPDATA + "/ms-playwright/chromium-1243/chrome-win64/chrome.exe" });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const falhas = [];
const ok = (cond, msg) => (cond ? console.log("ok  ", msg) : (falhas.push(msg), console.log("FALHA", msg)));

await p.goto(BASE + "?pagina=controlos");
await p.waitForTimeout(500);
const nomes = ["Nome da associação (obrigatório)", "NIF (obrigatório)", "Tipo de associado (opcional)", "Observações (opcional)"];
for (const n of nomes) ok((await p.getByLabel(n, { exact: true }).count()) === 1, `getByLabel("${n}")`);
const cdp = await p.context().newCDPSession(p);
const { nodes } = await cdp.send("Accessibility.getFullAXTree");
const ax = new Set(nodes.map((n) => n.name?.value ?? ""));
for (const n of [...nomes, "Forma de pagamento (obrigatório)"]) ok(ax.has(n), `Chromium: "${n}"`);

await p.evaluate(() => document.documentElement.setAttribute("data-app", "saude"));
await p.waitForTimeout(100);
ok((await p.getByRole("banner").innerText()).includes("Saúde"), "cabeçalho segue data-app");

await p.goto(BASE + "?pagina=dados");
await p.waitForTimeout(500);
const alvos = await p.$$eval('ul[aria-label="Filtros ativos"] :is(a, button)', (els) =>
  els.map((e) => {
    const r = e.getBoundingClientRect();
    const a = getComputedStyle(e, "::after");
    const w = r.width - 2 * parseFloat(a.left === "auto" ? "0" : a.left);
    const h = r.height - 2 * parseFloat(a.top === "auto" ? "0" : a.top);
    return [e.getAttribute("aria-label") ?? e.textContent, Math.min(Math.max(r.width, w), 999), Math.max(r.height, h)];
  }),
);
for (const [n, w, h] of alvos) ok(w >= 44 && h >= 44, `alvo ${Math.round(w)}×${Math.round(h)} — ${n}`);
// ─── Hit areas, invalid fields, table width, control labels ─────────────
// Tag remove buttons: 44px hit area.
await p.goto(BASE + "?pagina=controlos");
await p.waitForTimeout(500);
const alvosTag = await p.$$eval('button[aria-label^="Remover "]', (els) =>
  els.map((e) => {
    const r = e.getBoundingClientRect();
    const a = getComputedStyle(e, "::after");
    const w = r.width - 2 * parseFloat(a.left === "auto" ? "0" : a.left);
    const h = r.height - 2 * parseFloat(a.top === "auto" ? "0" : a.top);
    return [e.getAttribute("aria-label"), Math.max(r.width, w), Math.max(r.height, h)];
  }),
);
ok(alvosTag.length >= 2, "Tag: botões de remover presentes");
for (const [n, w, h] of alvosTag) ok(w >= 44 && h >= 44, `alvo Tag ${Math.round(w)}×${Math.round(h)} — ${n}`);

// Invalid fields: red border + destructive-soft tint in every theme.
for (const tema of ["claro", "escuro", "contraste"]) {
  await p.goto(BASE + `?pagina=controlos&tema=${tema}`);
  await p.waitForTimeout(300);
  const [fundo, soft, borda, vermelho] = await p.getByLabel("NIF (obrigatório)", { exact: true }).evaluate((e) => {
    const s = getComputedStyle(e);
    const probe = document.createElement("div");
    probe.style.cssText = "background:var(--destructive-soft);border-color:var(--destructive);border-style:solid";
    document.body.append(probe);
    const ps = getComputedStyle(probe);
    const out = [s.backgroundColor, ps.backgroundColor, s.borderTopColor, ps.borderTopColor];
    probe.remove();
    return out;
  });
  ok(fundo === soft && borda === vermelho, `campo inválido (${tema}): fundo ${fundo}, borda ${borda}`);
}

// DataTable: its sr-only caption/header text must not widen the page (150% text).
for (const w of [800, 1024, 1280]) {
  await p.setViewportSize({ width: w, height: 900 });
  await p.goto(BASE + "?pagina=dados&texto=150");
  await p.waitForTimeout(500);
  const [sw, cw] = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  ok(sw <= cw, `DataTable a 150% em ${w}px: sem rolagem horizontal da página (${sw} ≤ ${cw})`);
}
await p.setViewportSize({ width: 1440, height: 900 });

// Checkbox / Switch / Radio: the visible label names the focusable control,
// in server HTML (no JavaScript) and after hydration (showcase/ssr.tsx).
const controlos = [
  ["Só com quotas em atraso", "checkbox"],
  ["Li e aceito o regulamento de inscrição", "checkbox"],
  ["Avisos por email", "switch"],
  ["Referência Multibanco", "radio"],
];
for (const js of [false, true]) {
  const fase = js ? "hidratado" : "HTML do servidor";
  const ctx = await b.newContext({ javaScriptEnabled: js });
  const q = await ctx.newPage();
  await q.goto(BASE + "ssr" + (js ? "" : "?js=0"));
  if (js) await q.waitForSelector("html[data-hidratado]");
  const axq = new Set();
  for (const n of (await (await ctx.newCDPSession(q)).send("Accessibility.getFullAXTree")).nodes) if (n.name?.value) axq.add(n.role?.value + "|" + n.name.value);
  for (const [n, role] of controlos) {
    const l = q.getByLabel(n, { exact: true });
    const info = (await l.count()) === 1 ? await l.evaluate((e) => [e.getAttribute("role"), e.tabIndex]) : [null, null];
    // radios use a roving tabindex (-1 until chosen); never the hidden input
    ok(info[0] === role && info[1] >= (role === "radio" ? -1 : 0), `${fase}: getByLabel("${n}") → o ${role} focável`);
    ok((await q.getByRole(role, { name: n, exact: true }).count()) === 1, `${fase}: getByRole(${role}, "${n}")`);
    ok(axq.has(role + "|" + n), `${fase}: Chromium nomeia o ${role} "${n}"`);
  }
  if (js) {
    const n = "Li e aceito o regulamento de inscrição";
    await q.getByText(n, { exact: true }).click();
    ok((await q.getByTestId("estado").innerText()) === "aceite", "clique no rótulo marca a caixa");
    await q.getByLabel(n, { exact: true }).focus();
    await q.keyboard.press("Space");
    ok((await q.getByLabel(n, { exact: true }).getAttribute("aria-checked")) === "false", "Espaço no controlo focado desmarca");
    await q.getByText("Avisos por email", { exact: true }).click();
    ok((await q.getByRole("switch", { name: "Avisos por email" }).getAttribute("aria-checked")) === "true", "clique no rótulo liga o interruptor");
    await q.getByText("Referência Multibanco", { exact: true }).click();
    ok((await q.getByRole("radio", { name: "Referência Multibanco" }).getAttribute("aria-checked")) === "true", "clique no rótulo escolhe a opção");
  }
  await ctx.close();
}
await p.goto(BASE + "?pagina=controlos");
await p.waitForTimeout(500);
await p.getByRole("button", { name: "Filtros", exact: true }).click();
const ativas = p.getByLabel("Só associações ativas", { exact: true });
ok((await ativas.count()) === 1 && (await ativas.getAttribute("role")) === "checkbox", 'showcase (popover): getByLabel("Só associações ativas") → a caixa');
await p.getByText("Só associações ativas", { exact: true }).click();
ok((await ativas.getAttribute("aria-checked")) === "false", "showcase (popover): clique no rótulo desmarca");

// ─── DemoPreencher: dialogs and long forms ───────────────────────────────
const retangulo = (loc) => loc.evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
const sobrepoe = (a, b) => Math.min(a.x + a.w, b.x + b.w) > Math.max(a.x, b.x) && Math.min(a.y + a.h, b.y + b.h) > Math.max(a.y, b.y);
for (const [nome, vp] of [["desktop", { width: 1440, height: 900 }], ["telemóvel", { width: 390, height: 844 }]]) {
  await p.setViewportSize(vp);
  await p.goto(BASE + "?pagina=demo");
  await p.waitForTimeout(500);
  const pilula = p.locator("[data-demo-preencher] > button[aria-expanded]");
  const guardar = p.locator('[data-teste="guardar"]');
  const cancelar = guardar.locator("xpath=preceding-sibling::button[1]");
  ok((await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--demo-reserva").trim())) === "5rem", `demo (${nome}): <html data-demo> dá --demo-reserva`);
  // The last actions exactly at the bottom edge of the window: the pill docks away.
  for (const folga of [4, 30, 60]) {
    await guardar.evaluate((e, f) => window.scrollBy(0, e.getBoundingClientRect().bottom - (window.innerHeight - f)), folga);
    await p.waitForTimeout(250);
    const pr = await retangulo(pilula);
    const livre = !sobrepoe(pr, await retangulo(guardar)) && !sobrepoe(pr, await retangulo(cancelar));
    ok(livre, `demo (${nome}): a pílula não tapa «Cancelar»/«Guardar ficha» (fundo a ${folga}px, doca ${await p.locator("[data-demo-preencher]").getAttribute("data-doca")})`);
  }
  await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await p.waitForTimeout(250);
  ok(!sobrepoe(await retangulo(pilula), await retangulo(guardar)), `demo (${nome}): no fim da página a reserva deixa as ações livres`);
  await guardar.click({ timeout: 2000 }); // Playwright refuses when another element covers it
  ok(await p.getByText("Use o formato 1234-567.").isVisible(), `demo (${nome}): «Guardar ficha» clicável`);
  // Keyboard: open, first scenario focused, Escape returns focus to the pill.
  await pilula.focus();
  await p.keyboard.press("Enter");
  ok(await p.evaluate(() => document.activeElement?.hasAttribute("data-cenario") ?? false), `demo (${nome}): Enter abre e foca o primeiro cenário`);
  await p.keyboard.press("Escape");
  ok(await pilula.evaluate((e) => e === document.activeElement), `demo (${nome}): Escape fecha e devolve o foco`);
  await pilula.click();
  await p.getByRole("button", { name: /Dados válidos/ }).click();
  ok((await p.locator('input[name="codigoPostal"]').inputValue()) === "4700-328", `demo (${nome}): cenário da página aplicado`);

  // A decision dialog: the pill hides, the strip in the dialog fills its form.
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.locator('[data-abrir="decisao"]').click();
  await p.waitForTimeout(400);
  const dialogo = p.getByRole("dialog", { name: "Recusar o pedido de adesão?" });
  ok(await p.locator("[data-demo-preencher]").isHidden(), `demo (${nome}): a pílula esconde-se com o diálogo modal aberto`);
  ok((await dialogo.getByRole("group", { name: "Preencher (demonstração)" }).count()) === 1, `demo (${nome}): faixa «Preencher (demonstração)» dentro do diálogo`);
  await dialogo.getByRole("button", { name: /Sem motivo/ }).click();
  await p.waitForTimeout(200);
  ok(await dialogo.getByText("Indique o motivo.").isVisible(), `demo (${nome}): cenário com erro submete e mostra o erro`);
  const cenario = dialogo.getByRole("button", { name: /Motivo claro/ });
  await cenario.focus();
  await p.keyboard.press("Enter");
  ok((await p.locator('textarea[name="motivo"]').inputValue()).startsWith("Faltam os estatutos"), `demo (${nome}): cenário aplicado pelo teclado`);
  ok(await p.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')), `demo (${nome}): o foco continua no diálogo`);
  // Base UI's focus guards (a span, then the body for an instant) wrap focus back in;
  // what must never happen is a control of the page getting focus.
  let fora = 0;
  for (let i = 0; i < 12; i++) {
    await p.keyboard.press("Tab");
    await p.waitForTimeout(30);
    fora += await p.evaluate(() => {
      const a = document.activeElement;
      return a && a.matches("button, a[href], input, textarea, select") && !a.closest('[role="dialog"]') ? 1 : 0;
    });
  }
  ok(fora === 0, `demo (${nome}): Tab não leva o foco a controlos fora do diálogo`);
  await dialogo.getByRole("button", { name: "Recusar", exact: true }).click();
  await p.waitForTimeout(400);
  ok(await p.locator('[data-teste="recusado"]').isVisible(), `demo (${nome}): decisão submetida`);
  ok(await p.locator("[data-demo-preencher]").isVisible(), `demo (${nome}): a pílula volta depois de fechar o diálogo`);
  ok((await p.locator("[data-demo-camada]").count()) === 0, `demo (${nome}): a faixa sai com o diálogo`);

  // Sheet.
  await p.locator('[data-abrir="painel-demo"]').click();
  await p.waitForTimeout(400);
  await p.getByRole("dialog", { name: "Nota interna" }).getByRole("button", { name: /Nota de exemplo/ }).click();
  ok((await p.locator('textarea[name="nota"]').inputValue()).startsWith("Telefonar"), `demo (${nome}): faixa no painel lateral`);
  await p.keyboard.press("Escape");
  await p.waitForTimeout(300);
}
// --demo-fundo: the pill sits above a fixed bottom navigation bar and still docks right.
await p.setViewportSize({ width: 390, height: 844 });
await p.goto(BASE + "?pagina=demo");
await p.waitForTimeout(400);
await p.evaluate(() => {
  document.documentElement.style.setProperty("--demo-fundo", "72px");
  const nav = document.createElement("nav");
  nav.setAttribute("data-demo-evitar", "");
  nav.style.cssText = "position:fixed;left:0;right:0;bottom:0;height:72px;background:#ccc";
  document.body.append(nav);
});
await p.waitForTimeout(400);
const fundoPilula = await p.locator("[data-demo-preencher] > button[aria-expanded]").evaluate((e) => window.innerHeight - e.getBoundingClientRect().bottom);
ok(Math.round(fundoPilula) === 88, `demo: --demo-fundo levanta a pílula (${Math.round(fundoPilula)}px do fundo)`);
ok((await p.locator("[data-demo-preencher]").getAttribute("data-doca")) !== "meio", "demo: com --demo-fundo a barra de navegação não empurra a pílula para o meio");
// Reduced motion: no scroll animation, no transition.
await p.setViewportSize({ width: 1440, height: 900 });
await p.goto(BASE + "?pagina=demo&movimento=reduzido");
await p.waitForTimeout(400);
const dur = await p.locator("[data-demo-preencher]").evaluate((e) => parseFloat(getComputedStyle(e).transitionDuration));
ok(dur < 0.01, `demo: movimento reduzido sem transição (${dur}s)`);

// ─── Identificadores ─────────────────────────────────────────────────────
await p.setViewportSize({ width: 1440, height: 900 });
await p.goto(BASE + "?pagina=identificadores");
await p.waitForTimeout(500);
const tel = p.getByLabel("Telefone (opcional)", { exact: true });
await tel.pressSequentially("222084177");
ok((await tel.inputValue()) === "222 084 177", "CampoTelefone: máscara ao escrever");
await tel.fill("+44 20 7946 0958");
ok((await p.locator('select[aria-label^="Indicativo"]').first().inputValue()) === "44", "CampoTelefone: colar «+44 …» muda o país");
ok((await p.locator('input[type="hidden"][name="telefone"]').inputValue()) === "+442079460958", "CampoTelefone: valor em E.164");
await p.getByLabel("Código postal (obrigatório)").pressSequentially("4700328");
ok((await p.locator('input[type="hidden"][name="codigoPostal"]').inputValue()) === "4700-328", "CampoCodigoPostal: 4700-328");
const alvoTel = await p.locator('a[href^="tel:"]').first().evaluate((e) => { const r = e.getBoundingClientRect(); const a = getComputedStyle(e, "::after"); return r.height - 2 * parseFloat(a.top); });
ok(alvoTel >= 44, `Telefone: alvo ${Math.round(alvoTel)}px`);
ok((await p.locator('a[href^="tel:"]').first().getAttribute("href")) === "tel:+351253000111", "Telefone: tel: com E.164");

await b.close();
if (falhas.length) process.exit(1);
