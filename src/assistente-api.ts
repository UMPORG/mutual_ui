/**
 * The floating assistant's calls to the Cérebro — same origin
 * (`/api/v1/assistente/*`, no app proxy), `fetch` injected, no React:
 * tested in `tests/assistente.test.ts` (the SSE reader and the shapes).
 *
 * Contract: ADR 0006 in the Cérebro (`src/routes/assistente/assistente.ts`).
 * `POST /perguntar` answers JSON errors before the stream (401, 403, 422,
 * 429 `ASSISTENTE_LIMITE_DIARIO`, 503) and then `text/event-stream`:
 * `conversa`, `passo`, `texto`, `fontes`, `rascunho`, `acao`, `propostas`,
 * `fim`, `erro`.
 */
import type { ChatSource } from "./conversa-dados";
import type { ContextoPagina } from "./assistente-contexto";
import { API_ASSISTENTE, ErroAssistente, mensagemDoErro, type PropostaCampo } from "./preencher-dados";

export type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

// ─── Shapes (checked, never trusted with `as`) ───────────────────────────────

const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const txt = (v: unknown, omissao = ""): string => (typeof v === "string" ? v : omissao);
const txtOuNulo = (v: unknown): string | null => (typeof v === "string" ? v : null);
const lista = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** Where a conversation was started (an app page; `null` = in the Assistente). */
export interface OrigemConversa {
  app: string;
  pagina: string | null;
  seccao: string | null;
}

export interface ConversaResumo {
  id: string;
  titulo: string;
  atualizadaEm: string;
  origem: OrigemConversa | null;
}

export function lerOrigem(v: unknown): OrigemConversa | null {
  const o = obj(v);
  const app = txt(o.app);
  if (!app) return null;
  return { app, pagina: txtOuNulo(o.pagina), seccao: txtOuNulo(o.seccao) };
}

export interface EstadoAssistente {
  capacidades: string[];
  maxPergunta: number;
  limiteAtingido: "pessoa" | "organizacao" | null;
  ficheiros: { extensoes: string; maxPorPergunta: number };
  configuracao: { estado: string; mensagem: string | null };
}

export function lerEstadoAssistente(v: unknown): EstadoAssistente {
  const o = obj(v);
  const f = obj(o.ficheiros);
  const c = obj(o.configuracao);
  const limite = o.limiteAtingido;
  return {
    capacidades: lista(o.capacidades).filter((x): x is string => typeof x === "string"),
    maxPergunta: typeof o.maxPergunta === "number" ? o.maxPergunta : 4000,
    limiteAtingido: limite === "pessoa" || limite === "organizacao" ? limite : null,
    ficheiros: { extensoes: txt(f.extensoes), maxPorPergunta: typeof f.maxPorPergunta === "number" ? f.maxPorPergunta : 5 },
    configuracao: { estado: txt(c.estado, "pronto"), mensagem: txtOuNulo(c.mensagem) },
  };
}

export interface RascunhoMensagem {
  tipo: string;
  titulo: string;
  texto: string;
}

export interface AcaoMensagem {
  id: string;
  titulo: string;
  descricao: string;
  detalhes: Array<{ termo: string; valor: string }>;
  app: string;
  estado: string;
  /** After «Criar rascunho»: where the draft is. */
  resultado: { href: string; mensagem: string } | null;
}

const lerResultado = (v: unknown): { href: string; mensagem: string } | null => {
  const r = obj(v);
  return txt(r.href) ? { href: txt(r.href), mensagem: txt(r.mensagem, "Rascunho criado.") } : null;
};

/** A proposal from the conversation for a field of the page (ADR 0006 §16). */
export interface PropostaPagina extends PropostaCampo {
  /** The page the values are for (only applied there). */
  rota?: string | undefined;
}

export interface MensagemAssistente {
  id: string;
  papel: "user" | "assistant";
  conteudo: string;
  estado: "done" | "stopped" | "error";
  fontes: ChatSource[];
  feedback: "util" | "nao-util" | null;
  criadaEm: string;
  rascunhos: RascunhoMensagem[];
  acoes: AcaoMensagem[];
  propostas: PropostaPagina[];
}

const CONFIANCAS = ["alta", "media", "baixa"] as const;

export function lerPropostas(v: unknown): PropostaPagina[] {
  return lista(v).flatMap((x) => {
    const p = obj(x);
    const valor = typeof p.valor === "number" || typeof p.valor === "string" ? p.valor : null;
    const caminho = txt(p.caminho);
    if (!caminho || valor === null) return [];
    const confianca = CONFIANCAS.find((c) => c === p.confianca) ?? "media";
    const out: PropostaPagina = {
      caminho,
      rotulo: txt(p.rotulo, caminho),
      valor,
      origem: txt(p.origem, "Conversa"),
      excerto: txt(p.excerto),
      confianca,
      metodo: "modelo",
    };
    if (typeof p.rota === "string") out.rota = p.rota;
    return [out];
  });
}

