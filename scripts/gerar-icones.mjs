// Generates the favicon and home-screen icons of every app from the icon
// family (src/icones.ts) into assets/icones/<app>/:
//   icon.svg (favicon, the «folha»), favicon.ico (16 + 32 + 48),
//   icone-16.png, icone-32.png, apple-icon.png (180, full-bleed),
//   icone-192.png, icone-512.png (purpose "any"), icone-mascaravel-192.png,
//   icone-mascaravel-512.png (purpose "maskable", glyph in the safe zone).
// `node --experimental-strip-types scripts/gerar-icones.mjs` — needs a Chromium
// (Playwright; PLAYWRIGHT_MODULE / CHROMIUM env to override the defaults).
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { COR_MARCA_APP, svgIconeApp } from "../src/icones.ts";

const PW = process.env.PLAYWRIGHT_MODULE ?? "file:///D:/Mutual/mutual_eventos/node_modules/@playwright/test/index.mjs";
const CHROMIUM = process.env.CHROMIUM ?? process.env.LOCALAPPDATA + "/ms-playwright/chromium-1243/chrome-win64/chrome.exe";
const { chromium } = await import(PW);
const OUT = new URL("../assets/icones/", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");

const b = await chromium.launch({ executablePath: CHROMIUM });
const p = await b.newPage({ deviceScaleFactor: 1 });
async function png(svg, px) {
  await p.setViewportSize({ width: px, height: px });
  const src = "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
  await p.setContent(`<html><body style="margin:0;background:transparent"><img src="${src}" width="${px}" height="${px}" style="display:block"></body></html>`);
  await p.waitForFunction(() => document.images[0]?.complete);
  return p.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: px, height: px } });
}
function ico(pngs) {
  const cab = Buffer.alloc(6 + 16 * pngs.length);
  cab.writeUInt16LE(0, 0); cab.writeUInt16LE(1, 2); cab.writeUInt16LE(pngs.length, 4);
  let pos = cab.length;
  pngs.forEach(([px, dados], i) => {
    const o = 6 + 16 * i;
    cab.writeUInt8(px >= 256 ? 0 : px, o); cab.writeUInt8(px >= 256 ? 0 : px, o + 1);
    cab.writeUInt16LE(1, o + 4); cab.writeUInt16LE(32, o + 6);
    cab.writeUInt32LE(dados.length, o + 8); cab.writeUInt32LE(pos, o + 12);
    pos += dados.length;
  });
  return Buffer.concat([cab, ...pngs.map(([, d]) => d)]);
}
for (const app of Object.keys(COR_MARCA_APP)) {
  const dir = join(OUT, app);
  mkdirSync(dir, { recursive: true });
  const folha = svgIconeApp(app);
  const cheio = svgIconeApp(app, { mascaravel: true });
  writeFileSync(join(dir, "icon.svg"), folha + "\n");
  const p16 = await png(folha, 16), p32 = await png(folha, 32), p48 = await png(folha, 48);
  writeFileSync(join(dir, "icone-16.png"), p16);
  writeFileSync(join(dir, "icone-32.png"), p32);
  writeFileSync(join(dir, "favicon.ico"), ico([[16, p16], [32, p32], [48, p48]]));
  writeFileSync(join(dir, "apple-icon.png"), await png(cheio, 180));
  writeFileSync(join(dir, "icone-192.png"), await png(folha, 192));
  writeFileSync(join(dir, "icone-512.png"), await png(folha, 512));
  writeFileSync(join(dir, "icone-mascaravel-192.png"), await png(cheio, 192));
  writeFileSync(join(dir, "icone-mascaravel-512.png"), await png(cheio, 512));
  console.log(app);
}
await b.close();
