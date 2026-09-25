import { test } from "node:test";
import assert from "node:assert/strict";
import { portalLoginUrl, portalAppUrl, publicRequestUrl, safeReturnUrl } from "../src/sso.ts";

const allowed = ["https://eventos.mutualismo.pt", "https://simplex.mutualismo.pt/"];
const TAB = String.fromCharCode(9);
const LF = String.fromCharCode(10);

test("safeReturnUrl accepts allowed origins and relative paths", () => {
  assert.equal(safeReturnUrl("https://eventos.mutualismo.pt/dashboard?x=1", allowed), "https://eventos.mutualismo.pt/dashboard?x=1");
  assert.equal(safeReturnUrl("https://simplex.mutualismo.pt/", allowed), "https://simplex.mutualismo.pt/");
  assert.equal(safeReturnUrl("/apps", allowed), "/apps");
  assert.equal(safeReturnUrl("/a/../b?x=1#y", allowed), "/b?x=1#y");
});

test("safeReturnUrl refuses open redirects", () => {
  for (const bad of [
    "https://evil.pt/",
    "https://eventos.mutualismo.pt.evil.pt/",
    "//evil.pt/x",
    "/" + String.fromCharCode(92) + "evil.pt", // "/\evil.pt"
    "javascript:alert(1)",
    "http://eventos.mutualismo.pt/", // scheme differs → different origin
    "/" + TAB + "/evil.pt", // browsers strip the tab → "//evil.pt"
    "/" + LF + "/evil.pt",
    " /evil",
    "https://evil@eventos.mutualismo.pt/",
    "https://user:pw@eventos.mutualismo.pt/",
    "/" + "x".repeat(3000),
    "",
    null,
  ]) assert.equal(safeReturnUrl(bad as string, allowed), null, JSON.stringify(bad));
});

test("portal URLs", () => {
  assert.equal(
    portalLoginUrl("https://portal.mutualismo.pt/", "https://eventos.mutualismo.pt/a?b=1", "sem-sessao"),
    "https://portal.mutualismo.pt/login?next=https%3A%2F%2Feventos.mutualismo.pt%2Fa%3Fb%3D1&motivo=sem-sessao",
  );
  assert.equal(portalAppUrl("https://portal.mutualismo.pt", "eventos"), "https://portal.mutualismo.pt/ir/eventos");
  assert.equal(portalAppUrl("https://portal.mutualismo.pt/", "portal"), "https://portal.mutualismo.pt/");
});

test("publicRequestUrl swaps the container origin for the public one", () => {
  assert.equal(publicRequestUrl("http://0.0.0.0:3003/dashboard?a=1", "https://eventos.mutualismo.pt/"), "https://eventos.mutualismo.pt/dashboard?a=1");
  assert.equal(publicRequestUrl("http://localhost:3003/x", undefined), "http://localhost:3003/x");
});
