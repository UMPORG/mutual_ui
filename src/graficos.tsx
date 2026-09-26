"use client";

/**
 * Brand charts on Recharts (optional peer dependency — import from
 * `@umporg/ui/graficos` only in apps that have `recharts` installed).
 *
 * Every chart is a `ChartFrame`: a card with title, description, legend
 * (≥ 2 series), the plot, and a "Ver dados" toggle that swaps the plot for
 * an accessible table. The svg carries a generated text description;
 * Recharts' accessibility layer makes the plot keyboard-focusable (arrow keys
 * move the tooltip). Colours come from the validated `--serie-*` palette,
 * numbers are pt-PT, animation is off under Reduzir movimento.
 */

import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { BarChart3, Table2 } from "lucide-react";
import { cx } from "./cx";
import { EmptyState } from "./feedback";
import { formatarEixo, formatarPercentagem, formatarValor, paraNumero, type FormatoValor } from "./formatar";
import {
  agruparOutros,
  atribuirCores,
  corSerie,
  descreverGrafico,
  tabelaDoGrafico,
  type CorSerie,
  type Fatia,
  type Linha,
  type SerieBase,
} from "./dados";

export type { CorSerie, SerieBase as ChartSeries } from "./dados";

// ─── Motion ───────────────────────────────────────────────────────────────

/** True when the OS or the Acessibilidade menu asks for less motion. */
export function useMovimentoReduzido(): boolean {
  const [reduzido, setReduzido] = useState(true); // SSR/first paint: no animation
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const ler = () =>
      setReduzido(mq.matches || document.documentElement.getAttribute("data-movimento") === "reduzido");
    ler();
    mq.addEventListener("change", ler);
    const obs = new MutationObserver(ler);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-movimento"] });
    return () => {
      mq.removeEventListener("change", ler);
      obs.disconnect();
    };
  }, []);
  return reduzido;
}

/** Axis text in px (Recharts measures labels in px): 0.875rem of the root
 *  size, so ticks grow with the Acessibilidade text size. */
export function useLetraEixo(): number {
  const [px, setPx] = useState(14);
  useEffect(() => {
    const ler = () => setPx(Math.round(parseFloat(getComputedStyle(document.documentElement).fontSize || "16") * 0.875));
    ler();
    const obs = new MutationObserver(ler);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-texto", "style", "class"] });
    return () => obs.disconnect();
  }, []);
  return px;
}

let medidor: CanvasRenderingContext2D | null = null;
/** Width (px) of the widest label, measured like the browser draws it. */
function larguraTexto(textos: string[], px: number): number {
  if (typeof document === "undefined") return Math.max(...textos.map((t) => t.length)) * px * 0.62;
  medidor ??= document.createElement("canvas").getContext("2d");
  if (!medidor) return Math.max(...textos.map((t) => t.length)) * px * 0.62;
  const familia = getComputedStyle(document.body).fontFamily || "system-ui, sans-serif";
  medidor.font = `${px}px ${familia}`;
  return Math.max(0, ...textos.map((t) => medidor!.measureText(t).width));
}

/** Width of a value axis: the widest tick Recharts can produce for this data
 *  (it rounds the top up, so allow for a longer label), plus breathing room. */
function larguraEixoValor(dados: readonly Linha[], chaves: string[], formato: FormatoValor | undefined, px: number, empilhado?: boolean): number {
  let max = 0;
  let min = 0;
  for (const d of dados) {
    let soma = 0;
    for (const k of chaves) {
      const v = paraNumero(d[k] as number) ?? 0;
      if (empilhado) soma += v;
      else max = Math.max(max, v);
      min = Math.min(min, v);
    }
    if (empilhado) max = Math.max(max, soma);
  }
  // Ticks are "nice" steps of the rounded-up top, which may carry a decimal
  // in compact form ("19,5 mil €"): try both round and 3-figure values.
  const alvos = [max, max * 1.25, max * 0.77, max * 0.53, min, 0];
  const candidatos = alvos.flatMap((v) => [2, 3].map((p) => formatarEixo(Number((v || 0).toPrecision(p)), formato)));
  return Math.ceil(larguraTexto(candidatos, px) * 1.08) + 12;
}

