"use client";

import { createContext, useContext } from "react";
import type { Lancamento } from "./apps";

/**
 * What `AppShell` knows about the launch switches of the page it frames
 * (from its `lancamento`, `app` and `caminhoAtual` props). Outside a shell,
 * everything is on.
 */
export interface EstadoLancamento {
  lancamento: Lancamento | null;
  app: string | null;
  caminho: string | null;
  /** `assistenteLigado(lancamento, app, caminho)`. */
  assistente: boolean;
}

export const ContextoLancamento = createContext<EstadoLancamento>({ lancamento: null, app: null, caminho: null, assistente: true });

/** The launch switches of the current page (inside `AppShell`). */
export function useLancamento(): EstadoLancamento {
  return useContext(ContextoLancamento);
}

/** The assistant may show on this page (false when the UMP switched it off here). */
export function useAssistenteLigado(): boolean {
  return useContext(ContextoLancamento).assistente;
}
