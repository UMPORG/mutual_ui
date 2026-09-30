/**
 * Where the floating assistant chat sits — pure geometry, no DOM, so
 * it is unit-tested (`tests/assistente.test.ts`).
 *
 * - The chat lives in one of four CORNERS. Dragged and released, it goes to
 *   the corner nearest its centre (`cantoMaisProximo`); the arrow keys move
 *   it between corners (`cantoPelaSeta`).
 * - It never overlaps the «Demonstração» widget (or anything else published
 *   in the position registry): the widget never moves for the chat — the
 *   chat YIELDS. In a bottom corner it stacks ABOVE the widget with a gap; an
 *   obstacle higher up only limits its height. When what is left is shorter
 *   than `minAltura`, the chat takes the mirrored corner on the same edge
 *   (the person's chosen corner comes back as soon as there is room).
 * - At phone width it is a bottom sheet (`folha`): full width, anchored to
 *   the bottom edge, stacked above a widget docked at the bottom; a widget
 *   higher up (mid-edge) caps its height when a useful sheet is left.
 */

export type CantoChat = "inf-dir" | "inf-esq" | "sup-dir" | "sup-esq";

export const CANTOS_CHAT: readonly CantoChat[] = ["inf-dir", "inf-esq", "sup-dir", "sup-esq"];

