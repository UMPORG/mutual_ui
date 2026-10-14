/**
 * Monitorização (ADR 0007): reporta erros das apps ao Cérebro e propaga o `x-pedido-id`. Sem React (browser,
 * servidor Next via `instrumentation.ts` → `onRequestError`, edge). Contrato: `POST /api/v1/monitor/erros`
 * (mutual_cerebro/docs/referencia/monitorizacao.md). O browser envia à mesma origem, com ou sem sessão, e só
 * pode dizer `lado: "browser"`; o servidor envia com a Machine Key do serviço `monitor` (`MONITOR_CHAVE`; sem
 * chave não envia). Nunca lança, nunca atrasa mais de 3 s e nunca envia corpos, cookies ou cabeçalhos: só tipo,
 * mensagem, stack, página (o Cérebro guarda o caminho normalizado) e contexto simples.
 */
import type { MutualAppId } from "./apps";

export const CABECALHO_PEDIDO = "x-pedido-id";
export const CAMINHO_ERROS = "/api/v1/monitor/erros";

const FORMATO_ID = /^[A-Za-z0-9._-]{8,64}$/;

export function novoPedidoId(): string {
  return crypto.randomUUID();
}

type CabecalhosSoltos = Headers | Readonly<Record<string, string | readonly string[] | undefined>>;

/** O `x-pedido-id` recebido, se tiver um formato seguro (senão `null`). */
export function pedidoIdDe(cabecalhos: CabecalhosSoltos | null | undefined): string | null {
  if (!cabecalhos) return null;
  const bruto =
    typeof (cabecalhos as Headers).get === "function"
      ? (cabecalhos as Headers).get(CABECALHO_PEDIDO)
      : (cabecalhos as Record<string, string | readonly string[] | undefined>)[CABECALHO_PEDIDO];
  const v = (Array.isArray(bruto) ? bruto[0] : bruto) as string | null | undefined;
  return v && FORMATO_ID.test(v.trim()) ? v.trim() : null;
}

export function cabecalhosComPedido(pedidoId: string | null | undefined): Record<string, string> {
  return pedidoId && FORMATO_ID.test(pedidoId) ? { [CABECALHO_PEDIDO]: pedidoId } : {};
}

export interface ErroSerializado {
  tipo: string;
  mensagem: string;
  stack: string | null;
  causa: string | null;
  digest: string | null;
}

const corta = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

export function serializarErro(erro: unknown): ErroSerializado {
  if (erro instanceof Error) {
    const causas: string[] = [];
    let c: unknown = (erro as { cause?: unknown }).cause;
    for (let i = 0; c !== undefined && c !== null && i < 4; i++) {
      causas.push(
        c instanceof Error ? `${c.name}: ${c.message}${c.stack ? `\n${c.stack}` : ""}` : String(c),
      );
      c = c instanceof Error ? (c as { cause?: unknown }).cause : undefined;
    }
    const digest = (erro as { digest?: unknown }).digest;
    return {
      tipo: corta(erro.name || "Error", 120),
      mensagem: corta(erro.message || "(sem mensagem)", 4000),
      stack: erro.stack ? corta(erro.stack, 16_000) : null,
      causa: causas.length ? corta(causas.join("\n— causa —\n"), 8000) : null,
      digest: typeof digest === "string" ? corta(digest, 64) : null,
    };
  }
  if (typeof erro === "string") {
    return { tipo: "Error", mensagem: corta(erro || "(sem mensagem)", 4000), stack: null, causa: null, digest: null };
  }
  let texto: string;
  try {
    texto = JSON.stringify(erro) ?? String(erro);
  } catch {
    texto = String(erro);
  }
  return { tipo: "NaoErro", mensagem: corta(texto || "(sem mensagem)", 4000), stack: null, causa: null, digest: null };
}

/** Ruído conhecido dos browsers que não é um problema da app. */
const RUIDO: readonly RegExp[] = [
  /ResizeObserver loop/i,
  /^Script error\.?$/im,
  /(chrome|moz|safari(-web)?)-extension:\/\//i,
  /^AbortError$/,
  /The (user aborted|operation was aborted)/i,
  /NEXT_REDIRECT|NEXT_NOT_FOUND|NEXT_HTTP_ERROR_FALLBACK/,
];

export function eRuido(e: ErroSerializado): boolean {
  const texto = `${e.tipo}\n${e.mensagem}\n${e.stack ?? ""}`;
  return RUIDO.some((re) => re.test(texto)) || RUIDO.some((re) => re.test(e.tipo));
}

type ValorContexto = string | number | boolean | null;

export interface OpcoesReporte {
  app: MutualAppId;
  /** omissão: `browser` no browser, `servidor` fora dele */
  lado?: "browser" | "servidor" | undefined;
  versao?: string | null | undefined;
  /** Para onde enviar. Browser: `/api/v1/monitor/erros` (mesma origem); servidor: URL absoluto do Cérebro + esse caminho. */
  endpoint?: string | undefined;
  /** Machine Key de serviço `monitor` — só no servidor, nunca no browser */
  chave?: string | null | undefined;
  url?: string | null | undefined;
  pedidoId?: string | null | undefined;
  contexto?: Readonly<Record<string, ValorContexto>> | undefined;
  fetch?: typeof fetch | undefined;
}

