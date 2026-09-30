import { CloudOff, RotateCw } from "lucide-react";
import { type MutualAppId } from "./apps";
import { MutualWordmark } from "./brand";
import { AcessibilidadeMenu } from "./acessibilidade";
import { TEXTOS_INDISPONIVEL } from "./cerebro";
import { cx } from "./cx";

/**
 * A página «Serviço temporariamente indisponível» de todas as apps.
 * O `proxy.ts` mostra-a com 503 (`PAGINA_INDISPONIVEL`, `CABECALHOS_INDISPONIVEL`)
 * quando o Cérebro não responde — nunca o login do Portal, que faria um ciclo.
 * Server-safe (sem hooks); não lê sessão nem configuração, para se desenhar
 * com o que estiver avariado.
 *
 * `tentarHref`: para onde «Tentar novamente» volta (a página que a pessoa
 * pediu, ou a raiz da app), sempre com um carregamento completo — o proxy
 * decide outra vez. Não há ligação para o Portal: também depende do Cérebro.
 */
export function ServicoIndisponivel({
  app,
  tentarHref,
  className,
}: {
  app: MutualAppId;
  tentarHref: string;
  className?: string | undefined;
}) {
  return (
    <main data-app={app} className={cx("m-canvas flex min-h-dvh flex-col", className)}>
      <header className="flex items-center justify-between gap-3 px-6 py-4">
        <MutualWordmark app={app} />
        <AcessibilidadeMenu compacto="md" />
      </header>
      <div className="flex flex-1 items-start justify-center px-4 pt-6 pb-16 sm:items-center">
        <section className="m-surface flex w-full max-w-[34rem] flex-col gap-5 p-7 sm:p-8">
          <CloudOff aria-hidden className="size-9 text-warning" />
          <div className="flex flex-col gap-2">
            <h1 className="text-pagina font-bold tracking-tight text-balance">{TEXTOS_INDISPONIVEL.titulo}</h1>
            <p className="text-base text-muted-foreground">{TEXTOS_INDISPONIVEL.texto}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={tentarHref} className="m-btn m-btn-primary inline-flex min-h-12 items-center gap-2 rounded-lg px-5">
              <RotateCw aria-hidden className="size-[1.15em]" />
              {TEXTOS_INDISPONIVEL.tentar}
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
