import { test } from "node:test";
import assert from "node:assert/strict";
import {
  agruparPersonas,
  contextoEntrarComo,
  eListaDePersonas,
  ouvirEntrarComo,
  registarEntrarComo,
  type PersonaDemo,
} from "../src/demo-entrar-dados.ts";

const P = (id: string, grupo: string, nome: string, funcao = "Direção"): PersonaDemo => ({
  id,
  destino: "portal",
  grupo,
  funcao,
  nome,
  email: `${id}@exemplo.pt`,
});

test("registarEntrarComo: register, notify and unregister (only its own context)", () => {
  let avisos = 0;
  const parar = ouvirEntrarComo(() => avisos++);
  const aoEntrar = () => {};
  const a = registarEntrarComo({ destino: "portal", aoEntrar });
  assert.equal(contextoEntrarComo()?.destino, "portal");
  const b = registarEntrarComo({ destino: "cartao", aoEntrar });
  a(); // stale unregister does not remove the newer context
  assert.equal(contextoEntrarComo()?.destino, "cartao");
  b();
  assert.equal(contextoEntrarComo(), null);
  assert.equal(avisos, 3);
  parar();
});

test("eListaDePersonas accepts the Cérebro envelope only", () => {
  assert.equal(eListaDePersonas({ success: true, data: { personas: [] } }), true);
  assert.equal(eListaDePersonas({ success: false, error: "Não encontrado" }), false);
  assert.equal(eListaDePersonas(null), false);
});

test("agruparPersonas keeps the order of the groups and filters without accents", () => {
  const lista = [P("a", "UMP", "Ana Sá"), P("b", "Associação", "João Gonçalves", "Tesoureiro"), P("c", "UMP", "Rui Paço")];
  assert.deepEqual(
    agruparPersonas(lista).map(([g, ps]) => [g, ps.map((p) => p.id)]),
    [
      ["UMP", ["a", "c"]],
      ["Associação", ["b"]],
    ],
  );
  assert.deepEqual(agruparPersonas(lista, "goncalves").map(([g]) => g), ["Associação"]);
  assert.deepEqual(agruparPersonas(lista, "TESOUREIRO")[0]![1].map((p) => p.id), ["b"]);
  assert.deepEqual(agruparPersonas(lista, "ninguém"), []);
});
