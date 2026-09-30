import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cantoEspelhado,
  cantoMaisProximo,
  cantoPelaSeta,
  posicaoDoChat,
  sobreposicao,
  uniao,
  type Retangulo,
} from "../src/assistente-posicao.ts";
import {
  contextoAEnviar,
  diferencaContexto,
  hashContexto,
  jsonEstavel,
  normalizarContexto,
  rotaSemIds,
  valoresDoContexto,
} from "../src/assistente-contexto.ts";
import {
  CHAVES_CHAT,
  guardarEstado,
  lerEstadoGuardado,
  publicarContextoPagina,
  contextoPagina,
  RegistoPosicoes,
} from "../src/assistente-estado.ts";
import { eventoDoSse, LeitorSse, lerPropostas, textoDaOrigem } from "../src/assistente-api.ts";

const VP = { w: 1440, h: 900 };
const CHAT = { w: 400, h: 640 };
const TOPO = 64;

// ─── Snapping ────────────────────────────────────────────────────────────────

test("cantoMaisProximo: the quadrant of the released centre", () => {
  assert.equal(cantoMaisProximo({ x: 1200, y: 700 }, VP), "inf-dir");
  assert.equal(cantoMaisProximo({ x: 100, y: 700 }, VP), "inf-esq");
  assert.equal(cantoMaisProximo({ x: 1200, y: 100 }, VP), "sup-dir");
  assert.equal(cantoMaisProximo({ x: 100, y: 100 }, VP), "sup-esq");
  // The exact middle goes to the bottom-right (the default corner).
  assert.equal(cantoMaisProximo({ x: 720, y: 450 }, VP), "inf-dir");
});

test("cantoPelaSeta: arrows move between corners, other keys do nothing", () => {
  assert.equal(cantoPelaSeta("inf-dir", "ArrowUp"), "sup-dir");
  assert.equal(cantoPelaSeta("inf-dir", "ArrowLeft"), "inf-esq");
  assert.equal(cantoPelaSeta("sup-esq", "ArrowDown"), "inf-esq");
  assert.equal(cantoPelaSeta("sup-esq", "ArrowRight"), "sup-dir");
  assert.equal(cantoPelaSeta("inf-dir", "ArrowDown"), "inf-dir");
  assert.equal(cantoPelaSeta("inf-dir", "Enter"), null);
  assert.equal(cantoEspelhado("inf-dir"), "inf-esq");
  assert.equal(cantoEspelhado("sup-esq"), "sup-dir");
});

test("posicaoDoChat: each corner, inside the margins and below the top bar", () => {
  const o = { tamanho: CHAT, viewport: VP, topo: TOPO };
  assert.deepEqual(posicaoDoChat("inf-dir", o), { x: 1020, y: 240, w: 400, h: 640, canto: "inf-dir", folha: false });
  assert.deepEqual(posicaoDoChat("inf-esq", o), { x: 20, y: 240, w: 400, h: 640, canto: "inf-esq", folha: false });
  const sup = posicaoDoChat("sup-dir", o);
  assert.equal(sup.y, TOPO + 20);
  assert.ok(sup.y + sup.h <= VP.h - 20);
  // A short window: the chat shrinks to fit between the top bar and the bottom.
  const baixo = posicaoDoChat("inf-dir", { tamanho: CHAT, viewport: { w: 1280, h: 600 }, topo: TOPO });
  assert.equal(baixo.h, 600 - TOPO - 40);
  assert.equal(baixo.y, TOPO + 20);
});

// ─── Stacking with the «Demonstração» widget ─────────────────────────────────

const PILULA: Retangulo = { x: 1372, y: 832, w: 48, h: 48 }; // bottom-right, margin 20

test("stacking: in the demo pill's corner the chat sits ABOVE it, with the gap", () => {
  const p = posicaoDoChat("inf-dir", { tamanho: CHAT, viewport: VP, topo: TOPO, ocupados: [PILULA] });
  assert.equal(p.canto, "inf-dir");
  assert.equal(sobreposicao(p, PILULA), 0);
  assert.equal(p.y + p.h, PILULA.y - 12);
  // In the other corner the pill changes nothing.
  assert.deepEqual(posicaoDoChat("inf-esq", { tamanho: CHAT, viewport: VP, topo: TOPO, ocupados: [PILULA] }), posicaoDoChat("inf-esq", { tamanho: CHAT, viewport: VP, topo: TOPO }));
});

