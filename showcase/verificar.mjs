// Checks what unit tests cannot see (needs `bun serve.ts` running):
// FormField accessible names ("Nome (opcional)", "Nome (obrigatório)") both
// in Playwright's getByLabel and in Chromium's accessibility tree, the 44px
// hit area of the FilterChips and Tag buttons, that the header follows data-app,
// the invalid-field tint, that DataTable never widens the page at 150% text,
// and that Checkbox/Switch/Radio labels name the focusable control in server
// HTML and after hydration (/ssr).
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
// ─── v0.8.2 ──────────────────────────────────────────────────────────────
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

await b.close();
if (falhas.length) process.exit(1);
