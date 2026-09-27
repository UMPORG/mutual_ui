import type { ButtonHTMLAttributes, ElementType, ReactNode, Ref } from "react";
import { Check, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { cx } from "./cx";

/**
 * Small, server-safe building blocks (v0.7): Button, Kbd, Badge, Tag,
 * Separator, Spinner, Breadcrumbs, Stepper. No hooks, no Base UI — safe in
 * server components and in the main entry.
 */

// ─── Button ───────────────────────────────────────────────────────────────

export type ButtonVariant = "primary" | "outline" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTE: Record<ButtonVariant, string> = {
  primary: "m-btn-primary",
  outline: "m-btn-outline",
  secondary: "m-btn-secondary",
  ghost: "m-btn-ghost",
  destructive: "m-btn-destructive",
};
const TAMANHO: Record<ButtonSize, string> = {
  sm: "h-9 min-w-9 gap-1.5 text-[0.9375rem] [&_svg]:size-4 [&_svg]:shrink-0",
  md: "h-11 min-w-11 gap-2 text-base [&_svg]:size-[1.125rem] [&_svg]:shrink-0",
  lg: "h-12 min-w-12 gap-2 text-base [&_svg]:size-5 [&_svg]:shrink-0",
};
const PADDING: Record<ButtonSize, string> = { sm: "px-3", md: "px-4", lg: "px-5" };
const SO_ICONE: Record<ButtonSize, string> = { sm: "w-9", md: "w-11", lg: "w-12" };

/**
 * Class names of the shared button look, for links and for the app's own
 * button components: `<Link className={buttonClasses({ variant: "outline" })}>`.
 */
export function buttonClasses({
  variant = "primary",
  size = "md",
  iconOnly = false,
  className,
}: { variant?: ButtonVariant | undefined; size?: ButtonSize | undefined; iconOnly?: boolean | undefined; className?: string | undefined } = {}): string {
  return cx(
    "m-btn inline-flex shrink-0 items-center justify-center rounded-lg whitespace-nowrap select-none",
    "disabled:pointer-events-none disabled:opacity-55 aria-disabled:pointer-events-none aria-disabled:opacity-55",
    VARIANTE[variant],
    TAMANHO[size],
    iconOnly ? SO_ICONE[size] : PADDING[size],
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant | undefined;
  size?: ButtonSize | undefined;
  /** Square button with only an icon — give it an `aria-label`. */
  iconOnly?: boolean | undefined;
  /** Shows a spinner, keeps the label, and blocks repeated presses. */
  pending?: boolean | undefined;
  ref?: Ref<HTMLButtonElement> | undefined;
}

/** The MUTU@L button (the `m-btn` look). `type="button"` unless told otherwise. */
export function Button({
  variant = "primary",
  size = "md",
  iconOnly,
  pending,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={buttonClasses({ variant, size, iconOnly, className })}
      {...props}
    >
      {pending && <Loader2 aria-hidden className="m-spinner" />}
      {children}
    </button>
  );
}

// ─── Kbd ──────────────────────────────────────────────────────────────────

/**
 * A key as printed on the keyboard: `<Kbd>Enter</Kbd>`, `<Kbd keys={["Shift", "Enter"]} />`.
 * Use it in help text only; the apps have no single-key shortcuts (WCAG 2.1.4).
 */
export function Kbd({ children, keys, className }: { children?: ReactNode | undefined; keys?: string[] | undefined; className?: string | undefined }) {
  if (keys?.length) {
    return (
      <span className={cx("inline-flex items-center gap-1 align-baseline", className)}>
        {keys.map((k, i) => (
          <span key={`${k}-${i}`} className="inline-flex items-center gap-1">
            {i > 0 && <span aria-hidden className="text-muted-foreground">+</span>}
            <kbd className="m-kbd">{k}</kbd>
          </span>
        ))}
      </span>
    );
  }
  return <kbd className={cx("m-kbd", className)}>{children}</kbd>;
}

// ─── Badge and Tag ────────────────────────────────────────────────────────

export type BadgeVariant = "neutral" | "brand" | "app" | "outline" | "solid";

const BADGE: Record<BadgeVariant, string> = {
  neutral: "border-transparent bg-secondary text-secondary-foreground",
  brand: "border-transparent bg-brand-soft text-brand-soft-foreground",
  app: "border-app-accent/25 bg-app-accent-soft text-foreground",
  outline: "border-border bg-transparent text-foreground",
  solid: "border-transparent bg-brand text-brand-foreground",
};

/**
 * A label for a category, a count or "Novo". Not for status (use
 * `StatusBadge`, which carries the status tones and words).
 */
export function Badge({
  variant = "neutral",
  size = "md",
  icon,
  children,
  className,
}: {
  variant?: BadgeVariant | undefined;
  size?: "sm" | "md" | undefined;
  icon?: ReactNode | undefined;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <span
      className={cx(
        "inline-flex max-w-full items-center gap-1 rounded-full border font-medium whitespace-nowrap",
        size === "sm" ? "px-2 py-px text-[0.8125rem]" : "px-2.5 py-0.5 text-sm",
        "[&_svg]:size-3.5 [&_svg]:shrink-0",
        BADGE[variant],
        className,
      )}
    >
      {icon}
      <span className="truncate">{children}</span>
    </span>
  );
}

/**
 * A removable value (a chosen option, a keyword). The remove button is a real
 * button with a spoken name ("Remover Braga").
 */
export function Tag({
  children,
  onRemove,
  removeLabel,
  icon,
  className,
}: {
  children: ReactNode;
  onRemove?: (() => void) | undefined;
  /** Spoken name of the remove button; default "Remover <texto>". */
  removeLabel?: string | undefined;
  icon?: ReactNode | undefined;
  className?: string | undefined;
}) {
  return (
    <span
      className={cx(
        "inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-secondary py-0.5 text-[0.9375rem] text-secondary-foreground",
        onRemove ? "pr-0.5 pl-2" : "px-2",
        "[&>svg]:size-4 [&>svg]:shrink-0",
        className,
      )}
    >
      {icon}
      <span className="truncate">{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel ?? `Remover ${typeof children === "string" ? children : ""}`.trim()}
          // 28px visual, 44px hit area (the ::after extends 8px on every side).
          className="relative grid size-7 shrink-0 place-items-center rounded text-muted-foreground after:absolute after:-inset-2 after:rounded-md hover:bg-foreground/10 hover:text-foreground"
        >
          <X aria-hidden size={16} />
        </button>
      )}
    </span>
  );
}