function lerFontes(v: unknown): ChatSource[] {
  return lista(v).flatMap((x) => {
    const f = obj(x);
    const kind = f.kind === "ajuda" || f.kind === "registo" ? f.kind : null;
    if (!kind || !txt(f.href) || !txt(f.title)) return [];
    const s: ChatSource = { id: txt(f.id, txt(f.href)), title: txt(f.title), href: txt(f.href), kind };
    if (typeof f.n === "number") s.n = f.n;
    if (typeof f.app === "string") s.app = f.app;
    if (typeof f.excerpt === "string") s.excerpt = f.excerpt;
    return [s];
  });
}

function lerRascunhos(v: unknown): RascunhoMensagem[] {
  return lista(v).flatMap((x) => {
    const r = obj(x);
    return txt(r.texto) ? [{ tipo: txt(r.tipo, "texto"), titulo: txt(r.titulo), texto: txt(r.texto) }] : [];
  });
}

function lerAcoes(v: unknown): AcaoMensagem[] {
  return lista(v).flatMap((x) => {
    const a = obj(x);
    if (!txt(a.id)) return [];
    return [
      {
        id: txt(a.id),
        titulo: txt(a.titulo),
        descricao: txt(a.descricao),
        detalhes: lista(a.detalhes).map((d) => ({ termo: txt(obj(d).termo), valor: txt(obj(d).valor) })),
        app: txt(a.app),
        estado: txt(a.estado, "proposta"),
        resultado: lerResultado(a.resultado),
      },
    ];
  });
}

export function lerMensagem(v: unknown): MensagemAssistente {
  const m = obj(v);
  const estado = m.estado === "stopped" || m.estado === "error" ? m.estado : "done";
  const feedback = m.feedback === "util" || m.feedback === "nao-util" ? m.feedback : null;
  return {
    id: txt(m.id),
    papel: m.papel === "user" ? "user" : "assistant",
    conteudo: txt(m.conteudo),
    estado,
    fontes: lerFontes(m.fontes),
    feedback,
    criadaEm: txt(m.criadaEm),
    rascunhos: lerRascunhos(m.rascunhos),
    acoes: lerAcoes(m.acoes),
    propostas: lerPropostas(m.propostas),
  };
}

// ─── Calls ───────────────────────────────────────────────────────────────────

async function pedirJson(f: Fetch, caminho: string, init: RequestInit = {}): Promise<unknown> {
  const r = await f(caminho, { credentials: "same-origin", ...init });
  let corpo: unknown = null;
  try {
    corpo = await r.json();
  } catch {
    corpo = null;
  }
  if (!r.ok) {
    const c = obj(corpo);
    throw new ErroAssistente(r.status, typeof c.code === "string" ? c.code : null, mensagemDoErro(r.status, corpo));
  }
  return obj(corpo).data;
}

export async function obterEstado(f: Fetch, api = API_ASSISTENTE): Promise<EstadoAssistente> {
  return lerEstadoAssistente(await pedirJson(f, `${api}/estado`));
}

export async function listarConversas(f: Fetch, api = API_ASSISTENTE): Promise<ConversaResumo[]> {
  return lista(await pedirJson(f, `${api}/conversas`)).flatMap((x) => {
    const c = obj(x);
    return txt(c.id) ? [{ id: txt(c.id), titulo: txt(c.titulo, "Conversa"), atualizadaEm: txt(c.atualizadaEm), origem: lerOrigem(c.origem) }] : [];
  });
}

export async function obterConversa(
  f: Fetch,
  id: string,
  api = API_ASSISTENTE,
): Promise<{ id: string; titulo: string; origem: OrigemConversa | null; mensagens: MensagemAssistente[] }> {
  const c = obj(await pedirJson(f, `${api}/conversas/${encodeURIComponent(id)}`));
  return { id: txt(c.id), titulo: txt(c.titulo), origem: lerOrigem(c.origem), mensagens: lista(c.mensagens).map(lerMensagem) };
}

export async function avaliarMensagem(f: Fetch, id: string, valor: "util" | "nao-util" | null, api = API_ASSISTENTE): Promise<void> {
  await pedirJson(f, `${api}/mensagens/${encodeURIComponent(id)}/avaliacao`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ valor }),
  });
}

export async function aplicarAcao(f: Fetch, id: string, api = API_ASSISTENTE): Promise<{ estado: string; resultado: { href: string; mensagem: string } | null }> {
  const r = obj(await pedirJson(f, `${api}/acoes/${encodeURIComponent(id)}/aplicar`, { method: "POST" }));
  return { estado: txt(r.estado, "aplicada"), resultado: lerResultado(r.resultado) };
}

// ─── The stream ──────────────────────────────────────────────────────────────

export type EventoPergunta =
  | { tipo: "conversa"; id: string; titulo: string }
  | { tipo: "passo"; id: string; rotulo: string; estado: "active" | "done" }
  | { tipo: "texto"; delta: string }
  | { tipo: "fontes"; fontes: ChatSource[] }
  | { tipo: "rascunho"; rascunho: RascunhoMensagem }
  | { tipo: "acao"; acao: AcaoMensagem }
  | { tipo: "propostas"; propostas: PropostaPagina[] }
  | { tipo: "fim"; mensagemId: string }
  | { tipo: "erro"; codigo: string; mensagem: string };

