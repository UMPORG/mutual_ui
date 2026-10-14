import type { ElementType, ReactNode } from "react";
import { AlertCircle, ArrowDownRight, ArrowRight, ArrowUpRight, Minus } from "lucide-react";
import { cx } from "./cx";
import { TONE_ICONS, type Tone } from "./feedback";
import { formatarPercentagem, formatarValor, paraNumero, type FormatoValor } from "./formatar";
import {
  avaliarVariacao,
  descreverVariacao,
  formatarVariacao,
  proporcoes,
  type FormatoVariacao,
  type Melhor,
} from "./dados";

/** Stat tiles, deltas, sparklines, meters and status summaries. Server-safe (no hooks). */

export interface DeltaProps {
  /** Change vs the reference: a fraction for "percentagem" (0.12 = +12%), points for "pontos", units for "numero"/"moeda". */
  value: number;
  label?: string | undefined;
  format?: FormatoVariacao | undefined;
  better?: Melhor | undefined;
  className?: string | undefined;
}

export function Delta({ value, label, format = "percentagem", better = "subir", className }: DeltaProps) {
  const { sentido, avaliacao } = avaliarVariacao(value, better);
  const Icon = sentido === "subiu" ? ArrowUpRight : sentido === "desceu" ? ArrowDownRight : Minus;
  const frase = descreverVariacao(value, format, label);
  return (
    <p className={cx("flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[0.9375rem]", className)} title={frase}>
      <span
        className={cx(
          "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold whitespace-nowrap",
          avaliacao === "positiva" && "bg-success-soft text-success-soft-foreground",
          avaliacao === "negativa" && "bg-destructive-soft text-destructive-soft-foreground",
          avaliacao === "neutra" && "bg-muted text-muted-foreground",
        )}
      >
        <Icon aria-hidden size={16} strokeWidth={2.5} className="shrink-0" />
        <span aria-hidden>{formatarVariacao(value, format)}</span>
        <span className="sr-only">{frase}</span>
      </span>
      {label && (
        <span aria-hidden className="text-muted-foreground">
          {label}
        </span>
      )}
    </p>
  );
}