/** Width of a category axis (horizontal bars): the longest name, capped. */
function larguraEixoCategoria(dados: readonly Linha[], chave: string, px: number, fc?: (v: unknown) => string): number {
  const nomes = dados.map((d) => (fc ? fc(d[chave]) : String(d[chave] ?? "")));
  return Math.min(Math.ceil(larguraTexto(nomes, px) * 1.06) + 14, 220);
}

/** Heights are given in px at 100% text and scale with the Acessibilidade size. */
const rem = (px: number) => `${px / 16}rem`;

// ─── Frame ────────────────────────────────────────────────────────────────

export interface LegendItem {
  label: string;
  color: string;
  /** Key shape mirrors the mark: rect for bars/areas/slices, line for lines. */
  shape?: "rect" | "line" | undefined;
  /** Optional value next to the name (donut). */
  value?: string | undefined;
}

export function ChartLegend({ items, className }: { items: LegendItem[]; className?: string }) {
  return (
    <ul className={cx("flex flex-wrap gap-x-4 gap-y-1.5 text-[0.9375rem]", className)} aria-label="Legenda">
      {items.map((it) => (
        <li key={it.label} className="inline-flex items-center gap-2">
          <span
            aria-hidden
            className={cx("shrink-0", it.shape === "line" ? "h-[3px] w-4 rounded-full" : "size-3 rounded-[3px]")}
            style={{ background: it.color }}
          />
          <span className="text-foreground">{it.label}</span>
          {it.value && <span className="font-semibold m-num">{it.value}</span>}
        </li>
      ))}
    </ul>
  );
}

export interface ChartFrameProps {
  title: ReactNode;
  description?: ReactNode | undefined;
  /** Extra controls on the right (the "Ver dados" toggle is added for you). */
  actions?: ReactNode | undefined;
  legend?: LegendItem[] | undefined;
  /** The table twin of the chart. */
  table?: { headers: string[]; rows: string[][] } | undefined;
  loading?: boolean | undefined;
  /** Keeps the previous plot at reduced opacity while new data loads. */
  refreshing?: boolean | undefined;
  isEmpty?: boolean | undefined;
  empty?: ReactNode | undefined;
  /** Plot height in px at 100% text (scales with the text size; the axis band is inside it). */
  height?: number | undefined;
  /** No card surface (inside another card). */
  bare?: boolean | undefined;
  /** Heading level of the title. */
  level?: 2 | 3 | 4 | undefined;
  /** "auto": the plot sizes itself (content taller than `height` on phones). */
  plotHeight?: "fixed" | "auto" | undefined;
  className?: string | undefined;
  children: ReactNode;
}

