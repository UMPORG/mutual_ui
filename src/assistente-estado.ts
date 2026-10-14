/**
 * Shared state of the floating assistant: plain stores, no React/DOM (only guarded `localStorage`).
 * `estadoChat` (open/closed, corner, conversation) lives under `assistente.flutuante.*` so the chat reopens identically in every app (one origin, ADR 0004); message contents are never stored.
 * `RegistoPosicoes`: floating widgets publish their rectangle and the chat yields.
 */
import type { CantoChat, Retangulo } from "./assistente-posicao";
import { eCanto } from "./assistente-posicao";
import type { ContextoPagina } from "./assistente-contexto";

export interface Loja<T> {
  ler: () => T;
  ouvir: (fn: () => void) => () => void;
}

function criarLoja<T>(inicial: T) {
  let valor = inicial;
  const ouvintes = new Set<() => void>();
  return {
    ler: () => valor,
    ouvir: (fn: () => void) => {
      ouvintes.add(fn);
      return () => void ouvintes.delete(fn);
    },
    definir: (novo: T) => {
      if (Object.is(novo, valor)) return;
      valor = novo;
      for (const f of ouvintes) f();
    },
  };
}

export interface EstadoChat {
  aberto: boolean;
  canto: CantoChat;
  conversaId: string | null;
}

export const CHAVES_CHAT = {
  aberto: "assistente.flutuante.aberto",
  canto: "assistente.flutuante.canto",
  conversa: "assistente.flutuante.conversa",
} as const;

const ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const ESTADO_INICIAL: EstadoChat = { aberto: false, canto: "inf-dir", conversaId: null };

interface Armazem {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

const armazem = (): Armazem | null => {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
};

export function lerEstadoGuardado(a: Armazem | null = armazem()): EstadoChat {
  if (!a) return ESTADO_INICIAL;
  try {
    const canto = a.getItem(CHAVES_CHAT.canto);
    const conversa = a.getItem(CHAVES_CHAT.conversa);
    return {
      aberto: a.getItem(CHAVES_CHAT.aberto) === "1",
      canto: eCanto(canto) ? canto : ESTADO_INICIAL.canto,
      conversaId: conversa && ID_RE.test(conversa) ? conversa : null,
    };
  } catch {
    return ESTADO_INICIAL;
  }
}

export function guardarEstado(e: EstadoChat, a: Armazem | null = armazem()): void {
  if (!a) return;
  try {
    a.setItem(CHAVES_CHAT.aberto, e.aberto ? "1" : "0");
    a.setItem(CHAVES_CHAT.canto, e.canto);
    if (e.conversaId) a.setItem(CHAVES_CHAT.conversa, e.conversaId);
    else a.removeItem(CHAVES_CHAT.conversa);
  } catch {
    /* private mode, quota */
  }
}

const lojaChat = criarLoja<EstadoChat>(ESTADO_INICIAL);
let carregado = false;

export const estadoChat: Loja<EstadoChat> = {
  ler: () => {
    if (!carregado && typeof window !== "undefined") {
      carregado = true;
      lojaChat.definir(lerEstadoGuardado());
    }
    return lojaChat.ler();
  },
  ouvir: lojaChat.ouvir,
};

/** The server snapshot (`useSyncExternalStore`): always closed. */
export const estadoChatServidor = (): EstadoChat => ESTADO_INICIAL;

export function mudarChat(parcial: Partial<EstadoChat>): void {
  const novo = { ...estadoChat.ler(), ...parcial };
  lojaChat.definir(novo);
  guardarEstado(novo);
}

export function recarregarChat(): void {
  lojaChat.definir(lerEstadoGuardado());
}

export class RegistoPosicoes {
  private mapa = new Map<string, Retangulo>();
  private lista: readonly Retangulo[] = [];
  private ouvintes = new Set<() => void>();

  /** Publishes (or with `null` withdraws) the rectangle a widget occupies (viewport px). */
  publicar = (id: string, r: Retangulo | null): void => {
    const antes = this.mapa.get(id);
    if (r === null) {
      if (!antes) return;
      this.mapa.delete(id);
    } else {
      if (antes && antes.x === r.x && antes.y === r.y && antes.w === r.w && antes.h === r.h) return;
      this.mapa.set(id, { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h) });
    }
    this.lista = [...this.mapa.values()];
    for (const f of this.ouvintes) f();
  };

  ocupados = (): readonly Retangulo[] => this.lista;

  ouvir = (fn: () => void): (() => void) => {
    this.ouvintes.add(fn);
    return () => void this.ouvintes.delete(fn);
  };
}

export const registoPosicoesGlobal = new RegistoPosicoes();

export interface ContextoPublicado {
  contexto: ContextoPagina;
  hash: string;
  /** Applies proposed values to the page's DRAFT (never submits). */
  aoAplicar?: ((valores: Record<string, string | number>) => void) | undefined;
}

const lojaContexto = criarLoja<ContextoPublicado | null>(null);
/** Publishers still on screen, oldest first: the newest shows; when it withdraws, the previous one's context returns. */
const pilhaContexto: { eu: symbol; contexto: ContextoPublicado }[] = [];

function mostrarTopo(): void {
  lojaContexto.definir(pilhaContexto.at(-1)?.contexto ?? null);
}

/** Publishes the page's context (the last publisher still on screen wins). */
export function publicarContextoPagina(c: ContextoPublicado): { atualizar: (c: ContextoPublicado) => void; retirar: () => void } {
  const eu = Symbol("contexto");
  pilhaContexto.push({ eu, contexto: c });
  mostrarTopo();
  return {
    atualizar: (novo) => {
      const entrada = pilhaContexto.find((e) => e.eu === eu);
      if (!entrada) return;
      entrada.contexto = novo;
      if (pilhaContexto.at(-1) === entrada) lojaContexto.definir(novo);
    },
    retirar: () => {
      const i = pilhaContexto.findIndex((e) => e.eu === eu);
      if (i < 0) return;
      const eraTopo = i === pilhaContexto.length - 1;
      pilhaContexto.splice(i, 1);
      if (eraTopo) mostrarTopo();
    },
  };
}

export const contextoPagina: Loja<ContextoPublicado | null> = { ler: lojaContexto.ler, ouvir: lojaContexto.ouvir };

const lojaAviso = criarLoja(false);

export const avisoResposta: Loja<boolean> = { ler: lojaAviso.ler, ouvir: lojaAviso.ouvir };

export function marcarAvisoResposta(v: boolean): void {
  lojaAviso.definir(v);
}
