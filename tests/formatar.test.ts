import { test } from "node:test";
import assert from "node:assert/strict";
import {
  contar,
  formatarData,
  formatarMoeda,
  formatarNumero,
  formatarPercentagem,
  formatarValor,
  paraData,
  SEM_VALOR,
} from "../src/formatar.ts";

// pt-PT separates thousands with a non-breaking space; normalise for reading.
const e = (s: string) => s.replace(/[  ]/g, " ");

test("números em pt-PT", () => {
  assert.equal(formatarNumero(1234), "1234"); // CLDR pt-PT: grouping from 5 digits
  assert.equal(e(formatarNumero(12345.678)), "12 345,68");
  assert.equal(formatarNumero(3, { casas: 2 }), "3,00");
  assert.equal(formatarNumero(-3, { sinal: true }), "-3");
  assert.equal(formatarNumero(4, { sinal: true }), "+4");
  assert.equal(formatarNumero(0, { sinal: true }), "0");
  assert.equal(e(formatarNumero(12345, { compacto: true })), "12,3 mil");
  assert.equal(e(formatarNumero(2_500_000, { compacto: true })), "2,5 M");
  assert.equal(e(formatarNumero("12345.5")), "12 345,5"); // numeric strings (Decimal columns)
});

test("valores em falta nunca mostram NaN nem undefined", () => {
  for (const v of [null, undefined, "", "abc", Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(formatarNumero(v as number), SEM_VALOR);
    assert.equal(formatarMoeda(v as number), SEM_VALOR);
    assert.equal(formatarPercentagem(v as number), SEM_VALOR);
  }
  assert.equal(formatarData(null), SEM_VALOR);
  assert.equal(formatarData("não é data"), SEM_VALOR);
});

test("moeda: euro depois do valor, duas casas", () => {
  assert.equal(e(formatarMoeda(1234.5)), "1234,50 €");
  assert.equal(e(formatarMoeda(98765.4)), "98 765,40 €");
  assert.equal(e(formatarMoeda(-12.3, { sinal: true })), "-12,30 €");
  assert.equal(e(formatarMoeda(2_500_000, { compacto: true })), "2,5 M €");
  assert.equal(e(formatarMoeda(10, { casas: 0 })), "10 €");
});

test("percentagem: fração por omissão, escala 'cem' para valores já em %", () => {
  assert.equal(formatarPercentagem(0.125), "12,5%");
  assert.equal(formatarPercentagem(12.5, { escala: "cem" }), "12,5%");
  assert.equal(formatarPercentagem(0.5), "50%");
  assert.equal(formatarPercentagem(0.034, { sinal: true }), "+3,4%");
  assert.equal(formatarPercentagem(1 / 3, { casas: 0 }), "33%");
});

test("formatarValor escolhe o formato e compacta quando pedido", () => {
  assert.equal(e(formatarValor(1234.5, "moeda")), "1234,50 €");
  assert.equal(formatarValor(0.2, "percentagem"), "20%");
  assert.equal(formatarValor(41.7, "inteiro"), "42");
  assert.equal(e(formatarValor(1_234_567, "inteiro", true)), "1,2 M");
  assert.equal(formatarValor(7, (n) => `${n} dias`), "7 dias");
  assert.equal(formatarValor(0.25, { tipo: "percentagem", opcoes: { casas: 2 } }), "25,00%");
});

test("datas em Europe/Lisbon, sem deslocar dias", () => {
  assert.equal(formatarData("2026-10-03"), "03/10/2026");
  assert.equal(formatarData("2026-10-03", "longa"), "sábado, 3 de outubro de 2026");
  assert.equal(formatarData("2026-10-03", "media"), "3 de outubro de 2026");
  assert.equal(formatarData("2026-10-03", "mesAno"), "outubro de 2026");
  assert.equal(formatarData("2026-10-03", "diaMes"), "3 out.");
  assert.equal(formatarData("2026-10-03", "mesAnoCurto"), "out. 2026");
  // 23:30 UTC on 1 July is 00:30 on 2 July in Lisbon (summer time).
  assert.equal(formatarData("2026-07-01T23:30:00Z", "dataHora"), "02/07/2026, 00:30");
  assert.equal(formatarData("2026-01-15T09:05:00Z", "hora"), "09:05");
  assert.equal(formatarData(new Date(Date.UTC(2026, 0, 1, 12))), "01/01/2026");
  assert.equal(paraData("2026-02-30T99:00"), null);
});

test("contar pluraliza", () => {
  assert.equal(contar(1, "associação", "associações"), "1 associação");
  assert.equal(contar(0, "associação", "associações"), "0 associações");
  assert.equal(e(contar(12000, "pessoa", "pessoas")), "12 000 pessoas");
});
