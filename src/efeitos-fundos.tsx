"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { Check } from "lucide-react";
import { cx } from "./cx";
import { movimentoReduzido } from "./preferencias";
import { aleatorio, comAlfa, estiloMascara, iniciarEfeito, type Mascara } from "./efeitos-base";
import { dentroDoPoligono, ILHAS, LOCAIS_ASSOCIACOES, PORTUGAL_CONTINENTAL } from "./efeitos-portugal";

/**
 * Decorative effects (v0.7). Each has its own look and its own place (see
 * AGENTS.md → "Efeitos: onde usar cada um"), so the apps do not all wear the
 * same backdrop. All are `aria-hidden`, pointer-transparent, masked away
 * from text, capped in DPR and frame rate, paused off screen and in hidden
 * tabs, still under "Reduzir movimento" and gone in "Alto contraste".
 *
 * Place them inside a `relative` (and usually `overflow-hidden`) container,
 * before the content, and give the content `relative`.
 */

interface BaseProps {
  className?: string | undefined;
  /** Soft hole where the content sits (so nothing moves behind text). */
  mascara?: Mascara | undefined;
  /** Fade out at the top under a header, e.g. "5rem". */
  fadeTopo?: string | false | undefined;
  /** 0–1: overall strength. */
  intensidade?: number | undefined;
}

