"use client";

/**
 * `@umporg/ui/assistente` — the floating assistant chat.
 *
 *   <AppShell … assistente={eu.assistenteNaPagina ? <ChatFlutuante app="simplex" /> : undefined}>
 *
 * The links in a reply (sources, markdown) are paths from the MUTU@L root
 * (`/ajuda/…`, `/ir/…`), so they are always plain `<a>` — a router link
 * would put the app's basePath in front.
 *
 * Mounted by `AppShell` (it survives client navigation) and portalled to
 * `<body>`. Opened by «Assistente» in the top bar. The window:
 *
 * - drags by its header (mouse, pen, touch) and, when released, springs to
 *   the nearest of four corners (`--movimento-lento` + `--curva-mola`; with
 *   «Reduzir movimento» it snaps). The «Mover» button moves it with the
 *   arrow keys. At phone width it is a bottom sheet.
 * - never covers the «Demonstração» widget: it stacks above it (position
 *   registry, `assistente-posicao.ts`).
 * - Esc minimises it and gives the focus back to «Assistente»; replies are
 *   announced (`aria-live`, `MessageList`).
 * - «Nova conversa», «Conversas» (reopen any previous one; where each was
 *   started) and «Abrir no Assistente» (the same conversation at
 *   /assistente/c/<id>).
 * - Page context (`useContextoAssistente`): sent with the next question only
 *   when it changed; with it, «O que falta?», «Preencher com um documento»
 *   and the values the assistant proposes for the current section, applied
 *   by the page to its DRAFT (the proposals review of `/preencher`).
 *
 * Open state, corner and conversation id are kept on the device
 * (`assistente.flutuante.*`); the messages always come from the server.
 */
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ElementType,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ExternalLink, GripVertical, ListChecks, Minus, MessageSquarePlus, MessagesSquare, X } from "lucide-react";
import { cx } from "./cx";
import { GlifoApp } from "./icone-app";
import { Button } from "./basicos";
import { StatusCallout } from "./feedback";
import { MUTUAL_APPS, nomeDaApp, type AppNoEndereco, type MutualAppId } from "./apps";
import { CAMINHOS } from "./sso";
import { ID_CHAT_FLUTUANTE, useEstadoChat, useRegistoPosicoes } from "./assistente";
import {
  contextoPagina,
  marcarAvisoResposta,
  mudarChat,
  recarregarChat,
  type ContextoPublicado,
} from "./assistente-estado";
import { cantoMaisProximo, cantoPelaSeta, posicaoDoChat, type CantoChat, type Retangulo } from "./assistente-posicao";
import { contextoAEnviar, rotaSemIds, valoresDoContexto, type ContextoPagina } from "./assistente-contexto";
import {
  aplicarAcao,
  avaliarMensagem,
  listarConversas,
  obterConversa,
  obterEstado,
  perguntar,
  textoDaOrigem,
  type AcaoMensagem,
  type ConversaResumo,
  type EstadoAssistente,
  type EventoPergunta,
  type Fetch,
  type PropostaPagina,
  type RascunhoMensagem,
} from "./assistente-api";
import { ActionCard, ChatMessage, MessageList, ThreadList, type WorkStep } from "./conversa-componentes";
import { AttachButton, AttachmentChip, Composer } from "./conversa-compositor";
import type { ChatMessageData } from "./conversa-dados";
import { ListaDoQueFalta, PreencherComDocumento, RascunhoTexto, RevisaoPropostas } from "./preencher";
import {
  API_ASSISTENTE,
  carregarDocumento,
  compararPropostas,
  ErroAssistente,
  TEXTO_ASSISTENTE_INDISPONIVEL,
  escolhaInicial,
  pedirOQueFalta,
  valoresEscolhidos,
  type OQueFalta,
} from "./preencher-dados";

export { useContextoAssistente, BotaoAssistente, ProvedorPosicoes } from "./assistente";
export type { EntradaContexto, CampoContexto, ContextoPagina } from "./assistente-contexto";

export interface ChatFlutuanteProps {
  /** The app it is in (the page context and the conversation's origin). */
  app: AppNoEndereco;
  /**
   * @deprecated Ignored since v0.18.2: the links in a reply are paths from
   * the MUTU@L root and are always plain `<a>` (a router `Link` would add
   * the app's basePath — `/backoffice/ajuda/…`).
   */
  LinkComponent?: ElementType | undefined;
  /** Default `/api/v1/assistente` (same origin). */
  api?: string | undefined;
  /** For tests and the showcase. */
  fetcher?: Fetch | undefined;
  /** Where the Assistente app lives (default `/assistente`). */
  enderecoAssistente?: string | undefined;
}

