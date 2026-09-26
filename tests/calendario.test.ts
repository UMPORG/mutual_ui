import { test } from "node:test";
import assert from "node:assert/strict";
import {
  compararDatas,
  dentroDoIntervalo,
  diaDaSemana,
  diasNoMes,
  formatarDataCurta,
  grelhaDoMes,
  hojeLisboa,
  inicioDaSemana,
  interpretarData,
  intervalosRapidos,
  lerIso,
  limitarData,
  moverFoco,
  rotuloDoDia,
  somarDias,
  somarMeses,
  tituloDoMes,
} from "../src/calendario.ts";

test("lerIso valida dias reais", () => {
  assert.deepEqual(lerIso("2026-10-03"), { ano: 2026, mes: 10, dia: 3 });
  assert.equal(lerIso("2026-02-29"), null);
  assert.deepEqual(lerIso("2028-02-29"), { ano: 2028, mes: 2, dia: 29 });
  assert.equal(lerIso("2026-13-01"), null);
  assert.equal(lerIso("03/10/2026"), null);
  assert.equal(diasNoMes(2026, 2), 28);
});

test("hoje é o dia em Lisboa, qualquer que seja o fuso do aparelho", () => {
  // 23:30 UTC on 31 March 2026 is already 1 April in Lisbon (summer time, UTC+1).
  assert.equal(hojeLisboa(new Date("2026-03-31T23:30:00Z")), "2026-04-01");
  // 23:30 UTC on 15 January is still 15 January in Lisbon (UTC+0).
  assert.equal(hojeLisboa(new Date("2026-01-15T23:30:00Z")), "2026-01-15");
});

test("somar dias e meses atravessa a mudança de hora sem saltar dias", () => {
  assert.equal(somarDias("2026-03-28", 1), "2026-03-29");
  assert.equal(somarDias("2026-03-29", 1), "2026-03-30");
  assert.equal(somarDias("2026-10-24", 2), "2026-10-26");
  assert.equal(somarDias("2026-12-31", 1), "2027-01-01");
  assert.equal(somarMeses("2026-01-31", 1), "2026-02-28");
  assert.equal(somarMeses("2026-03-15", -3), "2025-12-15");
  assert.equal(somarMeses("2026-10-03", 12), "2027-10-03");
});

test("semana começa à segunda-feira", () => {
  assert.equal(diaDaSemana("2026-10-05"), 0); // segunda
  assert.equal(diaDaSemana("2026-10-04"), 6); // domingo
  assert.equal(inicioDaSemana("2026-10-04"), "2026-09-28");
  const g = grelhaDoMes(2026, 10);
  assert.equal(g.length, 6);
  assert.equal(g[0]![0]!.iso, "2026-09-28");
  assert.equal(g[0]![0]!.fora, true);
  assert.equal(g[0]![3]!.iso, "2026-10-01");
  assert.equal(g[0]![3]!.fora, false);
  assert.ok(g.every((s) => s.length === 7));
});

test("nomes em pt-PT", () => {
  assert.equal(tituloDoMes(2026, 10), "outubro de 2026");
  assert.equal(rotuloDoDia("2026-10-03"), "sábado, 3 de outubro de 2026");
  assert.equal(formatarDataCurta("2026-10-03"), "03/10/2026");
  assert.equal(formatarDataCurta(null), "");
});

test("interpretar o que a pessoa escreve", () => {
  const hoje = "2026-09-26";
  assert.equal(interpretarData("3/10/2026", hoje), "2026-10-03");
  assert.equal(interpretarData("03-10-2026", hoje), "2026-10-03");
  assert.equal(interpretarData("3.10.26", hoje), "2026-10-03");
  assert.equal(interpretarData("03102026", hoje), "2026-10-03");
  assert.equal(interpretarData("2026-10-03", hoje), "2026-10-03");
  assert.equal(interpretarData("hoje", hoje), "2026-09-26");
  assert.equal(interpretarData("Amanhã", hoje), "2026-09-27");
  assert.equal(interpretarData("ontem", hoje), "2026-09-25");
  assert.equal(interpretarData("31/02/2026", hoje), null);
  assert.equal(interpretarData("10/3", hoje), null);
  assert.equal(interpretarData("", hoje), null);
});

test("comparar, limitar, intervalo", () => {
  assert.equal(compararDatas("2026-01-01", "2026-01-02"), -1);
  assert.equal(limitarData("2026-01-01", "2026-02-01", null), "2026-02-01");
  assert.equal(limitarData("2026-05-01", null, "2026-03-01"), "2026-03-01");
  assert.equal(dentroDoIntervalo("2026-01-05", "2026-01-10", "2026-01-01"), true);
  assert.equal(dentroDoIntervalo("2026-01-05", "2026-01-01", null), false);
});

test("navegação por teclado na grelha", () => {
  assert.equal(moverFoco("2026-10-01", "ArrowLeft"), "2026-09-30");
  assert.equal(moverFoco("2026-10-01", "ArrowDown"), "2026-10-08");
  assert.equal(moverFoco("2026-10-01", "Home"), "2026-09-28");
  assert.equal(moverFoco("2026-10-01", "End"), "2026-10-04");
  assert.equal(moverFoco("2026-10-31", "PageDown"), "2026-11-30");
  assert.equal(moverFoco("2026-10-31", "PageUp", true), "2025-10-31");
  assert.equal(moverFoco("2026-10-31", "a"), null);
});

test("intervalos rápidos", () => {
  const r = intervalosRapidos("2026-09-26");
  const por = Object.fromEntries(r.map((x) => [x.id, [x.inicio, x.fim]]));
  assert.deepEqual(por["7d"], ["2026-09-20", "2026-09-26"]);
  assert.deepEqual(por["mes"], ["2026-09-01", "2026-09-26"]);
  assert.deepEqual(por["mes-anterior"], ["2026-08-01", "2026-08-31"]);
  assert.deepEqual(por["ano"], ["2026-01-01", "2026-09-26"]);
});
