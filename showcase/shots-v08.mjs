// Screenshots of every app's shell (top bar, tinted frame, content layer) in
// each theme and size, and the scrolling states.
// `node shots-v08.mjs <outDir> [filtro]` with `bun serve.ts` running.
// If %TEMP% is on a full disk, run with TEMP/TMP pointing elsewhere.
import { chromium } from "file:///D:/Mutual/mutual_eventos/node_modules/@playwright/test/index.mjs";
import { mkdirSync } from "node:fs";

const OUT = process.argv[2] ?? "shots-v08";
const FILTRO = process.argv[3] ?? "";
mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:5199/";
// Headless Chromium hides scrollbars by default; this page is about them.
const b = await chromium.launch({ executablePath: process.env.LOCALAPPDATA + "/ms-playwright/chromium-1243/chrome-win64/chrome.exe", ignoreDefaultArgs: ["--hide-scrollbars"] });
const erros = [];
const quer = (n) => !FILTRO || n.includes(FILTRO);

async function abrir(q, vp = { width: 1440, height: 900 }, opcoes = {}) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1, forcedColors: opcoes.forcedColors ?? "none" });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erros.push(`${q}: ${e.message}`));
  p.on("console", (m) => m.type() === "error" && erros.push(`${q}: ${m.text()}`));
  await p.goto(BASE + q + "&movimento=reduzido", { waitUntil: "networkidle" });
  await p.waitForTimeout(400);
  return p;
}

// Element and full-page captures drop native scrollbars; scroll the section
// into view and capture the viewport instead.
async function vista(p, s, path) {
  await p.evaluate((id) => document.querySelector(`section[aria-labelledby="${id}"]`).scrollIntoView({ block: "start" }), s);
  await p.waitForTimeout(200);
  await p.screenshot({ path });
}

const TEMAS = ["claro", "escuro", "contraste"];
const APPS = ["portal", "backoffice", "eventos", "simplex", "saude", "dns", "qr", "monitor", "assistente"];

// 1) Every app shell, per theme, desktop and phone (one image per app).
for (const tema of TEMAS) {
  for (const [tam, vp] of [["desktop", { width: 1440, height: 900 }], ["390", { width: 390, height: 844 }]]) {
    const nome = `shells-${tema}-${tam}`;
    if (!quer(nome)) continue;
    const p = await abrir(`?pagina=shells&tema=${tema}`, vp);
    const [sw, iw] = await p.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    console.log(nome, sw > iw ? `TRANSBORDA ${sw}/${iw}` : "ok");
    for (const app of APPS) {
      const sec = p.locator(`section[aria-labelledby="shell-${app}"]`);
      await sec.screenshot({ path: `${OUT}/${nome}-${app}.png` });
    }
    await p.close();
  }
}

// 2) Side by side (three themes in iframes) — the overview.
if (quer("lado")) {
  const p = await abrir(`?pagina=shells&vista=lado&tema=claro`, { width: 1600, height: 1000 });
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${OUT}/shells-lado.png`, fullPage: true });
  await p.close();
}

// 3) A whole desk page with the real header per app (showcase header is bg-sidebar).
for (const app of ["backoffice", "saude"]) {
  for (const tema of TEMAS) {
    const nome = `pagina-${app}-${tema}`;
    if (!quer(nome)) continue;
    const p = await abrir(`?pagina=controlos&app=${app}&tema=${tema}`, { width: 1280, height: 700 });
    await p.screenshot({ path: `${OUT}/${nome}.png` });
    await p.close();
  }
}

// 4) Scrolling: page per theme and size, then states.
for (const tema of TEMAS) {
  for (const [tam, vp] of [["desktop", { width: 1440, height: 900 }], ["390", { width: 390, height: 844 }]]) {
    const nome = `rolagem-${tema}-${tam}`;
    if (!quer(nome)) continue;
    const p = await abrir(`?pagina=rolagem&tema=${tema}`, vp);
    const [sw, iw] = await p.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    console.log(nome, sw > iw ? `TRANSBORDA ${sw}/${iw}` : "ok");
    await p.screenshot({ path: `${OUT}/${nome}.png`, fullPage: true });
    // Middle of every horizontal scroller: both edge shadows.
    await p.evaluate(() => {
      for (const el of document.querySelectorAll(".m-scroll-x")) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
      for (const el of document.querySelectorAll(".m-scroll-y")) el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
    });
    await p.waitForTimeout(250);
    for (const s of ["r-vertical", "r-horizontal"]) await vista(p, s, `${OUT}/${nome}-meio-${s}.png`);
    // End: only the start shadow.
    await p.evaluate(() => {
      for (const el of document.querySelectorAll(".m-scroll-x")) el.scrollLeft = el.scrollWidth;
      for (const el of document.querySelectorAll(".m-scroll-y")) el.scrollTop = el.scrollHeight;
    });
    await p.waitForTimeout(250);
    await vista(p, "r-horizontal", `${OUT}/${nome}-fim-r-horizontal.png`);
    await p.close();
  }
}

// 5) Hover on a thumb (grows and darkens) — native list and ScrollArea.
if (quer("hover")) {
  for (const tema of TEMAS) {
    const p = await abrir(`?pagina=rolagem&tema=${tema}`, { width: 1440, height: 900 });
    const lista = p.locator('[data-rolo="lista"]');
    await lista.scrollIntoViewIfNeeded();
    const bx = await lista.boundingBox();
    await p.mouse.move(bx.x + bx.width - 6, bx.y + 20);
    await p.waitForTimeout(250);
    await p.locator(`section[aria-labelledby="r-vertical"]`).screenshot({ path: `${OUT}/hover-lista-${tema}.png` });
    const area = p.locator('[aria-label="Lista em ScrollArea"]');
    const ba = await area.boundingBox();
    await p.mouse.move(ba.x + ba.width - 6, ba.y + 30);
    await p.waitForTimeout(300);
    await p.locator(`section[aria-labelledby="r-vertical"]`).screenshot({ path: `${OUT}/hover-scrollarea-${tema}.png` });
    await p.close();
  }
}

// 6) Windows high contrast (forced colours).
if (quer("forcado")) {
  for (const pagina of ["rolagem", "shells"]) {
    const p = await abrir(`?pagina=${pagina}&tema=claro`, { width: 1440, height: 900 }, { forcedColors: "active" });
    await p.screenshot({ path: `${OUT}/forcado-${pagina}.png` });
    await p.close();
  }
}

// 7) Keyboard: Tab into the table scroller and press → (it must scroll).
if (quer("teclado")) {
  const p = await abrir(`?pagina=rolagem&tema=claro`, { width: 1024, height: 800 });
  const r = await p.evaluate(async () => {
    const el = document.querySelector('[data-rolo="faixa"]');
    el.focus();
    return { focavel: document.activeElement === el, antes: el.scrollLeft };
  });
  await p.keyboard.press("ArrowRight");
  await p.keyboard.press("ArrowRight");
  await p.waitForTimeout(300);
  const depois = await p.evaluate(() => document.querySelector('[data-rolo="faixa"]').scrollLeft);
  console.log("teclado", r, "depois", depois);
  await p.close();
}

await b.close();
console.log(erros.length ? "ERROS:\n" + erros.join("\n") : "sem erros");
