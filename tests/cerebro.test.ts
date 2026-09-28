import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import {
  CerebroIndisponivel,
  eCerebroIndisponivel,
  pedirAoCerebro,
  TEXTOS_INDISPONIVEL,
} from "../src/cerebro.ts";

async function servidor(
  handler: (res: import("node:http").ServerResponse) => void,
): Promise<{ url: string; fechar: () => Promise<void>; s: Server }> {
  const s = createServer((_req, res) => handler(res));
  await new Promise<void>((r) => s.listen(0, "127.0.0.1", r));
  const { port } = s.address() as AddressInfo;
  return {
    s,
    url: `http://127.0.0.1:${port}/api/v1/acessos/eu`,
    fechar: () => {
      s.closeAllConnections();
      return new Promise((r) => s.close(() => r()));
    },
  };
}

test("responde a tempo → a resposta, 4xx incluído (sem sessão não é indisponível)", async () => {
  const sv = await servidor((res) => {
    res.statusCode = 401;
    res.end("{}");
  });
  try {
    const r = await pedirAoCerebro(sv.url, { tempoLimiteMs: 2000 });
    assert.equal(r.status, 401);
  } finally {
    await sv.fechar();
  }
});

test("5xx → CerebroIndisponivel (estado), ou a resposta com falharEm5xx=false", async () => {
  const sv = await servidor((res) => {
    res.statusCode = 503;
    res.end("x");
  });
  try {
    await assert.rejects(pedirAoCerebro(sv.url), (e: unknown) => {
      assert.ok(eCerebroIndisponivel(e));
      assert.equal((e as CerebroIndisponivel).motivo, "estado");
      assert.equal((e as CerebroIndisponivel).estado, 503);
      return true;
    });
    const r = await pedirAoCerebro(sv.url, { falharEm5xx: false });
    assert.equal(r.status, 503);
  } finally {
    await sv.fechar();
  }
});

test("pendurado → tempo esgotado dentro do tempo-limite", async () => {
  const sv = await servidor(() => {
    /* nunca responde */
  });
  try {
    const inicio = Date.now();
    await assert.rejects(pedirAoCerebro(sv.url, { tempoLimiteMs: 200 }), (e: unknown) => {
      assert.equal((e as CerebroIndisponivel).motivo, "tempo-esgotado");
      return true;
    });
    assert.ok(Date.now() - inicio < 2000);
  } finally {
    await sv.fechar();
  }
});

test("sem ninguém na porta → rede", async () => {
  const sv = await servidor(() => {});
  const url = sv.url;
  await sv.fechar();
  await assert.rejects(pedirAoCerebro(url, { tempoLimiteMs: 2000 }), (e: unknown) => {
    assert.equal((e as CerebroIndisponivel).motivo, "rede");
    return true;
  });
});

test("um cancelamento de quem chama continua a ser AbortError", async () => {
  const sv = await servidor(() => {});
  try {
    const c = new AbortController();
    const p = pedirAoCerebro(sv.url, { signal: c.signal, tempoLimiteMs: 5000 });
    c.abort();
    await assert.rejects(p, (e: unknown) => !eCerebroIndisponivel(e));
  } finally {
    await sv.fechar();
  }
});

test("textos únicos em pt-PT", () => {
  assert.equal(TEXTOS_INDISPONIVEL.titulo, "Serviço temporariamente indisponível");
});
