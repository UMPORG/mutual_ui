"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { iniciarEfeito } from "./efeitos-base";
import { cx } from "./cx";

/**
 * Decorative (aria-hidden) and calm by design: 10 fps, paused when the tab is hidden or off screen, still a few seconds after the pointer stops (the next move wakes it), one still frame under reduced motion, hidden in high contrast.
 * `mascara` cuts a soft hole where content sits, so characters never run behind text.
 */
export interface AsciiFundoProps {
  className?: string | undefined;
  /** Hole in the animation, in CSS units relative to the backdrop. */
  mascara?: { x?: string | undefined; y?: string | undefined; largura?: string | undefined; altura?: string | undefined } | false | undefined;
  /** px. */
  celula?: number | undefined;
  /** 0–1. */
  intensidade?: number | undefined;
  /** Fade the animation out at the top (keeps a header legible), e.g. "6rem"; false to disable. */
  fadeTopo?: string | false | undefined;
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

const TEMPO_PARADO = 12_000;
/** Without pointer movement the animation freezes after this long (ms of animation) and wakes on the next move. */
const ATE_CONGELAR = 6_000;

export function iniciarAsciiFundo(
  canvas: HTMLCanvasElement,
  { celula = 15, intensidade = 1 }: { celula?: number | undefined; intensidade?: number | undefined } = {},
): () => void {
  // Animation time: advances only while frames are drawn, so waking up never jumps the wave.
  let tempo = 0;
  let anterior = -1;
  let ultimoMovimento = 0;
  let ondaColuna = new Float64Array(0);
  return iniciarEfeito(canvas, {
    fps: 10,
    rato: true,
    decaimento: 0.9,
    tempoParado: TEMPO_PARADO,
    desenhar: (ctx, e, t) => {
      const { largura, altura, cores, rato } = e;
      let agora = TEMPO_PARADO;
      if (!e.parado) {
        tempo += anterior < 0 ? 0 : Math.min(t - anterior, 250);
        anterior = t;
        if (rato.forca > 0.99) ultimoMovimento = tempo;
        agora = tempo + TEMPO_PARADO;
      }
      ctx.clearRect(0, 0, largura, altura);
      ctx.font = `500 ${celula - 2}px ui-monospace, "Geist Mono", "SFMono-Regular", Menlo, monospace`;
      ctx.textBaseline = "top";
      const cw = celula * 0.62;
      const colunas = Math.ceil(largura / cw) + 1;
      const linhas = Math.ceil(altura / celula) + 1;
      if (ondaColuna.length < colunas) ondaColuna = new Float64Array(colunas);
      for (let i = 0; i < colunas; i++) ondaColuna[i] = Math.sin(i * cw * 0.0065 + agora * 0.00042) * 26;
      const base = (cores.escuro ? 0.5 : 0.36) * intensidade;
      const faixa = altura / 7; // the flag has 7 bands (4 red + 3 green lines)
      const comRato = rato.forca > 0.01;

      for (let j = 0; j < linhas; j++) {
        const y = j * celula;
        for (let i = 0; i < colunas; i++) {
          const x = i * cw;
          const onda = (ondaColuna[i] ?? 0) + Math.sin(x * 0.017 - agora * 0.0007 + y * 0.004) * 9;
          const posFaixa = (y + onda) / faixa;
          const indiceFaixa = Math.floor(posFaixa);
          const dentro = posFaixa - indiceFaixa; // 0..1 within the band
          let v = Math.sin(dentro * Math.PI) ** 2;
          const diag = Math.sin((x - y * 1.35) * 0.0045 - agora * 0.00025);
          v *= 0.55 + 0.45 * (diag * 0.5 + 0.5);
          if (comRato) {
            const dx = x - rato.x;
            const dy = y - rato.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < 25_600) {
              const d = Math.sqrt(d2);
              v += (1 - d / 160) * 0.55 * rato.forca * (0.6 + 0.4 * Math.sin(d * 0.09 - agora * 0.012));
            }
          }
          if (v < 0.08) continue;
          const idx = Math.min(RAMPA.length - 1, Math.floor(v * (RAMPA.length - 1)));
          const ch = RAMPA[idx];
          if (!ch || ch === " ") continue;
          const vermelha = ((indiceFaixa % 2) + 2) % 2 === 0;
          ctx.globalAlpha = Math.min(1, base * (0.35 + v * 0.9));
          ctx.fillStyle = vermelha ? cores.vermelho : cores.verde;
          ctx.fillText(ch, x, y);
        }
      }
      ctx.globalAlpha = 1;
      if (e.parado) return;
      // Calm by design: still a few seconds after the pointer stops.
      if (tempo - ultimoMovimento < ATE_CONGELAR) return;
      anterior = -1;
      return false;
    },
  });
}
