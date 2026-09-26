// Checks what unit tests cannot see (needs `bun serve.ts` running):
// FormField accessible names ("Nome (opcional)", "Nome (obrigatório)") both
// in Playwright's getByLabel and in Chromium's accessibility tree, the 44px
// hit area of the FilterChips buttons, and that the header follows data-app.
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
await b.close();
if (falhas.length) process.exit(1);
