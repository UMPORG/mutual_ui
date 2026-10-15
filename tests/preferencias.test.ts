import { test } from "vite-plus/test";
import assert from "node:assert/strict";
import {
  codificarPreferencias,
  cookiePreferencias,
  descodificarPreferencias,
  lerCookiePreferencias,
  PREFERENCIAS_PADRAO,
  PREFERENCIAS_SCRIPT,
  temaEscuro,
} from "../src/preferencias.ts";

test("round-trips every choice", () => {
  const p = { ...PREFERENCIAS_PADRAO, tema: "contraste" as const, texto: "150" as const, espaco: "amplo" as const, letraLegivel: true, guiaLeitura: true };
  assert.deepEqual(descodificarPreferencias(codificarPreferencias(p)), p);
});

test("ignores garbage and falls back to defaults", () => {
  assert.deepEqual(descodificarPreferencias("t=roxo;x=999;e=?;zz"), PREFERENCIAS_PADRAO);
  assert.deepEqual(descodificarPreferencias(undefined), PREFERENCIAS_PADRAO);
});

test("reads the cookie among others", () => {
  const c = `a=1; mutual_pref=${encodeURIComponent("t=escuro;x=125;e=normal;s")}; b=2`;
  const p = lerCookiePreferencias(c);
  assert.equal(p.tema, "escuro");
  assert.equal(p.texto, "125");
  assert.equal(p.sublinharLigacoes, true);
});

test("cookie is host-only (same origin for every app)", () => {
  assert.doesNotMatch(cookiePreferencias(PREFERENCIAS_PADRAO), /Domain=/);
  assert.match(cookiePreferencias(PREFERENCIAS_PADRAO), /Path=\//);
});

test("automatic theme follows the OS", () => {
  assert.equal(temaEscuro(PREFERENCIAS_PADRAO, true), true);
  assert.equal(temaEscuro({ ...PREFERENCIAS_PADRAO, tema: "claro" }, true), false);
  assert.equal(temaEscuro({ ...PREFERENCIAS_PADRAO, tema: "contraste" }, true), false);
});

/** Runs `PREFERENCIAS_SCRIPT` against a minimal <html> stand-in. */
function correrScript(dataApp: string | undefined, guardado: Record<string, string> | "falha", cookie = "") {
  const dataset: Record<string, string> = dataApp ? { app: dataApp } : {};
  const classes = new Set<string>();
  const d = {
    dataset,
    style: {} as Record<string, string>,
    classList: { toggle: (c: string, on: boolean) => (on ? classes.add(c) : classes.delete(c)) },
  };
  const documento = { documentElement: d, cookie, createElement: () => ({}), head: { appendChild: () => {} } };
  const armazem = {
    getItem: (k: string) => {
      if (guardado === "falha") throw new Error("SecurityError");
      return guardado[k] ?? null;
    },
  };
  new Function("document", "localStorage", "matchMedia", PREFERENCIAS_SCRIPT)(documento, armazem, () => ({ matches: false }));
  return { dataset, classes };
}

test("head script: a collapsed AppShell menu is marked on <html> before first paint", () => {
  assert.equal(correrScript("backoffice", { "backoffice.navegacao-recolhida": "1" }).dataset.navegacao, "recolhida");
  assert.equal(correrScript("backoffice", { "backoffice.navegacao-recolhida": "0" }).dataset.navegacao, undefined);
  // Another app's choice does not apply here.
  assert.equal(correrScript("dns", { "backoffice.navegacao-recolhida": "1" }).dataset.navegacao, undefined);
  assert.equal(correrScript(undefined, { "undefined.navegacao-recolhida": "1" }).dataset.navegacao, undefined);
});

test("head script: blocked storage still applies the Acessibilidade choices", () => {
  const r = correrScript("backoffice", "falha", `mutual_pref=${encodeURIComponent("t=escuro;x=125;e=amplo")}`);
  assert.equal(r.dataset.navegacao, undefined);
  assert.equal(r.dataset.tema, "escuro");
  assert.equal(r.dataset.texto, "125");
  assert.equal(r.dataset.espaco, "amplo");
  assert.ok(r.classes.has("dark"));
});
