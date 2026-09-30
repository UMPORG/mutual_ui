/**
 * Pure helpers of «Preencher com um documento»: comparing the
 * assistant's proposals with the form's current values, what is kept by
 * default, reading/writing a dotted path in a draft, the Cérebro calls and
 * the pt-PT error messages. No React, no DOM — tested in tests/preencher.test.ts.
 *
 * The Cérebro only PROPOSES (ADR 0006 §12). The form reviews and applies to
 * ITS draft; nothing is ever submitted from here.
 */

export type Confianca = "alta" | "media" | "baixa";

export interface PropostaCampo {
  /** dotted path in the form body ("identificacao.nif", "n.inventarios") */
  caminho: string;
  rotulo: string;
  valor: string | number;
  /** "página 1, linha 4" / "célula Balanço!C12" */
  origem: string;
  /** the document line the value came from */
  excerto: string;
  confianca: Confianca;
  metodo: "regra" | "folha" | "modelo";
}

export interface ResultadoLeitura {
  propostas: PropostaCampo[];
  avisos: string[];
  paginas: number;
  metodo: string;
}

export type EstadoLeitura = "em-fila" | "a-ler" | "a-analisar" | "concluida" | "erro";

export interface Leitura {
  id: string;
  alvo: string;
  nomeAlvo: string;
  estado: EstadoLeitura;
  progresso: number;
  fase: string | null;
  erro: string | null;
  ficheiro: { id: string; nome: string } | null;
  resultado: ResultadoLeitura | null;
}

export type Diferenca = "novo" | "igual" | "substitui";

export interface LinhaRevisao extends PropostaCampo {
  /** the value the form has now ("" / null = empty) */
  atual: unknown;
  diferenca: Diferenca;
}

/** A value as the person reads it (numbers in pt-PT, dates dd/mm/aaaa). */
export function valorLegivel(v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  if (typeof v === "number") {
    return new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 2 }).format(v);
  }
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  const s = String(v);
  const data = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}:\d{2}))?$/.exec(s);
  if (data) return `${data[3]}/${data[2]}/${data[1]}${data[4] ? ` às ${data[4]}` : ""}`;
  return s;
}

const normal = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return String(Math.round(v * 100) / 100);
  const s = String(v).trim();
  const n = Number(s.replace(/\s/g, "").replace(",", "."));
  if (s !== "" && /^-?[\d\s.,]+$/.test(s) && Number.isFinite(n)) return String(Math.round(n * 100) / 100);
  return s.normalize("NFC").replace(/\s+/g, " ").toLowerCase();
};

/** The proposals next to the current values of the form. */
export function compararPropostas(
  propostas: readonly PropostaCampo[],
  valoresAtuais: Readonly<Record<string, unknown>>,
): LinhaRevisao[] {
  return propostas.map((p) => {
    const atual = valoresAtuais[p.caminho];
    // Empty = nothing written, or the zero many forms start with ("0.00").
    const vazio = normal(atual) === "" || normal(atual) === "0";
    const diferenca: Diferenca = normal(atual) === normal(p.valor) ? "igual" : vazio ? "novo" : "substitui";
    return { ...p, atual, diferenca };
  });
}

/**
 * Kept by default: new values with high or medium confidence. A value that
 * would REPLACE what the person already wrote, or one with low confidence,
 * starts unticked — the person decides.
 */
export function escolhaInicial(linhas: readonly LinhaRevisao[]): Set<string> {
  return new Set(
    linhas
      .filter((l) => l.diferenca === "novo" && l.confianca !== "baixa")
      .map((l) => l.caminho),
  );
}

/** `{ caminho: valor }` of the kept proposals. */
export function valoresEscolhidos(
  linhas: readonly LinhaRevisao[],
  escolhidos: ReadonlySet<string>,
): Record<string, string | number> {
  return Object.fromEntries(
    linhas.filter((l) => escolhidos.has(l.caminho) && l.diferenca !== "igual").map((l) => [l.caminho, l.valor]),
  );
}

/** Reads `a.b.c` from an object (undefined if absent). */
export function lerCaminho(obj: unknown, caminho: string): unknown {
  let x: unknown = obj;
  for (const k of caminho.split(".")) {
    if (x === null || typeof x !== "object") return undefined;
    x = (x as Record<string, unknown>)[k];
  }
  return x;
}

/** A copy of `obj` with `a.b.c` = `valor` (creates the missing objects). */
export function escreverCaminho<T>(obj: T, caminho: string, valor: unknown): T {
  const [k, ...resto] = caminho.split(".");
  const base = (obj && typeof obj === "object" ? obj : {}) as Record<string, unknown>;
  if (!k) return obj;
  return {
    ...base,
    [k]: resto.length === 0 ? valor : escreverCaminho(base[k], resto.join("."), valor),
  } as T;
}

/** Applies `{ caminho: valor }` to a draft object (immutably). */
export function aplicarValores<T>(rascunho: T, valores: Readonly<Record<string, unknown>>): T {
  return Object.entries(valores).reduce((acc, [c, v]) => escreverCaminho(acc, c, v), rascunho);
}

/** The current values of a draft for the given paths (for `compararPropostas`). */
export function valoresDoRascunho(rascunho: unknown, caminhos: readonly string[]): Record<string, unknown> {
  return Object.fromEntries(caminhos.map((c) => [c, lerCaminho(rascunho, c)]));
}

