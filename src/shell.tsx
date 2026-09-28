"use client";

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { ArrowLeftRight, HelpCircle, LogOut } from "lucide-react";
import { AcessibilidadeMenu } from "./acessibilidade";
import { AppSwitcher } from "./app-switcher";
import { nomeDaApp, type AppNoEndereco, type MutualAppId } from "./apps";
import { MutualWordmark } from "./brand";
import { CAMINHOS } from "./sso";
import { cx } from "./cx";

/**
 * The desk shell of every MUTU@L app (v0.9.1). Same anatomy, same sizes, same
 * account block everywhere — only the navigation in the middle is the app's:
 *
 *   <ShellBarraLateral>
 *     <ShellMarca app="dns" disponiveis={…} LinkComponent={Link} />
 *     <nav aria-label="Principal">… <Link className={classeItemShell(ativo)}> …</nav>
 *     <ShellConta app="dns" nome=… perfil=… organizacao=… onTerminarSessao=… />
 *   </ShellBarraLateral>
 *
 * The content column uses `.m-pagina` (css/superficies.css): the same gutters,
 * top space and maximum width in every app.
 */

/** Width of the desk sidebar (16rem). Layouts offset the content with `md:pl-64` / `lg:pl-64`. */
export const SHELL_LARGURA = "w-64";

/**
 * A navigation item of the desk sidebar. `ativo` = the current page (pair it
 * with `aria-current="page"`): tinted background, a bar in the app's accent on
 * the left and the icon in that accent. `nivel` 1 = inside a group.
 */
export function classeItemShell(ativo: boolean, nivel: 0 | 1 = 0): string {
  return cx(
    "flex min-h-11 w-full items-center rounded-lg text-left font-medium transition-colors",
    "[&>svg]:shrink-0",
    nivel === 0 ? "gap-3 px-3 text-[0.9375rem] [&>svg]:size-5" : "gap-2.5 px-2.5 text-[0.9375rem] [&>svg]:size-4",
    ativo
      ? "bg-sidebar-accent font-semibold text-sidebar-foreground shadow-[inset_3px_0_0_var(--app-accent-on-ink)] [&>svg]:text-app-accent-on-ink"
      : "text-sidebar-foreground hover:bg-sidebar-accent",
  );
}

/** Title of a group of items in the sidebar ("Reportes", "Clínica"…). */
export function ShellGrupo({ titulo, children, className }: { titulo: ReactNode; children: ReactNode; className?: string | undefined }) {
  return (
    <div className={cx("flex flex-col gap-0.5", className)}>
      <p className="px-3 pt-3 pb-1 text-sm font-semibold text-sidebar-muted-foreground">{titulo}</p>
      {children}
    </div>
  );
}

/** The sidebar itself: tinted by `data-app`, 16rem, scrolls on its own. */
export function ShellBarraLateral({
  children,
  className,
  "aria-label": ariaLabel = "Menu da aplicação",
  ...resto
}: ComponentPropsWithoutRef<"aside">) {
  return (
    <aside
      aria-label={ariaLabel}
      className={cx(
        SHELL_LARGURA,
        "flex h-full shrink-0 flex-col gap-4 overflow-y-auto bg-sidebar px-3 py-4 text-sidebar-foreground",
        className,
      )}
      {...resto}
    >
      {children}
    </aside>
  );
}

/**
 * Top of the sidebar: the MUTU@L wordmark with the app's name (a link to the
 * app's home) and, under it, the «Aplicações» switcher.
 */
