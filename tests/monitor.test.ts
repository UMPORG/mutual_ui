import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CABECALHO_PEDIDO,
  cabecalhosComPedido,
  criarOnRequestError,
  eRuido,
  pedidoIdDe,
  reportarErro,
  reporTravoes,
  serializarErro,
} from "../src/monitor.ts";

type Chamada = { url: string; init: RequestInit };
function fetchFalso(estado = 201) {
  const chamadas: Chamada[] = [];
  const f = (async (url: string, init: RequestInit) => {
    chamadas.push({ url, init });
    return new Response("{}", { status: estado });
  }) as unknown as typeof fetch;
  return { f, chamadas };
}

test("serializarErro: tipo, mensagem, stack, causa e digest, com limites", () => {
  const causa = new TypeError("fetch failed");
  const e = Object.assign(new Error("Falhou a carregar", { cause: causa }), { digest: "123456789" });
  const s = serializarErro(e);
  assert.equal(s.tipo, "Error");
  assert.equal(s.mensagem, "Falhou a carregar");
  assert.match(s.causa ?? "", /TypeError: fetch failed/);
  assert.equal(s.digest, "123456789");
  assert.equal(serializarErro("texto").mensagem, "texto");
  assert.equal(serializarErro({ a: 1 }).tipo, "NaoErro");
  assert.equal(serializarErro(new Error("x".repeat(9000))).mensagem.length, 4000);
});

test("o ruído dos browsers não é enviado", () => {
  assert.equal(eRuido(serializarErro(new Error("ResizeObserver loop completed with undelivered notifications."))), true);
  assert.equal(eRuido(serializarErro("Script error.")), true);
  assert.equal(eRuido(serializarErro(new Error("Cannot read properties of undefined"))), false);
});

test("id do pedido: só formatos seguros", () => {
  assert.equal(pedidoIdDe(new Headers({ [CABECALHO_PEDIDO]: "abc-12345678" })), "abc-12345678");
  assert.equal(pedidoIdDe({ [CABECALHO_PEDIDO]: ["id-da-lista-1"] }), "id-da-lista-1");
  assert.equal(pedidoIdDe({ [CABECALHO_PEDIDO]: "mau id com espaços" }), null);
  assert.equal(pedidoIdDe(null), null);
  assert.deepEqual(cabecalhosComPedido("abc-12345678"), { [CABECALHO_PEDIDO]: "abc-12345678" });
  assert.deepEqual(cabecalhosComPedido("x"), {});
});

test("reportarErro do servidor precisa da chave e envia-a no cabeçalho", async () => {
  const { f, chamadas } = fetchFalso();
  assert.equal(await reportarErro(new Error("x"), { app: "eventos", lado: "servidor", fetch: f }), false);
  assert.equal(chamadas.length, 0);
  const ok = await reportarErro(new Error("Falhou"), {
    app: "eventos",
    lado: "servidor",
    chave: "mak_live_x.y",
    endpoint: "http://cerebro:4000/api/v1/monitor/erros",
    fetch: f,
  });
  assert.equal(ok, true);
  const c = chamadas[0]!;
  assert.equal(c.url, "http://cerebro:4000/api/v1/monitor/erros");
  assert.equal((c.init.headers as Record<string, string>)["x-machine-key"], "mak_live_x.y");
  const corpo = JSON.parse(String(c.init.body));
  assert.equal(corpo.app, "eventos");
  assert.equal(corpo.lado, "servidor");
  assert.equal(corpo.mensagem, "Falhou");
});

test("reportarErro do browser: sem chave, o mesmo erro no máximo uma vez por minuto", async () => {
  reporTravoes();
  const { f, chamadas } = fetchFalso();
  const o = { app: "simplex" as const, lado: "browser" as const, fetch: f, url: "/simplex/balancos" };
  await reportarErro(new Error("Repetido"), o);
  await reportarErro(new Error("Repetido"), o);
  await reportarErro(new Error("Outro"), o);
  assert.equal(chamadas.length, 2);
  assert.equal((chamadas[0]!.init.headers as Record<string, string>)["x-machine-key"], undefined);
  assert.equal(chamadas[0]!.url, "/api/v1/monitor/erros");
});

test("reportarErro nunca lança (rede em baixo)", async () => {
  const f = (async () => {
    throw new Error("sem rede");
  }) as unknown as typeof fetch;
  assert.equal(await reportarErro(new Error("x"), { app: "portal", lado: "servidor", chave: "k", fetch: f }), false);
});

test("criarOnRequestError envia o caminho, o id do pedido e o contexto do Next", async () => {
  const { f, chamadas } = fetchFalso();
  const onRequestError = criarOnRequestError({ app: "dns", cerebroUrl: "http://c:4000/", chave: "k", versao: "abc1234", fetch: f });
  await onRequestError(
    Object.assign(new Error("boom"), { digest: "999" }),
    { path: "/dns/servidores?x=1", method: "GET", headers: { [CABECALHO_PEDIDO]: "pedido-1234567" } },
    { routerKind: "App Router", routePath: "/servidores", routeType: "render", renderSource: "react-server-components" },
  );
  const corpo = JSON.parse(String(chamadas[0]!.init.body));
  assert.equal(chamadas[0]!.url, "http://c:4000/api/v1/monitor/erros");
  assert.equal(corpo.pedidoId, "pedido-1234567");
  assert.equal(corpo.digest, "999");
  assert.equal(corpo.versao, "abc1234");
  assert.equal(corpo.contexto.routePath, "/servidores");
  const semChave = criarOnRequestError({ app: "dns", cerebroUrl: "http://c", chave: undefined, fetch: f });
  await semChave(new Error("x"), { path: "/", method: "GET", headers: {} }, { routerKind: "", routePath: "", routeType: "" });
  assert.equal(chamadas.length, 1);
});