function useCanvas(iniciar: (c: HTMLCanvasElement) => () => void, deps: unknown[]) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    return iniciar(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

const CLASSE_CANVAS = "m-efeito pointer-events-none absolute inset-0 size-full select-none";

// ─── ConstelacaoFundo — the network of associations across Portugal ──────

export interface ConstelacaoFundoProps extends BaseProps {
  /** Places to light up ([lon, lat]); default: towns with mutual associations. */
  pontos?: ReadonlyArray<readonly [number, number]> | undefined;
  /** Where the map sits; keep the text on the other side. */
  posicao?: "direita" | "esquerda" | "centro" | undefined;
  /** Madeira and the Azores in an inset. */
  ilhas?: boolean | undefined;
}

/**
 * A dotted map of Portugal with the associations as slowly twinkling points,
 * joined to their neighbours; now and then a soft light travels between two
 * of them. For pages about the network (Portal home band, public "Sobre",
 * associations directory hero), never behind forms or tables.
 */
export function ConstelacaoFundo({ className, pontos = LOCAIS_ASSOCIACOES, posicao = "direita", ilhas = true, mascara = false, fadeTopo = false, intensidade = 1 }: ConstelacaoFundoProps) {
  const ref = useCanvas(
    (canvas) => {
      let camada: HTMLCanvasElement | null = null;
      let pts: Array<{ x: number; y: number; fase: number; vel: number; r: number }> = [];
      let arestas: Array<[number, number]> = [];
      const rnd = aleatorio(7);
      const pulsos = Array.from({ length: 3 }, (_, i) => ({ aresta: -1, inicio: -i * 1400, dur: 2600 }));

      return iniciarEfeito(canvas, {
        fps: 20,
        preparar: (_ctx, e) => {
          const { largura: W, altura: H, cores } = e;
          const RAZAO = (3.4 * 0.77) / 5.3; // map width / height (lon scaled by cos 39.6°)
          const fatia = posicao === "centro" ? 0.8 : 0.46;
          const hM = Math.min(H * 0.9, (W * fatia) / RAZAO);
          const wM = hM * RAZAO;
          const x0 = posicao === "direita" ? W - wM - W * 0.07 : posicao === "esquerda" ? W * 0.07 : (W - wM) / 2;
          const y0 = (H - hM) / 2;
          const px = (lon: number) => x0 + ((lon + 9.55) * 0.77 * hM) / 5.3;
          const py = (lat: number) => y0 + ((42.2 - lat) * hM) / 5.3;
          const inv = (x: number, y: number): [number, number] => [((x - x0) * 5.3) / (0.77 * hM) - 9.55, 42.2 - ((y - y0) * 5.3) / hM];

          camada = document.createElement("canvas");
          camada.width = Math.max(1, Math.round(W * e.dpr));
          camada.height = Math.max(1, Math.round(H * e.dpr));
          const c = camada.getContext("2d")!;
          c.setTransform(e.dpr, 0, 0, e.dpr, 0, 0);
          const passo = Math.max(5, Math.min(10, hM / 64));
          const aTerra = (cores.escuro ? 0.26 : 0.2) * intensidade;
          c.fillStyle = comAlfa(cores.texto, aTerra);
          for (let y = y0; y < y0 + hM; y += passo) {
            for (let x = x0 + ((Math.round((y - y0) / passo) % 2) * passo) / 2; x < x0 + wM; x += passo) {
              const [lon, lat] = inv(x, y);
              if (dentroDoPoligono(lon, lat, PORTUGAL_CONTINENTAL)) {
                c.beginPath();
                c.arc(x, y, passo * 0.14 + 0.35, 0, Math.PI * 2);
                c.fill();
              }
            }
          }
          if (ilhas) {
            // Inset: islands at true size, positions pulled together.
            const escalaKm = hM / 5.3 / 111;
            const lado = posicao === "esquerda" ? 1 : -1;
            const ix = posicao === "esquerda" ? x0 + wM + wM * 0.12 : x0 - wM * 0.12;
            const iy = y0 + hM * 0.72;
            const caixas = { acores: [Infinity, Infinity, -Infinity, -Infinity], madeira: [Infinity, Infinity, -Infinity, -Infinity] };
            for (const [lon, lat, rx, ry] of ILHAS) {
              const madeira = lat < 34;
              const cx0 = ix + lado * (madeira ? wM * 0.18 : wM * 0.5 + (lon + 27) * wM * 0.07);
              const cy0 = iy + (madeira ? hM * 0.16 : -(lat - 38) * hM * 0.035);
              const cx = caixas[madeira ? "madeira" : "acores"];
              cx[0] = Math.min(cx[0]!, cx0 - rx * escalaKm);
              cx[1] = Math.min(cx[1]!, cy0 - ry * escalaKm);
              cx[2] = Math.max(cx[2]!, cx0 + rx * escalaKm);
              cx[3] = Math.max(cx[3]!, cy0 + ry * escalaKm);
              for (let y = cy0 - ry * escalaKm; y <= cy0 + ry * escalaKm; y += passo) {
                for (let x = cx0 - rx * escalaKm; x <= cx0 + rx * escalaKm; x += passo) {
                  const dx = (x - cx0) / (rx * escalaKm);
                  const dy = (y - cy0) / (ry * escalaKm);
                  if (dx * dx + dy * dy <= 1.05) {
                    c.beginPath();
                    c.arc(x, y, passo * 0.14 + 0.35, 0, Math.PI * 2);
                    c.fill();
                  }
                }
              }
            }
            // A hairline frame around each inset (it is an inset, not the sea).
            c.strokeStyle = comAlfa(cores.texto, (cores.escuro ? 0.2 : 0.14) * intensidade);
            c.lineWidth = 1;
            for (const [a, b, d, f] of Object.values(caixas)) {
              const m = passo * 1.6;
              c.beginPath();
              c.roundRect(a! - m, b! - m, d! - a! + 2 * m, f! - b! + 2 * m, 6);
              c.stroke();
            }
          }
          pts = pontos.map(([lon, lat], i) => ({ x: px(lon), y: py(lat), fase: rnd() * Math.PI * 2, vel: 0.6 + rnd() * 0.8, r: i % 5 === 0 ? 2.6 : 1.9 }));
          // Each point joined to its two nearest neighbours.
          const vistas = new Set<string>();
          arestas = [];
          pts.forEach((p, i) => {
            const perto = pts
              .map((q, j) => ({ j, d: (q.x - p.x) ** 2 + (q.y - p.y) ** 2 }))
              .filter((q) => q.j !== i)
              .sort((a, b) => a.d - b.d)
              .slice(0, 2);
            for (const q of perto) {
              const k = i < q.j ? `${i}-${q.j}` : `${q.j}-${i}`;
              if (!vistas.has(k)) {
                vistas.add(k);
                arestas.push([i, q.j]);
              }
            }
          });
          c.strokeStyle = comAlfa(cores.escuro ? cores.verde : cores.marca, (cores.escuro ? 0.22 : 0.16) * intensidade);
          c.lineWidth = 0.8;
          c.beginPath();
          for (const [a, b] of arestas) {
            c.moveTo(pts[a]!.x, pts[a]!.y);
            c.lineTo(pts[b]!.x, pts[b]!.y);
          }
          c.stroke();
        },
        desenhar: (ctx, e, t) => {
          ctx.clearRect(0, 0, e.largura, e.altura);
          if (camada) ctx.drawImage(camada, 0, 0, e.largura, e.altura);
          const ponto = e.cores.escuro ? e.cores.verde : e.cores.marca;
          for (const p of pts) {
            const tw = 0.5 + 0.5 * Math.sin(t * 0.0011 * p.vel + p.fase);
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
            g.addColorStop(0, comAlfa(ponto, (0.22 + 0.3 * tw) * intensidade));
            g.addColorStop(1, comAlfa(ponto, 0));
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = comAlfa(ponto, (0.55 + 0.45 * tw) * intensidade);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
          }
          if (e.parado || !arestas.length) return;
          // A light travelling between two associations.
          for (const pu of pulsos) {
            let p = (t - pu.inicio) / pu.dur;
            if (p >= 1 || pu.aresta < 0) {
              pu.aresta = Math.floor(rnd() * arestas.length);
              pu.inicio = t + rnd() * 1800;
              p = (t - pu.inicio) / pu.dur;
            }
            if (p < 0) continue;
            const [a, b] = arestas[pu.aresta]!;
            const A = pts[a]!;
            const B = pts[b]!;
            const ease = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
            const x = A.x + (B.x - A.x) * ease;
            const y = A.y + (B.y - A.y) * ease;
            const alfa = Math.sin(p * Math.PI) * 0.8 * intensidade;
            const grad = ctx.createLinearGradient(A.x, A.y, x, y);
            grad.addColorStop(0, comAlfa(e.cores.acento, 0));
            grad.addColorStop(1, comAlfa(e.cores.acento, alfa * 0.6));
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(A.x + (B.x - A.x) * Math.max(0, ease - 0.35), A.y + (B.y - A.y) * Math.max(0, ease - 0.35));
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.fillStyle = comAlfa(e.cores.acento, alfa);
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        },
      });
    },
    [pontos, posicao, ilhas, intensidade],
  );
  return <canvas ref={ref} aria-hidden className={cx(CLASSE_CANVAS, className)} style={estiloMascara(mascara, fadeTopo)} />;
}

// ─── TopografiaFundo — contour lines ──────────────────────────────────────

function ruido(semente: number) {
  const perm = new Uint8Array(512);
  const r = aleatorio(semente);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [p[i], p[j]] = [p[j]!, p[i]!];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255]!;
  const suave = (t: number) => t * t * (3 - 2 * t);
  const h = (x: number, y: number) => perm[(perm[x & 255]! + y) & 511]! / 255;
  return (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = suave(x - xi);
    const yf = suave(y - yi);
    const a = h(xi, yi);
    const b = h(xi + 1, yi);
    const c = h(xi, yi + 1);
    const d = h(xi + 1, yi + 1);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  };
}

export interface TopografiaFundoProps extends BaseProps {
  /** Number of contour levels (default 12). */
  niveis?: number | undefined;
  /** Size of the hills in px (default 420). */
  escala?: number | undefined;
  /** Line colour: the app accent (default) or the brand green. */
  cor?: "acento" | "marca" | undefined;
}

/**
 * Topographic contour lines that drift very slowly, like a relief map of
 * the country. For public heroes, the help centre and section covers — a
 * quiet texture with the app's accent.
 */
export function TopografiaFundo({ className, niveis = 12, escala = 420, cor = "acento", mascara = false, fadeTopo = false, intensidade = 1 }: TopografiaFundoProps) {
  const ref = useCanvas(
    (canvas) => {
      const n = ruido(11);
      let cols = 0;
      let lins = 0;
      let celula = 18;
      let campo = new Float32Array(0);
      return iniciarEfeito(canvas, {
        fps: 12,
        tempoParado: 30_000,
        preparar: (_c, e) => {
          celula = Math.max(14, Math.ceil(Math.sqrt((e.largura * e.altura) / 5200)));
          cols = Math.ceil(e.largura / celula) + 1;
          lins = Math.ceil(e.altura / celula) + 1;
          campo = new Float32Array(cols * lins);
        },
        desenhar: (ctx, e, t) => {
          ctx.clearRect(0, 0, e.largura, e.altura);
          const dx = t * 0.0000045;
          const dy = t * 0.0000028;
          for (let j = 0; j < lins; j++) {
            for (let i = 0; i < cols; i++) {
              const x = (i * celula) / escala;
              const y = (j * celula) / escala;
              campo[j * cols + i] = n(x + dx, y - dy) * 0.68 + n(x * 2.1 - dy * 1.7 + 40, y * 2.1 + dx + 40) * 0.32;
            }
          }
          const base = cor === "acento" ? e.cores.acento : e.cores.marca;
          const alfa = (e.cores.escuro ? 0.26 : 0.21) * intensidade;
          for (let k = 0; k < niveis; k++) {
            const nivel = 0.14 + (0.72 * (k + 0.5)) / niveis;
            const indice = k % 4 === 1;
            ctx.strokeStyle = comAlfa(base, indice ? alfa * 1.7 : alfa);
            ctx.lineWidth = indice ? 1.3 : 0.9;
            ctx.beginPath();
            for (let j = 0; j < lins - 1; j++) {
              for (let i = 0; i < cols - 1; i++) {
                const a = campo[j * cols + i]!;
                const b = campo[j * cols + i + 1]!;
                const c = campo[(j + 1) * cols + i + 1]!;
                const d = campo[(j + 1) * cols + i]!;
                const caso = (a > nivel ? 8 : 0) | (b > nivel ? 4 : 0) | (c > nivel ? 2 : 0) | (d > nivel ? 1 : 0);
                if (caso === 0 || caso === 15) continue;
                const x = i * celula;
                const y = j * celula;
                const topo = () => [x + ((nivel - a) / (b - a)) * celula, y] as const;
                const direita = () => [x + celula, y + ((nivel - b) / (c - b)) * celula] as const;
                const baixo = () => [x + ((nivel - d) / (c - d)) * celula, y + celula] as const;
                const esquerda = () => [x, y + ((nivel - a) / (d - a)) * celula] as const;
                const seg = (p: readonly [number, number], q: readonly [number, number]) => {
                  ctx.moveTo(p[0], p[1]);
                  ctx.lineTo(q[0], q[1]);
                };
                switch (caso) {
                  case 1: case 14: seg(esquerda(), baixo()); break;
                  case 2: case 13: seg(baixo(), direita()); break;
                  case 3: case 12: seg(esquerda(), direita()); break;
                  case 4: case 11: seg(topo(), direita()); break;
                  case 5: seg(esquerda(), topo()); seg(baixo(), direita()); break;
                  case 6: case 9: seg(topo(), baixo()); break;
                  case 7: case 8: seg(esquerda(), topo()); break;
                  case 10: seg(topo(), direita()); seg(esquerda(), baixo()); break;
                }
              }
            }
            ctx.stroke();
          }
        },
      });
    },
    [niveis, escala, cor, intensidade],
  );
  return <canvas ref={ref} aria-hidden className={cx(CLASSE_CANVAS, className)} style={estiloMascara(mascara, fadeTopo)} />;
}

// ─── MalhaFundo — soft gradient mesh with grain (CSS only) ────────────────

export interface MalhaFundoProps extends BaseProps {
  /**
   * "marca": brand greens (Portal, general); "app": the app accent with the
   * brand; "bandeira": the flag's green with a touch of its red
   * (celebrations, institutional); "calmo": almost neutral.
   */
  tons?: "marca" | "app" | "bandeira" | "calmo" | undefined;
  /** Film grain over the colours (default true). */
  grao?: boolean | undefined;
}

/**
 * A soft mesh of colour that drifts slowly, with a fine grain. Pure CSS (no
 * JavaScript, server-safe markup). For public heroes and cover bands with
 * large type on top; as a quiet wash behind "done" moments.
 */
export function MalhaFundo({ className, tons = "marca", grao = true, mascara = false, fadeTopo = false, intensidade = 1 }: MalhaFundoProps) {
  return (
    <div aria-hidden data-tons={tons} className={cx("m-efeito m-malha pointer-events-none absolute inset-0 overflow-hidden", className)} style={{ ...estiloMascara(mascara, fadeTopo), opacity: intensidade }}>
      <span className="m-malha-a" />
      <span className="m-malha-b" />
      <span className="m-malha-c" />
      <span className="m-malha-d" />
      {grao && <span className="m-malha-grao" />}
    </div>
  );
}

// ─── PontosFundo — a dot grid that answers the pointer ────────────────────

export interface PontosFundoProps extends BaseProps {
  /** Distance between dots in px (default 22). */
  espaco?: number | undefined;
  /** Reach of the pointer in px (default 150). */
  alcance?: number | undefined;
}

/**
 * A quiet grid of dots; near the pointer they swell a little and take the
 * brand colour. Still when nobody moves (no animation loop runs). For empty
 * states, the assistant's greeting, search pages and 404s.
 */
export function PontosFundo({ className, espaco = 22, alcance = 150, mascara = false, fadeTopo = false, intensidade = 1 }: PontosFundoProps) {
  const ref = useCanvas(
    (canvas) => {
      let camada: HTMLCanvasElement | null = null;
      return iniciarEfeito(canvas, {
        fps: 40,
        rato: true,
        decaimento: 0.975,
        preparar: (_c, e) => {
          camada = document.createElement("canvas");
          camada.width = Math.max(1, Math.round(e.largura * e.dpr));
          camada.height = Math.max(1, Math.round(e.altura * e.dpr));
          const c = camada.getContext("2d")!;
          c.setTransform(e.dpr, 0, 0, e.dpr, 0, 0);
          c.fillStyle = comAlfa(e.cores.texto, (e.cores.escuro ? 0.22 : 0.16) * intensidade);
          const ox = (e.largura % espaco) / 2;
          const oy = (e.altura % espaco) / 2;
          for (let y = oy; y < e.altura; y += espaco) {
            for (let x = ox; x < e.largura; x += espaco) {
              c.beginPath();
              c.arc(x, y, 1, 0, Math.PI * 2);
              c.fill();
            }
          }
        },
        desenhar: (ctx, e) => {
          ctx.clearRect(0, 0, e.largura, e.altura);
          const f = e.parado ? 0 : e.rato.forca;
          if (f < 0.01 || !camada) {
            if (camada) ctx.drawImage(camada, 0, 0, e.largura, e.altura);
            return false;
          }
          const { x: rx, y: ry } = e.rato;
          const ox = (e.largura % espaco) / 2;
          const oy = (e.altura % espaco) / 2;
          const cor = e.cores.escuro ? e.cores.verde : e.cores.marca;
          const base = comAlfa(e.cores.texto, (e.cores.escuro ? 0.22 : 0.16) * intensidade);
          const a2 = alcance * alcance;
          ctx.fillStyle = base;
          for (let y = oy; y < e.altura; y += espaco) {
            for (let x = ox; x < e.largura; x += espaco) {
              const dx = x - rx;
              const dy = y - ry;
              const d2 = dx * dx + dy * dy;
              if (d2 >= a2) {
                ctx.beginPath();
                ctx.arc(x, y, 1, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
          for (let y = oy; y < e.altura; y += espaco) {
            for (let x = ox; x < e.largura; x += espaco) {
              const dx = x - rx;
              const dy = y - ry;
              const d2 = dx * dx + dy * dy;
              if (d2 >= a2) continue;
              const d = Math.sqrt(d2);
              const k = (1 - d / alcance) ** 2 * f;
              const empurrar = d > 0.1 ? (7 * k) / d : 0;
              ctx.fillStyle = comAlfa(cor, (0.25 + 0.6 * k) * intensidade);
              ctx.beginPath();
              ctx.arc(x + dx * empurrar, y + dy * empurrar, 1 + 1.9 * k, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          return true;
        },
      });
    },
    [espaco, alcance, intensidade],
  );
  return <canvas ref={ref} aria-hidden className={cx(CLASSE_CANVAS, className)} style={estiloMascara(mascara, fadeTopo)} />;
}

// ─── BrilhoDestaque — a light that runs around a featured card ────────────

/**
 * A slow light that runs around the edge of ONE featured card per page
 * ("Recomendado", the next event, a new feature). Also available as the
 * class `m-brilho` (e.g. `<Card className="m-brilho">`).
 */
export function BrilhoDestaque({ children, as: Tag = "div", className }: { children: ReactNode; as?: ElementType | undefined; className?: string | undefined }) {
  return <Tag className={cx("m-brilho", className)}>{children}</Tag>;
}

// ─── Celebracao — a one-off burst for "done" moments ─────────────────────

export interface CelebracaoProps {
  /** Plays when it becomes true (default: on mount). */
  ativo?: boolean | undefined;
  /** Centre of the burst inside the parent. */
  origem?: { x?: string | undefined; y?: string | undefined } | undefined;
  particulas?: number | undefined;
  className?: string | undefined;
}

/**
 * A short, single burst of the flag's colours (≈ 1.5 s, then still) for
 * moments that close a task: "Documento submetido", "Inscrição confirmada",
 * "Pagamento recebido". Never on page load of ordinary pages, never
 * repeated. Nothing plays under "Reduzir movimento".
 */
export function Celebracao({ ativo = true, origem = {}, particulas = 30, className }: CelebracaoProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !ativo || movimentoReduzido()) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    const s = getComputedStyle(canvas);
    const cores = [s.getPropertyValue("--flag-green").trim() || "#6dba6a", s.getPropertyValue("--brand").trim() || "#1f6f36", s.getPropertyValue("--app-accent").trim() || "#1f6f36", s.getPropertyValue("--flag-red").trim() || "#e8393c"];
    const cx0 = (Number.parseFloat(origem.x ?? "50") / 100) * r.width;
    const cy0 = (Number.parseFloat(origem.y ?? "50") / 100) * r.height;
    const rnd = aleatorio(3);
    const ps = Array.from({ length: particulas }, (_, i) => {
      const ang = (i / particulas) * Math.PI * 2 + (rnd() - 0.5) * 0.5;
      const vel = 0.16 + rnd() * 0.2;
      return {
        vx: Math.cos(ang) * vel,
        vy: Math.sin(ang) * vel - 0.05,
        cor: cores[i % 7 === 0 ? 3 : i % 3]!,
        forma: i % 3 === 0 ? "barra" : "ponto",
        rot: rnd() * Math.PI,
        vr: (rnd() - 0.5) * 0.012,
        tam: 2.2 + rnd() * 2.2,
        vida: 1100 + rnd() * 600,
      };
    });
    const t0 = performance.now();
    let raf = 0;
    const passo = (agora: number) => {
      const t = agora - t0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, r.width, r.height);
      // Ring.
      if (t < 800) {
        const p = t / 800;
        ctx.strokeStyle = comAlfa(cores[1]!, 0.35 * (1 - p));
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx0, cy0, 28 + p * 70, 0, Math.PI * 2);
        ctx.stroke();
      }
      let vivas = 0;
      for (const q of ps) {
        if (t > q.vida) continue;
        vivas++;
        const desacel = 1 - Math.min(1, t / q.vida) * 0.55;
        const x = cx0 + q.vx * t * desacel;
        const y = cy0 + q.vy * t * desacel + 0.00009 * t * t;
        const alfa = t < 120 ? t / 120 : 1 - ((t - 120) / (q.vida - 120)) ** 1.6;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(q.rot + q.vr * t);
        ctx.fillStyle = comAlfa(q.cor, Math.max(0, alfa));
        if (q.forma === "barra") ctx.fillRect(-q.tam * 1.3, -q.tam * 0.45, q.tam * 2.6, q.tam * 0.9);
        else {
          ctx.beginPath();
          ctx.arc(0, 0, q.tam * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      if (vivas > 0 || t < 800) raf = requestAnimationFrame(passo);
      else ctx.clearRect(0, 0, r.width, r.height);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [ativo, origem.x, origem.y, particulas]);
  return <canvas ref={ref} aria-hidden className={cx(CLASSE_CANVAS, className)} />;
}

/**
 * The "done" moment of a flow: a big check with a single `Celebracao`,
 * the result in words and the next steps. Focus moves to the title so
 * screen readers hear the result.
 */
export function MomentoSucesso({
  title,
  children,
  actions,
  celebrar = true,
  headingLevel = 1,
  className,
}: {
  title: ReactNode;
  children?: ReactNode | undefined;
  actions?: ReactNode | undefined;
  /** Play the burst (default true). */
  celebrar?: boolean | undefined;
  headingLevel?: 1 | 2 | undefined;
  className?: string | undefined;
}) {
  const titulo = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    titulo.current?.focus();
  }, []);
  const H = `h${headingLevel}` as const;
  return (
    <div className={cx("relative flex flex-col items-center gap-4 px-4 py-10 text-center", className)}>
      <div className="relative grid size-40 place-items-center">
        {celebrar && <Celebracao className="-inset-10 size-[calc(100%+5rem)]" />}
        <span className="m-selo-sucesso relative grid size-20 place-items-center rounded-full">
          <Check aria-hidden size={40} strokeWidth={2.75} />
        </span>
      </div>
      <H ref={titulo} tabIndex={-1} className="text-2xl font-bold tracking-tight text-balance outline-none sm:text-[1.75rem]">
        {title}
      </H>
      {children && <div className="max-w-prose text-base text-muted-foreground">{children}</div>}
      {actions && <div className="mt-2 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}
