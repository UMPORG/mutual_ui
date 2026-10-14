"use client";

/**
 * Main-entry pieces of the floating assistant, no Base UI. `AppShell` renders `BotaoAssistente` only when the app passes its `assistente` slot (never in the Assistente app).
 * The position registry's default context is one registry per page, so apps need no provider; the «Demonstração» widget publishes its footprint in it and the chat yields.
 */
import { createContext, useContext, useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { GlifoApp } from "./icone-app";
import { cx } from "./cx";
import { hashContexto, normalizarContexto, type EntradaContexto } from "./assistente-contexto";
import {
  avisoResposta,
  estadoChat,
  marcarAvisoResposta,
  estadoChatServidor,
  mudarChat,
  publicarContextoPagina,
  registoPosicoesGlobal,
  type ContextoPublicado,
  type EstadoChat,
  type RegistoPosicoes,
} from "./assistente-estado";

const ContextoPosicoes = createContext<RegistoPosicoes>(registoPosicoesGlobal);

export function ProvedorPosicoes({ registo, children }: { registo: RegistoPosicoes; children: ReactNode }) {
  return <ContextoPosicoes.Provider value={registo}>{children}</ContextoPosicoes.Provider>;
}

export function useRegistoPosicoes(): RegistoPosicoes {
  return useContext(ContextoPosicoes);
}

export function useEstadoChat(): EstadoChat {
  return useSyncExternalStore(estadoChat.ouvir, estadoChat.ler, estadoChatServidor);
}

export const ID_CHAT_FLUTUANTE = "mutual-chat-flutuante";

export function BotaoAssistente({ className }: { className?: string | undefined }) {
  const { aberto } = useEstadoChat();
  const nova = useSyncExternalStore(avisoResposta.ouvir, avisoResposta.ler, () => false);
  return (
    <button
      type="button"
      data-shell="assistente"
      aria-expanded={aberto}
      aria-controls={aberto ? ID_CHAT_FLUTUANTE : undefined}
      onClick={() => {
        if (!aberto) marcarAvisoResposta(false);
        mudarChat({ aberto: !aberto });
      }}
      className={cx("m-barra-util relative max-md:!w-11 max-md:!justify-center max-md:!px-0", className)}
    >
      <GlifoApp app="assistente" />
      <span className="max-md:sr-only">Assistente</span>
      {nova && !aberto && (
        <>
          <span aria-hidden className="m-assistente-ponto" />
          <span className="sr-only">(nova resposta)</span>
        </>
      )}
    </button>
  );
}

export interface OpcoesContextoAssistente extends EntradaContexto {
  /** Applies values the assistant proposed to the page's DRAFT, never submits. Without it, proposals are not offered. */
  aoAplicar?: ((valores: Record<string, string | number>) => void) | undefined;
}

/** Publishes the page's context while mounted (`null` = nothing); only a real change is published (hash), so `aoAplicar` may change identity freely. */
export function useContextoAssistente(opcoes: OpcoesContextoAssistente | null): void {
  const aoAplicar = useRef(opcoes?.aoAplicar);
  aoAplicar.current = opcoes?.aoAplicar;
  const temAplicar = typeof opcoes?.aoAplicar === "function";
  const pub = useRef<ReturnType<typeof publicarContextoPagina> | null>(null);
  const rota = typeof window === "undefined" ? "" : window.location.pathname;
  const contexto = opcoes ? normalizarContexto(opcoes, rota) : null;
  const hash = contexto ? hashContexto(contexto) : null;
  const chave = hash === null ? null : `${hash}${temAplicar ? "+" : ""}`;

  useEffect(() => {
    if (!contexto || !hash) return;
    const c: ContextoPublicado = {
      contexto,
      hash,
      aoAplicar: temAplicar ? (v) => aoAplicar.current?.(v) : undefined,
    };
    if (pub.current) pub.current.atualizar(c);
    else pub.current = publicarContextoPagina(c);
    // `contexto` is described by `hash`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  useEffect(
    () => () => {
      pub.current?.retirar();
      pub.current = null;
    },
    [],
  );

  useEffect(() => {
    if (chave === null && pub.current) {
      pub.current.retirar();
      pub.current = null;
    }
  }, [chave]);
}
