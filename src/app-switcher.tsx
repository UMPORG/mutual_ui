"use client";

import { useId, useRef } from "react";
import { ChevronDown, LayoutGrid } from "lucide-react";
import { MUTUAL_APPS, type MutualAppId } from "./apps";
import { AppMark } from "./brand";
import { portalAppUrl } from "./sso";
import { cx } from "./cx";

/**
 * "Mudar de aplicação" — the same menu in every app. Lists the apps the
 * person can use in the active organisation and opens them through the Portal (`/ir/<app>`),
 * so no app needs to know its siblings' URLs. With SSO the user lands
 * signed in.
 *
 * Uses the native Popover API (light-dismiss, Esc, top layer) — no deps.
 */
export function AppSwitcher({
  current,
  portalUrl,
  disponiveis,
  tone = "ink",
  className,
  label = "Aplicações",
}: {
  current: MutualAppId;
  portalUrl: string;
  /** Apps the person can open in the active organisation — the keys of
   *  `apps` from `GET /api/v1/acessos/eu` whose value is not null (public
   *  apps such as the Validador QR are always listed). */
  disponiveis: readonly MutualAppId[];
  tone?: "ink" | "default";
  className?: string;
  label?: string;
}) {
  const id = useId().replace(/:/g, "");
  const popId = `mutual-apps-${id}`;
  const apps = MUTUAL_APPS.filter((a) => a.id !== current && (a.publica || disponiveis.includes(a.id)));
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Place the popover under its button (flipping up near the bottom edge).
  function place(e: React.ToggleEvent<HTMLDivElement>) {
    if (e.newState !== "open" || !buttonRef.current) return;
    const pop = e.currentTarget;
    const r = buttonRef.current.getBoundingClientRect();
    const h = pop.offsetHeight;
    const w = pop.offsetWidth;
    const below = r.bottom + 8 + h <= window.innerHeight;
    pop.style.top = `${below ? r.bottom + 8 : Math.max(8, r.top - 8 - h)}px`;
    pop.style.left = `${Math.min(Math.max(8, r.left), window.innerWidth - w - 8)}px`;
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        popoverTarget={popId}
        className={cx(
          "inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-[0.9375rem] font-medium transition-colors",
          tone === "ink"
            ? "text-sidebar-foreground hover:bg-sidebar-accent"
            : "border border-border bg-card text-foreground hover:bg-accent",
          className,
        )}
      >
        <LayoutGrid size={18} aria-hidden />
        <span>{label}</span>
        <ChevronDown size={16} aria-hidden className="opacity-70" />
      </button>
      <div
        id={popId}
        popover="auto"
        className="fixed m-0 w-[min(22rem,calc(100vw-2rem))] m-float p-2"
        onToggle={place}
      >
        <p className="px-3 pt-2 pb-1 text-sm font-semibold text-muted-foreground">Mudar de aplicação</p>
        <ul className="flex flex-col">
          {apps.map((a) => (
            <li key={a.id}>
              <a
                href={portalAppUrl(portalUrl, a.id)}
                className="flex min-h-14 items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent focus-visible:bg-accent"
              >
                <AppMark app={a.id} size={36} />
                <span className="flex min-w-0 flex-col">
                  <span className="font-semibold">{a.nome}</span>
                  <span className="truncate text-sm text-muted-foreground">{a.descricao}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-1 border-t border-border pt-1">
          <a
            href={portalAppUrl(portalUrl, "portal")}
            className="flex min-h-11 items-center gap-2 rounded-lg px-3 font-medium text-brand hover:bg-accent"
          >
            <LayoutGrid size={18} aria-hidden />
            Todas as aplicações — Portal MUTU@L
          </a>
        </div>
      </div>
    </>
  );
}