// ─── Separator ────────────────────────────────────────────────────────────

/** A hairline. Decorative by default; `decorative={false}` for a real section break. */
export function Separator({
  orientation = "horizontal",
  decorative = true,
  label,
  className,
}: {
  orientation?: "horizontal" | "vertical" | undefined;
  decorative?: boolean | undefined;
  /** Text in the middle ("ou"). */
  label?: ReactNode | undefined;
  className?: string | undefined;
}) {
  const a11y = decorative ? { "aria-hidden": true } : { role: "separator", "aria-orientation": orientation };
  if (label) {
    return (
      <div {...a11y} className={cx("flex items-center gap-3 text-sm text-muted-foreground", className)}>
        <span className="h-px flex-1 bg-border" />
        {label}
        <span className="h-px flex-1 bg-border" />
      </div>
    );
  }
  return (
    <div
      {...a11y}
      className={cx("shrink-0 bg-border", orientation === "horizontal" ? "h-px w-full" : "w-px self-stretch", className)}
    />
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────

/**
 * Working indicator for a short wait inside a control or a small area. For
 * whole lists and cards prefer `Skeleton` (keeps the layout). With `label`
 * it is announced once ("A carregar…").
 */
export function Spinner({ size = 20, label, className }: { size?: number | undefined; label?: string | undefined; className?: string | undefined }) {
  return (
    <span role={label ? "status" : undefined} className={cx("inline-flex items-center gap-2 text-muted-foreground", className)}>
      <Loader2 aria-hidden size={size} className="m-spinner shrink-0" />
      {label && <span className="text-[0.9375rem]">{label}</span>}
    </span>
  );
}

// ─── Breadcrumbs ──────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  label: string;
  href?: string | undefined;
}

/**
 * Where the page sits. On phones only the way back is shown ("‹ Associações");
 * from 40rem the full trail. Long trails fold the middle into "…".
 * `PageHeader` already renders these for page headers.
 */
export function Breadcrumbs({
  items,
  LinkComponent = "a",
  maxItems = 4,
  className,
}: {
  items: BreadcrumbItem[];
  LinkComponent?: ElementType | undefined;
  /** Beyond this many, the middle items fold into "…". */
  maxItems?: number | undefined;
  className?: string | undefined;
}) {
  const Link = LinkComponent;
  if (!items.length) return null;
  const pai = [...items.slice(0, -1)].reverse().find((i) => i.href);
  let visiveis: Array<BreadcrumbItem | "…"> = items;
  if (items.length > maxItems) visiveis = [items[0]!, "…", ...items.slice(items.length - (maxItems - 2))];
  return (
    <nav aria-label="Localização" className={className}>
      {pai?.href && (
        <Link
          href={pai.href}
          className="inline-flex min-h-11 items-center gap-1 rounded-sm text-[0.9375rem] font-medium text-muted-foreground hover:text-foreground sm:hidden"
        >
          <ChevronLeft aria-hidden size={18} />
          {pai.label}
        </Link>
      )}
      <ol className={cx("flex-wrap items-center gap-1 text-[0.9375rem] text-muted-foreground", pai?.href ? "hidden sm:flex" : "flex")}>
        {visiveis.map((c, i) => {
          const ultimo = i === visiveis.length - 1;
          return (
            <li key={c === "…" ? `r-${i}` : `${c.label}-${i}`} className="inline-flex min-w-0 items-center gap-1">
              {c === "…" ? (
                <span aria-label="Níveis intermédios omitidos">…</span>
              ) : c.href && !ultimo ? (
                <Link href={c.href} className="truncate rounded-sm underline-offset-4 hover:text-foreground hover:underline">
                  {c.label}
                </Link>
              ) : (
                <span aria-current={ultimo ? "page" : undefined} className={cx("truncate", ultimo && "text-foreground")}>
                  {c.label}
                </span>
              )}
              {!ultimo && <ChevronRight size={16} aria-hidden className="shrink-0" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────

export interface StepperStep {
  label: string;
  description?: string | undefined;
  /** Link back to a completed step (wizards that allow revisiting). */
  href?: string | undefined;
  /** Error on this step (e.g. after submitting). */
  error?: boolean | undefined;
}

/**
 * Wizard steps: done (check), current, to do. The current step is
 * `aria-current="step"`, and every step says its state in words. Below 40rem
 * the horizontal stepper collapses to "Passo 2 de 5 · Morada" with a bar.
 * The wizard's state (current step, validation) stays in the app.
 */
export function Stepper({
  steps,
  current,
  orientation = "horizontal",
  LinkComponent = "a",
  onStepClick,
  className,
}: {
  steps: StepperStep[];
  /** Index of the current step (0-based). */
  current: number;
  orientation?: "horizontal" | "vertical" | undefined;
  LinkComponent?: ElementType | undefined;
  /** Makes completed steps buttons (client components). */
  onStepClick?: ((index: number) => void) | undefined;
  className?: string | undefined;
}) {
  const Link = LinkComponent;
  const total = steps.length;
  const atual = steps[current];
  const vertical = orientation === "vertical";

  const marcador = (i: number, s: StepperStep) => {
    const feito = i < current;
    const agora = i === current;
    return (
      <span
        aria-hidden
        className={cx(
          "grid size-8 shrink-0 place-items-center rounded-full border-2 text-sm font-semibold tabular-nums transition-colors",
          s.error
            ? "border-destructive bg-destructive-soft text-destructive-soft-foreground"
            : feito
              ? "border-brand bg-brand text-brand-foreground"
              : agora
                ? "border-brand bg-card text-brand shadow-[0_0_0_4px_color-mix(in_oklab,var(--brand)_18%,transparent)]"
                : "border-border bg-card text-muted-foreground",
        )}
      >
        {feito && !s.error ? <Check size={16} strokeWidth={3} /> : s.error ? "!" : i + 1}
      </span>
    );
  };

  const estado = (i: number, s: StepperStep) =>
    s.error ? "com erro" : i < current ? "concluído" : i === current ? "passo atual" : "por fazer";

  return (
    <nav aria-label="Passos" className={className}>
      {!vertical && atual && (
        <div className="flex flex-col gap-2 sm:hidden">
          <p className="flex flex-wrap items-baseline gap-x-2 text-base">
            <span className="text-muted-foreground">
              Passo {current + 1} de {total}
            </span>
            <span className="font-semibold">{atual.label}</span>
          </p>
          <div aria-hidden className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-brand" style={{ width: `${((current + 1) / total) * 100}%` }} />
          </div>
        </div>
      )}
      <ol className={cx(vertical ? "flex flex-col" : "hidden items-start sm:flex")}>
        {steps.map((s, i) => {
          const conteudo = (
            <>
              {marcador(i, s)}
              <span className={cx("flex min-w-0 flex-col", vertical ? "pt-1" : "items-center text-center")}>
                <span className={cx("text-[0.9375rem] leading-snug", i === current ? "font-semibold text-foreground" : "text-muted-foreground")}>
                  {s.label}
                </span>
                {s.description && <span className="text-sm text-muted-foreground">{s.description}</span>}
                <span className="sr-only">({estado(i, s)})</span>
              </span>
            </>
          );
          const clicavel = i < current && (s.href || onStepClick);
          const classeItem = cx(
            "group flex gap-3 rounded-lg",
            vertical ? "items-start" : "flex-col items-center",
            clicavel && "hover:[&>span:first-child]:shadow-[0_0_0_4px_color-mix(in_oklab,var(--brand)_18%,transparent)]",
          );
          return (
            <li
              key={`${s.label}-${i}`}
              aria-current={i === current ? "step" : undefined}
              className={cx("relative flex", vertical ? "gap-3 pb-6 last:pb-0" : "min-w-0 flex-1 justify-center")}
            >
              {i < total - 1 &&
                (vertical ? (
                  <span aria-hidden data-feito={i < current || undefined} className="m-passo-linha absolute top-9 bottom-1 left-[15px] w-0.5 rounded-full" />
                ) : (
                  <span
                    aria-hidden
                    data-feito={i < current || undefined}
                    className="m-passo-linha absolute top-[15px] right-[calc(-50%+1.5rem)] left-[calc(50%+1.5rem)] h-0.5 rounded-full"
                  />
                ))}
              {clicavel && s.href ? (
                <Link href={s.href} className={classeItem}>
                  {conteudo}
                </Link>
              ) : clicavel && onStepClick ? (
                <button type="button" onClick={() => onStepClick(i)} className={cx(classeItem, "text-left")}>
                  {conteudo}
                </button>
              ) : (
                <div className={classeItem}>{conteudo}</div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
