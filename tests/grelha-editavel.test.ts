import { test } from "vite-plus/test";
import assert from "node:assert/strict";
import {
  analisarColagem,
  aplicarColagem,
  chaveCelula,
  converterTexto,
  moverNaGrelha,
  textoDaCelula,
  type ColunaGrelha,
  type LinhaGrelha,
} from "../src/grelha-editavel-logica.ts";

const nota: ColunaGrelha = { chave: "nota", rotulo: "Nota", tipo: "numero", min: 0, max: 20, casas: 1, obrigatoria: true };
const data: ColunaGrelha = { chave: "d", rotulo: "Data", tipo: "data" };
const sn: ColunaGrelha = { chave: "ok", rotulo: "Aprovado", tipo: "simNao" };
const esc: ColunaGrelha = {
  chave: "r",
  rotulo: "Resultado",
  tipo: "escolha",
  opcoes: [
    { valor: "aprovado", rotulo: "Aprovado" },
    { valor: "ausente", rotulo: "Ausência" },
  ],
};
const txt: ColunaGrelha = { chave: "t", rotulo: "Obs", tipo: "texto" };
const ro: ColunaGrelha = { chave: "x", rotulo: "Turma", tipo: "texto", apenasLeitura: true };

test("converterTexto: números com vírgula, limites, casas e obrigatório", () => {
  assert.deepEqual(converterTexto(nota, "7,5"), { ok: true, valor: 7.5 });
  assert.deepEqual(converterTexto(nota, " 7.5 "), { ok: true, valor: 7.5 });
  assert.deepEqual(converterTexto(nota, "20"), { ok: true, valor: 20 });
  assert.equal(converterTexto(nota, "21").ok, false);
  assert.equal(converterTexto(nota, "-1").ok, false);
  assert.equal(converterTexto(nota, "7,55").ok, false);
  assert.equal(converterTexto(nota, "abc").ok, false);
  assert.equal(converterTexto(nota, "").ok, false);
  assert.deepEqual(converterTexto({ ...nota, obrigatoria: false }, ""), { ok: true, valor: null });
  assert.deepEqual(converterTexto({ chave: "n", rotulo: "N", tipo: "numero" }, "1.234,5"), { ok: true, valor: 1234.5 });
});

test("converterTexto: datas, sim/não, escolha e texto", () => {
  assert.deepEqual(converterTexto(data, "03/10/2026"), { ok: true, valor: "2026-10-03" });
  assert.deepEqual(converterTexto(data, "2026-10-03"), { ok: true, valor: "2026-10-03" });
  assert.equal(converterTexto(data, "31/02/2026").ok, false);
  assert.deepEqual(converterTexto(sn, "Sim"), { ok: true, valor: true });
  assert.deepEqual(converterTexto(sn, "não"), { ok: true, valor: false });
  assert.deepEqual(converterTexto(sn, "Nao"), { ok: true, valor: false });
  assert.equal(converterTexto(sn, "talvez").ok, false);
  assert.deepEqual(converterTexto(esc, "ausencia"), { ok: true, valor: "ausente" });
  assert.deepEqual(converterTexto(esc, "aprovado"), { ok: true, valor: "aprovado" });
  assert.equal(converterTexto(esc, "outro").ok, false);
  assert.deepEqual(converterTexto(txt, "  olá "), { ok: true, valor: "olá" });
});

test("textoDaCelula: formato de apresentação pt-PT", () => {
  assert.equal(textoDaCelula(nota, 7.5), "7,5");
  assert.equal(textoDaCelula(nota, 8), "8,0");
  assert.equal(textoDaCelula(data, "2026-10-03"), "03/10/2026");
  assert.equal(textoDaCelula(sn, false), "Não");
  assert.equal(textoDaCelula(esc, "ausente"), "Ausência");
  assert.equal(textoDaCelula(nota, null), "");
});

test("analisarColagem: tabulações, quebras de linha, aspas e fim de linha final", () => {
  assert.deepEqual(analisarColagem("7,5\tSim\r\n12\tNão\r\n"), [
    ["7,5", "Sim"],
    ["12", "Não"],
  ]);
  assert.deepEqual(analisarColagem("a\t\tb"), [["a", "", "b"]]);
  assert.deepEqual(analisarColagem('"linha1\nlinha2"\t"diz ""olá"""'), [["linha1\nlinha2", 'diz "olá"']]);
  assert.deepEqual(analisarColagem("9"), [["9"]]);
  assert.deepEqual(analisarColagem(""), []);
});