export interface Retangulo {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Tamanho {
  w: number;
  h: number;
}

/** Below this width the chat is a bottom sheet (Tailwind `sm`, 40rem). */
export const LARGURA_FOLHA = 640;

export const eCanto = (v: unknown): v is CantoChat => typeof v === "string" && (CANTOS_CHAT as readonly string[]).includes(v);

const inferior = (c: CantoChat) => c.startsWith("inf");
const direito = (c: CantoChat) => c.endsWith("dir");

/** The corner of the same edge on the other side. */
export function cantoEspelhado(c: CantoChat): CantoChat {
  return `${inferior(c) ? "inf" : "sup"}-${direito(c) ? "esq" : "dir"}` as CantoChat;
}

/** The corner nearest a point (the chat's centre when it is released). */
export function cantoMaisProximo(centro: { x: number; y: number }, viewport: Tamanho): CantoChat {
  const baixo = centro.y >= viewport.h / 2;
  const dir = centro.x >= viewport.w / 2;
  return `${baixo ? "inf" : "sup"}-${dir ? "dir" : "esq"}` as CantoChat;
}

/** Arrow keys move between corners; any other key → `null`. */
export function cantoPelaSeta(c: CantoChat, tecla: string): CantoChat | null {
  const v = inferior(c) ? "inf" : "sup";
  const h = direito(c) ? "dir" : "esq";
  switch (tecla) {
    case "ArrowUp":
      return `sup-${h}` as CantoChat;
    case "ArrowDown":
      return `inf-${h}` as CantoChat;
    case "ArrowLeft":
      return `${v}-esq` as CantoChat;
    case "ArrowRight":
      return `${v}-dir` as CantoChat;
    default:
      return null;
  }
}

export interface OpcoesPosicao {
  /** The chat's preferred size (desktop) — its height is the maximum. */
  tamanho: Tamanho;
  viewport: Tamanho;
  /** Distance to the edges (default 20; 16 on phones). */
  margem?: number | undefined;
  /** Space between the chat and an obstacle (default 12). */
  folga?: number | undefined;
  /** Nothing above this line (the shell's top bar), default 0. */
  topo?: number | undefined;
  /** Shortest useful chat (default 280). */
  minAltura?: number | undefined;
  /** What the chat must not cover (the demo widget's footprint), viewport rectangles. */
  ocupados?: readonly Retangulo[] | undefined;
  /** Width below which it is a bottom sheet (default `LARGURA_FOLHA`). */
  larguraFolha?: number | undefined;
}

export interface PosicaoChat {
  x: number;
  y: number;
  w: number;
  h: number;
  /** The corner actually used (the mirrored one when the chosen corner has no room). */
  canto: CantoChat;
  /** Phone width: a bottom sheet. */
  folha: boolean;
}

const sobrepoeHorizontal = (a: { x: number; w: number }, b: Retangulo, folga: number) =>
  a.x < b.x + b.w + folga && b.x < a.x + a.w + folga;

/**
 * The chat's rectangle in one corner, yielding to the obstacles: the ones in
 * its column that reach the anchored edge push it inwards (it stacks past
 * them), the others limit its height. `h` may end below `minAltura` — the
 * caller then tries the mirrored corner.
 */
function noCanto(
  canto: CantoChat,
  w: number,
  hDesejada: number,
  vw: number,
  vh: number,
  margem: number,
  folga: number,
  topo: number,
  minAltura: number,
  ocupados: readonly Retangulo[],
): Retangulo {
  const x = direito(canto) ? vw - margem - w : margem;
  const coluna = ocupados.filter((o) => o.w > 0 && o.h > 0 && sobrepoeHorizontal({ x, w }, o, folga));
  const limiteTopo = topo + margem;
  const limiteFundo = vh - margem;
  if (inferior(canto)) {
    // Anchored at the bottom: push the anchor above whatever sits in the
    // anchor zone (from the bottom edge up to the shortest chat), nearest first.
    let fundo = limiteFundo;
    for (const o of [...coluna].sort((a, b) => b.y + b.h - (a.y + a.h))) {
      if (o.y + o.h + folga > fundo - minAltura && o.y < fundo) fundo = Math.min(fundo, o.y - folga);
    }
    // Obstacles higher up only cap the height.
    let teto = limiteTopo;
    for (const o of coluna) {
      const baseO = o.y + o.h;
      if (baseO + folga <= fundo && baseO + folga > teto) teto = baseO + folga;
    }
    const h = Math.max(0, Math.min(hDesejada, fundo - teto));
    return { x, y: fundo - h, w, h };
  }
  // Anchored at the top.
  let cima = limiteTopo;
  for (const o of [...coluna].sort((a, b) => a.y - b.y)) {
    if (o.y - folga < cima + minAltura && o.y + o.h > cima) cima = Math.max(cima, o.y + o.h + folga);
  }
  let chao = limiteFundo;
  for (const o of coluna) {
    if (o.y - folga >= cima && o.y - folga < chao) chao = o.y - folga;
  }
  const h = Math.max(0, Math.min(hDesejada, chao - cima));
  return { x, y: cima, w, h };
}

/**
 * The chat's rectangle for the chosen corner (or the bottom sheet at phone
 * width), never overlapping `ocupados`.
 */
export function posicaoDoChat(canto: CantoChat, o: OpcoesPosicao): PosicaoChat {
  const { w: vw, h: vh } = o.viewport;
  const ocupados = o.ocupados ?? [];
  const folga = o.folga ?? 12;
  const topo = o.topo ?? 0;
  const minAltura = o.minAltura ?? 280;
  if (vw < (o.larguraFolha ?? LARGURA_FOLHA)) {
    // Bottom sheet: full width, stacked above what sits at the bottom edge.
    const margem = 0;
    let fundo = vh - margem;
    for (const r of [...ocupados].sort((a, b) => b.y + b.h - (a.y + a.h))) {
      if (r.w > 0 && r.h > 0 && r.y + r.h + folga > fundo - minAltura && r.y < fundo) fundo = Math.min(fundo, r.y - folga);
    }
    // Something higher up (the «Demonstração» pill docked mid-edge) caps the
    // sheet's height, as long as a useful sheet is left.
    let teto = topo;
    for (const r of ocupados) {
      const base = r.y + r.h;
      if (r.w > 0 && r.h > 0 && base + folga <= fundo && base + folga > teto && fundo - (base + folga) >= minAltura) teto = base + folga;
    }
    const h = Math.max(0, Math.min(o.tamanho.h, fundo - teto));
    return { x: 0, y: fundo - h, w: vw, h, canto, folha: true };
  }
  const margem = o.margem ?? 20;
  const w = Math.min(o.tamanho.w, vw - 2 * margem);
  const hDesejada = Math.min(o.tamanho.h, vh - topo - 2 * margem);
  const aqui = noCanto(canto, w, hDesejada, vw, vh, margem, folga, topo, minAltura, ocupados);
  if (aqui.h >= Math.min(minAltura, hDesejada)) return { ...aqui, canto, folha: false };
  const outro = cantoEspelhado(canto);
  const ali = noCanto(outro, w, hDesejada, vw, vh, margem, folga, topo, minAltura, ocupados);
  return ali.h > aqui.h ? { ...ali, canto: outro, folha: false } : { ...aqui, canto, folha: false };
}

/** Area shared by two rectangles (0 when apart) — for tests and checks. */
export function sobreposicao(a: Retangulo, b: Retangulo): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

/** The smallest rectangle around several (a widget's pill + its open panel). */
export function uniao(rs: readonly Retangulo[]): Retangulo | null {
  const v = rs.filter((r) => r.w > 0 && r.h > 0);
  if (v.length === 0) return null;
  const x = Math.min(...v.map((r) => r.x));
  const y = Math.min(...v.map((r) => r.y));
  const x2 = Math.max(...v.map((r) => r.x + r.w));
  const y2 = Math.max(...v.map((r) => r.y + r.h));
  return { x, y, w: x2 - x, h: y2 - y };
}
