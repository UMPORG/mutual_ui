import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { COR_MARCA_APP, GLIFOS_APPS, svgIconeApp } from "../src/icones.ts";

const APPS = ["portal", "backoffice", "eventos", "simplex", "saude", "qr", "dns", "assistente", "protocolos", "monitor", "cartao"] as const;

test("icon family: every app has a glyph, and the tile colour is its --app-marca", () => {
  const tokens = readFileSync(new URL("../css/tokens.css", import.meta.url), "utf8");
  for (const app of APPS) {
    assert.ok(GLIFOS_APPS[app].length > 0, `${app} has a glyph`);
    const m = tokens.match(new RegExp(String.raw`\[data-app="${app}"\]\s*\{\s*--app-marca:\s*(#[0-9a-f]{6})`));
    const esperado = m?.[1] ?? "#1f6f36"; // portal/cartao: the brand
    assert.equal(COR_MARCA_APP[app], esperado, `${app} tile colour`);
  }
});

test("icon family: no two apps share a glyph", () => {
  const vistos = new Set(APPS.map((a) => JSON.stringify(GLIFOS_APPS[a])));
  assert.equal(vistos.size, APPS.length);
});

test("svgIconeApp: standalone SVG with the tile colour; maskable is full-bleed", () => {
  const s = svgIconeApp("eventos");
  assert.match(s, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 24 24">/);
  assert.match(s, /fill="#7a1fc4"/);
  assert.match(s, /<\/svg>$/);
  assert.match(svgIconeApp("eventos", { mascaravel: true }), /<rect width="24" height="24" fill="#7a1fc4"\/>/);
});

test("generated assets exist for every app (scripts/gerar-icones.mjs)", () => {
  for (const app of APPS) {
    for (const f of ["icon.svg", "favicon.ico", "apple-icon.png", "icone-16.png", "icone-32.png", "icone-192.png", "icone-512.png", "icone-mascaravel-192.png", "icone-mascaravel-512.png"]) {
      assert.ok(existsSync(new URL(`../assets/icones/${app}/${f}`, import.meta.url)), `${app}/${f}`);
    }
    assert.equal(readFileSync(new URL(`../assets/icones/${app}/icon.svg`, import.meta.url), "utf8").trim(), svgIconeApp(app), `${app}/icon.svg is up to date`);
  }
});
