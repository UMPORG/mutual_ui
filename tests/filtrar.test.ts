import { test } from "node:test";
import assert from "node:assert/strict";
import { filtrarOpcoes, normalizarTexto, partesDestacadas, pontuarCorrespondencia, textoParaCriar } from "../src/filtrar.ts";

const DISTRITOS = ["Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra", "Évora", "Faro", "Guarda", "Leiria", "Lisboa", "Portalegre", "Porto", "Santarém", "Setúbal", "Viana do Castelo", "Vila Real", "Viseu"];
const id = (s: string) => s;

test("normalizar tira acentos, maiúsculas e espaços a mais", () => {
  assert.equal(normalizarTexto("  São  JOÃO da Madeira "), "sao joao da madeira");
  assert.equal(normalizarTexto("Évora"), "evora");
});

test("encontra sem acentos e ordena pelo melhor", () => {
  assert.deepEqual(filtrarOpcoes(DISTRITOS, "evora", id), ["Évora"]);
  assert.deepEqual(filtrarOpcoes(DISTRITOS, "port", id), ["Portalegre", "Porto"]);
  // start of label beats start of a word, which beats anywhere
  assert.deepEqual(filtrarOpcoes(DISTRITOS, "castelo", id), ["Castelo Branco", "Viana do Castelo"]);
  assert.deepEqual(filtrarOpcoes(DISTRITOS, "bra", id), ["Braga", "Bragança", "Castelo Branco", "Coimbra"]);
  // every word must appear, in any order
  assert.deepEqual(filtrarOpcoes(DISTRITOS, "castelo viana", id), ["Viana do Castelo"]);
  assert.deepEqual(filtrarOpcoes(DISTRITOS, "xyz", id), []);
});

test("consulta vazia devolve tudo pela ordem da aplicação; limite", () => {
  assert.equal(filtrarOpcoes(DISTRITOS, "  ", id).length, DISTRITOS.length);
  assert.deepEqual(filtrarOpcoes(DISTRITOS, "", id, 2), ["Aveiro", "Beja"]);
  assert.deepEqual(filtrarOpcoes(DISTRITOS, "a", id, 3).length, 3);
});

test("pontuação: igual > início > início de palavra > meio", () => {
  const igual = pontuarCorrespondencia("Porto", "porto");
  const inicio = pontuarCorrespondencia("Portalegre", "port");
  const palavra = pontuarCorrespondencia("Viana do Castelo", "castelo");
  const meio = pontuarCorrespondencia("Aveiro", "vei");
  assert.ok(igual > inicio && inicio > palavra && palavra > meio && meio > 0);
});

test("opção de criar só quando não existe igual", () => {
  assert.equal(textoParaCriar("  Nova  etiqueta ", ["Quotas"], id), "Nova etiqueta");
  assert.equal(textoParaCriar("evora", DISTRITOS, id), null);
  assert.equal(textoParaCriar("   ", DISTRITOS, id), null);
});

test("destacar a parte escrita, mesmo sem acentos", () => {
  assert.deepEqual(partesDestacadas("Évora", "ev"), [
    { texto: "Év", destaque: true },
    { texto: "ora", destaque: false },
  ]);
  assert.deepEqual(partesDestacadas("Viana do Castelo", "castelo"), [
    { texto: "Viana do ", destaque: false },
    { texto: "Castelo", destaque: true },
  ]);
  assert.deepEqual(partesDestacadas("Porto", ""), [{ texto: "Porto", destaque: false }]);
});