/** Tiny trend line (no axes), pure SVG, server-safe. Decorative unless `label` is given. */
export function Sparkline({
  values,
  label,
  height = 36,
  className,
  area = true,
}: {
  values: ReadonlyArray<number | null | undefined>;
  label?: string | undefined;
  height?: number | undefined;
  className?: string | undefined;
  area?: boolean | undefined;
}) {
  const pts = values.map((v) => paraNumero(v ?? null));
  const nums = pts.filter((v): v is number => v !== null);
  if (nums.length < 2) return null;
  const W = 120;
  const pad = 4;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || 1;
  const x = (i: number) => (pts.length === 1 ? W / 2 : (i / (pts.length - 1)) * W);
  const y = (v: number) => pad + (1 - (v - min) / span) * (height - pad * 2);
  let d = "";
  let pen = false;
  pts.forEach((v, i) => {
    if (v === null) {
      pen = false;
      return;
    }
    d += `${pen ? "L" : "M"}${x(i).toFixed(2)} ${y(v).toFixed(2)} `;
    pen = true;
  });
  let lastIdx = pts.length - 1;
  while (lastIdx >= 0 && pts[lastIdx] === null) lastIdx--;
  const firstIdx = pts.findIndex((v) => v !== null);
  const last = pts[lastIdx] as number;
  const areaD = `${d}L${x(lastIdx).toFixed(2)} ${height} L${x(firstIdx).toFixed(2)} ${height} Z`;
  return (
    <svg
      viewBox={`-5 0 ${W + 10} ${height}`}
      preserveAspectRatio="none"
      height={height}
      className={cx("block w-full overflow-visible", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {area && <path d={areaD} fill="var(--serie-1)" opacity={0.08} stroke="none" />}
      <path
        d={d}
        fill="none"
        stroke="var(--serie-outros)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* Dot as a zero-length round-capped line so the viewBox stretch keeps it round. */}
      <path
        d={`M${x(lastIdx)} ${y(last)} l0.001 0`}
        stroke="var(--card)"
        strokeWidth={12}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={`M${x(lastIdx)} ${y(last)} l0.001 0`}
        stroke="var(--serie-1)"
        strokeWidth={8}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export interface StatCardProps {
  label: ReactNode;
  value: number | string | null | undefined;
  format?: FormatoValor | undefined;
  /** Shorten large values ("12,3 mil"). Default true for numbers ≥ 100 000. */
  compact?: boolean | undefined;
  unit?: ReactNode | undefined;
  delta?: DeltaProps | undefined;
  /** History for a sparkline (oldest first; the last is the current value). */
  trend?: ReadonlyArray<number | null | undefined> | undefined;
  description?: ReactNode | undefined;
  icon?: ReactNode | undefined;
  href?: string | undefined;
  LinkComponent?: ElementType | undefined;
  accent?: boolean | undefined;
  /** "hero": the one number a dashboard leads with (≥ 48px). One per page. */
  size?: "md" | "hero" | undefined;
  loading?: boolean | undefined;
  error?: ReactNode | undefined;
  className?: string | undefined;
}

export function StatCard({
  label,
  value,
  format = "numero",
  compact,
  unit,
  delta,
  trend,
  description,
  icon,
  href,
  LinkComponent = "a",
  accent,
  size = "md",
  loading,
  error,
  className,
}: StatCardProps) {
  const n = typeof value === "string" ? null : paraNumero(value);
  const hero = size === "hero";
  // Tiles shorten from 100 000 up; the hero number stays exact up to 10 million.
  const compacto = compact ?? (n !== null && Math.abs(n) >= (hero ? 10_000_000 : 100_000));
  const texto = typeof value === "string" ? value : formatarValor(value, format, compacto);
  const completo = n !== null && compacto ? formatarValor(n, format, false) : undefined;

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 text-[0.9375rem] leading-snug font-medium text-muted-foreground">{label}</p>
        {icon && (
          <span
            aria-hidden
            className="grid size-9 shrink-0 place-items-center rounded-lg bg-app-accent-soft text-app-accent [&_svg]:size-[1.125rem]"
          >
            {icon}
          </span>
        )}
      </div>
      {loading ? (
        <div className="flex flex-col gap-2 pt-1" aria-hidden>
          <span className={cx("m-skeleton", hero ? "h-12 w-40" : "h-9 w-28")} />
          <span className="m-skeleton h-4 w-36" />
        </div>
      ) : error ? (
        <p className="flex items-center gap-2 text-base font-medium text-destructive-soft-foreground">
          <AlertCircle aria-hidden size={18} className="shrink-0" />
          {error}
        </p>
      ) : (
        <>
          <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
            <span
              className={cx(
                "font-semibold tracking-tight text-foreground",
                hero ? "text-[3rem] leading-[1.05]" : "text-[2rem] leading-tight",
              )}
              title={completo}
            >
              {texto}
            </span>
            {completo && <span className="sr-only">({completo})</span>}
            {unit && <span className="text-base font-medium text-muted-foreground">{unit}</span>}
          </p>
          {(delta || description) && (
            <div className="flex flex-col gap-1">
              {delta && <Delta {...delta} />}
              {description && <p className="text-[0.9375rem] text-muted-foreground">{description}</p>}
            </div>
          )}
        </>
      )}
      {trend && !loading && !error && (
        <div className="mt-auto pt-2">
          <Sparkline values={trend} />
        </div>
      )}
      {href && !loading && (
        <span className="m-cta mt-auto inline-flex items-center gap-1 pt-1 text-[0.9375rem] font-medium text-primary">
          Ver detalhe
          <ArrowRight aria-hidden size={16} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      )}
    </>
  );

  const classes = cx(
    "group relative flex min-w-0 flex-col gap-2 p-5 m-surface",
    hero && "gap-3 p-6",
    accent &&
      "overflow-hidden before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-app-accent",
    href && "m-surface-interactive no-underline text-inherit",
    className,
  );

  if (href) {
    const Link = LinkComponent;
    return (
      <Link href={href} className={classes} aria-busy={loading || undefined}>
        {body}
      </Link>
    );
  }
  return (
    <div className={classes} aria-busy={loading || undefined}>
      {body}
    </div>
  );
}

/** Responsive KPI grid; columns shrink with text size and on phones, never a horizontal scroll. */
export function StatGroup({
  children,
  min = "13rem",
  className,
  label,
}: {
  children: ReactNode;
  min?: string | undefined;
  className?: string | undefined;
  label?: string | undefined;
}) {
  return (
    <div
      role={label ? "group" : undefined}
      aria-label={label}
      className={cx("grid gap-4", className)}
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${min}), 1fr))` }}
    >
      {children}
    </div>
  );
}

type MeterTone = "brand" | "accent" | "success" | "warning" | "danger";

const METER_FILL: Record<MeterTone, string> = {
  brand: "var(--brand)",
  accent: "var(--app-accent)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--destructive)",
};

/** A ratio against a limit; with `thresholds` the fill turns warning/danger with icon + words. */
export function Meter({
  label,
  value,
  max = 1,
  format = "percentagem",
  detail,
  tone = "brand",
  thresholds,
  statusLabel,
  size = "md",
  className,
}: {
  label: ReactNode;
  value: number;
  max?: number | undefined;
  /** How the headline value is shown; "percentagem" shows value/max. */
  format?: FormatoValor | undefined;
  detail?: ReactNode | undefined;
  tone?: MeterTone | undefined;
  /** Ratios (0–1) at which the fill turns warning / danger. */
  thresholds?: { warning?: number | undefined; danger?: number | undefined } | undefined;
  statusLabel?: ReactNode | undefined;
  size?: "sm" | "md" | undefined;
  className?: string | undefined;
}) {
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  let t: MeterTone = tone;
  if (thresholds?.danger !== undefined && ratio >= thresholds.danger) t = "danger";
  else if (thresholds?.warning !== undefined && ratio >= thresholds.warning) t = "warning";
  const valor = format === "percentagem" ? formatarPercentagem(max > 0 ? value / max : null, { casas: 0 }) : formatarValor(value, format);
  const Icon = t === "danger" ? TONE_ICONS.danger : t === "warning" ? TONE_ICONS.warning : null;
  const fill = METER_FILL[t];
  return (
    <div className={cx("flex min-w-0 flex-col gap-1.5", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <span className="text-[0.9375rem] font-medium">{label}</span>
        <span className="flex items-baseline gap-2 text-[0.9375rem]">
          {Icon && (
            <span
              className={cx(
                "inline-flex items-center gap-1 self-center font-medium",
                t === "danger" ? "text-destructive-soft-foreground" : "text-warning-soft-foreground",
              )}
            >
              <Icon aria-hidden size={16} />
              {statusLabel}
            </span>
          )}
          <span className="font-semibold">{valor}</span>
          {detail && <span className="text-muted-foreground">{detail}</span>}
        </span>
      </div>
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${valor}${typeof detail === "string" ? `, ${detail}` : ""}`}
        aria-label={typeof label === "string" ? label : undefined}
        className={cx("relative w-full overflow-hidden rounded-full", size === "sm" ? "h-1.5" : "h-2.5")}
        style={{ background: `color-mix(in oklab, ${fill} 16%, var(--card))` }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out forced-colors:bg-[Highlight]"
          style={{ width: `${ratio * 100}%`, background: fill }}
        />
      </div>
    </div>
  );
}

