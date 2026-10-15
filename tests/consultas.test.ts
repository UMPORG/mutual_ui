import { test } from "vite-plus/test";
import assert from "node:assert/strict";
import { MutationCache, QueryCache } from "@tanstack/react-query";
import { CONSULTA_FRESCA_MS, criarQueryClient, estadoDoErro, repetirConsulta } from "../src/consultas.ts";

class ErroApi extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status}`);
  }
}

test("estadoDoErro: reads `status` from any app's error class; network failures have none", () => {
  assert.equal(estadoDoErro(new ErroApi(404)), 404);
  assert.equal(estadoDoErro({ status: 503 }), 503);
  assert.equal(estadoDoErro(new TypeError("Failed to fetch")), undefined);
  assert.equal(estadoDoErro({ status: "500" }), undefined);
  assert.equal(estadoDoErro(null), undefined);
  assert.equal(estadoDoErro("erro"), undefined);
});

test("repetirConsulta: once, only on a network failure or a 5xx", () => {
  assert.equal(repetirConsulta(0, new TypeError("Failed to fetch")), true);
  assert.equal(repetirConsulta(0, new ErroApi(500)), true);
  assert.equal(repetirConsulta(0, new ErroApi(503)), true);
  for (const s of [400, 401, 403, 404, 409, 422, 429]) assert.equal(repetirConsulta(0, new ErroApi(s)), false, String(s));
  assert.equal(repetirConsulta(1, new ErroApi(503)), false);
  assert.equal(repetirConsulta(1, new TypeError("Failed to fetch")), false);
});

test("criarQueryClient: shared defaults", () => {
  const q = criarQueryClient().getDefaultOptions();
  assert.equal(q.queries?.staleTime, CONSULTA_FRESCA_MS);
  assert.equal(CONSULTA_FRESCA_MS, 60_000);
  assert.equal(q.queries?.refetchOnWindowFocus, false);
  assert.equal(q.queries?.retry, repetirConsulta);
  assert.equal(q.mutations?.retry, false);
});

test("criarQueryClient: keeps the app's caches and overrides", () => {
  const queryCache = new QueryCache();
  const mutationCache = new MutationCache();
  const c = criarQueryClient({ queryCache, mutationCache, defaultOptions: { queries: { staleTime: 5_000 } } });
  assert.equal(c.getQueryCache(), queryCache);
  assert.equal(c.getMutationCache(), mutationCache);
  const q = c.getDefaultOptions();
  assert.equal(q.queries?.staleTime, 5_000);
  assert.equal(q.queries?.refetchOnWindowFocus, false);
  assert.equal(q.queries?.retry, repetirConsulta);
});
