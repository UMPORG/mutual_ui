import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * v0.8 app shell tints: re-measure every pair documented in css/tokens.css,
 * so nobody can change a tint without keeping the contrast floor
 * (text ≥ 7:1, muted text and the app accent ≥ 4.5:1, flag red ≥ 3:1).
 */

const css = readFileSync(new URL("../css/tokens.css", import.meta.url), "utf8");

function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
export function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Every hex custom property declared in the rule(s) whose selector matches. */
function declaracoes(seletor: RegExp): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /([^{}]+)\{([^{}]*)\}/g;
  for (let m; (m = re.exec(css)); ) {
    const sel = m[1]!.replace(/\/\*[\s\S]*?\*\//g, "").trim();
    if (!seletor.test(sel)) continue;
    for (const d of m[2]!.matchAll(/(--[\w-]+):\s*(#[0-9a-f]{6})/gi)) out[d[1]!] = d[2]!.toLowerCase();
  }
  return out;
}

const raiz = declaracoes(/^:root$/);
const escuroRaiz = declaracoes(/^\.dark$/);
const APPS = ["portal", "backoffice", "eventos", "simplex", "qr", "saude", "dns", "monitor", "assistente", "protocolos"];

for (const app of APPS) {
  const claro = { ...raiz, ...declaracoes(new RegExp(`^\\[data-app="${app}"\\]`)) };
  const escuro = { ...claro, ...escuroRaiz, ...declaracoes(new RegExp(`^\\.dark\\[data-app="${app}"\\]`)) };
  if (app === "portal") Object.assign(escuro, { "--sidebar-foreground": raiz["--sidebar-foreground"] });
  for (const [tema, t] of [["claro", claro], ["escuro", escuro]] as const) {
    test(`${app} (${tema}): the tinted sidebar keeps the contrast floor`, () => {
      const fundo = t["--sidebar"]!, ativo = t["--sidebar-accent"]!;
      assert.ok(fundo && ativo, "tint declared");
      for (const [nome, sobre] of [["--sidebar", fundo], ["--sidebar-accent", ativo]] as const) {
        assert.ok(contraste(t["--sidebar-foreground"]!, sobre) >= 7, `text on ${nome}`);
        assert.ok(contraste(t["--sidebar-muted-foreground"]!, sobre) >= 4.5, `muted on ${nome}`);
        assert.ok(contraste(t["--app-accent-on-ink"]!, sobre) >= 4.5, `accent on ink on ${nome}`);
        assert.ok(contraste("#7cc97a", sobre) >= 3, `focus ring on ${nome}`);
      }
      assert.ok(contraste("#e8393c", fundo) >= 3, "flag red (logo) on the sidebar");
    });
  }
}

test("the tints stay one family: same depth as the MUTU@L ink", () => {
  const ink = luminancia("#12241a");
  for (const app of APPS.slice(1)) {
    const l = luminancia(declaracoes(new RegExp(`^\\[data-app="${app}"\\]`))["--sidebar"]!);
    assert.ok(Math.abs(l - ink) < 0.006, `${app} sidebar luminance ${l.toFixed(4)} vs ink ${ink.toFixed(4)}`);
  }
});

// ─── useScrollShadow maths ───────────────────────────────────────────────
import { bordasComMais } from "../src/rolagem-bordas.ts";

test("bordasComMais: shadows only toward hidden content", () => {
  const base = { scrollTop: 0, scrollHeight: 100, clientHeight: 100, scrollWidth: 1000, clientWidth: 400 };
  assert.deepEqual(
    [bordasComMais({ ...base, scrollLeft: 0 }).inicio, bordasComMais({ ...base, scrollLeft: 0 }).fim],
    [false, true],
  );
  const meio = bordasComMais({ ...base, scrollLeft: 300 });
  assert.equal(meio.inicio && meio.fim, true);
  const fim = bordasComMais({ ...base, scrollLeft: 599.6 }); // zoom rounding
  assert.deepEqual([fim.inicio, fim.fim], [true, false]);
  const cabe = bordasComMais({ ...base, scrollWidth: 400.5, scrollLeft: 0 });
  assert.equal(cabe.transbordaX || cabe.inicio || cabe.fim || cabe.cima || cabe.baixo, false);
  const vertical = bordasComMais({ ...base, scrollWidth: 400, scrollLeft: 0, scrollHeight: 500, scrollTop: 200 });
  assert.deepEqual([vertical.cima, vertical.baixo, vertical.transbordaY], [true, true, true]);
});

// ─── v0.8.2: invalid fields are tinted with --destructive-soft ────────────
test("invalid field tint: text, placeholder and red border stay readable (light, dark)", () => {
  for (const [tema, t] of [["claro", raiz], ["escuro", { ...raiz, ...escuroRaiz }]] as const) {
    const fundo = t["--destructive-soft"]!;
    assert.ok(fundo, `${tema}: --destructive-soft declared`);
    assert.ok(contraste(t["--foreground"]!, fundo) >= 7, `${tema}: text on the tint`);
    assert.ok(contraste(t["--muted-foreground"]!, fundo) >= 4.5, `${tema}: placeholder on the tint`);
    assert.ok(contraste(t["--destructive"]!, fundo) >= 3, `${tema}: red border on the tint`);
  }
});

test("invalid field tint is wired in css/controlos.css, with an Alto contraste override", () => {
  const controlos = readFileSync(new URL("../css/controlos.css", import.meta.url), "utf8");
  assert.match(controlos, /\.m-field\[aria-invalid="true"\][^{]*\{[^}]*background-color:\s*var\(--destructive-soft\)/);
  assert.match(controlos, /html\.contraste \.m-field\[aria-invalid="true"\][^{]*\{[^}]*border:\s*3px solid var\(--destructive\)/);
});

test("DataTable scroller is a containing block (sr-only text cannot widen the page)", () => {
  const dados = readFileSync(new URL("../css/dados.css", import.meta.url), "utf8");
  assert.match(dados, /\.m-tabela-rolo\s*\{\s*position:\s*relative;/);
  const tabela = readFileSync(new URL("../src/tabela.tsx", import.meta.url), "utf8");
  assert.match(tabela, /"m-tabela-rolo m-scroll-x relative"/);
});
