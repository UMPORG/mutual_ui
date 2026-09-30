/**
 * Where the floating «Demonstração» pill sits — pure geometry, no
 * DOM, so it is unit-tested.
 *
 * The pill prefers the bottom-right corner ("fim"). When that spot would
 * cover something the person needs — the focused field, a form's last
 * actions (submit/cancel), anything marked `data-demo-evitar` — it moves to
 * the bottom-left corner ("inicio"), then to the middle of the right edge
 * ("meio"). When every spot collides it takes the one that covers least.
 */

export type DocaDemo = "fim" | "inicio" | "meio";

export interface Retangulo {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const DOCAS: readonly DocaDemo[] = ["fim", "inicio", "meio"];

/**
 * Rectangle of the pill at a dock, inside a viewport of `vw`×`vh`. `fundo` is the
 * distance from the bottom edge in the corner docks (default `margem`; larger when
 * the app lifts the pill above a bottom navigation bar with `--demo-fundo`).
 */
export function retanguloDaDoca(
  doca: DocaDemo,
  pilula: { w: number; h: number },
  vw: number,
  vh: number,
  margem: number,
  fundo: number = margem,
): Retangulo {
  const { w, h } = pilula;
  if (doca === "inicio") return { x: margem, y: vh - fundo - h, w, h };
  if (doca === "meio") return { x: vw - margem - w, y: Math.round((vh - h) / 2), w, h };
  return { x: vw - margem - w, y: vh - fundo - h, w, h };
}

/** Area shared by two rectangles, after growing `b` by `folga` on every side. */
export function areaSobreposta(a: Retangulo, b: Retangulo, folga = 0): number {
  const bx = b.x - folga;
  const by = b.y - folga;
  const bw = b.w + 2 * folga;
  const bh = b.h + 2 * folga;
  const w = Math.min(a.x + a.w, bx + bw) - Math.max(a.x, bx);
  const h = Math.min(a.y + a.h, by + bh) - Math.max(a.y, by);
  return w > 0 && h > 0 ? w * h : 0;
}

/**
 * The first dock (fim → inicio → meio) that covers none of the obstacles;
 * when all collide, the one with the smallest covered area (ties keep the
 * preferred order). Obstacles are viewport rectangles (getBoundingClientRect).
 */
export function escolherDoca(
  pilula: { w: number; h: number },
  viewport: { w: number; h: number },
  obstaculos: readonly Retangulo[],
  {
    margem = 20,
    folga = 8,
    fundo,
  }: { margem?: number | undefined; folga?: number | undefined; fundo?: number | undefined } = {},
): DocaDemo {
  let melhor: DocaDemo = "fim";
  let menor = Number.POSITIVE_INFINITY;
  for (const doca of DOCAS) {
    const r = retanguloDaDoca(doca, pilula, viewport.w, viewport.h, margem, fundo ?? margem);
    let area = 0;
    for (const o of obstaculos) {
      if (o.w <= 0 || o.h <= 0) continue;
      area += areaSobreposta(r, o, folga);
    }
    if (area === 0) return doca;
    if (area < menor) {
      menor = area;
      melhor = doca;
    }
  }
  return melhor;
}
