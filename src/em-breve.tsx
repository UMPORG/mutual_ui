import { LayoutGrid } from "lucide-react";
import { type Lancamento, type MutualAppId } from "./apps";
import { CAMINHOS } from "./sso";
import { MutualWordmark } from "./brand";
import { AcessibilidadeMenu } from "./acessibilidade";
import { IconeApp } from "./icone-app";
import { cx } from "./cx";

export const TEXTOS_EM_BREVE = {
  titulo: "Disponível em breve",
  texto: "Esta área ainda não está disponível. A UMP vai abri-la em breve.",
  portal: "Ir para o Portal",
} as const;

/**
 * The one «Disponível em breve» screen: an app or a page the UMP has not
 * opened yet (`appLigada` / `paginaLigada` false, from `eu.lancamento`).
 * Server-safe (no hooks).
 *
 * - App switched off: render it instead of the app (full screen, own header).
 * - Page switched off: `dentroDoShell` renders only the card, inside the
 *   `AppShell` content layer.
 */
export function EmBreve({
  app,
  dentroDoShell = false,
  portalHref = CAMINHOS.portal,
  lancamento,
  className,
}: {
  app: MutualAppId;
  /** `eu.lancamento` (or the public one): the configured platform name in the header. */
  lancamento?: Lancamento | null | undefined;
  /** Inside `AppShell` (a switched-off page): no own header, no full-screen canvas. */
  dentroDoShell?: boolean | undefined;
  /** The Portal address — absolute for an app on another host. */
  portalHref?: string | undefined;
  className?: string | undefined;
}) {
  const portal = portalHref.replace(/\/+$/, "") || "/";
  const cartao = (
    <section className="m-surface flex w-full max-w-[34rem] flex-col gap-5 p-7 sm:p-8">
      <IconeApp app={app} tamanho={48} />
      <div className="flex flex-col gap-2">
        <h1 className="text-pagina font-bold tracking-tight text-balance">{TEXTOS_EM_BREVE.titulo}</h1>
        <p className="text-base text-muted-foreground">{TEXTOS_EM_BREVE.texto}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <a href={portal} className="m-btn m-btn-primary inline-flex min-h-12 items-center gap-2 rounded-lg px-5">
          <LayoutGrid aria-hidden className="size-[1.15em]" />
          {TEXTOS_EM_BREVE.portal}
        </a>
      </div>
    </section>
  );
  if (dentroDoShell) {
    return <div className={cx("m-pagina flex justify-center pt-6 pb-16 sm:pt-12", className)}>{cartao}</div>;
  }
  return (
    <main data-app={app} className={cx("m-canvas flex min-h-dvh flex-col", className)}>
      <header className="flex items-center justify-between gap-3 px-6 py-4">
        <MutualWordmark app={app} lancamento={lancamento} />
        <AcessibilidadeMenu compacto="md" />
      </header>
      <div className="flex flex-1 items-start justify-center px-4 pt-6 pb-16 sm:items-center">{cartao}</div>
    </main>
  );
}
