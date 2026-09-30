import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * Shell G: the frame (top bar + navigation) is a neutral grey mixed
 * with 9% of the app's colour, the current page a pill with 20% (24% dark),
 * hover 14%; the content one neutral layer. The search field is not
 * tinted: the neutral input surface with a border ≥ 3:1 on the tinted bar. Re-measure every pair
 * in every app, light and dark, mixing exactly as `color-mix(in srgb …)`
 * does, and keep the app colours apart (OKLCH hue).
 */

const css = readFileSync(new URL("../css/tokens.css", import.meta.url), "utf8");

function canais(hex: string): number[] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
}
function luminancia(hex: string): number {
  const [r, g, b] = canais(hex).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
export function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
/** color-mix(in srgb, a p, b). */
export function misturar(a: string, p: number, b: string): string {
  const [x, y] = [canais(a), canais(b)];
  return "#" + x.map((v, i) => Math.round((v * p + y[i]! * (1 - p)) * 255).toString(16).padStart(2, "0")).join("");
}
/** OKLCH hue in degrees. */
function matiz(hex: string): number {
  const [r, g, b] = canais(hex).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const l = Math.cbrt(0.4122214708 * r! + 0.5363325363 * g! + 0.0514459929 * b!);
  const m = Math.cbrt(0.2119034982 * r! + 0.6806995451 * g! + 0.1073969566 * b!);
  const s = Math.cbrt(0.0883024619 * r! + 0.2817188376 * g! + 0.6299787005 * b!);
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
}

/** Every hex (or %) custom property declared in the rule(s) whose selector matches. */
function declaracoes(seletor: RegExp): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /([^{}]+)\{([^{}]*)\}/g;
  for (let m; (m = re.exec(css)); ) {
    const sel = m[1]!.replace(/\/\*[\s\S]*?\*\//g, "").trim();
    if (!seletor.test(sel)) continue;
    for (const d of m[2]!.matchAll(/(--[\w-]+):\s*(#[0-9a-f]{6}|\d+%)/gi)) out[d[1]!] = d[2]!.toLowerCase();
  }
  return out;
}

const raiz = declaracoes(/^:root$/);
const escuroRaiz = declaracoes(/^\.dark$/);
const APPS = ["portal", "backoffice", "eventos", "simplex", "qr", "saude", "dns", "monitor", "assistente", "protocolos"];
const pct = (t: Record<string, string>, k: string) => parseFloat(t[k]!) / 100;

function tema(app: string, escuro: boolean): Record<string, string> {
  const claro = { ...raiz, ...declaracoes(new RegExp(`^\\[data-app="${app}"\\]`)) };
  const t = escuro ? { ...claro, ...escuroRaiz, ...declaracoes(new RegExp(`^\\.dark\\[data-app="${app}"\\]`)) } : claro;
  // Portal (and Cartão): the accent IS the brand (var(--brand)).
  if (!t["--app-accent"] || app === "portal") t["--app-accent"] = t["--brand"]!;
  if (!t["--app-marca"] || app === "portal") t["--app-marca"] = raiz["--brand"]!;
  const cor = t["--app-accent"]!;
  t["--moldura"] = misturar(cor, pct(t, "--moldura-mistura"), t["--moldura-base"]!);
  t["--moldura-hover"] = misturar(cor, pct(t, "--moldura-hover-mistura"), t["--moldura-base"]!);
  t["--moldura-selecao"] = misturar(cor, pct(t, "--moldura-selecao-mistura"), t["--moldura-base"]!);
  return t;
}

for (const app of APPS) {
  for (const escuro of [false, true]) {
    const nomeTema = escuro ? "escuro" : "claro";
    test(`${app} (${nomeTema}): the tinted frame of shell G keeps the contrast floor`, () => {
      const t = tema(app, escuro);
      const pares: [string, string, string, string, number][] = [];
      for (const sup of ["--moldura", "--moldura-hover", "--moldura-selecao"]) {
        pares.push(["texto", t["--foreground"]!, sup, t[sup]!, 7]);
        pares.push(["texto suave / títulos dos grupos", t["--muted-foreground"]!, sup, t[sup]!, 4.5]);
        pares.push(["anel de foco", t["--ring"]!, sup, t[sup]!, 3]);
      }
      pares.push(["ícone da página atual", t["--app-accent"]!, "--moldura-selecao", t["--moldura-selecao"]!, 3]);
      pares.push(["glifo branco no azulejo", "#ffffff", "--app-marca", t["--app-marca"]!, 4.5]);
      pares.push(["traço do separador atual", t["--app-accent"]!, "--camada", t["--camada"]!, 3]);
      pares.push(["texto na camada", t["--foreground"]!, "--camada", t["--camada"]!, 7]);
      pares.push(["contador e iniciais do avatar", t["--camada"]!, "--foreground", t["--foreground"]!, 4.5]);
      // The search field: neutral input surface, border visible on the
      // tinted bar (and on its hover shade, which sits right next to it).
      for (const sup of ["--moldura", "--moldura-hover"]) {
        pares.push(["borda da procura", t["--procura-borda"]!, sup, t[sup]!, 3]);
      }
      pares.push(["borda da procura sobre o próprio campo", t["--procura-borda"]!, "--procura-fundo", t["--procura-fundo"]!, 3]);
      pares.push(["texto escrito na procura", t["--foreground"]!, "--procura-fundo", t["--procura-fundo"]!, 7]);
      pares.push(["sugestão e lupa da procura", t["--muted-foreground"]!, "--procura-fundo", t["--procura-fundo"]!, 4.5]);
      pares.push(["anel de foco da procura", t["--ring"]!, "--procura-fundo", t["--procura-fundo"]!, 3]);
      if (!escuro) pares.push(["cor da app como texto", t["--app-accent"]!, "--background", t["--background"]!, 4.5]);
      else pares.push(["cor da app como texto", t["--app-accent"]!, "--card", t["--card"]!, 4.5]);
      for (const [nome, a, sobre, b, min] of pares) {
        const r = contraste(a, b);
        assert.ok(r >= min, `${nome} sobre ${sobre} (${a} / ${b}): ${r.toFixed(2)} < ${min}`);
      }
    });
  }
}

test("the frame is 9% of the app colour, the content layer neutral", () => {
  assert.equal(raiz["--moldura-mistura"], "9%");
  for (const t of [raiz, { ...raiz, ...escuroRaiz }]) {
    const c = t["--camada"]!;
    assert.ok(c.slice(1, 3) === c.slice(3, 5) && c.slice(3, 5) === c.slice(5, 7), `--camada ${c} is not neutral`);
  }
  assert.doesNotMatch(css, /\[data-app="[a-z]+"\][^{]*\{[^}]*--sidebar:/, "no per-app sidebar tints any more");
});

test("the app colours stay apart: ≥ 30° of OKLCH hue in light, ≥ 28° in dark (DNS is the slate)", () => {
  for (const escuro of [false, true]) {
    const lista = APPS.filter((a) => a !== "dns").map((a) => [a, matiz(tema(a, escuro)["--app-accent"]!)] as const);
    for (let i = 0; i < lista.length; i++)
      for (let j = i + 1; j < lista.length; j++) {
        const d = Math.abs(lista[i]![1] - lista[j]![1]);
        const dist = Math.min(d, 360 - d);
        assert.ok(dist >= (escuro ? 28 : 30), `${lista[i]![0]} / ${lista[j]![0]} (${escuro ? "escuro" : "claro"}): ${dist.toFixed(0)}°`);
      }
  }
});

test("the search field is the neutral input surface, never the tinted frame (v0.16)", () => {
  const shell = readFileSync(new URL("../css/shell.css", import.meta.url), "utf8");
  const regra = shell.match(/\.m-procura \{([^}]*)\}/)?.[1] ?? "";
  assert.match(regra, /background: var\(--procura-fundo\)/);
  assert.match(regra, /border: 1px solid var\(--procura-borda\)/);
  assert.doesNotMatch(shell + css, /--moldura-procura/);
  // Light: the same white as the form fields; dark: the dark input surface.
  assert.equal(raiz["--procura-fundo"], raiz["--card"]);
  assert.equal(escuroRaiz["--procura-fundo"], escuroRaiz["--card"]);
  // High contrast: white field, black border.
  const pref = readFileSync(new URL("../css/preferencias.css", import.meta.url), "utf8");
  assert.match(pref, /--procura-fundo: #ffffff;\s*--procura-borda: #000000;/);
});

test("the navigation holds no action (v0.16: page actions live in PageHeader)", () => {
  const shell = readFileSync(new URL("../css/shell.css", import.meta.url), "utf8");
  const tsx = readFileSync(new URL("../src/shell.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(shell, /m-acao-principal|m-app-com-acao/);
  assert.doesNotMatch(tsx, /acaoPrincipal|AcaoPrincipal|acao-principal/);
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

// ─── Invalid fields are tinted with --destructive-soft ───────────────────
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

// ─── Content tokens: neutral greys + contrast floor ─────────────────────
// The content (canvas, cards, borders, muted text, inputs) must be NEUTRAL
// in every theme — the app identity lives only in the frame of the shell and
// the accents — and readable in dark.
const NEUTROS = ["--background", "--card", "--popover", "--secondary", "--muted", "--accent", "--border", "--input", "--foreground", "--muted-foreground"];
for (const [tema, t] of [["claro", raiz], ["escuro", { ...raiz, ...escuroRaiz }]] as const) {
  test(`content tokens are neutral grey (${tema})`, () => {
    for (const k of NEUTROS) {
      const h = t[k]!;
      assert.ok(h, `${k} declared`);
      assert.ok(h.slice(1, 3) === h.slice(3, 5) && h.slice(3, 5) === h.slice(5, 7), `${k} ${h} is not neutral`);
    }
  });
  test(`content text and controls keep the contrast floor (${tema})`, () => {
    const pares: [string, string, number][] = [
      ["--foreground", "--background", 7],
      ["--foreground", "--card", 7],
      ["--muted-foreground", "--background", 7],
      ["--muted-foreground", "--card", 7],
      ["--muted-foreground", "--muted", 7],
      ["--muted-foreground", "--secondary", 7],
      ["--secondary-foreground", "--secondary", 7],
      ["--brand", "--card", 4.5],
      ["--brand", "--background", 4.5],
      ["--brand-foreground", "--brand", 4.5],
      ["--brand-soft-foreground", "--brand-soft", 4.5],
      ["--destructive", "--card", 4.5],
      ["--destructive-foreground", "--destructive", 4.5],
      ["--success", "--card", 4.5],
      ["--warning", "--card", 4.5],
      ["--info", "--card", 4.5],
      ["--success-soft-foreground", "--success-soft", 4.5],
      ["--warning-soft-foreground", "--warning-soft", 4.5],
      ["--warning-soft-foreground", "--card", 4.5],
      ["--info-soft-foreground", "--info-soft", 4.5],
      ["--destructive-soft-foreground", "--destructive-soft", 4.5],
      // UI components (WCAG 1.4.11): form borders, the switch when off, focus.
      ["--input", "--card", 3],
      ["--input", "--background", 3],
      ["--ring", "--card", 3],
      ["--ring", "--background", 3],
    ];
    for (const [a, b, min] of pares) {
      const r = contraste(t[a]!, t[b]!);
      assert.ok(r >= min, `${a} on ${b}: ${r.toFixed(2)} < ${min}`);
    }
  });
}
