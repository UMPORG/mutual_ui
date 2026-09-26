import { test } from "node:test";
import assert from "node:assert/strict";
import { agruparConversas, numerarFontes, teclaEnvia, textoParaAnunciar } from "../src/conversa-dados.ts";

test("conversas agrupadas por dia em Lisboa", () => {
  const agora = new Date("2026-09-26T10:00:00Z");
  const g = agruparConversas(
    [
      { id: "a", title: "Quotas de março", updatedAt: "2026-09-26T08:00:00Z" },
      { id: "b", title: "Recibos", updatedAt: "2026-09-25T22:30:00Z" }, // 23:30 in Lisbon → Ontem
      { id: "c", title: "Eventos", updatedAt: "2026-09-21T10:00:00Z" },
      { id: "d", title: "Relatório", updatedAt: "2026-09-01T10:00:00Z" },
      { id: "e", title: "Antiga", updatedAt: "2026-05-01T10:00:00Z" },
      { id: "f", title: "Agora mesmo", updatedAt: "2026-09-26T09:59:00Z" },
    ],
    agora,
  );
  assert.deepEqual(
    g.map((x) => [x.rotulo, x.threads.map((t) => t.id)]),
    [
      ["Hoje", ["f", "a"]],
      ["Ontem", ["b"]],
      ["Últimos 7 dias", ["c"]],
      ["Últimos 30 dias", ["d"]],
      ["Mais antigas", ["e"]],
    ],
  );
  assert.deepEqual(agruparConversas([], agora), []);
});

test("anúncio para leitores de ecrã: texto simples, cortado numa frase", () => {
  assert.equal(textoParaAnunciar("As **quotas** estão pagas [1]."), "As quotas estão pagas.");
  const longo = "Primeira frase com algum conteúdo. ".repeat(30);
  const a = textoParaAnunciar(longo, 200);
  assert.ok(a.length < 260);
  assert.ok(a.endsWith("A resposta continua na conversa."));
  assert.ok(a.includes("conteúdo. A resposta"));
});

test("Enter envia; Shift+Enter e composição (IME) não", () => {
  assert.equal(teclaEnvia({ key: "Enter" }), true);
  assert.equal(teclaEnvia({ key: "Enter", shiftKey: true }), false);
  assert.equal(teclaEnvia({ key: "Enter", isComposing: true }), false);
  assert.equal(teclaEnvia({ key: "Enter", keyCode: 229 }), false);
  assert.equal(teclaEnvia({ key: "a" }), false);
});

test("fontes numeradas pela ordem, respeitando números dados", () => {
  const r = numerarFontes([
    { id: "x", title: "X", href: "/ajuda/x", kind: "ajuda" },
    { id: "y", n: 1, title: "Y", href: "/ajuda/y", kind: "ajuda" },
    { id: "z", title: "Z", href: "/simplex/z", kind: "registo", app: "simplex" },
  ]);
  assert.deepEqual(r.map((f) => f.n), [2, 1, 3]);
});