/** One SSE event (`event:` + `data:`) → a checked event, or `null` if unknown. */
export function eventoDoSse(evento: string, dados: string): EventoPergunta | null {
  let d: Record<string, unknown>;
  try {
    d = obj(JSON.parse(dados));
  } catch {
    return null;
  }
  switch (evento) {
    case "conversa":
      return txt(d.id) ? { tipo: "conversa", id: txt(d.id), titulo: txt(d.titulo) } : null;
    case "passo":
      return { tipo: "passo", id: txt(d.id), rotulo: txt(d.rotulo), estado: d.estado === "done" ? "done" : "active" };
    case "texto":
      return { tipo: "texto", delta: txt(d.delta) };
    case "fontes":
      return { tipo: "fontes", fontes: lerFontes(d.fontes) };
    case "rascunho": {
      const [r] = lerRascunhos([d.rascunho]);
      return r ? { tipo: "rascunho", rascunho: r } : null;
    }
    case "acao": {
      const [a] = lerAcoes([d.acao]);
      return a ? { tipo: "acao", acao: a } : null;
    }
    case "propostas":
      return { tipo: "propostas", propostas: lerPropostas(d.propostas) };
    case "fim":
      return { tipo: "fim", mensagemId: txt(d.mensagemId) };
    case "erro":
      return { tipo: "erro", codigo: txt(d.codigo, "ERR_INTERNAL"), mensagem: txt(d.mensagem, "Ocorreu um erro inesperado. Tente novamente.") };
    default:
      return null;
  }
}

/** Reads `text/event-stream` in pieces of any size (CRLF or LF). */
export class LeitorSse {
  private resto = "";
  alimentar(pedaco: string): Array<{ evento: string; dados: string }> {
    this.resto += pedaco.replace(/\r\n?/g, "\n");
    const out: Array<{ evento: string; dados: string }> = [];
    let fim: number;
    while ((fim = this.resto.indexOf("\n\n")) >= 0) {
      const bloco = this.resto.slice(0, fim);
      this.resto = this.resto.slice(fim + 2);
      let evento = "message";
      const dados: string[] = [];
      for (const linha of bloco.split("\n")) {
        if (linha.startsWith(":")) continue;
        const i = linha.indexOf(":");
        const campo = i < 0 ? linha : linha.slice(0, i);
        const valor = i < 0 ? "" : linha.slice(i + 1).replace(/^ /, "");
        if (campo === "event") evento = valor;
        else if (campo === "data") dados.push(valor);
      }
      if (dados.length > 0) out.push({ evento, dados: dados.join("\n") });
    }
    return out;
  }
}

export interface CorpoPergunta {
  conversaId?: string | undefined;
  texto: string;
  documentos?: string[] | undefined;
  contextoPagina?: ContextoPagina | undefined;
}

/**
 * `POST /perguntar` and the stream. Errors before the stream throw
 * `ErroAssistente` (pt-PT message). A stream that ends without `fim`/`erro`
 * ends with an `erro` «A ligação foi interrompida». Abort with `sinal`.
 */
export async function perguntar(
  f: Fetch,
  corpo: CorpoPergunta,
  aoEvento: (e: EventoPergunta) => void,
  o: { api?: string | undefined; sinal?: AbortSignal | undefined } = {},
): Promise<void> {
  const semIndefinidos = Object.fromEntries(Object.entries(corpo).filter(([, v]) => v !== undefined));
  const r = await f(`${o.api ?? API_ASSISTENTE}/perguntar`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json", accept: "text/event-stream" },
    body: JSON.stringify(semIndefinidos),
    ...(o.sinal ? { signal: o.sinal } : {}),
  });
  if (!r.ok || !r.body) {
    let c: unknown = null;
    try {
      c = await r.json();
    } catch {
      c = null;
    }
    const code = obj(c).code;
    throw new ErroAssistente(r.status, typeof code === "string" ? code : null, mensagemDoErro(r.status, c));
  }
  const leitor = r.body.getReader();
  const texto = new TextDecoder();
  const sse = new LeitorSse();
  let terminou = false;
  for (;;) {
    const { done, value } = await leitor.read();
    const pedaco = done ? texto.decode() : texto.decode(value, { stream: true });
    for (const { evento, dados } of sse.alimentar(done ? `${pedaco}\n\n` : pedaco)) {
      const e = eventoDoSse(evento, dados);
      if (!e) continue;
      if (e.tipo === "fim" || e.tipo === "erro") terminou = true;
      aoEvento(e);
    }
    if (done) break;
  }
  if (!terminou) aoEvento({ tipo: "erro", codigo: "LIGACAO", mensagem: "A ligação foi interrompida. Tente novamente." });
}

/** «Simplex · Balanço 2025» — where a conversation started, for the list. */
export function textoDaOrigem(o: OrigemConversa | null, nomeDaApp: (app: string) => string | null): string | null {
  if (!o) return null;
  const app = nomeDaApp(o.app) ?? null;
  const partes = [app, o.pagina, o.seccao].filter((x): x is string => !!x && x.trim() !== "");
  return partes.length > 0 ? `Iniciada em ${partes.join(" · ")}` : null;
}
