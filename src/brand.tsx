import { nomeDaApp, type MutualAppId } from "./apps";
import { MUTUAL_FLAG_DATA_URI, MUTUAL_FLAG_RATIO } from "./logo-data";
import { cx } from "./cx";

/** The MUTU@L flag. Decorative by default (the wordmark carries the name). */
export function MutualFlag({ height = 24, className, title }: { height?: number | undefined; className?: string | undefined; title?: string | undefined }) {
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
 * tone="ink" on the dark ink (the Cartão's bars), "default" on light surfaces.
 */
export function MutualWordmark({
  app,
  tone = "default",
  size = "md",
  className,
}: {
  app?: MutualAppId | undefined;
  tone?: "default" | "ink" | undefined;
  size?: "sm" | "md" | "lg" | undefined;
  className?: string | undefined;
}) {
  const nome = app ? nomeDaApp(app) : undefined;
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
