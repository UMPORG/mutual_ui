"use client";

/**
 * The floating assistant — main-entry pieces, no Base UI:
 *
 * - `BotaoAssistente`: «Assistente» in the shell's top bar (next to Ajuda).
 *   `AppShell` renders it when the app passes its `assistente` slot (the
 *   `<ChatFlutuante/>` of `@umporg/ui/assistente`), never in the Assistente
 *   app itself.
 * - `useContextoAssistente`: a page publishes what the person is looking at
 *   (app, page, section, fields); only a change is published.
 * - The position registry (`ProvedorPosicoes`, `useRegistoPosicoes`): a React
 *   context whose default is one registry per page, so no app has to add a
 *   provider; the «Demonstração» widget publishes its footprint in it and the
 *   chat yields.
 */
import { createContext, useContext, useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { Sparkles } from "lucide-react";
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

// ─── Position registry ───────────────────────────────────────────────────────

const ContextoPosicoes = createContext<RegistoPosicoes>(registoPosicoesGlobal);

/** Optional: an isolated registry (tests, a preview with two shells). */
export function ProvedorPosicoes({ registo, children }: { registo: RegistoPosicoes; children: ReactNode }) {
  return <ContextoPosicoes.Provider value={registo}>{children}</ContextoPosicoes.Provider>;
}

export function useRegistoPosicoes(): RegistoPosicoes {
  return useContext(ContextoPosicoes);
}

// ─── Chat state ──────────────────────────────────────────────────────────────

/** Open/closed, corner and conversation of the floating chat (kept on the device). */
export function useEstadoChat(): EstadoChat {
  return useSyncExternalStore(estadoChat.ouvir, estadoChat.ler, estadoChatServidor);
}

export const ID_CHAT_FLUTUANTE = "mutual-chat-flutuante";

/**
 * «Assistente» in the top bar: opens and closes the floating chat. Focus comes
 * back here when the chat closes (Esc).
 */
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
      <Sparkles aria-hidden />
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

// ─── Page context ────────────────────────────────────────────────────────────

export interface OpcoesContextoAssistente extends EntradaContexto {
  /**
   * Applies values the assistant proposed (and the person kept) to the
   * page's DRAFT — never submits. Without it, proposals are not offered.
   */
  aoAplicar?: ((valores: Record<string, string | number>) => void) | undefined;
}

/**
 * Publishes the page's context for the floating assistant while the page is
 * mounted (pass `null` to publish nothing):
 *
 *   useContextoAssistente({
 *     app: "backoffice", pagina: "Caracterização", seccao: "A. Identificação",
 *     dados: { "identificacao.nome": { valor: nome, rotulo: "Nome", editavel: true },
 *              "identificacao.nif": { valor: nif, rotulo: "NIF", sensivel: true } },
 *     formulario: "caracterizacao", alvo: "caracterizacao.a",
 *     aoAplicar: (v) => setRascunho((r) => aplicarValores(r, v)),
 *   });
 *
 * Only a real change is published (compact hash); `aoAplicar` may change
 * identity freely.
 */
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

  // `null` after a context: withdraw it.
  useEffect(() => {
    if (chave === null && pub.current) {
      pub.current.retirar();
      pub.current = null;
    }
  }, [chave]);
}