test("stacking: the demo panel opens (pill + panel) — the chat moves up and shrinks, never overlapping", () => {
  const painel = uniao([PILULA, { x: 1068, y: 420, w: 352, h: 404 }])!;
  const p = posicaoDoChat("inf-dir", { tamanho: CHAT, viewport: VP, topo: TOPO, ocupados: [painel] });
  assert.equal(p.canto, "inf-dir");
  assert.equal(sobreposicao(p, painel), 0);
  assert.equal(p.y + p.h, painel.y - 12);
  assert.ok(p.h >= 280);
});

test("stacking: no room above a tall demo panel — the chat takes the mirrored corner", () => {
  const alto = uniao([PILULA, { x: 1068, y: 200, w: 352, h: 624 }])!;
  const p = posicaoDoChat("inf-dir", { tamanho: CHAT, viewport: VP, topo: TOPO, ocupados: [alto] });
  assert.equal(p.canto, "inf-esq");
  assert.equal(sobreposicao(p, alto), 0);
  assert.equal(p.h, 640);
});

test("stacking: a demo pill in the middle of the right edge only caps the height", () => {
  const meio: Retangulo = { x: 1372, y: 426, w: 48, h: 48 };
  const inf = posicaoDoChat("inf-dir", { tamanho: CHAT, viewport: VP, topo: TOPO, ocupados: [meio] });
  assert.equal(sobreposicao(inf, meio), 0);
  assert.equal(inf.y + inf.h, VP.h - 20);
  assert.equal(inf.y, meio.y + meio.h + 12);
  const sup = posicaoDoChat("sup-dir", { tamanho: CHAT, viewport: VP, topo: TOPO, ocupados: [meio] });
  assert.equal(sobreposicao(sup, meio), 0);
  assert.equal(sup.y + sup.h, meio.y - 12);
});

test("stacking: every corner and dock combination never overlaps (property sweep)", () => {
  const docas: Retangulo[] = [
    PILULA,
    { x: 20, y: 832, w: 48, h: 48 },
    { x: 1372, y: 426, w: 48, h: 48 },
    uniao([PILULA, { x: 1068, y: 420, w: 352, h: 404 }])!,
    uniao([{ x: 20, y: 832, w: 48, h: 48 }, { x: 20, y: 300, w: 352, h: 524 }])!,
  ];
  for (const vp of [VP, { w: 1024, h: 700 }, { w: 800, h: 1100 }]) {
    for (const canto of ["inf-dir", "inf-esq", "sup-dir", "sup-esq"] as const) {
      for (const d of docas) {
        const p = posicaoDoChat(canto, { tamanho: CHAT, viewport: vp, topo: TOPO, ocupados: [d] });
        assert.equal(sobreposicao(p, d), 0, `${canto} ${JSON.stringify(d)} ${vp.w}x${vp.h}`);
        assert.ok(p.x >= 0 && p.x + p.w <= vp.w && p.y >= TOPO && p.y + p.h <= vp.h);
      }
    }
  }
});

test("phone width: a full-width bottom sheet, above a demo pill at the bottom", () => {
  const tel = { w: 390, h: 844 };
  const livre = posicaoDoChat("inf-dir", { tamanho: CHAT, viewport: tel, topo: 56 });
  assert.equal(livre.folha, true);
  assert.equal(livre.x, 0);
  assert.equal(livre.w, 390);
  assert.equal(livre.y + livre.h, 844);
  const pilula: Retangulo = { x: 326, y: 780, w: 48, h: 48 };
  const p = posicaoDoChat("sup-esq", { tamanho: CHAT, viewport: tel, topo: 56, ocupados: [pilula] });
  assert.equal(p.folha, true);
  assert.equal(sobreposicao(p, pilula), 0);
  assert.equal(p.y + p.h, pilula.y - 12);
});

test("uniao: the footprint around several rectangles; empty ones ignored", () => {
  assert.deepEqual(uniao([{ x: 10, y: 10, w: 10, h: 10 }, { x: 0, y: 30, w: 5, h: 5 }, { x: 99, y: 99, w: 0, h: 0 }]), { x: 0, y: 10, w: 20, h: 25 });
  assert.equal(uniao([]), null);
});

// ─── Page context ────────────────────────────────────────────────────────────

const ENTRADA = {
  app: "backoffice",
  pagina: "Caracterização",
  seccao: "A. Identificação",
  dados: {
    "identificacao.nome": { valor: "  Associação   Mutualista Exemplo ", rotulo: "Nome", editavel: true },
    "identificacao.nif": { valor: "501234567", rotulo: "NIF", sensivel: true },
    "identificacao.fundacao": 1923,
    "identificacao.ativa": true,
  },
};

