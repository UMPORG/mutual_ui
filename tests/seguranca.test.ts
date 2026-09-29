import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cabecalhosNext,
  cabecalhosSeguranca,
  comCsp,
  gerarNonce,
  NONCE_CABECALHO,
  politicaCsp,
  politicaPermissoes,
} from "../src/seguranca.js";

const diretivas = (csp: string) =>
  Object.fromEntries(
    csp.split("; ").map((d) => {
      const [nome, ...valores] = d.split(" ");
      return [nome, valores];
    }),
  ) as Record<string, string[]>;

test("nonce: 128 bits em base64, diferente em cada pedido", () => {
  const a = gerarNonce();
  const b = gerarNonce();
  assert.notEqual(a, b);
  assert.equal(Buffer.from(a, "base64").length, 16);
});

test("CSP base: scripts só com o nonce, sem eval, ninguém enquadra, sem plugins", () => {
  const d = diretivas(politicaCsp({ nonce: "abc" }));
  assert.deepEqual(d["script-src"], ["'self'", "'nonce-abc'", "'strict-dynamic'"]);
  assert.ok(!d["script-src"]!.includes("'unsafe-inline'"));
  assert.ok(!d["script-src"]!.includes("'unsafe-eval'"));
  assert.deepEqual(d["frame-ancestors"], ["'none'"]);
  assert.deepEqual(d["object-src"], ["'none'"]);
  assert.deepEqual(d["base-uri"], ["'self'"]);
  assert.deepEqual(d["form-action"], ["'self'"]);
  assert.deepEqual(d["frame-src"], ["'none'"]);
  assert.deepEqual(d["connect-src"], ["'self'"]);
  // a «letra legível» do menu Acessibilidade
  assert.ok(d["style-src"]!.includes("https://fonts.googleapis.com"));
  assert.ok(d["font-src"]!.includes("https://fonts.gstatic.com"));
});

test("CSP em next dev: eval e WebSocket só aí", () => {
  const d = diretivas(politicaCsp({ nonce: "n", dev: true }));
  assert.ok(d["script-src"]!.includes("'unsafe-eval'"));
  assert.ok(d["connect-src"]!.includes("ws:"));
});

test("permissões por app só acrescentam (ex.: Stripe no Cartão)", () => {
  const d = diretivas(
    politicaCsp({
      nonce: "n",
      permissoes: {
        script: ["https://js.stripe.com"],
        connect: ["https://api.stripe.com"],
        frame: ["https://js.stripe.com"],
      },
    }),
  );
  assert.deepEqual(d["script-src"], ["'self'", "'nonce-n'", "'strict-dynamic'", "https://js.stripe.com"]);
  assert.deepEqual(d["connect-src"], ["'self'", "https://api.stripe.com"]);
  assert.deepEqual(d["frame-src"], ["https://js.stripe.com"]);
  assert.deepEqual(d["frame-ancestors"], ["'none'"]);
});

test("comCsp: o pedido leva x-nonce e a CSP; os cabeçalhos originais ficam", () => {
  const original = new Headers({ cookie: "a=1" });
  const { nonce, csp, cabecalhosPedido } = comCsp(original, {});
  assert.equal(cabecalhosPedido.get(NONCE_CABECALHO), nonce);
  assert.equal(cabecalhosPedido.get("content-security-policy"), csp);
  assert.equal(cabecalhosPedido.get("cookie"), "a=1");
  assert.ok(csp.includes(`'nonce-${nonce}'`));
  assert.equal(original.get(NONCE_CABECALHO), null);
});

test("cabeçalhos fixos: nosniff, referrer, COOP/CORP, DENY; HSTS só em produção", () => {
  const dev = cabecalhosSeguranca({ producao: false });
  assert.equal(dev["X-Content-Type-Options"], "nosniff");
  assert.equal(dev["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.equal(dev["Cross-Origin-Opener-Policy"], "same-origin");
  assert.equal(dev["Cross-Origin-Resource-Policy"], "same-origin");
  assert.equal(dev["X-Frame-Options"], "DENY");
  assert.equal(dev["Strict-Transport-Security"], undefined);
  const prod = cabecalhosSeguranca({ producao: true });
  assert.equal(prod["Strict-Transport-Security"], "max-age=63072000; includeSubDomains");
});

test("Permissions-Policy: tudo desligado, exceto o que a app pede", () => {
  assert.match(politicaPermissoes(), /camera=\(\)/);
  assert.match(politicaPermissoes(), /geolocation=\(\)/);
  const qr = politicaPermissoes({ camera: ["self"] });
  assert.match(qr, /camera=\(self\)/);
  assert.match(qr, /microphone=\(\)/);
  const cartao = politicaPermissoes({ payment: ["self", "https://js.stripe.com"] });
  assert.match(cartao, /payment=\(self "https:\/\/js\.stripe\.com"\)/);
});

test("cabecalhosNext: formato do next.config, em todos os caminhos", () => {
  const [regra] = cabecalhosNext({ producao: true });
  assert.equal(regra!.source, "/:path*");
  assert.ok(regra!.headers.some((h) => h.key === "Strict-Transport-Security"));
});
