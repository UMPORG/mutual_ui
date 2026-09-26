import { test } from "node:test";
import assert from "node:assert/strict";
import {
  agruparOutros,
  atribuirCores,
  avaliarVariacao,
  calcularVariacao,
  corSerie,
  descreverGrafico,
  descreverVariacao,
  formatarVariacao,
  intervaloPagina,
  MAX_SERIES,
  paginasVisiveis,
  proporcoes,
  tabelaDoGrafico,
} from "../src/dados.ts";

const e = (s: string) => s.replace(/[  ]/g, " ");

test("cores seguem a entidade, não a posição depois de filtrar", () => {
  const todas = atribuirCores([
    { key: "a", label: "A" },
    { key: "b", label: "B" },
    { key: "c", label: "C" },
  ]);
  assert.deepEqual(todas.map((s) => s.cor), ["var(--serie-1)", "var(--serie-2)", "var(--serie-3)"]);
  // Filtering out A: pin the survivors' slots so they keep their colour.
  const filtradas = atribuirCores([
    { key: "b", label: "B", color: 2 },
    { key: "c", label: "C", color: 3 },
  ]);
  assert.deepEqual(filtradas.map((s) => s.cor), ["var(--serie-2)", "var(--serie-3)"]);
  // Pinned slots are skipped by the automatic ones.
  const mistas = atribuirCores([
    { key: "x", label: "X" },
    { key: "y", label: "Y", color: 1 },
  ]);
  assert.deepEqual(mistas.map((s) => s.cor), ["var(--serie-2)", "var(--serie-1)"]);
});

test("nunca gera uma nona cor", () => {
  const nove = Array.from({ length: MAX_SERIES + 1 }, (_, i) => ({ key: `s${i}`, label: `S${i}` }));
  assert.throws(() => atribuirCores(nove), /Outros/);
  assert.equal(corSerie("outros"), "var(--serie-outros)");
  assert.equal(corSerie("perigo"), "var(--destructive)");
});

test("agruparOutros mantém as maiores fatias pela ordem original", () => {
  const f = [
    { label: "a", value: 5 },
    { label: "b", value: 1 },
    { label: "c", value: 9 },
    { label: "d", value: 2 },
    { label: "e", value: 3 },
    { label: "f", value: 4 },
  ];
  const r = agruparOutros(f, 5);
  assert.deepEqual(r.map((x) => x.label), ["a", "c", "e", "f", "Outros"]);
  assert.equal(r.at(-1)?.value, 3);
  assert.equal(r.at(-1)?.color, "outros");
  assert.equal(agruparOutros(f.slice(0, 3), 5).length, 3);
  assert.equal(agruparOutros([{ label: "z", value: 0 }, { label: "n", value: Number.NaN }]).length, 0);
});

test("tabela do gráfico: uma linha por categoria, valores formatados", () => {
  const t = tabelaDoGrafico(
    [
      { mes: "2026-01", quotas: 1200.5, eventos: null },
      { mes: "2026-02", quotas: 980, eventos: 45 },
    ],
    "mes",
    [
      { key: "quotas", label: "Quotas" },
      { key: "eventos", label: "Eventos" },
    ],
    { formato: "moeda", rotuloCategoria: "Mês", formatarCategoria: (v) => `M${String(v).slice(5)}` },
  );
  assert.deepEqual(t.cabecalhos, ["Mês", "Quotas", "Eventos"]);
  assert.deepEqual(t.linhas.map((l) => l.map(e)), [
    ["M01", "1200,50 €", "—"],
    ["M02", "980,00 €", "45,00 €"],
  ]);
});

test("descrição para leitores de ecrã", () => {
  const d = descreverGrafico(
    "barras",
    [
      { d: "Braga", n: 12 },
      { d: "Lisboa", n: 40 },
      { d: "Faro", n: 3 },
    ],
    "d",
    [{ key: "n", label: "Associações" }],
  );
  assert.equal(d, "Gráfico de barras com 3 categorias. Máximo 40 (Lisboa), mínimo 3 (Faro).");
  const m = descreverGrafico("linhas", [{ m: "jan", a: 1, b: 2 }], "m", [
    { key: "a", label: "A" },
    { key: "b", label: "B" },
  ]);
  assert.match(m, /^Gráfico de linhas com 1 categoria e 2 séries \(A, B\)\. A: máximo 1 \(jan\)/);
  assert.equal(descreverGrafico("donut", [], "x", []), "Gráfico circular sem dados.");
});

test("variação: cálculo, sentido e avaliação", () => {
  assert.equal(calcularVariacao(110, 100), 0.1);
  assert.equal(calcularVariacao(90, 0), null);
  assert.equal(calcularVariacao(null, 3), null);
  assert.deepEqual(avaliarVariacao(0.1), { sentido: "subiu", avaliacao: "positiva" });
  assert.deepEqual(avaliarVariacao(0.1, "descer"), { sentido: "subiu", avaliacao: "negativa" });
  assert.deepEqual(avaliarVariacao(-0.1, "descer"), { sentido: "desceu", avaliacao: "positiva" });
  assert.deepEqual(avaliarVariacao(0), { sentido: "igual", avaliacao: "neutra" });
  assert.deepEqual(avaliarVariacao(5, "neutro"), { sentido: "subiu", avaliacao: "neutra" });
});

test("variação em texto", () => {
  assert.equal(formatarVariacao(0.123), "+12,3%");
  assert.equal(formatarVariacao(-2.1, "pontos"), "-2,1 p.p.");
  assert.equal(formatarVariacao(340, "numero"), "+340");
  assert.equal(e(formatarVariacao(1250, "moeda")), "+1250,00 €");
  assert.equal(descreverVariacao(0.123, "percentagem", "face ao mês anterior"), "Subiu 12,3% face ao mês anterior.");
  assert.equal(descreverVariacao(-2.1, "pontos"), "Desceu 2,1 pontos percentuais.");
  assert.equal(descreverVariacao(0, "numero", "face a 2025"), "Sem alteração face a 2025.");
});

test("paginação: janela com reticências", () => {
  assert.deepEqual(paginasVisiveis(6, 20), [1, null, 5, 6, 7, null, 20]);
  assert.deepEqual(paginasVisiveis(1, 5), [1, 2, null, 5]);
  assert.deepEqual(paginasVisiveis(3, 5), [1, 2, 3, 4, 5]); // a single hidden page is shown, not "…"
  assert.deepEqual(paginasVisiveis(1, 1), [1]);
  assert.deepEqual(paginasVisiveis(99, 3), [1, 2, 3]);
  assert.deepEqual(paginasVisiveis(1, 0), []);
  assert.deepEqual(intervaloPagina(2, 20, 312), { de: 21, ate: 40 });
  assert.deepEqual(intervaloPagina(16, 20, 312), { de: 301, ate: 312 });
  assert.deepEqual(intervaloPagina(1, 20, 0), { de: 0, ate: 0 });
});

test("proporções ignoram negativos e totais nulos", () => {
  assert.deepEqual(proporcoes([1, 3]), [0.25, 0.75]);
  assert.deepEqual(proporcoes([0, 0]), [0, 0]);
  assert.deepEqual(proporcoes([-1, 2]), [0, 1]);
});