const TAMANHO = { w: 400, h: 640 };
const nomeApp = (a: string): string | null =>
  a === "portal" || MUTUAL_APPS.some((x) => x.id === a) ? (nomeDaApp(a as MutualAppId) ?? null) : null;
const VAZIO: readonly Retangulo[] = [];
const NOMES_CANTO: Record<CantoChat, string> = {
  "inf-dir": "canto inferior direito",
  "inf-esq": "canto inferior esquerdo",
  "sup-dir": "canto superior direito",
  "sup-esq": "canto superior esquerdo",
};

type MensagemEcra = ChatMessageData & {
  rascunhos: RascunhoMensagem[];
  acoes: AcaoMensagem[];
  propostas: PropostaPagina[];
};

type Vista = "conversa" | "conversas" | "falta";

const ESTADO_ACAO = (estado: string): "proposta" | "aplicada" | "cancelada" | "erro" =>
  estado === "aplicada" ? "aplicada" : estado === "cancelada" || estado === "expirada" ? "cancelada" : estado === "erro" ? "erro" : "proposta";

/** The chat (renders nothing until opened once; then stays mounted while minimised). */
export function ChatFlutuante(props: ChatFlutuanteProps) {
  const { aberto } = useEstadoChat();
  const [montado, setMontado] = useState(false);
  const [usado, setUsado] = useState(false);
  useEffect(() => setMontado(true), []);
  useEffect(() => {
    if (aberto) setUsado(true);
  }, [aberto]);
  // Another tab (or app) moved or closed it.
  useEffect(() => {
    const f = (e: StorageEvent) => {
      if (e.key === null || e.key.startsWith("assistente.flutuante.")) recarregarChat();
    };
    window.addEventListener("storage", f);
    return () => window.removeEventListener("storage", f);
  }, []);
  if (!montado || !usado) return null;
  return createPortal(<Janela {...props} aberto={aberto} />, document.body);
}

// ─── The window ──────────────────────────────────────────────────────────────

