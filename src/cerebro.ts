/**
 * Pedidos das apps ao Cérebro com tempo-limite e UMA semântica para «o Cérebro
 * está em baixo» (Onda 0, 2026-09-29).
 *
 * Regra de todas as apps: uma falha do SERVIDOR (Cérebro inalcançável, sem
 * resposta dentro do tempo-limite, ou 5xx) nunca manda a pessoa para o login do
 * Portal — o Portal vê a sessão válida e devolve-a à app, em ciclo. O
 * `proxy.ts` responde 503 com a página `/indisponivel` (`ServicoIndisponivel`)
 * e o browser mostra o mesmo texto (`TEXTOS_INDISPONIVEL`).
 *
 * Sem dependências do Next: só `fetch` e `AbortSignal`.
 */

/** Tempos-limite (ms): o proxy corre em cada página; o browser espera mais. */
export const TEMPO_LIMITE_CEREBRO_MS = {
  /** `proxy.ts` (ex.: `/acessos/eu` em cada página). */
  proxy: 5_000,
  /** Leituras e escritas no servidor (RSC, route handlers, server actions). */
  servidor: 10_000,
  /** Pedidos do browser (inclui uploads pequenos). */
  browser: 15_000,
} as const;

export type MotivoIndisponivel = "tempo-esgotado" | "rede" | "estado";

/** O Cérebro não respondeu (a tempo), ou respondeu 5xx. Nunca é «sem sessão». */
export class CerebroIndisponivel extends Error {
  readonly motivo: MotivoIndisponivel;
  /** Estado HTTP quando `motivo` é `"estado"` (≥ 500). */
  readonly estado: number | undefined;
  constructor(motivo: MotivoIndisponivel, estado?: number) {
    super(
      motivo === "estado"
        ? `Cérebro indisponível (HTTP ${estado})`
        : motivo === "tempo-esgotado"
          ? "Cérebro indisponível (sem resposta a tempo)"
          : "Cérebro indisponível (sem ligação)",
    );
    this.name = "CerebroIndisponivel";
    this.motivo = motivo;
    this.estado = estado;
  }
}

export function eCerebroIndisponivel(e: unknown): e is CerebroIndisponivel {
  return e instanceof CerebroIndisponivel || (e as { name?: unknown })?.name === "CerebroIndisponivel";
}

/** Um estado HTTP que é falha do servidor (e não da pessoa). */
export const eFalhaDoServidor = (estado: number): boolean => estado >= 500;

export interface PedidoCerebro extends RequestInit {
  /** Omissão: `TEMPO_LIMITE_CEREBRO_MS.servidor`. */
  readonly tempoLimiteMs?: number;
  /**
   * Omissão `true`: um 5xx lança `CerebroIndisponivel`. `false` devolve a
   * resposta (para quem quer ler o corpo de erro do Cérebro).
   */
  readonly falharEm5xx?: boolean;
}

/**
 * `fetch` com tempo-limite. Lança `CerebroIndisponivel` quando não há ligação,
 * quando o tempo acaba ou (por omissão) num 5xx. Um cancelamento pedido por
 * quem chama (`signal`) continua a ser um `AbortError` normal.
 */
export async function pedirAoCerebro(
  url: string | URL,
  { tempoLimiteMs = TEMPO_LIMITE_CEREBRO_MS.servidor, falharEm5xx = true, ...init }: PedidoCerebro = {},
): Promise<Response> {
  const tempo = AbortSignal.timeout(tempoLimiteMs);
  const signal = init.signal ? AbortSignal.any([init.signal, tempo]) : tempo;
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal });
  } catch (err) {
    if (init.signal?.aborted) throw err;
    if (tempo.aborted) throw new CerebroIndisponivel("tempo-esgotado");
    throw new CerebroIndisponivel("rede");
  }
  if (falharEm5xx && eFalhaDoServidor(res.status)) {
    // Liberta a ligação: o corpo não interessa.
    await res.body?.cancel().catch(() => undefined);
    throw new CerebroIndisponivel("estado", res.status);
  }
  return res;
}

/** Caminho (sem o basePath) da página de serviço indisponível de cada app. */
export const PAGINA_INDISPONIVEL = "/indisponivel";

/** Cabeçalhos da resposta 503 (o browser e os proxies voltam a tentar depois). */
export const CABECALHOS_INDISPONIVEL: Readonly<Record<string, string>> = {
  "Retry-After": "120",
  "Cache-Control": "no-store",
};

/** Os textos, iguais em todas as apps (página e estado no browser). */
export const TEXTOS_INDISPONIVEL = {
  titulo: "Serviço temporariamente indisponível",
  texto:
    "Não foi possível falar com o serviço central da MUTU@L. Tente novamente dentro de alguns minutos. Se o problema continuar, contacte o suporte.",
  tentar: "Tentar novamente",
} as const;
