import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CAMINHOS,
  caminhoDoPedido,
  portalAfterLogoutUrl,
  portalLoginUrl,
  safeReturnUrl,
  urlAbsoluta,
} from "../src/sso.ts";

const TAB = String.fromCharCode(9);
const LF = String.fromCharCode(10);

test("safeReturnUrl accepts same-origin paths only", () => {
  assert.equal(safeReturnUrl("/simplex/associacao?x=1"), "/simplex/associacao?x=1");
  assert.equal(safeReturnUrl("/a/../b?x=1#y"), "/b?x=1#y");
  for (const bad of [
    "https://mutual.mutualismo.pt/simplex", // absolute URLs are refused
    "https://evil.pt/",
    "//evil.pt/x",
    "/" + String.fromCharCode(92) + "evil.pt",
    "javascript:alert(1)",
    "/" + TAB + "/evil.pt",
    "/" + LF + "/evil.pt",
    " /evil",
    "/" + "x".repeat(3000),
    "",
    null,
  ]) assert.equal(safeReturnUrl(bad as string), null, JSON.stringify(bad));
});

test("portal login URLs are relative", () => {
  assert.equal(portalLoginUrl("/simplex/a?b=1", "sem-sessao"), "/login?next=%2Fsimplex%2Fa%3Fb%3D1&motivo=sem-sessao");
  assert.equal(portalLoginUrl("https://evil.pt/"), "/login");
  assert.equal(portalAfterLogoutUrl(), "/login?motivo=saiu");
});

test("paths and absolute links", () => {
  assert.equal(CAMINHOS.eventos, "/eventos");
  assert.equal(caminhoDoPedido("http://0.0.0.0:3005/simplex/admin?x=1"), "/simplex/admin?x=1");
  assert.equal(urlAbsoluta("https://mutual.mutualismo.pt/", "/eventos/gestao"), "https://mutual.mutualismo.pt/eventos/gestao");
});

test("the Cartão Digital lives on its own host (ADR 0004 exception)", async () => {
  const { CARTAO_URL_PRODUCAO, urlCartao } = await import("../src/sso.ts");
  const { APP_CARTAO, nomeDaApp, MUTUAL_APPS } = await import("../src/apps.ts");
  assert.equal(CARTAO_URL_PRODUCAO, "https://id.mutualismo.pt");
  assert.equal(urlCartao(), "https://id.mutualismo.pt/");
  assert.equal(urlCartao("http://127.0.0.1:3002/", "/entrar"), "http://127.0.0.1:3002/entrar");
  assert.equal(nomeDaApp("cartao"), APP_CARTAO.nome);
  assert.equal(nomeDaApp("portal"), "Portal");
  assert.equal(nomeDaApp("eventos"), "Eventos");
  // Not a staff app: never in the launcher or the switcher.
  assert.ok(!MUTUAL_APPS.some((a) => (a.id as string) === "cartao"));
});