function useViewport() {
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  useEffect(() => {
    const f = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  return vp;
}

/** The bottom of the shell's top bar (nothing goes above it). */
function alturaDaBarra(): number {
  const b = document.querySelector(".m-app-barra");
  return b ? Math.max(0, Math.round(b.getBoundingClientRect().bottom)) : 0;
}

function botaoDoAssistente(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-shell="assistente"]');
}

function Janela({ app, api = API_ASSISTENTE, fetcher, enderecoAssistente = CAMINHOS.assistente, aberto }: ChatFlutuanteProps & { aberto: boolean }) {
  const f: Fetch = useMemo(() => fetcher ?? ((i: string, init?: RequestInit) => fetch(i, init)), [fetcher]);
  const { canto, conversaId } = useEstadoChat();
  const registo = useRegistoPosicoes();
  const ocupados = useSyncExternalStore(registo.ouvir, registo.ocupados, () => VAZIO);
  const ctxPagina = useSyncExternalStore(contextoPagina.ouvir, contextoPagina.ler, () => null);
  const vp = useViewport();
  const [topo, setTopo] = useState(0);
  useLayoutEffect(() => setTopo(alturaDaBarra()), [vp]);
  const pos = posicaoDoChat(canto, { tamanho: TAMANHO, viewport: vp, topo, ocupados, margem: vp.w < 640 ? 16 : 20 });

  const raizRef = useRef<HTMLDivElement>(null);
  const tituloId = useId();
  const [arrasto, setArrasto] = useState<{ dx: number; dy: number } | null>(null);
  const inicio = useRef<{ x: number; y: number; id: number } | null>(null);
  const [anuncio, setAnuncio] = useState("");
  const [animar, setAnimar] = useState(false);

  // ─── Data ───
  const [estado, setEstado] = useState<EstadoAssistente | null>(null);
  const [erroEstado, setErroEstado] = useState<string | null>(null);
  const [vista, setVista] = useState<Vista>("conversa");
  const [mensagens, setMensagens] = useState<MensagemEcra[]>([]);
  const [titulo, setTitulo] = useState<string | null>(null);
  const [aCarregar, setACarregar] = useState(false);
  const [erroConversa, setErroConversa] = useState<string | null>(null);
  const [aResponder, setAResponder] = useState(false);
  const [passos, setPassos] = useState<WorkStep[]>([]);
  const [conversas, setConversas] = useState<ConversaResumo[] | null>(null);
  const [falta, setFalta] = useState<OQueFalta | "a-carregar" | string | null>(null);
  const [anexos, setAnexos] = useState<Array<{ chave: string; nome: string; tamanho: number; id: string | null; estado: "a-carregar" | "pronto" | "erro" }>>([]);
  const carregada = useRef<string | null>(null);
  const cancelar = useRef<AbortController | null>(null);
  const ultimoHash = useRef(new Map<string, string>());
  const abertoRef = useRef(aberto);
  abertoRef.current = aberto;

  const pode = (c: string) => estado?.capacidades.includes(c) ?? false;

  useEffect(() => {
    if (!aberto || estado || erroEstado) return;
    obterEstado(f, api).then(setEstado, (e: unknown) =>
      setErroEstado(e instanceof ErroAssistente ? e.message : "O assistente não está disponível de momento. Tente dentro de alguns minutos."),
    );
  }, [aberto, estado, erroEstado, f, api]);

  // Open the kept conversation (content always from the server).
  useEffect(() => {
    if (!aberto || !estado || aResponder) return;
    if (!conversaId) {
      if (carregada.current !== null) {
        carregada.current = null;
        setMensagens([]);
        setTitulo(null);
      }
      return;
    }
    if (carregada.current === conversaId) return;
    carregada.current = conversaId;
    setACarregar(true);
    setErroConversa(null);
    obterConversa(f, conversaId, api)
      .then((c) => {
        setTitulo(c.titulo);
        setMensagens(
          c.mensagens.map((m) => ({
            id: m.id,
            role: m.estado === "error" && m.papel === "assistant" ? "error" : m.papel,
            content: m.conteudo,
            createdAt: m.criadaEm,
            status: m.estado,
            sources: m.fontes,
            feedback: m.feedback,
            rascunhos: m.rascunhos,
            acoes: m.acoes,
            propostas: m.propostas,
          })),
        );
      })
      .catch((e: unknown) => {
        if (e instanceof ErroAssistente && e.estado === 404) {
          // Deleted elsewhere: start a new one.
          mudarChat({ conversaId: null });
          return;
        }
        setErroConversa(e instanceof ErroAssistente ? e.message : "Não foi possível abrir a conversa.");
      })
      .finally(() => setACarregar(false));
  }, [aberto, estado, conversaId, aResponder, f, api]);

  // Focus: the message box when it opens; «Assistente» when it closes.
  // On the first open the message box is still disabled (GET /estado is
  // loading): the window itself takes the focus (so Esc works) and the box
  // gets it as soon as it can, unless the person moved the focus meanwhile.
  const primeiraVez = useRef(true);
  const focoPendente = useRef(false);
  const focarCaixa = useCallback(() => {
    const raiz = raizRef.current;
    if (!raiz || raiz.hidden) return;
    const ativo = document.activeElement;
    const livre = !ativo || ativo === document.body || ativo === raiz || ativo === botaoDoAssistente();
    if (!livre) {
      focoPendente.current = false;
      return;
    }
    const alvo = raiz.querySelector<HTMLElement>("textarea:not(:disabled), [data-foco-inicial]");
    if (alvo) {
      alvo.focus();
      focoPendente.current = false;
    } else if (ativo !== raiz) {
      raiz.focus();
    }
  }, []);
  useEffect(() => {
    if (primeiraVez.current) {
      primeiraVez.current = false;
      if (!aberto) return;
    }
    focoPendente.current = aberto;
    if (aberto) requestAnimationFrame(focarCaixa);
  }, [aberto, focarCaixa]);
  // The box became usable (state loaded, a document attached) or an error replaced it.
  const caixaDisponivel = !!estado && !erroEstado;
  useEffect(() => {
    if (!aberto || !focoPendente.current) return;
    if (erroEstado) {
      focoPendente.current = false;
      return;
    }
    if (caixaDisponivel) requestAnimationFrame(focarCaixa);
  }, [aberto, caixaDisponivel, erroEstado, focarCaixa]);

  const minimizar = useCallback(() => {
    mudarChat({ aberto: false });
    botaoDoAssistente()?.focus();
  }, []);

  const novaConversa = () => {
    cancelar.current?.abort();
    carregada.current = null;
    setMensagens([]);
    setTitulo(null);
    setPassos([]);
    setVista("conversa");
    setErroConversa(null);
    mudarChat({ conversaId: null });
  };

  const abrirConversa = (id: string) => {
    cancelar.current?.abort();
    setVista("conversa");
    if (id !== conversaId) mudarChat({ conversaId: id });
  };

  useEffect(() => {
    if (vista !== "conversas") return;
    setConversas(null);
    listarConversas(f, api).then(setConversas, () => setConversas([]));
  }, [vista, f, api]);

  // ─── Sending ───
  const contextoAtual = (): ContextoPagina => {
    if (ctxPagina && ctxPagina.contexto.app === app) return ctxPagina.contexto;
    return { app, rota: rotaSemIds(window.location.pathname), pagina: "", campos: [] };
  };

  const atualizarUltima = (fn: (m: MensagemEcra) => MensagemEcra) =>
    setMensagens((ms) => (ms.length === 0 ? ms : [...ms.slice(0, -1), fn(ms.at(-1)!)]));

  const enviar = async (texto: string) => {
    if (!estado || aResponder) return;
    const documentos = anexos.filter((a) => a.estado === "pronto" && a.id).map((a) => a.id!);
    setAnexos([]);
    const chaveConversa = conversaId ?? "nova";
    const ctx = pode("pagina") ? contextoAtual() : null;
    const { contexto, hash } = contextoAEnviar(ctx, ultimoHash.current.get(chaveConversa));
    const rotaDaPergunta = ctx?.rota;
    const agora = new Date().toISOString();
    const idResposta = `resposta-${Date.now()}`;
    setMensagens((ms) => [
      ...ms,
      { id: `pergunta-${Date.now()}`, role: "user", content: texto, createdAt: agora, status: "done", rascunhos: [], acoes: [], propostas: [] },
      { id: idResposta, role: "assistant", content: "", createdAt: agora, status: "streaming", rascunhos: [], acoes: [], propostas: [] },
    ]);
    setPassos([]);
    setAResponder(true);
    const ctrl = new AbortController();
    cancelar.current = ctrl;
    let idConversa = conversaId;
    const aoEvento = (e: EventoPergunta) => {
      switch (e.tipo) {
        case "conversa":
          idConversa = e.id;
          ultimoHash.current.set(e.id, hash);
          carregada.current = e.id;
          setTitulo(e.titulo);
          if (e.id !== conversaId) mudarChat({ conversaId: e.id });
          break;
        case "passo":
          setPassos((ps) => {
            const i = ps.findIndex((p) => p.label === e.rotulo);
            const novo: WorkStep = { label: e.rotulo, status: e.estado === "done" ? "done" : "active" };
            return i < 0 ? [...ps, novo] : ps.map((p, j) => (j === i ? novo : p));
          });
          break;
        case "texto":
          atualizarUltima((m) => ({ ...m, content: m.content + e.delta }));
          break;
        case "fontes":
          atualizarUltima((m) => ({ ...m, sources: e.fontes }));
          break;
        case "rascunho":
          atualizarUltima((m) => ({ ...m, rascunhos: [...m.rascunhos, e.rascunho] }));
          break;
        case "acao":
          atualizarUltima((m) => ({ ...m, acoes: [...m.acoes, e.acao] }));
          break;
        case "propostas":
          atualizarUltima((m) => ({
            ...m,
            propostas: [...m.propostas, ...e.propostas.map((p) => (p.rota || !rotaDaPergunta ? p : { ...p, rota: rotaDaPergunta }))],
          }));
          break;
        case "fim":
          atualizarUltima((m) => ({ ...m, id: e.mensagemId || m.id, status: "done" }));
          if (!abertoRef.current) marcarAvisoResposta(true);
          break;
        case "erro":
          atualizarUltima((m) =>
            m.content.trim()
              ? { ...m, status: "stopped" }
              : e.codigo === "ASSISTENTE_INDISPONIVEL"
                ? { ...m, content: TEXTO_ASSISTENTE_INDISPONIVEL, status: "done" }
                : { ...m, role: "error", content: e.mensagem, status: "error" },
          );
          break;
      }
    };
    try {
      await perguntar(f, { conversaId: conversaId ?? undefined, texto, documentos: documentos.length ? documentos : undefined, contextoPagina: contexto }, aoEvento, { api, sinal: ctrl.signal });
    } catch (e) {
      if (ctrl.signal.aborted) {
        atualizarUltima((m) => ({ ...m, status: m.content.trim() ? "stopped" : "stopped", content: m.content || "Resposta interrompida." }));
      } else {
        const mensagem = e instanceof ErroAssistente ? e.message : "Não foi possível enviar a pergunta. Verifique a ligação e tente novamente.";
        const calmo = e instanceof ErroAssistente && e.codigo === "ASSISTENTE_INDISPONIVEL";
        atualizarUltima((m) => (calmo ? { ...m, content: TEXTO_ASSISTENTE_INDISPONIVEL, status: "done" } : { ...m, role: "error", content: mensagem, status: "error" }));
        if (e instanceof ErroAssistente && e.codigo === "ASSISTENTE_LIMITE_DIARIO") setEstado((s) => (s ? { ...s, limiteAtingido: "pessoa" } : s));
      }
    } finally {
      cancelar.current = null;
      setAResponder(false);
      setPassos([]);
      if (idConversa) carregada.current = idConversa;
    }
  };

  const parar = () => cancelar.current?.abort();
  useEffect(() => () => cancelar.current?.abort(), []);

  const anexar = (ficheiros: File[]) => {
    const max = estado?.ficheiros.maxPorPergunta ?? 5;
    const novos = ficheiros.slice(0, Math.max(0, max - anexos.length)).map((ficheiro, i) => ({
      chave: `${Date.now()}-${i}`,
      nome: ficheiro.name,
      tamanho: ficheiro.size,
      id: null as string | null,
      estado: "a-carregar" as const,
      ficheiro,
    }));
    setAnexos((as) => [...as, ...novos.map(({ ficheiro: _f, ...a }) => a)]);
    for (const n of novos) {
      carregarDocumento(f, n.ficheiro, api).then(
        (d) => setAnexos((as) => as.map((a) => (a.chave === n.chave ? { ...a, id: d.id, estado: "pronto" } : a))),
        () => setAnexos((as) => as.map((a) => (a.chave === n.chave ? { ...a, estado: "erro" } : a))),
      );
    }
  };

  const verFalta = () => {
    const formulario = ctxPagina?.contexto.formulario;
    if (!formulario) return;
    setVista("falta");
    setFalta("a-carregar");
    pedirOQueFalta(f, formulario, api).then(setFalta, (e: unknown) =>
      setFalta(e instanceof ErroAssistente ? e.message : "Não foi possível verificar o que falta."),
    );
  };

  // ─── Moving ───
  const mover = (novo: CantoChat) => {
    // Only a move the person made springs into place; a change of room (the
    // demo panel opening, a resize) is instant, so the chat never crosses
    // what it yields to on the way.
    setAnimar(true);
    mudarChat({ canto: novo });
    setAnuncio(`Assistente no ${NOMES_CANTO[novo]}.`);
  };

  const aoPremir = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (pos.folha || e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button, a, input, textarea, select")) return;
    inicio.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const aoMover = (e: ReactPointerEvent<HTMLDivElement>) => {
    const i = inicio.current;
    if (!i || i.id !== e.pointerId) return;
    const dx = e.clientX - i.x;
    const dy = e.clientY - i.y;
    if (!arrasto && Math.hypot(dx, dy) < 4) return;
    setArrasto({ dx, dy });
  };
  const aoLargar = (e: ReactPointerEvent<HTMLDivElement>) => {
    const i = inicio.current;
    if (!i || i.id !== e.pointerId) return;
    inicio.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (!arrasto) return;
    const centro = { x: pos.x + arrasto.dx + pos.w / 2, y: pos.y + arrasto.dy + pos.h / 2 };
    setArrasto(null);
    mover(cantoMaisProximo(centro, vp));
  };

  const teclaMover = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    const novo = cantoPelaSeta(pos.canto, e.key);
    if (!novo) return;
    e.preventDefault();
    if (novo !== canto) mover(novo);
  };

  const aoTeclar = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Escape" || e.defaultPrevented) return;
    // Esc inside a dialog or menu opened from the chat (portalled elsewhere,
    // but bubbling through React) closes that dialog only.
    if (!(e.target instanceof Node) || !raizRef.current?.contains(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    if (vista !== "conversa") setVista("conversa");
    else minimizar();
  };

  const x = pos.x + (arrasto?.dx ?? 0);
  const y = pos.y + (arrasto?.dy ?? 0);
  const linkAssistente = `${enderecoAssistente.replace(/\/$/, "")}${conversaId ? `/c/${conversaId}` : ""}`;
  const ctxDestaApp = ctxPagina && ctxPagina.contexto.app === app ? ctxPagina : null;
  const nomeContexto = ctxDestaApp ? [ctxDestaApp.contexto.pagina, ctxDestaApp.contexto.seccao].filter(Boolean).join(" · ") : "";
  const temFalta = !!ctxDestaApp?.contexto.formulario && pode("dados");
  const temDocumento = !!ctxDestaApp?.contexto.alvo && !!ctxDestaApp.aoAplicar && pode("ficheiros") && pode("preencher");
  const ferramentasPagina = temFalta || temDocumento;
  const bloqueado = estado?.limiteAtingido
    ? estado.limiteAtingido === "pessoa"
      ? "Chegou ao limite de perguntas de hoje. Pode voltar a perguntar amanhã."
      : "A sua entidade chegou ao limite de perguntas de hoje."
    : estado && estado.configuracao.estado !== "pronto"
      ? (estado.configuracao.mensagem ?? "O assistente ainda não está configurado nesta entidade.")
      : null;

  return (
    <div
      ref={raizRef}
      id={ID_CHAT_FLUTUANTE}
      role="dialog"
      aria-modal="false"
      tabIndex={-1}
      aria-labelledby={tituloId}
      hidden={!aberto}
      data-canto={pos.canto}
      data-folha={pos.folha ? "" : undefined}
      // The «Demonstração» pill docks at the bottom while the sheet is open; the sheet stacks above it.
      data-demo-folha={pos.folha ? "" : undefined}
      data-arrastar={arrasto ? "" : undefined}
      data-animar={animar && !arrasto ? "" : undefined}
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget && e.propertyName === "transform") setAnimar(false);
      }}
      onKeyDown={aoTeclar}
      className="m-chat-flutuante m-float print:hidden"
      style={{ width: pos.w, height: pos.h, transform: `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)` }}
    >
      <p role="status" className="sr-only">
        {anuncio}
      </p>
      <div className="m-chat-topo" onPointerDown={aoPremir} onPointerMove={aoMover} onPointerUp={aoLargar} onPointerCancel={aoLargar}>
        {!pos.folha && (
          <button type="button" className="m-chat-botao m-chat-mover" aria-label="Mover o assistente (use as setas)" onKeyDown={teclaMover}>
            <GripVertical aria-hidden />
          </button>
        )}
        {vista !== "conversa" ? (
          <button type="button" className="m-chat-botao" aria-label="Voltar à conversa" onClick={() => setVista("conversa")}>
            <ArrowLeft aria-hidden />
          </button>
        ) : null}
        <div className="m-chat-titulo">
          <p id={tituloId} className="flex items-center gap-1.5 font-semibold">
            <GlifoApp app="assistente" tamanho={16} className="text-brand" />
            Assistente
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {vista === "conversas" ? "As suas conversas" : vista === "falta" ? "O que falta" : (titulo ?? "Nova conversa")}
          </p>
        </div>
        <button type="button" className="m-chat-botao" aria-label="Conversas" aria-pressed={vista === "conversas"} onClick={() => setVista((v) => (v === "conversas" ? "conversa" : "conversas"))}>
          <MessagesSquare aria-hidden />
        </button>
        <button type="button" className="m-chat-botao" aria-label="Nova conversa" onClick={novaConversa}>
          <MessageSquarePlus aria-hidden />
        </button>
        <button type="button" className="m-chat-botao" aria-label={pos.folha ? "Fechar" : "Minimizar"} onClick={minimizar}>
          {pos.folha ? <X aria-hidden /> : <Minus aria-hidden />}
        </button>
      </div>

      <div className="m-chat-barra">
        {nomeContexto ? (
          // With the page tools the name gets its own line (never cut to «C…»).
          <p className="m-chat-contexto truncate text-sm text-muted-foreground" data-linha={ferramentasPagina ? "" : undefined} title={nomeContexto}>
            <span className="sr-only">Página atual: </span>
            {nomeContexto}
          </p>
        ) : (
          <span className="flex-1" />
        )}
        {temFalta && (
          <button type="button" className="m-chat-acao" onClick={verFalta}>
            <ListChecks aria-hidden />
            O que falta?
          </button>
        )}
        {temDocumento && ctxDestaApp?.contexto.alvo && ctxDestaApp.aoAplicar && (
          <PreencherComDocumento
            alvo={ctxDestaApp.contexto.alvo}
            nomeFormulario={nomeContexto || "este formulário"}
            valoresAtuais={valoresDoContexto(ctxDestaApp.contexto)}
            aoAplicar={ctxDestaApp.aoAplicar}
            api={api}
            fetcher={f}
            label="Com um documento"
            buttonVariant="ghost"
            className="m-chat-preencher"
          />
        )}
        <a href={linkAssistente} className="m-chat-acao">
          <ExternalLink aria-hidden />
          Abrir no Assistente
        </a>
      </div>

      <div className="m-chat-corpo">
        {erroEstado ? (
          <div className="p-4">
            <StatusCallout tone={erroEstado === TEXTO_ASSISTENTE_INDISPONIVEL ? "info" : "warning"}>{erroEstado}</StatusCallout>
          </div>
        ) : vista === "conversas" ? (
          <ThreadList
            threads={(conversas ?? []).map((c) => ({ id: c.id, title: c.titulo, updatedAt: c.atualizadaEm, subtitle: textoDaOrigem(c.origem, nomeApp) ?? undefined }))}
            activeId={conversaId}
            loading={conversas === null}
            onSelect={(t) => abrirConversa(t.id)}
            onNew={novaConversa}
          />
        ) : vista === "falta" ? (
          <div className="m-scroll-y min-h-0 flex-1 overflow-y-auto p-4">
            {falta === "a-carregar" || falta === null ? (
              <p role="status" className="text-muted-foreground">
                A verificar o que falta…
              </p>
            ) : typeof falta === "string" ? (
              <StatusCallout tone="warning">{falta}</StatusCallout>
            ) : (
              <ListaDoQueFalta dados={falta} />
            )}
          </div>
        ) : (
          <>
            {erroConversa && (
              <div className="px-4 pt-3">
                <StatusCallout tone="warning">{erroConversa}</StatusCallout>
              </div>
            )}
            <MessageList
              messages={mensagens}
              initialCount={30}
              className="m-chat-mensagens"
              empty={
                aCarregar ? (
                  <p role="status" className="text-center text-muted-foreground">
                    A abrir a conversa…
                  </p>
                ) : (
                  <div className="flex flex-col gap-2 py-6 text-center">
                    <p className="font-semibold">Como posso ajudar?</p>
                    <p className="text-[0.9375rem] text-muted-foreground">
                      {nomeContexto
                        ? `Pergunte sobre «${nomeContexto}». O assistente vê o que está nesta página.`
                        : "Pergunte como fazer algo nas aplicações MUTU@L."}
                    </p>
                  </div>
                )
              }
              renderMessage={(m) => {
                const e = m as MensagemEcra;
                const ultima = m.id === mensagens.at(-1)?.id;
                return (
                  <ChatMessage
                    message={m}
                    thinking={ultima && m.status === "streaming" ? { steps: passos } : undefined}
                    onFeedback={
                      m.role === "assistant" && m.status === "done" && !m.id.startsWith("resposta-")
                        ? (v) => {
                            setMensagens((ms) => ms.map((x) => (x.id === m.id ? { ...x, feedback: v } : x)));
                            void avaliarMensagem(f, m.id, v, api).catch(() => undefined);
                          }
                        : undefined
                    }
                  >
                    {e.rascunhos.map((r, i) => (
                      <RascunhoTexto key={`r${i}`} tipo={r.tipo} titulo={r.titulo} texto={r.texto} />
                    ))}
                    {e.acoes.map((a) => (
                      <CartaoAcao key={a.id} acao={a} f={f} api={api} pode={pode("acoes")} />
                    ))}
                    {e.propostas.length > 0 && <CartaoPropostas propostas={e.propostas} contexto={ctxDestaApp} />}
                  </ChatMessage>
                );
              }}
            />
          </>
        )}
      </div>

      {vista === "conversa" && !erroEstado && (
        <div className="m-chat-compositor">
          <Composer
            onSubmit={(t) => void enviar(t)}
            onStop={parar}
            streaming={aResponder}
            maxLength={estado?.maxPergunta ?? 4000}
            disabled={!estado || bloqueado !== null || anexos.some((a) => a.estado === "a-carregar")}
            disabledReason={bloqueado ?? (anexos.some((a) => a.estado === "a-carregar") ? "A anexar o documento…" : undefined)}
            placeholder={nomeContexto ? "Pergunte sobre esta página" : "Escreva a sua pergunta"}
            disclaimer={
              <>
                As respostas podem conter erros.{" "}
                <a href={`${enderecoAssistente.replace(/\/$/, "")}/transparencia`} className="underline underline-offset-4">
                  O que é enviado
                </a>
              </>
            }
            attachments={
              anexos.length > 0
                ? anexos.map((a) => (
                    <AttachmentChip key={a.chave} name={a.nome} size={a.tamanho} status={a.estado} onRemove={() => setAnexos((as) => as.filter((x) => x.chave !== a.chave))} />
                  ))
                : undefined
            }
            actions={
              pode("ficheiros") ? (
                <AttachButton onFiles={anexar} accept={estado?.ficheiros.extensoes || undefined} disabled={aResponder || anexos.length >= (estado?.ficheiros.maxPorPergunta ?? 5)} />
              ) : undefined
            }
          />
        </div>
      )}
    </div>
  );
}

