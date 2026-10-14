/**
 * Regra de todas as apps: uma falha do SERVIDOR (Cérebro inalcançável, sem resposta no tempo-limite, ou 5xx) nunca manda a pessoa para o login do Portal
 * (o Portal vê a sessão válida e devolve-a à app, em ciclo). O `proxy.ts` responde 503 com `/indisponivel`; o browser mostra `TEXTOS_INDISPONIVEL`.
 * Sem dependências do Next: só `fetch` e `AbortSignal`.
 */

/** Tempos-limite (ms): o proxy corre em cada página; o browser espera mais. */
export const TEMPO_LIMITE_CEREBRO_MS = {
  /** `proxy.ts` (ex.: `/acessos/eu` em cada página). */
  proxy: 5_000,
  servidor: 10_000,
  browser: 15_000,
} as const;

export type MotivoIndisponivel = "tempo-esgotado" | "rede" | "estado";

/** O Cérebro não respondeu (a tempo), ou respondeu 5xx. Nunca é «sem sessão». */
export class CerebroIndisponivel extends Error {
  readonly motivo: MotivoIndisponivel;
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

export const eFalhaDoServidor = (estado: number): boolean => estado >= 500;

export interface PedidoCerebro extends RequestInit {
  /** Omissão: `TEMPO_LIMITE_CEREBRO_MS.servidor`. */
  readonly tempoLimiteMs?: number;
  /** Omissão `true`: um 5xx lança `CerebroIndisponivel`; `false` devolve a resposta (para ler o corpo de erro). */
  readonly falharEm5xx?: boolean;
}

/** `fetch` com tempo-limite; lança `CerebroIndisponivel` sem ligação, no tempo-limite ou (por omissão) num 5xx. Um cancelamento pedido por quem chama (`signal`) continua um `AbortError`. */
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

export const TEXTOS_INDISPONIVEL = {
  titulo: "Serviço temporariamente indisponível",
  texto:
    "Não foi possível falar com o serviço central da plataforma. Tente novamente dentro de alguns minutos. Se o problema continuar, contacte o suporte.",
  tentar: "Tentar novamente",
} as const;