/** Card + title + legend + plot/table toggle. Use it for custom charts too. */
export function ChartFrame({
  title,
  description,
  actions,
  legend,
  table,
  loading,
  refreshing,
  isEmpty,
  empty,
  height = 260,
  bare,
  level = 3,
  plotHeight = "fixed",
  className,
  children,
}: ChartFrameProps) {
  const [verTabela, setVerTabela] = useState(false);
  const id = useId();
  const H = `h${level}` as "h3";
  return (
    <figure
      aria-labelledby={`${id}-t`}
      className={cx("m-grafico @container flex min-w-0 flex-col gap-4", !bare && "m-surface p-5 sm:p-6", className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-1 basis-56 flex-col gap-1">
          <H id={`${id}-t`} className="text-lg leading-snug font-semibold tracking-tight text-balance">
            {title}
          </H>
          {description && <p className="text-[0.9375rem] text-muted-foreground">{description}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {table && !isEmpty && !loading && (
            <button
              type="button"
              aria-pressed={verTabela}
              onClick={() => setVerTabela((v) => !v)}
              className="m-btn m-btn-ghost inline-flex h-10 items-center gap-2 rounded-lg px-3 text-[0.9375rem]"
            >
              {verTabela ? <BarChart3 aria-hidden size={18} /> : <Table2 aria-hidden size={18} />}
              {verTabela ? "Ver gráfico" : "Ver dados"}
            </button>
          )}
        </div>
      </div>
      {legend && legend.length > 0 && !verTabela && !isEmpty && <ChartLegend items={legend} />}
      {loading ? (
        <div aria-busy className="flex items-end gap-3 px-2" style={{ height: rem(height) }}>
          {[0.55, 0.8, 0.4, 0.95, 0.7, 0.5, 0.85].map((h, i) => (
            <span key={i} className="m-skeleton flex-1" style={{ height: `${h * 100}%` }} />
          ))}
          <span className="sr-only">A carregar o gráfico</span>
        </div>
      ) : isEmpty ? (
        (empty ?? (
          <EmptyState variant="inline" icon={<BarChart3 />} title="Sem dados neste período">
            Escolha outro período ou retire filtros.
          </EmptyState>
        ))
      ) : verTabela && table ? (
        <div className="max-h-[28rem] overflow-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-[0.9375rem]">
            <caption className="sr-only">{typeof title === "string" ? title : "Dados do gráfico"}</caption>
            <thead className="sticky top-0 bg-muted">
              <tr>
                {table.headers.map((h, i) => (
                  <th key={i} scope="col" className={cx("px-3 py-2 font-semibold", i === 0 ? "text-left" : "text-right")}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {table.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) =>
                    j === 0 ? (
                      <th key={j} scope="row" className="px-3 py-2 text-left font-medium">
                        {c}
                      </th>
                    ) : (
                      <td key={j} className="px-3 py-2 text-right m-num">
                        {c}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={cx("min-w-0 transition-opacity", refreshing && "opacity-60")} style={plotHeight === "fixed" ? { height: rem(height) } : undefined} aria-busy={refreshing || undefined}>
          {children}
        </div>
      )}
    </figure>
  );
}

// ─── Shared pieces ────────────────────────────────────────────────────────

const tick = (px: number) => ({ fill: "var(--grafico-texto)", fontSize: px });

function ChartTooltip({
  active,
  payload,
  label,
  format,
  formatCategory,
  shape,
}: Partial<TooltipContentProps> & {
  format?: FormatoValor | undefined;
  formatCategory?: ((v: unknown) => string) | undefined;
  shape: "rect" | "line";
}) {
  if (!active || !payload || payload.length === 0) return null;
  const titulo = formatCategory ? formatCategory(label) : String(label ?? "");
  return (
    <div className="m-float min-w-40 px-3 py-2.5 text-[0.9375rem]">
      {titulo && <p className="mb-1.5 text-sm text-muted-foreground">{titulo}</p>}
      <ul className="flex flex-col gap-1">
        {payload.map((p) => (
          <li key={String(p.dataKey ?? p.name)} className="flex items-center gap-2">
            <span
              aria-hidden
              className={cx("shrink-0", shape === "line" ? "h-[3px] w-3.5 rounded-full" : "size-2.5 rounded-[2px]")}
              style={{ background: (p.payload as { __cor?: string })?.__cor ?? p.color ?? p.stroke }}
            />
            <span className="font-semibold text-foreground m-num">{formatarValor(p.value as number, format)}</span>
            <span className="text-muted-foreground">{p.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface CartesianBase<T extends Linha> {
  title: ReactNode;
  description?: ReactNode | undefined;
  data: readonly T[];
  /** Key of the category (x) value in each row. */
  categoryKey: keyof T & string;
  series: SerieBase[];
  format?: FormatoValor | undefined;
  formatCategory?: ((v: unknown) => string) | undefined;
  /** Header of the first table column ("Mês", "Distrito"). */
  categoryLabel?: string | undefined;
  height?: number | undefined;
  actions?: ReactNode | undefined;
  loading?: boolean | undefined;
  refreshing?: boolean | undefined;
  empty?: ReactNode | undefined;
  bare?: boolean | undefined;
  level?: 2 | 3 | 4 | undefined;
  /** Override the generated screen-reader description. */
  summary?: string | undefined;
  className?: string | undefined;
}

function usePreparar<T extends Linha>(p: CartesianBase<T>, tipo: "barras" | "linhas" | "area") {
  const series = useMemo(() => atribuirCores(p.series), [p.series]);
  const tabela = useMemo(
    () =>
      tabelaDoGrafico(p.data, p.categoryKey, p.series, {
        formato: p.format,
        formatarCategoria: p.formatCategory,
        rotuloCategoria: p.categoryLabel,
      }),
    [p.data, p.categoryKey, p.series, p.format, p.formatCategory, p.categoryLabel],
  );
  const resumo = useMemo(
    () =>
      p.summary ??
      descreverGrafico(tipo, p.data, p.categoryKey, p.series, { formato: p.format, formatarCategoria: p.formatCategory }),
    [p.summary, tipo, p.data, p.categoryKey, p.series, p.format, p.formatCategory],
  );
  return { series, table: { headers: tabela.cabecalhos, rows: tabela.linhas }, resumo };
}

function frameProps<T extends Linha>(p: CartesianBase<T>, legend: LegendItem[] | undefined, table: ChartFrameProps["table"]) {
  return {
    title: p.title,
    description: p.description,
    actions: p.actions,
    legend,
    table,
    loading: p.loading,
    refreshing: p.refreshing,
    isEmpty: !p.loading && p.data.length === 0,
    empty: p.empty,
    height: p.height ?? 260,
    bare: p.bare,
    level: p.level,
    className: p.className,
  };
}

const tituloTexto = (t: ReactNode) => (typeof t === "string" ? t : undefined);

// ─── Bars ─────────────────────────────────────────────────────────────────

export interface GraficoBarrasProps<T extends Linha> extends CartesianBase<T> {
  /** "vertical" columns (time), "horizontal" bars (rankings, long names). */
  orientation?: "vertical" | "horizontal" | undefined;
  stacked?: boolean | undefined;
  /** Emphasis: this category keeps its colour, the others go grey. */
  highlight?: string | undefined;
  /** Value at the bar end. Default: on for single-series horizontal bars. */
  valueLabels?: boolean | undefined;
}

/**
 * Bars ≤ 24px thick with 4px rounded data ends, a hairline grid and one
 * baseline. Horizontal bars grow with the number of categories.
 */
export function GraficoBarras<T extends Linha>(props: GraficoBarrasProps<T>) {
  const { orientation = "vertical", stacked, highlight } = props;
  const reduzido = useMovimentoReduzido();
  const TICK = tick(useLetraEixo());
  const { series, table, resumo } = usePreparar(props, "barras");
  const horizontal = orientation === "horizontal";
  const labels = props.valueLabels ?? (horizontal && series.length === 1);
  const fc = props.formatCategory;
  const altura = horizontal ? Math.max(props.height ?? 0, props.data.length * 40 + 48) : props.height ?? 260;
  const legend = series.length > 1 ? series.map((s) => ({ label: s.label, color: s.cor, shape: "rect" as const })) : undefined;
  const dados = useMemo(
    () =>
      highlight === undefined
        ? props.data
        : props.data.map((d) => ({ ...d, __destaque: String(d[props.categoryKey]) === highlight })),
    [props.data, highlight, props.categoryKey],
  );
  const eixoValor = (
    <>
      {horizontal ? (
        <XAxis
          type="number"
          tick={TICK}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => formatarEixo(v, props.format)}
        />
      ) : (
        <YAxis
          type="number"
          width={larguraEixoValor(props.data, props.series.map((x) => x.key), props.format, TICK.fontSize, stacked)}
          tick={TICK}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => formatarEixo(v, props.format)}
        />
      )}
      {horizontal ? (
        <YAxis
          type="category"
          dataKey={props.categoryKey as string}
          width={larguraEixoCategoria(props.data, props.categoryKey, TICK.fontSize, fc)}
          tick={TICK}
          tickLine={false}
          axisLine={{ stroke: "var(--grafico-eixo)" }}
          tickFormatter={fc ? (v: unknown) => fc(v) : undefined}
          interval={0}
        />
      ) : (
        <XAxis
          dataKey={props.categoryKey as string}
          tick={TICK}
          tickLine={false}
          axisLine={{ stroke: "var(--grafico-eixo)" }}
          tickFormatter={fc ? (v: unknown) => fc(v) : undefined}
          minTickGap={8}
        />
      )}
    </>
  );
  return (
    <ChartFrame {...frameProps(props, legend, table)} height={altura}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={dados as Linha[]}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={{ top: 8, right: labels ? 56 : 8, bottom: 0, left: 0 }}
          barGap={2}
          barCategoryGap={horizontal ? "28%" : "24%"}
          accessibilityLayer
          title={tituloTexto(props.title)}
          desc={resumo}
        >
          <CartesianGrid
            stroke="var(--grafico-grelha)"
            vertical={horizontal}
            horizontal={!horizontal}
          />
          {eixoValor}
          <Tooltip
            cursor={{ fill: "var(--grafico-faixa)" }}
            isAnimationActive={false}
            content={(p) => <ChartTooltip {...p} format={props.format} formatCategory={fc} shape="rect" />}
          />
          {series.map((s, i) => {
            const topo = !stacked || i === series.length - 1;
            const r = topo ? 4 : 0;
            return (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                fill={s.cor}
                stackId={stacked ? "pilha" : undefined}
                maxBarSize={24}
                radius={horizontal ? [0, r, r, 0] : [r, r, 0, 0]}
                stroke={stacked ? "var(--card)" : undefined}
                strokeWidth={stacked ? 2 : 0}
                isAnimationActive={!reduzido}
                animationDuration={500}
              >
                {highlight !== undefined &&
                  (dados as Array<Linha & { __destaque?: boolean }>).map((d, j) => (
                    <Cell key={j} fill={d.__destaque ? s.cor : "var(--serie-outros)"} />
                  ))}
                {labels && topo && (
                  <LabelList
                    dataKey={s.key}
                    position={horizontal ? "right" : "top"}
                    offset={8}
                    formatter={(v: unknown) => formatarValor(v as number, props.format, true)}
                    style={{ fill: "var(--foreground)", fontSize: TICK.fontSize, fontWeight: 600 }}
                  />
                )}
              </Bar>
            );
          })}
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

// ─── Lines ────────────────────────────────────────────────────────────────

export interface GraficoLinhasProps<T extends Linha> extends CartesianBase<T> {
  /** Series drawn in grey (context), e.g. "Média nacional". */
  context?: string[] | undefined;
  /** Fixed y domain, e.g. [0, 1] for rates. Default starts at 0. */
  domain?: [number | "auto", number | "auto"] | undefined;
}

/** 2px lines, a crosshair tooltip listing every series, an end dot. */
export function GraficoLinhas<T extends Linha>(props: GraficoLinhasProps<T>) {
  const reduzido = useMovimentoReduzido();
  const TICK = tick(useLetraEixo());
  const { series, table, resumo } = usePreparar(props, "linhas");
  const fc = props.formatCategory;
  const ctx = new Set(props.context ?? []);
  const cor = (s: { key: string; cor: string }) => (ctx.has(s.key) ? "var(--serie-outros)" : s.cor);
  const legend =
    series.length > 1 ? series.map((s) => ({ label: s.label, color: cor(s), shape: "line" as const })) : undefined;
  const ultimo = props.data.length - 1;
  return (
    <ChartFrame {...frameProps(props, legend, table)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={props.data as Linha[]}
          margin={{ top: 12, right: 16, bottom: 0, left: 0 }}
          accessibilityLayer
          title={tituloTexto(props.title)}
          desc={resumo}
        >
          <CartesianGrid stroke="var(--grafico-grelha)" vertical={false} />
          <XAxis
            dataKey={props.categoryKey as string}
            tick={TICK}
            tickLine={false}
            axisLine={{ stroke: "var(--grafico-eixo)" }}
            tickFormatter={fc ? (v: unknown) => fc(v) : undefined}
            minTickGap={16}
            padding={{ left: 8, right: 8 }}
          />
          <YAxis
            width={larguraEixoValor(props.data, props.series.map((x) => x.key), props.format, TICK.fontSize)}
            tick={TICK}
            tickLine={false}
            axisLine={false}
            domain={props.domain ?? [0, "auto"]}
            tickFormatter={(v: number) => formatarEixo(v, props.format)}
          />
          <Tooltip
            cursor={{ stroke: "var(--grafico-cursor)", strokeWidth: 1 }}
            isAnimationActive={false}
            content={(p) => <ChartTooltip {...p} format={props.format} formatCategory={fc} shape="line" />}
          />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={cor(s)}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              connectNulls={false}
              dot={(d: { cx?: number; cy?: number; index?: number; key?: React.Key | null }) =>
                d.index === ultimo && d.cx !== undefined && d.cy !== undefined ? (
                  <circle key={d.key ?? undefined} cx={d.cx} cy={d.cy} r={4.5} fill={cor(s)} stroke="var(--card)" strokeWidth={2} />
                ) : (
                  <g key={d.key ?? undefined} />
                )
              }
              activeDot={{ r: 5, fill: cor(s), stroke: "var(--card)", strokeWidth: 2 }}
              isAnimationActive={!reduzido}
              animationDuration={600}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

// ─── Area ─────────────────────────────────────────────────────────────────

export interface GraficoAreaProps<T extends Linha> extends CartesianBase<T> {
  stacked?: boolean | undefined;
}

/** A single trend as a line with a soft wash; stacked for part-to-whole over time. */
export function GraficoArea<T extends Linha>(props: GraficoAreaProps<T>) {
  const reduzido = useMovimentoReduzido();
  const TICK = tick(useLetraEixo());
  const { series, table, resumo } = usePreparar(props, "area");
  const fc = props.formatCategory;
  const id = useId().replace(/:/g, "");
  const legend = series.length > 1 ? series.map((s) => ({ label: s.label, color: s.cor, shape: "rect" as const })) : undefined;
  return (
    <ChartFrame {...frameProps(props, legend, table)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={props.data as Linha[]}
          margin={{ top: 12, right: 16, bottom: 0, left: 0 }}
          accessibilityLayer
          title={tituloTexto(props.title)}
          desc={resumo}
        >
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`${id}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.cor} stopOpacity={props.stacked ? 0.35 : 0.18} />
                <stop offset="100%" stopColor={s.cor} stopOpacity={props.stacked ? 0.2 : 0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="var(--grafico-grelha)" vertical={false} />
          <XAxis
            dataKey={props.categoryKey as string}
            tick={TICK}
            tickLine={false}
            axisLine={{ stroke: "var(--grafico-eixo)" }}
            tickFormatter={fc ? (v: unknown) => fc(v) : undefined}
            minTickGap={16}
          />
          <YAxis
            width={larguraEixoValor(props.data, props.series.map((x) => x.key), props.format, TICK.fontSize, props.stacked)}
            tick={TICK}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatarEixo(v, props.format)}
          />
          <Tooltip
            cursor={{ stroke: "var(--grafico-cursor)", strokeWidth: 1 }}
            isAnimationActive={false}
            content={(p) => <ChartTooltip {...p} format={props.format} formatCategory={fc} shape="rect" />}
          />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stackId={props.stacked ? "pilha" : undefined}
              stroke={s.cor}
              strokeWidth={2}
              fill={`url(#${id}-${s.key})`}
              activeDot={{ r: 5, fill: s.cor, stroke: "var(--card)", strokeWidth: 2 }}
              isAnimationActive={!reduzido}
              animationDuration={600}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

// ─── Donut ────────────────────────────────────────────────────────────────

export interface GraficoDonutProps {
  title: ReactNode;
  description?: ReactNode | undefined;
  /** Parts of one whole. More than 5 are folded into "Outros". */
  data: Fatia[];
  format?: FormatoValor | undefined;
  /** Words under the total in the centre ("inscrições"). */
  totalLabel?: string | undefined;
  /** Max slices including "Outros" (≤ 5: the palette's all-pairs limit is 4 + grey). */
  maxSlices?: number | undefined;
  height?: number | undefined;
  actions?: ReactNode | undefined;
  loading?: boolean | undefined;
  empty?: ReactNode | undefined;
  bare?: boolean | undefined;
  level?: 2 | 3 | 4 | undefined;
  summary?: string | undefined;
  className?: string | undefined;
}

/**
 * Part-to-whole at a glance (≤ 5 slices). For comparing close values use
 * GraficoBarras — a donut hides small differences.
 */
export function GraficoDonut({
  title,
  description,
  data,
  format = "inteiro",
  totalLabel = "Total",
  maxSlices = 5,
  height = 240,
  actions,
  loading,
  empty,
  bare,
  level,
  summary,
  className,
}: GraficoDonutProps) {
  const reduzido = useMovimentoReduzido();
  const fatias = useMemo(() => {
    const agrupadas = agruparOutros(data, Math.min(maxSlices, 5));
    const comCor = atribuirCores(agrupadas.map((f, i) => ({ key: String(i), label: f.label, color: f.color })));
    return agrupadas.map((f, i) => ({ ...f, __cor: comCor[i]?.cor ?? corSerie("outros") }));
  }, [data, maxSlices]);
  const total = fatias.reduce((s, f) => s + f.value, 0);
  const pct = (v: number) => formatarPercentagem(total > 0 ? v / total : 0, { casas: 0 });
  const resumo =
    summary ??
    `Gráfico circular, total ${formatarValor(total, format)}: ` +
      fatias.map((f) => `${f.label} ${formatarValor(f.value, format)} (${pct(f.value)})`).join(", ") +
      ".";
  return (
    <ChartFrame
      title={title}
      description={description}
      actions={actions}
      table={{
        headers: ["Parte", "Valor", "Percentagem"],
        rows: fatias.map((f) => [f.label, formatarValor(f.value, format), pct(f.value)]),
      }}
      loading={loading}
      isEmpty={!loading && fatias.length === 0}
      empty={empty}
      height={height}
      plotHeight="auto"
      bare={bare}
      level={level}
      className={className}
    >
      <div className="grid grid-cols-1 items-center gap-x-6 gap-y-4 @lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="relative min-h-0" style={{ height: rem(height) }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart accessibilityLayer title={tituloTexto(title)} desc={resumo}>
              <Tooltip
                isAnimationActive={false}
                content={(p) => <ChartTooltip {...p} format={format} shape="rect" />}
              />
              <Pie
                data={fatias}
                dataKey="value"
                nameKey="label"
                innerRadius="64%"
                outerRadius="92%"
                paddingAngle={1.5}
                cornerRadius={4}
                stroke="var(--card)"
                strokeWidth={2}
                startAngle={90}
                endAngle={-270}
                isAnimationActive={!reduzido}
                animationDuration={600}
              >
                {fatias.map((f) => (
                  <Cell key={f.label} fill={f.__cor} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="text-2xl font-semibold tracking-tight">{formatarValor(total, format, true)}</div>
              <div className="text-sm text-muted-foreground">{totalLabel}</div>
            </div>
          </div>
        </div>
        <ul className="flex flex-col text-[0.9375rem]" aria-label="Legenda">
          {fatias.map((f) => (
            <li key={f.label} className="flex items-center gap-2.5 border-b border-border/60 py-2 last:border-0">
              <span aria-hidden className="size-3 shrink-0 rounded-[3px]" style={{ background: f.__cor }} />
              <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{f.label}</span>
              <span className="font-semibold m-num">{formatarValor(f.value, format)}</span>
              <span className="w-12 text-right text-muted-foreground m-num">{pct(f.value)}</span>
            </li>
          ))}
        </ul>
      </div>
    </ChartFrame>
  );
}
