/**
 * Monitorização (ADR 0007) — reportar erros das apps ao Cérebro e propagar o
 * id do pedido (`x-pedido-id`). Sem React: serve o browser, o servidor Next
 * (`instrumentation.ts` → `onRequestError`) e o edge.
 *
 *   // instrumentation.ts (servidor)
 *   export const onRequestError = criarOnRequestError({
 *     app: "eventos", cerebroUrl: env.CEREBRO_URL_INTERNO ?? env.MUTUAL_URL, chave: env.MONITOR_CHAVE,
 *   });
 *
 *   // browser (layout raiz): <MonitorCliente app="eventos" /> de "@umporg/ui/monitor/react"
 *
 * Contrato do Cérebro: `POST /api/v1/monitor/erros` (`mutual_cerebro/docs/referencia/monitorizacao.md`). O browser
 * envia para o mesmo endereço (`/api/v1/monitor/erros`), com ou sem sessão, e
 * só pode dizer `lado: "browser"`; o servidor da app envia com a Machine Key
 * de serviço `monitor` (`X-Machine-Key`, variável `MONITOR_CHAVE`). Sem
 * chave, os erros do servidor não são enviados (ficam só no registo da app).
 *
 * Nunca lança, nunca atrasa quem chama mais do que o tempo limite (3 s), e
 * nunca envia corpos, cookies ou cabeçalhos: só o tipo, a mensagem, a stack,
 * a página (o Cérebro guarda apenas o caminho normalizado) e o contexto que a
 * app passar (valores simples).
 */
import type { MutualAppId } from "./apps";

/** Cabeçalho do id do pedido (o mesmo em todo o ecossistema). */
export const CABECALHO_PEDIDO = "x-pedido-id";
export const CAMINHO_ERROS = "/api/v1/monitor/erros";

const FORMATO_ID = /^[A-Za-z0-9._-]{8,64}$/;

/** Um id novo para um pedido (UUID). */
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

/** Cabeçalhos para uma chamada ao Cérebro com o mesmo id do pedido. */
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

/** Qualquer coisa que foi lançada → texto limitado (com a cadeia de `cause`). */
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
  /** a app que reporta */
  app: MutualAppId;
  /** omissão: `browser` no browser, `servidor` fora dele */
  lado?: "browser" | "servidor" | undefined;
  /** versão implantada (commit curto) */
  versao?: string | null | undefined;
  /**
   * Para onde enviar. Browser: omissão `/api/v1/monitor/erros` (mesma origem).
   * Servidor: o URL absoluto do Cérebro + esse caminho (`criarOnRequestError` faz isto).
   */
  endpoint?: string | undefined;
  /** Machine Key de serviço `monitor` — só no servidor, nunca no browser */
  chave?: string | null | undefined;
  /** página ou rota onde aconteceu */
  url?: string | null | undefined;
  pedidoId?: string | null | undefined;
  contexto?: Readonly<Record<string, ValorContexto>> | undefined;
  /** para testes */
  fetch?: typeof fetch | undefined;
}

const noBrowser = () => typeof window !== "undefined" && typeof document !== "undefined";

// Travões do browser: o mesmo erro no máximo 1× por minuto, 20 por página.
const vistos = new Map<string, number>();
let enviadosNaPagina = 0;
const MAX_POR_PAGINA = 20;

/** Para testes: esquece os travões. */
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

/**
 * Envia um erro ao Cérebro. Nunca lança. Devolve `true` se o Cérebro o
 * aceitou (útil em testes e para mostrar «o erro foi registado»).
 */
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

/**
 * Erros não apanhados no browser (`error` e `unhandledrejection`). Devolve a
 * função que desliga os ouvintes. Chamar uma vez (o `MonitorCliente` faz isto).
 */
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

/** O que o Next passa a `onRequestError` (instrumentation.ts). */
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

/**
 * `onRequestError` para o `instrumentation.ts` das apps Next: envia o erro do
 * servidor ao Cérebro com a Machine Key. Sem `cerebroUrl` ou sem `chave` não
 * faz nada (os erros continuam no registo da própria app).
 */
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
