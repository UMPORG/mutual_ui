/**
 * Shared state of the floating assistant (v0.18) — plain stores, no React, no
 * DOM (only `localStorage`, guarded), so they are unit-tested:
 *
 * - `estadoChat`: open or closed, corner and active conversation, kept in
 *   `localStorage` under `assistente.flutuante.*` — one origin with sub-paths
 *   (ADR 0004), so the chat reopens in the same place, with the same
 *   conversation, in every MUTU@L app. Message contents are never stored
 *   here: they always come from the Cérebro.
 * - `RegistoPosicoes`: floating widgets publish the rectangle they occupy
 *   (the «Demonstração» widget: pill + open panel); the chat yields to them.
 * - the page context (`publicarContextoPagina`): what the page on screen
 *   published with `useContextoAssistente`.
 */
import type { CantoChat, Retangulo } from "./assistente-posicao";
import { eCanto } from "./assistente-posicao";
import type { ContextoPagina } from "./assistente-contexto";

// ─── A tiny store ────────────────────────────────────────────────────────────

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

// ─── Chat: open, corner, conversation ────────────────────────────────────────

export interface EstadoChat {
  aberto: boolean;
  canto: CantoChat;
  /** The conversation on screen (`null` = a new one). */
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

/** Reads the kept state (anything invalid → the default). */
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

/** The chat state (read from `localStorage` on first use in the browser). */
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

/** Another tab changed the kept state (the `storage` event). */
export function recarregarChat(): void {
  lojaChat.definir(lerEstadoGuardado());
}

// ─── Position registry ───────────────────────────────────────────────────────

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

  /** Everything published (a stable array between changes). */
  ocupados = (): readonly Retangulo[] => this.lista;

  ouvir = (fn: () => void): (() => void) => {
    this.ouvintes.add(fn);
    return () => void this.ouvintes.delete(fn);
  };
}

/** The registry of the page (the default of the React context). */
export const registoPosicoesGlobal = new RegistoPosicoes();

// ─── Page context ────────────────────────────────────────────────────────────

export interface ContextoPublicado {
  /** The compact context (`normalizarContexto`). */
  contexto: ContextoPagina;
  /** `hashContexto(contexto)`. */
  hash: string;
  /** Applies proposed values to the page's DRAFT (never submits). */
  aoAplicar?: ((valores: Record<string, string | number>) => void) | undefined;
}

const lojaContexto = criarLoja<ContextoPublicado | null>(null);
let dono: symbol | null = null;

/**
 * Publishes the page's context (the last page to publish wins). `atualizar`
 * replaces it while this publisher is still the current one; `retirar`
 * withdraws it (page left).
 */
export function publicarContextoPagina(c: ContextoPublicado): { atualizar: (c: ContextoPublicado) => void; retirar: () => void } {
  const eu = Symbol("contexto");
  dono = eu;
  lojaContexto.definir(c);
  return {
    atualizar: (novo) => {
      if (dono === eu) lojaContexto.definir(novo);
    },
    retirar: () => {
      if (dono !== eu) return;
      dono = null;
      lojaContexto.definir(null);
    },
  };
}

export const contextoPagina: Loja<ContextoPublicado | null> = { ler: lojaContexto.ler, ouvir: lojaContexto.ouvir };

// ─── «Nova resposta» while minimised ─────────────────────────────────────────

const lojaAviso = criarLoja(false);

/** A reply finished while the chat was minimised (a dot on «Assistente»). */
export const avisoResposta: Loja<boolean> = { ler: lojaAviso.ler, ouvir: lojaAviso.ouvir };

export function marcarAvisoResposta(v: boolean): void {
  lojaAviso.definir(v);
}
