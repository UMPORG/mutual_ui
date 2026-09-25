"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { movimentoReduzido } from "./preferencias";
import { cx } from "./cx";

/**
 * Animated ASCII backdrop: the waving bands of the MUTU@L flag drawn in text
 * characters, drifting slowly, with a soft ripple where the pointer passes.
 *
 * Calm by design: ~20 fps, low contrast, paused when the tab is hidden, a
 * single still frame when motion is reduced (OS setting or "Reduzir
 * movimento"), hidden in high contrast. Decorative only (aria-hidden).
 *
 * The `mascara` cuts a soft hole where the content sits (e.g. the login
 * form), so the characters never run behind text.
 */
export interface AsciiFundoProps {
  className?: string;
  /** Hole in the animation, in CSS units relative to the backdrop. */
  mascara?: { x?: string; y?: string; largura?: string; altura?: string } | false;
  /** Cell size in px (character grid). */
  celula?: number;
  /** 0–1: overall strength of the characters. */
  intensidade?: number;
  /** Fade the animation out at the top (keeps a header legible), e.g. "6rem"; false to disable. */
  fadeTopo?: string | false;
}

const RAMPA = " .·:-=+*#%@";

export function AsciiFundo({
  className,
  mascara = {},
  celula = 15,
  intensidade = 1,
  fadeTopo = "6rem",
}: AsciiFundoProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    return iniciarAsciiFundo(canvas, { celula, intensidade });
  }, [celula, intensidade]);

  const estilo: CSSProperties = {};
  const camadas: string[] = [];
  if (mascara) {
    const { x = "50%", y = "50%", largura = "34rem", altura = "30rem" } = mascara;
    camadas.push(
      `radial-gradient(${largura} ${altura} at ${x} ${y}, transparent 0%, transparent 55%, rgb(0 0 0 / 0.35) 75%, #000 100%)`,
    );
  }
  if (fadeTopo) camadas.push(`linear-gradient(to bottom, transparent 0, transparent calc(${fadeTopo} * 0.5), #000 ${fadeTopo})`);
  if (camadas.length) {
    const m = camadas.join(", ");
    estilo.maskImage = m;
    estilo.WebkitMaskImage = m;
    if (camadas.length > 1) {
      // Keep only where every layer is opaque (hole AND top fade).
      estilo.maskComposite = "intersect";
      (estilo as Record<string, string>).WebkitMaskComposite = "source-in";
    }
  }

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={cx("mutual-ascii pointer-events-none absolute inset-0 size-full select-none", className)}
      style={estilo}
    />
  );
}

