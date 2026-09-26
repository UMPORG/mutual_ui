import type { CSSProperties } from "react";
import { movimentoReduzido } from "./preferencias";

/**
 * The engine shared by the canvas effects (v0.7). Every effect gets the same
 * guarantees as `AsciiFundo`:
 *
 * - device-pixel-ratio capped (default 1.5) and a frame-rate cap;
 * - paused when the tab is hidden or the canvas is off screen;
 * - a single still frame under "Reduzir movimento" (or the OS setting);
 * - colours re-read when the theme, the app or the preferences change;
 * - hidden in Alto contraste by CSS (`.m-efeito`).
 */

export interface CoresEfeito {
  marca: string;
  acento: string;
  verde: string;
  vermelho: string;
  texto: string;
  fundo: string;
  escuro: boolean;
}

export interface EstadoEfeito {
  largura: number;
  altura: number;
  dpr: number;
  cores: CoresEfeito;
  rato: { x: number; y: number; forca: number };
  /** True while drawing the one still frame (reduced motion). */
  parado: boolean;
}

export interface OpcoesEfeito {
  /** Frames per second cap. */
  fps?: number;
  /** Max device pixel ratio. */
  dprMax?: number;
  /** Called after every resize and theme change (precompute layers here). */
  preparar?: (ctx: CanvasRenderingContext2D, e: EstadoEfeito) => void;
  /**
   * Draws a frame at time `t` (ms). Return false to sleep until woken by the
   * pointer (effects that are still when nobody interacts).
   */
  desenhar: (ctx: CanvasRenderingContext2D, e: EstadoEfeito, t: number) => boolean | void;
  /** Wake up on pointer movement over the canvas area. */
  rato?: boolean;
  /** Time used for the still frame. */
  tempoParado?: number;
  /** How fast the pointer's influence fades per frame (0–1, default 0.93). */
  decaimento?: number;
}

function lerCores(el: Element): CoresEfeito {
  const s = getComputedStyle(el);
  const v = (n: string, padrao: string) => s.getPropertyValue(n).trim() || padrao;
  return {
    marca: v("--brand", "#1f6f36"),
    acento: v("--app-accent", "#1f6f36"),
    verde: v("--flag-green", "#6dba6a"),
    vermelho: v("--flag-red", "#e8393c"),
    texto: v("--foreground", "#1c1917"),
    fundo: v("--background", "#fafaf9"),
    escuro: document.documentElement.classList.contains("dark"),
  };
}

