"use client";

import { createContext, useContext } from "react";
import type { Lancamento } from "./apps";

/** What `AppShell` knows about the launch switches of the page it frames; outside a shell everything is on. */
export interface EstadoLancamento {
  lancamento: Lancamento | null;
  app: string | null;
  caminho: string | null;
  assistente: boolean;
}

export const ContextoLancamento = createContext<EstadoLancamento>({ lancamento: null, app: null, caminho: null, assistente: true });

export function useLancamento(): EstadoLancamento {
  return useContext(ContextoLancamento);
}

/** The assistant may show on this page (false when the UMP switched it off here). */
export function useAssistenteLigado(): boolean {
  return useContext(ContextoLancamento).assistente;
}