// ─── Cérebro ────────────────────────────────────────────────────────────────

export const API_ASSISTENTE = "/api/v1/assistente";

/** The accepted files (the Cérebro detects the real type by the bytes). */
export const EXTENSOES_DOCUMENTO = ".pdf,.docx,.xlsx,.csv,.jpg,.jpeg,.png";

export class ErroAssistente extends Error {
  readonly estado: number;
  readonly codigo: string | null;
  constructor(estado: number, codigo: string | null, mensagem: string) {
    super(mensagem);
    this.estado = estado;
    this.codigo = codigo;
  }
}

/** The message for the person from a Cérebro error answer (pure). */
export function mensagemDoErro(estado: number, corpo: unknown): string {
  const c = (corpo && typeof corpo === "object" ? corpo : {}) as { error?: unknown; code?: unknown };
  const texto = typeof c.error === "string" ? c.error : null;
  if (estado === 401) return "A sua sessão terminou. Entre de novo para continuar.";
  if (estado === 413) return "O ficheiro é demasiado grande.";
  if (estado === 429 && c.code === "ERR_RATE_LIMIT") return "Chegou ao limite de documentos de hoje. Pode voltar a tentar amanhã.";
  if (texto) return texto;
  if (estado === 403) return "Não tem acesso a esta função do assistente. Peça-o ao super administrador da sua organização.";
  if (estado >= 500) return "O assistente não está disponível de momento. Tente dentro de alguns minutos.";
  return "Não foi possível concluir o pedido. Tente novamente.";
}

type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

async function pedir<T>(f: Fetch, caminho: string, init: RequestInit = {}): Promise<T> {
  const r = await f(caminho, { credentials: "same-origin", ...init });
  let corpo: unknown = null;
  try {
    corpo = await r.json();
  } catch {
    corpo = null;
  }
  if (!r.ok) {
    const c = (corpo ?? {}) as { code?: unknown };
    throw new ErroAssistente(r.status, typeof c.code === "string" ? c.code : null, mensagemDoErro(r.status, corpo));
  }
  return (corpo as { data: T }).data;
}

/** POST /ficheiros (multipart) → the stored document. */
export function carregarDocumento(f: Fetch, ficheiro: File, api = API_ASSISTENTE) {
  const form = new FormData();
  form.append("file", ficheiro);
  return pedir<{ id: string; nome: string; tipo: string; tamanho: number }>(f, `${api}/ficheiros`, {
    method: "POST",
    body: form,
  });
}

/** POST /extracoes → the read's id (the Cérebro reads in the background). */
export function pedirLeitura(f: Fetch, ficheiroId: string, alvo: string, api = API_ASSISTENTE) {
  return pedir<{ id: string }>(f, `${api}/extracoes`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ficheiroId, alvo }),
  });
}

export function estadoDaLeitura(f: Fetch, id: string, api = API_ASSISTENTE) {
  return pedir<Leitura>(f, `${api}/extracoes/${id}`);
}

export interface ItemFalta {
  campo: string;
  mensagem: string;
  ligacao: string;
}

export interface OQueFalta {
  formulario: string;
  ano?: number;
  podeSubmeter?: boolean;
  submetida?: boolean;
  mensagem?: string;
  porCapitulo?: Array<{ capitulo: string; itens: ItemFalta[] }>;
  impedimentos?: Array<{ documento: string; mensagem: string; ligacao: string }>;
  porSubmeter?: string[];
  nota?: string;
  semAcesso?: string;
}

/** GET /formularios/:formulario/falta (the same rules as submitting). */
export function pedirOQueFalta(f: Fetch, formulario: "caracterizacao" | "simplex", api = API_ASSISTENTE) {
  return pedir<OQueFalta>(f, `${api}/formularios/${formulario}/falta`);
}

/** POST /redigir → an editable text in the MUTU@L voice. */
export function pedirTexto(
  f: Fetch,
  corpo: { tipo: "email" | "convite" | "descricao-evento" | "resumo-ata" | "texto"; pedido: string; contexto?: Record<string, string> },
  api = API_ASSISTENTE,
) {
  return pedir<{ tipo: string; titulo: string; texto: string }>(f, `${api}/redigir`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(corpo),
  });
}

/** Waits for a read to finish (polling), reporting progress. */
export async function esperarLeitura(
  f: Fetch,
  id: string,
  aoAvancar: (l: Leitura) => void,
  o: { api?: string; intervaloMs?: number; sinal?: AbortSignal; maxMs?: number } = {},
): Promise<Leitura> {
  const inicio = Date.now();
  const intervalo = o.intervaloMs ?? 800;
  for (;;) {
    if (o.sinal?.aborted) throw new ErroAssistente(0, "CANCELADO", "Leitura cancelada.");
    const l = await estadoDaLeitura(f, id, o.api);
    aoAvancar(l);
    if (l.estado === "concluida" || l.estado === "erro") return l;
    if (Date.now() - inicio > (o.maxMs ?? 5 * 60_000)) {
      throw new ErroAssistente(0, "DEMORADO", "A leitura está a demorar mais do que o normal. Tente de novo mais tarde.");
    }
    await new Promise((r) => setTimeout(r, intervalo));
  }
}

/** "Alta", "Média", "Baixa" (pure). */
export const TEXTO_CONFIANCA: Record<Confianca, string> = { alta: "Confiança alta", media: "Confiança média", baixa: "Confiança baixa" };
