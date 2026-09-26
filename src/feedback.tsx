import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cx } from "./cx";

export type Tone = "success" | "warning" | "info" | "danger" | "neutral";

/** Soft background + border + text for a tone (callouts, badges, chips). */
export const TONE_CLASSES: Record<Tone, string> = {
  success: "border-success/30 bg-success-soft text-success-soft-foreground",
  warning: "border-warning/30 bg-warning-soft text-warning-soft-foreground",
  info: "border-info/30 bg-info-soft text-info-soft-foreground",
  danger: "border-destructive/30 bg-destructive-soft text-destructive-soft-foreground",
  neutral: "border-border bg-muted text-foreground",
};

/** The icon that goes with each tone — status is never colour alone. */
export const TONE_ICONS = { success: CheckCircle2, warning: AlertTriangle, info: Info, danger: XCircle, neutral: Info } as const;

/**
 * Persistent, in-page message. Status is always icon + words, never colour
 * alone. Use it for anything the user must not miss (a toast disappears).
 */
export function StatusCallout({
  tone = "info",
  title,
  children,
  action,
  className,
  role,
}: {
  tone?: Tone | undefined;
  title?: ReactNode | undefined;
  children?: ReactNode | undefined;
  action?: ReactNode | undefined;
  className?: string | undefined;
  /** "alert" for errors raised by the user's own action; default "status". */
  role?: "status" | "alert" | undefined;
}) {
  const Icon = TONE_ICONS[tone];
  return (
    <div
      role={role ?? (tone === "danger" ? "alert" : "status")}
      className={cx("flex gap-3 rounded-lg border p-4 text-base", TONE_CLASSES[tone], className)}
    >
      <Icon size={22} aria-hidden className="mt-0.5 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="leading-relaxed">{children}</div>}
        {action && <div className="mt-2 flex flex-wrap gap-2">{action}</div>}
      </div>
    </div>
  );
}

/** Status pill: icon-less, but always with words. */
export function StatusBadge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-sm font-medium whitespace-nowrap",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * "Nothing here yet" / "No results". `variant="inline"` drops the dashed box
 * for use inside a Card, a DataTable or a chart frame.
 */
export function EmptyState({
  icon,
  title,
  children,
  action,
  className,
  variant = "page",
}: {
  icon?: ReactNode | undefined;
  title: ReactNode;
  children?: ReactNode | undefined;
  action?: ReactNode | undefined;
  className?: string | undefined;
  variant?: "page" | "inline" | undefined;
}) {
  return (
    <div
      className={cx(
        "flex flex-col items-center gap-3 text-center",
        variant === "page"
          ? "rounded-xl border border-dashed border-border bg-card px-6 py-12"
          : "px-4 py-10",
        className,
      )}
    >
      {icon && (
        <div
          className={cx(
            "text-muted-foreground",
            "grid place-items-center rounded-full bg-muted",
            variant === "page" ? "mb-1 size-16 [&_svg]:size-8" : "size-12 [&_svg]:size-6",
          )}
        >
          {icon}
        </div>
      )}
      <p className="text-lg font-semibold">{title}</p>
      {children && <div className="max-w-prose text-base text-muted-foreground">{children}</div>}
      {action && <div className="mt-2 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
