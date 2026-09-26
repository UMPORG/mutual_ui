// Screenshots of the showcase in every theme / size: `node shots.mjs <outDir>`
// (needs `bun serve.ts` running). Uses the Playwright copy of mutual_eventos.
import { chromium } from "file:///D:/Mutual/mutual_eventos/node_modules/@playwright/test/index.mjs";
const OUT = process.argv[2] ?? "shots";
const SECOES = process.argv.includes("--secoes");
const BASE = "http://localhost:5199/";
const b = await chromium.launch({ executablePath: process.env.LOCALAPPDATA + "/ms-playwright/chromium-1243/chrome-win64/chrome.exe" });
const casos = [
  ["claro-desktop", "?tema=claro", { width: 1440, height: 900 }],
  ["escuro-desktop", "?tema=escuro", { width: 1440, height: 900 }],
  ["contraste-desktop", "?tema=contraste", { width: 1440, height: 900 }],
  ["claro-390", "?tema=claro", { width: 390, height: 844 }],
  ["escuro-390", "?tema=escuro", { width: 390, height: 844 }],
  ["texto150-1280", "?tema=claro&texto=150", { width: 1280, height: 900 }],
  ["simplex-escuro-1024", "?tema=escuro&app=simplex", { width: 1024, height: 800 }],
];
for (const [nome, q, vp] of casos) {
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: 1 });
  const erros = [];
  p.on("pageerror", (e) => erros.push(e.message));
  p.on("console", (m) => m.type() === "error" && erros.push(m.text()));
  await p.goto(BASE + q + "&movimento=reduzido", { waitUntil: "networkidle" });
  await p.waitForTimeout(600);
  const largura = await p.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  await p.screenshot({ path: `${OUT}/${nome}.png`, fullPage: true });
  if (SECOES && (nome.endsWith("desktop") || nome.endsWith("390") || nome.startsWith("texto150"))) {
    for (const id of ["s-ind", "s-est", "s-car", "s-met", "s-graf", "s-tab", "s-tabest", "s-vaz"]) {
      await p.locator(`section[aria-labelledby="${id}"]`).screenshot({ path: `${OUT}/${nome}-${id}.png` });
    }
  }
  console.log(nome, "scroll/viewport", largura.join("/"), "erros:", erros.join(" | ") || "nenhum");
  await p.close();
}
// Interaction: keyboard tooltip + "Ver dados".
{
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(BASE + "?tema=claro&movimento=reduzido", { waitUntil: "networkidle" });
  const fig = p.locator("figure", { hasText: "Inscrições por tipo" });
  await fig.scrollIntoViewIfNeeded();
  const alvo = fig.locator("[tabindex='0']").first();
  console.log("focável:", await alvo.evaluate((el) => el.tagName + "." + el.getAttribute("class")));
  await p.keyboard.press("Tab"); // real keyboard path: reach the chart with Tab
  await alvo.focus();
  await p.keyboard.press("ArrowRight"); await p.keyboard.press("ArrowRight"); await p.keyboard.press("ArrowRight");
  await p.waitForTimeout(300);
  await fig.screenshot({ path: `${OUT}/interacao-teclado-tooltip.png` });
  const fig2 = p.locator("figure", { hasText: "Receita e despesa" });
  await fig2.getByRole("button", { name: "Ver dados" }).click();
  await fig2.screenshot({ path: `${OUT}/interacao-ver-dados.png` });
  const desc = await p.locator("figure", { hasText: "Associações por distrito" }).locator("desc").first().textContent().catch(() => null);
  console.log("desc:", desc);
  await p.close();
}
await b.close();
