// Preview screenshots of the app icon family and the grid launcher (icones-preview):
// `node shots-icones.mjs <outDir>` with `PORT=5198 bun serve.ts` running.
import { chromium } from "file:///D:/Mutual/mutual_eventos/node_modules/@playwright/test/index.mjs";
const OUT = process.argv[2] ?? "shots";
const BASE = process.env.BASE ?? "http://localhost:5198/";
const b = await chromium.launch({ executablePath: process.env.LOCALAPPDATA + "/ms-playwright/chromium-1243/chrome-win64/chrome.exe" });
const erros = [];
async function pagina(q, vp = { width: 1440, height: 900 }, { forcado = false, dpr = 1 } = {}) {
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: dpr });
  p.on("pageerror", (e) => erros.push(q + " " + e.message));
  p.on("console", (m) => m.type() === "error" && erros.push(q + " " + m.text()));
  if (forcado) await p.emulateMedia({ forcedColors: "active" });
  await p.goto(BASE + q + "&movimento=reduzido", { waitUntil: "networkidle" });
  await p.waitForTimeout(300);
  return p;
}
for (const d of ["a", "b"]) {
  for (const [tema, forcado] of [["claro", false], ["escuro", false], ["forcado", true]]) {
    const p = await pagina(`?pagina=icones&direcao=${d}&tema=${tema === "forcado" ? "claro" : tema}`, undefined, { forcado });
    await p.locator('[data-seccao="s-grelha"]').screenshot({ path: `${OUT}/grelha-${d}-${tema}.png` });
    if (tema !== "forcado") await p.locator('[data-seccao="s-barra"]').screenshot({ path: `${OUT}/barra-${d}-${tema}.png` });
    if (tema === "claro") await p.locator('[data-seccao="s-separadores"]').screenshot({ path: `${OUT}/separadores-${d}.png` });
    if (tema === "forcado") await p.locator('[data-seccao="s-separadores"]').screenshot({ path: `${OUT}/separadores-${d}-forcado.png` });
    await p.close();
  }
  for (const tema of ["claro", "escuro"]) {
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      const p = await pagina(`?pagina=icones-shell&app=eventos&direcao=${d}&tema=${tema}`, { width: w, height: h });
      await p.locator(".m-waffle").click();
      await p.waitForTimeout(250);
      await p.screenshot({ path: `${OUT}/lancador-${d}-${tema}-${w}.png` });
      await p.close();
    }
  }
}
// Forced colours: the launcher open.
{
  const p = await pagina(`?pagina=icones-shell&app=eventos&direcao=a&tema=claro`, undefined, { forcado: true });
  await p.locator(".m-waffle").click();
  await p.waitForTimeout(250);
  await p.screenshot({ path: `${OUT}/lancador-forcado-1440.png` });
  await p.close();
}
// Keyboard: focus lands on the current app, arrows move, Esc closes and returns focus.
{
  const p = await pagina(`?pagina=icones-shell&app=eventos&direcao=a&tema=claro`);
  const foco = () => p.evaluate(() => (document.activeElement?.textContent || document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName || "").trim());
  await p.locator(".m-waffle").focus();
  await p.keyboard.press("Enter");
  await p.waitForTimeout(150);
  const r = ["abrir: " + (await foco())];
  await p.keyboard.press("ArrowRight"); r.push("→ " + (await foco()));
  await p.keyboard.press("ArrowDown"); r.push("↓ " + (await foco()));
  await p.keyboard.press("End"); r.push("Fim " + (await foco()));
  await p.keyboard.press("Home"); r.push("Início " + (await foco()));
  await p.keyboard.press("Escape"); await p.waitForTimeout(150);
  r.push("Esc: " + (await foco()) + " aberto=" + (await p.locator(".m-grelha-apps").evaluate((e) => e.matches(":popover-open"))));
  await p.screenshot({ path: `${OUT}/teclado-dica-apos-esc.png`, clip: { x: 900, y: 0, width: 540, height: 120 } });
  await p.keyboard.press("Enter"); await p.waitForTimeout(150);
  await p.mouse.click(700, 600); await p.waitForTimeout(150);
  r.push("clique fora: " + (await foco()));
  console.log(r.join(" | "));
  // Tooltip on hover (panel closed).
  await p.mouse.move(10, 400);
  await p.locator(".m-waffle").hover(); await p.waitForTimeout(700);
  await p.screenshot({ path: `${OUT}/dica-hover.png`, clip: { x: 900, y: 0, width: 540, height: 120 } });
  await p.close();
}
await b.close();
console.log("erros:", erros.join(" | ") || "nenhum");
