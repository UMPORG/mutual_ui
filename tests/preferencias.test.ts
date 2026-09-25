import { test } from "node:test";
import assert from "node:assert/strict";
import {
  codificarPreferencias,
  cookiePreferencias,
  descodificarPreferencias,
  lerCookiePreferencias,
  PREFERENCIAS_PADRAO,
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

test("cookie is scoped to the parent domain when given", () => {
  assert.match(cookiePreferencias(PREFERENCIAS_PADRAO, ".mutualismo.pt"), /Domain=\.mutualismo\.pt/);
  assert.doesNotMatch(cookiePreferencias(PREFERENCIAS_PADRAO), /Domain=/);
});

test("automatic theme follows the OS", () => {
  assert.equal(temaEscuro(PREFERENCIAS_PADRAO, true), true);
  assert.equal(temaEscuro({ ...PREFERENCIAS_PADRAO, tema: "claro" }, true), false);
  assert.equal(temaEscuro({ ...PREFERENCIAS_PADRAO, tema: "contraste" }, true), false);
});
