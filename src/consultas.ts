import { QueryClient, type QueryClientConfig } from "@tanstack/react-query";

/** `@umporg/ui/consultas`: one TanStack Query client with the same defaults in every app (optional peer `@tanstack/react-query`). */

/** 60 s: a page revisited within a minute is shown from memory, without asking the server again. */
export const CONSULTA_FRESCA_MS = 60_000;

/** The HTTP status of an error from any app's client (`ErroApi`, `ApiError`, …), or `undefined` for a network failure. */
export function estadoDoErro(erro: unknown): number | undefined {
  if (typeof erro !== "object" || erro === null) return undefined;
  const { status } = erro as { status?: unknown };
  return typeof status === "number" && Number.isFinite(status) ? status : undefined;
}

/**
 * Retry once, and only when trying again can help: a network failure (no status) or a server error (5xx).
 * A 4xx (no session, refused, not found, invalid) gives the same answer the second time.
 */
export function repetirConsulta(tentativas: number, erro: unknown): boolean {
  if (tentativas >= 1) return false;
  const estado = estadoDoErro(erro);
  return estado === undefined || estado >= 500;
}

/**
 * `new QueryClient` with the shared defaults: `staleTime` 60 s, no refetch when the tab regains focus (turn it on per
 * query with `refetchOnWindowFocus: true` where live data matters), one retry on network/5xx only, mutations never
 * retried. The app keeps its own `queryCache`/`mutationCache` (e.g. the 401 handler) and may override any default.
 */
export function criarQueryClient(config: QueryClientConfig = {}): QueryClient {
  const { defaultOptions, ...resto } = config;
  return new QueryClient({
    ...resto,
    defaultOptions: {
      ...defaultOptions,
      queries: {
        staleTime: CONSULTA_FRESCA_MS,
        refetchOnWindowFocus: false,
        retry: repetirConsulta,
        ...defaultOptions?.queries,
      },
      mutations: {
        retry: false,
        ...defaultOptions?.mutations,
      },
    },
  });
}
