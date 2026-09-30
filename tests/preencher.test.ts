import { test } from "node:test";
import assert from "node:assert/strict";
import {
  aplicarValores,
  compararPropostas,
  escolhaInicial,
  lerCaminho,
  mensagemDoErro,
  valoresDoRascunho,
  valoresEscolhidos,
  valorLegivel,
  type PropostaCampo,
} from "../src/preencher-dados.ts";

const p = (caminho: string, valor: string | number, confianca: PropostaCampo["confianca"] = "alta"): PropostaCampo => ({
  caminho,
  rotulo: caminho,
  valor,
  origem: "página 1, linha 1",
  excerto: "x",
  confianca,
  metodo: "regra",
});

test("comparar: novo, igual (números e espaços), substitui; o zero inicial conta como vazio", () => {
  const l = compararPropostas(
    [p("a.nif", "501234560"), p("a.nome", "Mutualidade  do Vale"), p("n.caixa", 45210.55), p("b.total", 12), p("c.x", 3)],
    { "a.nif": "", "a.nome": "mutualidade do vale", "n.caixa": "0.00", "b.total": 10, "c.x": "3,00" },
  );
  assert.deepEqual(
    l.map((x) => x.diferenca),
    ["novo", "igual", "novo", "substitui", "igual"],
  );
});

test("escolha inicial: só valores novos com confiança alta ou média", () => {
  const l = compararPropostas([p("a", 1), p("b", 2, "baixa"), p("c", 3, "media"), p("d", 4)], { d: 9 });
  assert.deepEqual([...escolhaInicial(l)].sort(), ["a", "c"]);
  assert.deepEqual(valoresEscolhidos(l, new Set(["a", "d"])), { a: 1, d: 4 });
});

test("aplicar ao rascunho por caminhos, sem mexer no resto", () => {
  const r = { identificacao: { nif: "", morada: "Rua A" }, contactos: { telefoneGeral: "" } };
  const n = aplicarValores(r, { "identificacao.nif": "501234560", "contactos.telefoneGeral": "+351213456789" });
  assert.equal(lerCaminho(n, "identificacao.nif"), "501234560");
  assert.equal(lerCaminho(n, "identificacao.morada"), "Rua A");
  assert.equal(r.identificacao.nif, "");
  assert.deepEqual(valoresDoRascunho(n, ["contactos.telefoneGeral", "x.y"]), {
    "contactos.telefoneGeral": "+351213456789",
    "x.y": undefined,
  });
});

test("valores legíveis em pt-PT", () => {
  assert.equal(valorLegivel("2026-11-12T10:00"), "12/11/2026 às 10:00");
  assert.equal(valorLegivel("1932-03-12"), "12/03/1932");
  assert.equal(valorLegivel(1234.5), "1234,5");
  assert.equal(valorLegivel(null), "");
});

test("mensagens de erro do Cérebro", () => {
  assert.equal(mensagemDoErro(422, { error: "Este tipo de ficheiro não é aceite." }), "Este tipo de ficheiro não é aceite.");
  assert.match(mensagemDoErro(403, {}), /Não tem acesso/);
  assert.match(mensagemDoErro(503, null), /não está disponível/);
  assert.match(mensagemDoErro(429, { code: "ERR_RATE_LIMIT", error: "x" }), /limite de documentos/);
});