test("normalizarContexto: compact fields, trimmed text, marks only when set, ids out of the route", () => {
  const c = normalizarContexto(ENTRADA, "/backoffice/caracterizacao/0192f2f0-1111-7abc-8def-0123456789ab/a");
  assert.equal(c.rota, "/backoffice/caracterizacao/:id/a");
  assert.equal(c.seccao, "A. Identificação");
  assert.deepEqual(c.campos[0], { caminho: "identificacao.nome", rotulo: "Nome", valor: "Associação Mutualista Exemplo", editavel: true });
  assert.deepEqual(c.campos[1], { caminho: "identificacao.nif", rotulo: "NIF", valor: "501234567", sensivel: true });
  assert.deepEqual(c.campos[2], { caminho: "identificacao.fundacao", rotulo: "identificacao.fundacao", valor: 1923 });
  assert.equal(rotaSemIds("/simplex/documentos/12345?x=1#y"), "/simplex/documentos/:id");
});

test("normalizarContexto: caps the number of fields and the size of values", () => {
  const dados = Object.fromEntries(Array.from({ length: 120 }, (_, i) => [`c${i}`, "x".repeat(1000)]));
  const c = normalizarContexto({ app: "simplex", pagina: "Balanço", dados }, "/simplex");
  assert.equal(c.campos.length, 80);
  assert.equal(String(c.campos[0]!.valor).length, 300);
});

test("hashContexto: stable for the same content, whatever the key order; changes with a value", () => {
  const a = normalizarContexto(ENTRADA, "/x");
  const b = normalizarContexto({ ...ENTRADA, dados: { ...ENTRADA.dados } }, "/x");
  assert.equal(hashContexto(a), hashContexto(b));
  assert.equal(jsonEstavel({ b: 1, a: [1, { d: 2, c: 3 }] }), '{"a":[1,{"c":3,"d":2}],"b":1}');
  const c = normalizarContexto({ ...ENTRADA, dados: { ...ENTRADA.dados, "identificacao.fundacao": 1924 } }, "/x");
  assert.notEqual(hashContexto(a), hashContexto(c));
  assert.equal(hashContexto(null), "0");
});

test("diferencaContexto: only what changed; another section counts as a new page", () => {
  const a = normalizarContexto(ENTRADA, "/x");
  const dados = { ...ENTRADA.dados, "identificacao.fundacao": 1924 } as Record<string, unknown>;
  delete dados["identificacao.ativa"];
  const b = normalizarContexto({ ...ENTRADA, dados: dados as typeof ENTRADA.dados }, "/x");
  const d = diferencaContexto(a, b);
  assert.equal(d.outraPagina, false);
  assert.deepEqual(d.alterados.map((x) => x.caminho), ["identificacao.fundacao"]);
  assert.deepEqual(d.removidos, ["identificacao.ativa"]);
  assert.equal(diferencaContexto(a, a).alterados.length, 0);
  const outra = normalizarContexto({ ...ENTRADA, seccao: "B. Órgãos sociais" }, "/x");
  assert.equal(diferencaContexto(a, outra).outraPagina, true);
  assert.equal(diferencaContexto(null, a).outraPagina, true);
});

test("contextoAEnviar: sent the first time and after a change, not again when unchanged", () => {
  const a = normalizarContexto(ENTRADA, "/x");
  const primeiro = contextoAEnviar(a, undefined);
  assert.equal(primeiro.contexto, a);
  assert.equal(contextoAEnviar(a, primeiro.hash).contexto, undefined);
  const b = normalizarContexto({ ...ENTRADA, seccao: "B" }, "/x");
  assert.equal(contextoAEnviar(b, primeiro.hash).contexto, b);
  assert.equal(contextoAEnviar(null, undefined).contexto, undefined);
  assert.deepEqual(valoresDoContexto(a)["identificacao.fundacao"], 1923);
});

// ─── Kept state and registries ───────────────────────────────────────────────

class Memoria {
  m = new Map<string, string>();
  getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
}

test("estado guardado: open, corner and conversation survive; anything invalid falls back", () => {
  const a = new Memoria();
  assert.deepEqual(lerEstadoGuardado(a), { aberto: false, canto: "inf-dir", conversaId: null });
  const id = "0192f2f0-1111-7abc-8def-0123456789ab";
  guardarEstado({ aberto: true, canto: "sup-esq", conversaId: id }, a);
  assert.deepEqual(lerEstadoGuardado(a), { aberto: true, canto: "sup-esq", conversaId: id });
  a.setItem(CHAVES_CHAT.canto, "no-meio");
  a.setItem(CHAVES_CHAT.conversa, "<script>");
  assert.deepEqual(lerEstadoGuardado(a), { aberto: true, canto: "inf-dir", conversaId: null });
  guardarEstado({ aberto: false, canto: "inf-esq", conversaId: null }, a);
  assert.equal(a.getItem(CHAVES_CHAT.conversa), null);
  // A storage that throws (private mode) never breaks the page.
  const hostil = { getItem: () => { throw new Error("x"); }, setItem: () => { throw new Error("x"); }, removeItem: () => undefined };
  assert.deepEqual(lerEstadoGuardado(hostil), { aberto: false, canto: "inf-dir", conversaId: null });
  guardarEstado({ aberto: true, canto: "inf-dir", conversaId: null }, hostil);
});

