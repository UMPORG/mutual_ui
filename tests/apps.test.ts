import { test } from "node:test";
import assert from "node:assert/strict";
import { MUTUAL_APPS, appsDisponiveis } from "../src/apps.ts";

test("appsDisponiveis keeps the ecosystem order, the Portal first, and drops null apps", () => {
  const eu = { monitor: { nome: "Informática" }, dns: { nome: "Informática" }, backoffice: null, saude: undefined };
  assert.deepEqual(appsDisponiveis(eu), ["portal", "dns", "monitor", "carta"]);
});

test("appsDisponiveis lists every app of MUTUAL_APPS the profile opens (new apps included)", () => {
  const todas = Object.fromEntries(MUTUAL_APPS.map((a) => [a.id, { nome: "x" }]));
  assert.deepEqual(appsDisponiveis(todas), ["portal", ...MUTUAL_APPS.map((a) => a.id)]);
  assert.ok(!appsDisponiveis({ simplex: { nome: "x" } }).includes("qr"), "no QR without Eventos");
  assert.ok(appsDisponiveis({ eventos: { nome: "x" } }).includes("qr"), "QR comes with Eventos");
  assert.ok(appsDisponiveis(todas).includes("protocolos"));
  assert.ok(appsDisponiveis(todas).includes("monitor"));
});

test("appsDisponiveis without data still offers the Portal and the public Carta Social Mutualista", () => {
  assert.deepEqual(appsDisponiveis(null), ["portal", "carta"]);
  assert.deepEqual(appsDisponiveis({ cartao: { nome: "x" }, desconhecida: {} }), ["portal", "carta"]);
});