const noBrowser = () => typeof window !== "undefined" && typeof document !== "undefined";

// Travões do browser: o mesmo erro no máximo 1× por minuto, 20 por página.
const vistos = new Map<string, number>();
let enviadosNaPagina = 0;
const MAX_POR_PAGINA = 20;

export function reporTravoes(): void {
  vistos.clear();
  enviadosNaPagina = 0;
}

function contextoLimpo(c: Readonly<Record<string, ValorContexto>> | undefined) {
  if (!c) return undefined;
  const out: Record<string, ValorContexto> = {};
  for (const [k, v] of Object.entries(c).slice(0, 20)) {
    out[k.slice(0, 60)] = typeof v === "string" ? corta(v, 300) : v;
  }
  return out;
}

/** Envia um erro ao Cérebro; nunca lança. Devolve `true` se foi aceite. */
export async function reportarErro(erro: unknown, o: OpcoesReporte): Promise<boolean> {
  try {
    const lado = o.lado ?? (noBrowser() ? "browser" : "servidor");
    const e = serializarErro(erro);
    if (lado === "browser") {
      if (eRuido(e)) return false;
      const chave = `${e.tipo}|${e.mensagem}`;
      const agora = Date.now();
      if ((vistos.get(chave) ?? 0) > agora - 60_000) return false;
      if (enviadosNaPagina >= MAX_POR_PAGINA) return false;
      vistos.set(chave, agora);
      enviadosNaPagina++;
    } else if (!o.chave) {
      return false; // sem Machine Key o Cérebro recusa erros do servidor
    }
    const url = o.url ?? (noBrowser() ? window.location.href : null);
    const corpo = {
      app: o.app,
      lado,
      tipo: e.tipo,
      mensagem: e.mensagem,
      stack: e.stack,
      causa: e.causa,
      url: url ? corta(url, 2000) : null,
      versao: o.versao ? corta(o.versao, 64) : null,
      pedidoId: o.pedidoId && FORMATO_ID.test(o.pedidoId) ? o.pedidoId : null,
      digest: e.digest,
      contexto: contextoLimpo(o.contexto),
    };
    const cabecalhos: Record<string, string> = { "content-type": "application/json" };
    if (lado === "servidor" && o.chave) cabecalhos["x-machine-key"] = o.chave;
    const r = await (o.fetch ?? fetch)(o.endpoint ?? CAMINHO_ERROS, {
      method: "POST",
      headers: cabecalhos,
      body: JSON.stringify(corpo),
      keepalive: lado === "browser",
      credentials: lado === "browser" ? "same-origin" : "omit",
      signal: AbortSignal.timeout(3000),
    });
    return r.ok;
  } catch {
    return false;
  }
}

/** Ouvintes de `error` e `unhandledrejection` no browser; devolve a função que os desliga. */
export function instalarReporteGlobal(o: Omit<OpcoesReporte, "lado" | "chave">): () => void {
  if (!noBrowser()) return () => {};
  const aoErro = (ev: ErrorEvent) => {
    void reportarErro(ev.error ?? ev.message, { ...o, lado: "browser", contexto: { origem: "window.onerror" } });
  };
  const aoRejeitar = (ev: PromiseRejectionEvent) => {
    void reportarErro(ev.reason, { ...o, lado: "browser", contexto: { origem: "unhandledrejection" } });
  };
  window.addEventListener("error", aoErro);
  window.addEventListener("unhandledrejection", aoRejeitar);
  return () => {
    window.removeEventListener("error", aoErro);
    window.removeEventListener("unhandledrejection", aoRejeitar);
  };
}

export interface PedidoNext {
  path: string;
  method: string;
  headers: CabecalhosSoltos;
}
export interface ContextoNext {
  routerKind: string;
  routePath: string;
  routeType: string;
  renderSource?: string | undefined;
  revalidateReason?: string | undefined;
}

/** `onRequestError` do `instrumentation.ts`: envia o erro do servidor com a Machine Key; sem `cerebroUrl` ou `chave` não faz nada. */
export function criarOnRequestError(o: {
  app: MutualAppId;
  cerebroUrl: string | null | undefined;
  chave: string | null | undefined;
  versao?: string | null | undefined;
  fetch?: typeof fetch | undefined;
}) {
  return async (erro: unknown, pedido: PedidoNext, contexto: ContextoNext): Promise<void> => {
    if (!o.cerebroUrl || !o.chave) return;
    await reportarErro(erro, {
      app: o.app,
      lado: "servidor",
      versao: o.versao,
      endpoint: `${o.cerebroUrl.replace(/\/+$/, "")}${CAMINHO_ERROS}`,
      chave: o.chave,
      url: pedido.path,
      pedidoId: pedidoIdDe(pedido.headers),
      fetch: o.fetch,
      contexto: {
        metodo: pedido.method,
        routerKind: contexto.routerKind,
        routePath: contexto.routePath,
        routeType: contexto.routeType,
        renderSource: contexto.renderSource ?? null,
      },
    });
  };
}
