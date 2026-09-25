import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cx } from "./cx";

export type Tone = "success" | "warning" | "info" | "danger" | "neutral";

const TONE_CLASSES: Record<Tone, string> = {
  success: "border-success/30 bg-success-soft text-success-soft-foreground",
  warning: "border-warning/30 bg-warning-soft text-warning-soft-foreground",
  info: "border-info/30 bg-info-soft text-info-soft-foreground",
  danger: "border-destructive/30 bg-destructive-soft text-destructive-soft-foreground",
  neutral: "border-border bg-muted text-foreground",
};

const TONE_ICONS = { success: CheckCircle2, warning: AlertTriangle, info: Info, danger: XCircle, neutral: Info };

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
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
  /** "alert" for errors raised by the user's own action; default "status". */
  role?: "status" | "alert";
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

export function EmptyState({
  icon,
  title,
  children,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center",
        className,
      )}
    >
      {icon && <div className="text-muted-foreground [&_svg]:size-10">{icon}</div>}
      <p className="text-lg font-semibold">{title}</p>
      {children && <div className="max-w-prose text-base text-muted-foreground">{children}</div>}
      {action && <div className="mt-2 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