export function ShellMarca({
  app,
  disponiveis,
  inicioHref = "/",
  inicioRotulo,
  LinkComponent = "a",
  onNavegar,
  className,
}: {
  app: Exclude<AppNoEndereco, "portal">;
  /** `appsDisponiveis(eu.apps)` — see apps.ts. */
  disponiveis: readonly MutualAppId[];
  /** The app's home, relative to its basePath (Next `Link`). */
  inicioHref?: string | undefined;
  /** Spoken name of the home link; default "<App> — página inicial". */
  inicioRotulo?: string | undefined;
  LinkComponent?: ElementType | undefined;
  onNavegar?: (() => void) | undefined;
  className?: string | undefined;
}) {
  const Link = LinkComponent;
  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <Link
        href={inicioHref}
        onClick={onNavegar}
        aria-label={inicioRotulo ?? `${nomeDaApp(app)} — página inicial`}
        className="self-start rounded-md px-2 py-1"
      >
        <MutualWordmark tone="ink" app={app} />
      </Link>
      <AppSwitcher current={app} disponiveis={disponiveis} tone="ink" className="self-start" />
    </div>
  );
}

/**
 * Bottom of the sidebar, identical in every app: who is signed in (name,
 * profile, organisation), then Acessibilidade, Ajuda (the Portal's help centre
 * for this app), «Mudar de organização» when the person belongs to more than
 * one, the app's own extra links, and «Terminar sessão».
 */
export function ShellConta({
  app,
  nome,
  perfil,
  organizacao,
  variasOrganizacoes = false,
  onTerminarSessao,
  aTerminar = false,
  ajudaHref,
  comAcessibilidade = true,
  extra,
  className,
}: {
  app: Exclude<AppNoEndereco, "portal">;
  nome: string;
  /** The person's profile in this app ("Tesoureiro", "Informática"…). */
  perfil?: ReactNode | undefined;
  /** The active organisation. */
  organizacao?: ReactNode | undefined;
  /** Shows «Mudar de organização» (the Portal's organisation page). */
  variasOrganizacoes?: boolean | undefined;
  onTerminarSessao: () => void;
  /** Sign-out in progress: the button says «A terminar…» and is disabled. */
  aTerminar?: boolean | undefined;
  /** Default: the Portal's help centre for this app (`/ajuda/<app>`). */
  ajudaHref?: string | undefined;
  /** Off where another Acessibilidade trigger is on screen (mobile top bar). */
  comAcessibilidade?: boolean | undefined;
  /** App-specific links (Definições, Contactar a UMP…), styled with `classeItemShell(false)`. */
  extra?: ReactNode | undefined;
  className?: string | undefined;
}) {
  const ajuda = ajudaHref ?? `${CAMINHOS.ajuda}/${app === "qr" ? "validador-qr" : app}`;
  const organizacaoHref = `/organizacao?next=${encodeURIComponent(`${CAMINHOS[app]}/`)}`;
  const item = classeItemShell(false);
  return (
    <div className={cx("flex flex-col gap-3 border-t border-sidebar-border pt-4", className)}>
      <div className="flex min-w-0 flex-col gap-0.5 px-3">
        <p className="truncate font-semibold" title={nome}>
          {nome}
        </p>
        {perfil && <p className="text-sm text-sidebar-muted-foreground">{perfil}</p>}
        {organizacao && <p className="text-sm text-sidebar-muted-foreground">{organizacao}</p>}
      </div>
      <div className="flex flex-col gap-0.5">
        {comAcessibilidade && <AcessibilidadeMenu tone="ink" className="w-full justify-start gap-3 [&>svg]:size-5" />}
        {/* Same origin (ADR 0004): the help centre and the organisation page are the Portal's. */}
        <a href={ajuda} className={item}>
          <HelpCircle aria-hidden />
          <span>Ajuda</span>
        </a>
        {variasOrganizacoes && (
          <a href={organizacaoHref} className={item}>
            <ArrowLeftRight aria-hidden />
            <span>Mudar de organização</span>
          </a>
        )}
        {extra}
        <button type="button" onClick={onTerminarSessao} disabled={aTerminar} className={cx(item, "disabled:opacity-70")}>
          <LogOut aria-hidden />
          <span>{aTerminar ? "A terminar…" : "Terminar sessão"}</span>
        </button>
      </div>
    </div>
  );
}