test("aplicarColagem: preenche o bloco, regista erros e conta o que sai da grelha", () => {
  const colunas = [nota, sn, ro];
  const linhas: LinhaGrelha[] = [
    { id: "a", nome: "Ana", valores: { nota: 10 } },
    { id: "b", nome: "Bruno", valores: {} },
  ];
  const r = aplicarColagem(colunas, linhas, { linha: 0, coluna: 0 }, [
    ["10", "Sim", "A"],
    ["x", "Não", "A", "extra"],
    ["5", "Sim"],
  ]);
  // «10» equals the stored value: no change. Row 3 does not exist.
  assert.deepEqual(r.alteracoes, [
    { linhaId: "a", chave: "ok", valor: true },
    { linhaId: "b", chave: "ok", valor: false },
  ]);
  assert.deepEqual(
    r.erros.map((e) => [e.linhaId, e.chave, e.texto]),
    [
      ["a", "x", "A"],
      ["b", "nota", "x"],
      ["b", "x", "A"],
    ],
  );
  assert.equal(r.ignoradas, 3); // «extra» + the two cells of the missing third row
  assert.equal(r.total, 9);
});

test("aplicarColagem: começa na célula de origem", () => {
  const linhas: LinhaGrelha[] = [
    { id: "a", nome: "Ana", valores: {} },
    { id: "b", nome: "Bruno", valores: {} },
  ];
  const r = aplicarColagem([nota, sn], linhas, { linha: 1, coluna: 1 }, [["Sim"]]);
  assert.deepEqual(r.alteracoes, [{ linhaId: "b", chave: "ok", valor: true }]);
});

test("chaveCelula distingue linha e coluna", () => {
  assert.notEqual(chaveCelula("a1", "b"), chaveCelula("a", "1b"));
});

test("moverNaGrelha: setas, extremos da linha, Ctrl+Home/End e páginas", () => {
  const p = (linha: number, coluna: number) => ({ linha, coluna });
  // 4 rows × 3 columns
  assert.deepEqual(moverNaGrelha(p(1, 1), "ArrowRight", 4, 3, false), p(1, 2));
  assert.deepEqual(moverNaGrelha(p(1, 2), "ArrowRight", 4, 3, false), p(1, 2));
  assert.deepEqual(moverNaGrelha(p(1, 0), "ArrowLeft", 4, 3, false), p(1, 0));
  assert.deepEqual(moverNaGrelha(p(1, 1), "ArrowDown", 4, 3, false), p(2, 1));
  assert.deepEqual(moverNaGrelha(p(3, 1), "ArrowDown", 4, 3, false), p(3, 1));
  assert.deepEqual(moverNaGrelha(p(0, 1), "ArrowUp", 4, 3, false), p(0, 1));
  assert.deepEqual(moverNaGrelha(p(2, 1), "Home", 4, 3, false), p(2, 0));
  assert.deepEqual(moverNaGrelha(p(2, 1), "End", 4, 3, false), p(2, 2));
  assert.deepEqual(moverNaGrelha(p(2, 1), "Home", 4, 3, true), p(0, 0));
  assert.deepEqual(moverNaGrelha(p(1, 1), "End", 4, 3, true), p(3, 2));
  assert.deepEqual(moverNaGrelha(p(1, 1), "PageDown", 4, 3, false), p(3, 1));
  assert.deepEqual(moverNaGrelha(p(1, 1), "PageUp", 4, 3, false), p(0, 1));
  assert.deepEqual(moverNaGrelha(p(1, 1), "a", 4, 3, false), p(1, 1));
  assert.deepEqual(moverNaGrelha(p(0, 0), "ArrowDown", 0, 3, false), p(0, 0));
});

test("aplicarColagem: o que passa da última coluna de dados (p. ex. a coluna de ações) conta como fora da tabela", () => {
  const linhas: LinhaGrelha[] = [{ id: "a", nome: "Ana", valores: {} }];
  const r = aplicarColagem([nota, sn], linhas, { linha: 0, coluna: 1 }, [["Sim", "x", "y"]]);
  assert.deepEqual(r.alteracoes, [{ linhaId: "a", chave: "ok", valor: true }]);
  assert.equal(r.ignoradas, 2);
  assert.equal(r.erros.length, 0);
});

test("moverNaGrelha: uma coluna extra à direita (ações) entra na navegação e as setas param nela", () => {
  const p = (linha: number, coluna: number) => ({ linha, coluna });
  assert.deepEqual(moverNaGrelha(p(0, 6), "ArrowRight", 3, 8, false), p(0, 7));
  assert.deepEqual(moverNaGrelha(p(0, 7), "ArrowRight", 3, 8, false), p(0, 7));
  assert.deepEqual(moverNaGrelha(p(1, 3), "End", 3, 8, false), p(1, 7));
});