export function iniciarAsciiFundo(
  canvas: HTMLCanvasElement,
  { celula = 15, intensidade = 1 }: { celula?: number; intensidade?: number } = {},
): () => void {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return () => {};

  let largura = 0;
  let altura = 0;
  let colunas = 0;
  let linhas = 0;
  let dpr = 1;
  let raf = 0;
  let ultimo = 0;
  let parado = false;
  const rato = { x: -9999, y: -9999, forca: 0 };
  const cores = { verde: "#6dba6a", vermelho: "#e8393c", tinta: "#1c1917", escuro: false };

  const lerCores = () => {
    const s = getComputedStyle(document.documentElement);
    cores.verde = s.getPropertyValue("--flag-green").trim() || cores.verde;
    cores.vermelho = s.getPropertyValue("--flag-red").trim() || cores.vermelho;
    cores.tinta = s.getPropertyValue("--foreground").trim() || cores.tinta;
    cores.escuro = document.documentElement.classList.contains("dark");
  };

  const medir = () => {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    largura = r.width;
    altura = r.height;
    canvas.width = Math.round(largura * dpr);
    canvas.height = Math.round(altura * dpr);
    colunas = Math.ceil(largura / (celula * 0.62)) + 1;
    linhas = Math.ceil(altura / celula) + 1;
    lerCores();
  };

  const desenhar = (t: number) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, largura, altura);
    ctx.font = `500 ${celula - 2}px ui-monospace, "Geist Mono", "SFMono-Regular", Menlo, monospace`;
    ctx.textBaseline = "top";
    const cw = celula * 0.62;
    const base = (cores.escuro ? 0.5 : 0.36) * intensidade;
    const faixa = altura / 7; // the flag has 7 bands (4 red + 3 green lines)

    for (let j = 0; j < linhas; j++) {
      const y = j * celula;
      for (let i = 0; i < colunas; i++) {
        const x = i * cw;
        // Flag wave: vertical offset that travels along x and breathes in time.
        const onda = Math.sin(x * 0.0065 + t * 0.00042) * 26 + Math.sin(x * 0.017 - t * 0.0007 + y * 0.004) * 9;
        const yy = y + onda;
        const posFaixa = yy / faixa;
        const indiceFaixa = Math.floor(posFaixa);
        const dentro = posFaixa - indiceFaixa; // 0..1 within the band
        // Brightest at the middle of each band, fading to the edges.
        let v = Math.sin(dentro * Math.PI) ** 2;
        // Diagonal "S" of the logo: a slow sweep that lifts the characters it crosses.
        const diag = Math.sin((x - y * 1.35) * 0.0045 - t * 0.00025);
        v *= 0.55 + 0.45 * (diag * 0.5 + 0.5);
        // Pointer ripple.
        if (rato.forca > 0.01) {
          const dx = x - rato.x;
          const dy = y - rato.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 160) v += (1 - d / 160) * 0.55 * rato.forca * (0.6 + 0.4 * Math.sin(d * 0.09 - t * 0.012));
        }
        if (v < 0.08) continue;
        const idx = Math.min(RAMPA.length - 1, Math.floor(v * (RAMPA.length - 1)));
        const ch = RAMPA[idx];
        if (ch === " ") continue;
        const vermelha = ((indiceFaixa % 2) + 2) % 2 === 0;
        ctx.globalAlpha = Math.min(1, base * (0.35 + v * 0.9));
        ctx.fillStyle = vermelha ? cores.vermelho : cores.verde;
        ctx.fillText(ch, x, y);
      }
    }
    ctx.globalAlpha = 1;
    rato.forca *= 0.95;
  };

  const ciclo = (agora: number) => {
    raf = requestAnimationFrame(ciclo);
    if (agora - ultimo < 50) return; // ~20 fps is plenty for a backdrop
    ultimo = agora;
    desenhar(agora);
  };

  const arrancar = () => {
    cancelAnimationFrame(raf);
    medir();
    if (movimentoReduzido()) {
      parado = true;
      desenhar(12_000); // one still, pleasant frame
      return;
    }
    parado = false;
    raf = requestAnimationFrame(ciclo);
  };

  const onPointer = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    rato.x = e.clientX - r.left;
    rato.y = e.clientY - r.top;
    rato.forca = 1;
  };
  const onVisibilidade = () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else arrancar();
  };
  const onPreferencias = () => {
    lerCores();
    arrancar();
  };
  const ro = new ResizeObserver(() => {
    medir();
    if (parado) desenhar(12_000);
  });
  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  const temaObs = new MutationObserver(() => {
    lerCores();
    if (parado) desenhar(12_000);
  });

  ro.observe(canvas);
  temaObs.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-movimento"] });
  window.addEventListener("pointermove", onPointer, { passive: true });
  document.addEventListener("visibilitychange", onVisibilidade);
  window.addEventListener("mutual:preferencias", onPreferencias);
  mq.addEventListener("change", onPreferencias);
  arrancar();

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    temaObs.disconnect();
    window.removeEventListener("pointermove", onPointer);
    document.removeEventListener("visibilitychange", onVisibilidade);
    window.removeEventListener("mutual:preferencias", onPreferencias);
    mq.removeEventListener("change", onPreferencias);
  };
}