test("RegistoPosicoes: publish, replace, withdraw; listeners only on real changes", () => {
  const r = new RegistoPosicoes();
  let n = 0;
  const parar = r.ouvir(() => n++);
  r.publicar("demo", { x: 1, y: 2, w: 3, h: 4 });
  r.publicar("demo", { x: 1, y: 2, w: 3, h: 4 });
  assert.equal(n, 1);
  const lista = r.ocupados();
  assert.equal(r.ocupados(), lista);
  r.publicar("demo", { x: 1, y: 2, w: 3, h: 40 });
  assert.equal(r.ocupados()[0]!.h, 40);
  r.publicar("demo", null);
  r.publicar("demo", null);
  assert.equal(r.ocupados().length, 0);
  assert.equal(n, 3);
  parar();
});

test("contexto da página: the last page wins; an old page leaving does not clear the new one", () => {
  const c1 = normalizarContexto(ENTRADA, "/a");
  const c2 = normalizarContexto({ ...ENTRADA, pagina: "Outra" }, "/b");
  const p1 = publicarContextoPagina({ contexto: c1, hash: hashContexto(c1) });
  const p2 = publicarContextoPagina({ contexto: c2, hash: hashContexto(c2) });
  p1.atualizar({ contexto: c1, hash: "x" });
  p1.retirar();
  assert.equal(contextoPagina.ler()?.contexto.pagina, "Outra");
  p2.retirar();
  assert.equal(contextoPagina.ler(), null);
});

// ─── Stream and shapes ───────────────────────────────────────────────────────

test("LeitorSse: pieces of any size, CRLF, comments, multi-line data", () => {
  const l = new LeitorSse();
  assert.deepEqual(l.alimentar("event: conversa\r\ndata: {\"id\":\"a\","), []);
  assert.deepEqual(l.alimentar("\"titulo\":\"T\"}\r\n\r\n: ping\n\nevent: texto\ndata: {\"delta\":\"O\"}\n"), [
    { evento: "conversa", dados: '{"id":"a","titulo":"T"}' },
  ]);
  assert.deepEqual(l.alimentar("\n"), [{ evento: "texto", dados: '{"delta":"O"}' }]);
  assert.deepEqual(l.alimentar("data: a\ndata: b\n\n"), [{ evento: "message", dados: "a\nb" }]);
});

test("eventoDoSse: checked events; unknown or broken ones dropped", () => {
  assert.deepEqual(eventoDoSse("conversa", '{"id":"x","titulo":"T"}'), { tipo: "conversa", id: "x", titulo: "T" });
  assert.deepEqual(eventoDoSse("passo", '{"id":"ajuda","rotulo":"A procurar…","estado":"done"}'), { tipo: "passo", id: "ajuda", rotulo: "A procurar…", estado: "done" });
  assert.equal(eventoDoSse("conversa", "{}"), null);
  assert.equal(eventoDoSse("desconhecido", "{}"), null);
  assert.equal(eventoDoSse("texto", "não é json"), null);
  const p = eventoDoSse("propostas", JSON.stringify({ propostas: [{ caminho: "a.b", rotulo: "B", valor: "x", confianca: "alta", rota: "/r" }, { caminho: "", valor: 1 }, { caminho: "c", valor: { mau: 1 } }] }));
  assert.equal(p?.tipo, "propostas");
  if (p?.tipo === "propostas") {
    assert.equal(p.propostas.length, 1);
    assert.equal(p.propostas[0]!.rota, "/r");
    assert.equal(p.propostas[0]!.confianca, "alta");
  }
});

test("lerPropostas + textoDaOrigem", () => {
  assert.equal(lerPropostas([{ caminho: "x", valor: 2 }])[0]!.confianca, "media");
  const nome = (a: string) => (a === "simplex" ? "Simplex" : null);
  assert.equal(textoDaOrigem({ app: "simplex", pagina: "Balanço", seccao: null }, nome), "Iniciada em Simplex · Balanço");
  assert.equal(textoDaOrigem(null, nome), null);
});
