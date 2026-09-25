import type { ComponentType, CSSProperties, SVGProps } from "react";
import { Building2, CalendarDays, CreditCard, Landmark, LayoutGrid, QrCode, Stethoscope } from "lucide-react";
import { getMutualApp, type MutualAppId } from "./apps";
import { MUTUAL_FLAG_DATA_URI, MUTUAL_FLAG_RATIO } from "./logo-data";
import { cx } from "./cx";

type Icon = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }>;

export const APP_ICONS: Record<MutualAppId, Icon> = {
  portal: LayoutGrid,
  backoffice: Building2,
  eventos: CalendarDays,
  simplex: Landmark,
  saude: Stethoscope,
  qr: QrCode,
  cartao: CreditCard,
};

/** The MUTU@L flag. Decorative by default (the wordmark carries the name). */
export function MutualFlag({ height = 24, className, title }: { height?: number; className?: string; title?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- inline data URI, no optimisation needed
    <img
      src={MUTUAL_FLAG_DATA_URI}
      width={Math.round(height * MUTUAL_FLAG_RATIO)}
      height={height}
      alt={title ?? ""}
      aria-hidden={title ? undefined : true}
      className={cx("inline-block shrink-0 select-none", className)}
      draggable={false}
    />
  );
}

/**
 * Brand lock-up: flag + "MUTU@L" + the app name. The app name is what tells
 * the user where they are, so it is always shown in full.
 *
 * tone="ink" for the dark sidebar/header, "default" on light surfaces.
 */
export function MutualWordmark({
  app,
  tone = "default",
  size = "md",
  className,
}: {
  app?: MutualAppId;
  tone?: "default" | "ink";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const nome = app && app !== "portal" ? getMutualApp(app)?.nome : app === "portal" ? "Portal" : undefined;
  const flag = size === "lg" ? 34 : size === "sm" ? 20 : 26;
  const text = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";
  return (
    <span className={cx("inline-flex items-center gap-2.5 leading-none", className)}>
      <MutualFlag height={flag} />
      <span className="flex flex-col gap-1">
        <span
          className={cx(
            text,
            "font-bold tracking-tight",
            tone === "ink" ? "text-sidebar-foreground" : "text-foreground",
          )}
        >
          MUTU@L
        </span>
        {nome && (
          <span
            className={cx(
              "text-[0.875rem] font-semibold tracking-wide",
              tone === "ink" ? "text-app-accent-on-ink" : "text-app-accent",
            )}
          >
            {nome}
          </span>
        )}
      </span>
    </span>
  );
}

/** Square app icon in the app's accent colour (Portal tiles, switcher). */
export function AppMark({ app, size = 40, className }: { app: MutualAppId; size?: number; className?: string }) {
  const Icon = APP_ICONS[app];
  const style: CSSProperties = { width: size, height: size };
  return (
    <span
      data-app={app}
      style={style}
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-[28%] bg-app-accent text-white shadow-sm dark:text-[#12241a]",
        className,
      )}
      aria-hidden
    >
      <Icon size={Math.round(size * 0.52)} strokeWidth={2} />
    </span>
  );
}
