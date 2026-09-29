import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dicaDispensada, dispensarDica, reporDica, subscreverDicas } from "../src/dicas-estado.ts";

// ─── Memory ─────────────────────────────────────────────────────────────

function armazenamento(): Storage {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; },
    clear: () => m.clear(),
    getItem: (k: string) => m.get(k) ?? null,
    key: (i: number) => [...m.keys()][i] ?? null,
    removeItem: (k: string) => void m.delete(k),
    setItem: (k: string, v: string) => void m.set(k, v),
  };
}

test("closing a dica is remembered on the device and can be undone", () => {
  const ls = armazenamento();
  Object.defineProperty(globalThis, "localStorage", { value: ls, configurable: true });
  assert.equal(dicaDispensada("teste.dica.a"), false);
  let avisos = 0;
  const parar = subscreverDicas(() => avisos++);
  dispensarDica("teste.dica.a");
  assert.equal(dicaDispensada("teste.dica.a"), true);
  assert.equal(ls.getItem("teste.dica.a"), "1");
  reporDica("teste.dica.a");
  assert.equal(dicaDispensada("teste.dica.a"), false);
  assert.equal(avisos, 2);
  parar();
  dispensarDica("teste.dica.b");
  assert.equal(avisos, 2, "no calls after unsubscribing");
});

test("blocked storage never throws; the choice lasts for the session", () => {
  const bloqueado = {
    getItem: () => { throw new Error("SecurityError"); },
    setItem: () => { throw new Error("QuotaExceededError"); },
    removeItem: () => { throw new Error("SecurityError"); },
  };
  Object.defineProperty(globalThis, "localStorage", { value: bloqueado, configurable: true });
  assert.equal(dicaDispensada("teste.dica.c"), false);
  assert.doesNotThrow(() => dispensarDica("teste.dica.c"));
  assert.equal(dicaDispensada("teste.dica.c"), true);
  assert.doesNotThrow(() => reporDica("teste.dica.c"));
  assert.equal(dicaDispensada("teste.dica.c"), false);
});

// ─── Contrast (light, dark, high contrast) ──────────────────────────────

const tokens = readFileSync(new URL("../css/tokens.css", import.meta.url), "utf8");
const preferencias = readFileSync(new URL("../css/preferencias.css", import.meta.url), "utf8");

function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
function declaracoes(css: string, seletor: RegExp): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sel = m[1]!.replace(/\/\*[\s\S]*?\*\//g, "").trim();
    if (!seletor.test(sel)) continue;
    for (const d of m[2]!.matchAll(/(--[\w-]+):\s*(#[0-9a-f]{6})/gi)) out[d[1]!] = d[2]!.toLowerCase();
  }
  return out;
}

const claro = declaracoes(tokens, /^:root$/);
const escuro = { ...claro, ...declaracoes(tokens, /^\.dark$/) };
const altoContraste = { ...claro, ...declaracoes(preferencias, /^html\.contraste$/) };

/** The floor every theme of the dica must keep (also used by apps that re-theme it). */
export function verificarDica(t: Record<string, string>, fundos: string[], nome: string): void {
  const nota = t["--dica"]!;
  assert.ok(nota, `${nome}: --dica declared`);
  assert.ok(contraste(t["--dica-foreground"]!, nota) >= 7, `${nome}: title ≥ 7:1`);
  assert.ok(contraste(t["--dica-texto"]!, nota) >= 7, `${nome}: body ≥ 7:1`);
  assert.ok(contraste(t["--dica-ligacao"]!, nota) >= 7, `${nome}: «Saber mais» ≥ 7:1`);
  assert.ok(contraste(t["--dica-icone"]!, nota) >= 4.5, `${nome}: icon ≥ 4.5:1`);
  assert.ok(contraste(t["--dica-borda"]!, nota) >= 3, `${nome}: border ≥ 3:1 on the note`);
  for (const f of fundos) {
    assert.ok(contraste(t["--dica-borda"]!, f) >= 3, `${nome}: border ≥ 3:1 on the page ${f}`);
    // The «reabrir» button sits on the page, not on the note.
    assert.ok(contraste(t["--dica-texto"]!, f) >= 7, `${nome}: «reabrir» text ≥ 7:1 on ${f}`);
  }
}

test("dica tokens: light theme", () => verificarDica(claro, [claro["--background"]!, claro["--card"]!], "claro"));
test("dica tokens: dark theme", () => verificarDica(escuro, [escuro["--background"]!, escuro["--card"]!], "escuro"));
test("dica tokens: high contrast", () => verificarDica(altoContraste, ["#ffffff"], "alto contraste"));