// ─── Cards inside a reply ────────────────────────────────────────────────────

function CartaoAcao({ acao, f, api, pode }: { acao: AcaoMensagem; f: Fetch; api: string; pode: boolean }) {
  const [estado, setEstado] = useState<"proposta" | "a-aplicar" | "aplicada" | "cancelada" | "erro">(ESTADO_ACAO(acao.estado));
  const [resultado, setResultado] = useState(acao.resultado);
  const [erro, setErro] = useState<string | null>(null);
  return (
    <ActionCard
      title={acao.titulo}
      description={acao.descricao}
      details={acao.detalhes.map((d) => ({ term: d.termo, details: d.valor }))}
      status={estado}
      app={acao.app}
      applyLabel="Criar rascunho"
      error={erro}
      result={
        resultado ? (
          <a href={resultado.href} className="font-medium underline underline-offset-4">
            {resultado.mensagem}
          </a>
        ) : undefined
      }
      onApply={
        pode && (estado === "proposta" || estado === "erro")
          ? () => {
              setEstado("a-aplicar");
              aplicarAcao(f, acao.id, api).then(
                (r) => {
                  setEstado("aplicada");
                  setResultado(r.resultado);
                },
                (e: unknown) => {
                  setEstado("erro");
                  setErro(e instanceof ErroAssistente ? e.message : "Não foi possível criar o rascunho.");
                },
              );
            }
          : undefined
      }
    />
  );
}