export function iniciarEfeito(canvas: HTMLCanvasElement, o: OpcoesEfeito): () => void {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return () => {};
  const intervalo = 1000 / (o.fps ?? 24);
  const e: EstadoEfeito = {
    largura: 0,
    altura: 0,
    dpr: 1,
    cores: lerCores(canvas),
    rato: { x: -9999, y: -9999, forca: 0 },
    parado: false,
  };
  let raf = 0;
  let ultimo = 0;
  let visivel = true;
  let aDormir = false;
  let inicio = performance.now();

  const medir = () => {
    const r = canvas.getBoundingClientRect();
    e.dpr = Math.min(window.devicePixelRatio || 1, o.dprMax ?? 1.5);
    e.largura = r.width;
    e.altura = r.height;
    canvas.width = Math.max(1, Math.round(r.width * e.dpr));
    canvas.height = Math.max(1, Math.round(r.height * e.dpr));
    e.cores = lerCores(canvas);
    ctx.setTransform(e.dpr, 0, 0, e.dpr, 0, 0);
    o.preparar?.(ctx, e);
  };

  const quadro = (t: number) => {
    ctx.setTransform(e.dpr, 0, 0, e.dpr, 0, 0);
    return o.desenhar(ctx, e, t);
  };

  const ciclo = (agora: number) => {
    raf = requestAnimationFrame(ciclo);
    if (agora - ultimo < intervalo) return;
    ultimo = agora;
    const continuar = quadro(agora - inicio);
    e.rato.forca *= o.decaimento ?? 0.93;
    if (continuar === false && e.rato.forca < 0.01) {
      cancelAnimationFrame(raf);
      aDormir = true;
    }
  };

  const parar = () => cancelAnimationFrame(raf);
  const arrancar = () => {
    parar();
    if (!e.largura) medir();
    if (movimentoReduzido()) {
      e.parado = true;
      quadro(o.tempoParado ?? 8000);
      return;
    }
    e.parado = false;
    if (!visivel || document.hidden) return;
    aDormir = false;
    raf = requestAnimationFrame(ciclo);
  };
  const acordar = () => {
    if (aDormir && !e.parado && visivel && !document.hidden) {
      aDormir = false;
      raf = requestAnimationFrame(ciclo);
    }
  };

  const ro = new ResizeObserver(() => {
    medir();
    if (e.parado || aDormir) quadro(e.parado ? (o.tempoParado ?? 8000) : performance.now() - inicio);
  });
  const io = new IntersectionObserver(([entrada]) => {
    visivel = !!entrada?.isIntersecting;
    if (visivel) arrancar();
    else parar();
  });
  const mo = new MutationObserver(() => {
    e.cores = lerCores(canvas);
    o.preparar?.(ctx, e);
    arrancar();
  });
  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  const onVis = () => (document.hidden ? parar() : arrancar());
  const onPref = () => {
    e.cores = lerCores(canvas);
    o.preparar?.(ctx, e);
    arrancar();
  };
  const onPointer = (ev: PointerEvent) => {
    if (e.parado) return;
    const r = canvas.getBoundingClientRect();
    const x = ev.clientX - r.left;
    const y = ev.clientY - r.top;
    if (x < -80 || y < -80 || x > r.width + 80 || y > r.height + 80) return;
    e.rato.x = x;
    e.rato.y = y;
    e.rato.forca = 1;
    acordar();
  };

  medir();
  ro.observe(canvas);
  io.observe(canvas);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-movimento", "data-app"] });
  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("mutual:preferencias", onPref);
  mq.addEventListener("change", onPref);
  if (o.rato) window.addEventListener("pointermove", onPointer, { passive: true });
  inicio = performance.now();
  arrancar();

  return () => {
    parar();
    ro.disconnect();
    io.disconnect();
    mo.disconnect();
    document.removeEventListener("visibilitychange", onVis);
    window.removeEventListener("mutual:preferencias", onPref);
    mq.removeEventListener("change", onPref);
    if (o.rato) window.removeEventListener("pointermove", onPointer);
  };
}

/** Where the content sits: the effect fades out there so it never runs behind text. */
export type Mascara = { x?: string; y?: string; largura?: string; altura?: string } | false;

/**
 * CSS mask for an effect: a soft hole where the content sits (`mascara`)
 * and an optional fade at the top (under a header) — same as AsciiFundo.
 */
export function estiloMascara(mascara: Mascara | undefined, fadeTopo: string | false | undefined, extra: string[] = []): CSSProperties {
  const camadas: string[] = [...extra];
  if (mascara) {
    const { x = "50%", y = "50%", largura = "34rem", altura = "26rem" } = mascara;
    camadas.push(`radial-gradient(${largura} ${altura} at ${x} ${y}, transparent 0%, transparent 50%, rgb(0 0 0 / 0.35) 72%, #000 100%)`);
  }
  if (fadeTopo) camadas.push(`linear-gradient(to bottom, transparent 0, transparent calc(${fadeTopo} * 0.5), #000 ${fadeTopo})`);
  if (!camadas.length) return {};
  const m = camadas.join(", ");
  const estilo: CSSProperties = { maskImage: m, WebkitMaskImage: m };
  if (camadas.length > 1) {
    estilo.maskComposite = "intersect";
    (estilo as Record<string, string>).WebkitMaskComposite = "source-in";
  }
  return estilo;
}

/** Colour with alpha from any CSS colour string (hex or rgb/oklch). */
export function comAlfa(cor: string, alfa: number): string {
  const a = Math.max(0, Math.min(1, alfa));
  if (/^#([0-9a-f]{6})$/i.test(cor)) {
    const n = Number.parseInt(cor.slice(1), 16);
    return `rgb(${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255} / ${a})`;
  }
  if (/^#([0-9a-f]{3})$/i.test(cor)) {
    const [r, g, b] = cor.slice(1).split("").map((c) => Number.parseInt(c + c, 16));
    return `rgb(${r} ${g} ${b} / ${a})`;
  }
  return `color-mix(in srgb, ${cor} ${Math.round(a * 100)}%, transparent)`;
}

/** Deterministic pseudo-random numbers (effects look the same on every load). */
export function aleatorio(semente: number): () => number {
  let s = semente >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}