export interface StatusItem {
  label: string;
  value: number;
  tone: Tone;
  href?: string | undefined;
  onSelect?: (() => void) | undefined;
  selected?: boolean | undefined;
}

const TONE_FILL: Record<Tone, string> = {
  success: "var(--success)",
  warning: "var(--warning)",
  info: "var(--info)",
  danger: "var(--destructive)",
  neutral: "var(--serie-outros)",
};

const TONE_TEXT: Record<Tone, string> = {
  success: "text-success-soft-foreground",
  warning: "text-warning-soft-foreground",
  info: "text-info-soft-foreground",
  danger: "text-destructive-soft-foreground",
  neutral: "text-muted-foreground",
};

/** Counts by estado with status colours, icon and words. `bar`: proportion bar + legend; `inline`: one line above a list whose items can filter it. */
export function StatusSummary({
  items,
  total,
  totalLabel = "Total",
  variant = "bar",
  LinkComponent = "a",
  label,
  className,
}: {
  items: StatusItem[];
  total?: number | undefined;
  totalLabel?: string | undefined;
  variant?: "bar" | "inline" | undefined;
  LinkComponent?: ElementType | undefined;
  label?: string | undefined;
  className?: string | undefined;
}) {
  const soma = total ?? items.reduce((s, i) => s + (i.value > 0 ? i.value : 0), 0);
  const partes = proporcoes(items.map((i) => i.value));
  const Link = LinkComponent;

  const conteudo = (it: StatusItem, i: number, inline: boolean) => {
    const Icon = TONE_ICONS[it.tone];
    const inner = (
      <>
        <Icon aria-hidden size={inline ? 16 : 18} className={cx("shrink-0", TONE_TEXT[it.tone])} />
        <span className={cx("min-w-0", inline ? "" : "flex-1")}>{it.label}</span>
        <span className="font-semibold text-foreground m-num">{formatarValor(it.value, "inteiro")}</span>
        {!inline && (
          <span className="w-14 text-right text-muted-foreground m-num">
            {formatarPercentagem(partes[i] ?? 0, { casas: 0 })}
          </span>
        )}
      </>
    );
    const base = cx(
      "flex items-center gap-2 rounded-lg text-[0.9375rem]",
      inline ? "min-h-11 border px-3" : "min-h-11 px-2 -mx-2",
      inline && (it.selected ? "border-foreground/60 bg-accent font-medium" : "border-border bg-card"),
    );
    if (it.href)
      return (
        <Link href={it.href} className={cx(base, "no-underline text-inherit hover:bg-accent")}>
          {inner}
        </Link>
      );
    if (it.onSelect)
      return (
        <button type="button" onClick={it.onSelect} aria-pressed={it.selected ?? false} className={cx(base, "text-left hover:bg-accent")}>
          {inner}
        </button>
      );
    return <div className={base}>{inner}</div>;
  };

  if (variant === "inline") {
    return (
      <div role="group" aria-label={label} className={cx("flex flex-wrap items-center gap-2", className)}>
        <span className="mr-1 text-[0.9375rem] text-muted-foreground">
          {totalLabel}: <span className="font-semibold text-foreground m-num">{formatarValor(soma, "inteiro")}</span>
        </span>
        {items.map((it, i) => (
          <div key={it.label}>{conteudo(it, i, true)}</div>
        ))}
      </div>
    );
  }

  return (
    <div role="group" aria-label={label} className={cx("flex min-w-0 flex-col gap-3", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[0.9375rem] text-muted-foreground">{totalLabel}</span>
        <span className="text-xl font-semibold">{formatarValor(soma, "inteiro")}</span>
      </div>
      <div aria-hidden className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-muted">
        {items.map((it, i) =>
          (partes[i] ?? 0) > 0 ? (
            <span
              key={it.label}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{ flexGrow: partes[i], flexBasis: 0, background: TONE_FILL[it.tone], minWidth: 4 }}
            />
          ) : null,
        )}
      </div>
      <ul className="flex flex-col">
        {items.map((it, i) => (
          <li key={it.label}>{conteudo(it, i, false)}</li>
        ))}
      </ul>
    </div>
  );
}