/**
 * The values the assistant proposed for the page, reviewed like «Preencher
 * com um documento» (current → proposed; replacing starts unticked) and
 * applied by the page to its draft. Only on the page they were proposed for.
 */
function CartaoPropostas({ propostas, contexto }: { propostas: PropostaPagina[]; contexto: ContextoPublicado | null }) {
  const rota = propostas.find((p) => p.rota)?.rota;
  const naPagina = !!contexto?.aoAplicar && (!rota || contexto.contexto.rota === rota);
  const linhas = useMemo(() => compararPropostas(propostas, valoresDoContexto(contexto?.contexto ?? null)), [propostas, contexto]);
  const [escolhidos, setEscolhidos] = useState<Set<string>>(() => escolhaInicial(linhas));
  const [aplicadas, setAplicadas] = useState(0);
  const valores = valoresEscolhidos(linhas, escolhidos);
  const n = Object.keys(valores).length;
  return (
    <section aria-label="Valores propostos" className="m-surface flex flex-col gap-3 rounded-xl border border-border p-3">
      <p className="font-semibold">Valores propostos para esta página</p>
      {aplicadas > 0 ? (
        <StatusCallout tone="success">
          {aplicadas === 1 ? "1 valor aplicado ao formulário." : `${aplicadas} valores aplicados ao formulário.`} Reveja e guarde quando estiver pronto.
        </StatusCallout>
      ) : (
        <>
          <RevisaoPropostas linhas={linhas} escolhidos={escolhidos} onChange={setEscolhidos} />
          {naPagina ? (
            <div>
              <Button
                size="sm"
                disabled={n === 0}
                onClick={() => {
                  contexto?.aoAplicar?.(valores);
                  setAplicadas(n);
                }}
              >
                {n === 1 ? "Aplicar 1 valor" : `Aplicar ${n} valores`}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Abra a página a que estes valores se referem para os aplicar ao formulário.</p>
          )}
        </>
      )}
    </section>
  );
}
