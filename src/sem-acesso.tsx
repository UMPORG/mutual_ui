import type { ReactNode } from "react";
import { ArrowLeftRight, LayoutGrid, ShieldAlert } from "lucide-react";
import { nomeDaApp, type Lancamento, type MutualAppId } from "./apps";
import { CAMINHOS } from "./sso";
import { MutualWordmark } from "./brand";
import { AcessibilidadeMenu } from "./acessibilidade";
import { cx } from "./cx";

export type MotivoSemAcesso =
  /** No active organisation chosen (or none left). */
  | "sem-organizacao"
  /** The active organisation gives this person no profile in the app. */
  | "sem-perfil"
  /** App-specific second layer (e.g. Saúde: not linked to any unit). */
  | "sem-unidade"
  /** The app is not available to this type of organisation (e.g. UMP area). */
  | "tipo-organizacao"
  /** Cartão Digital: a team account with no associado record. */
  | "sem-associado";

const TEXTO: Record<MotivoSemAcesso, (app: string) => string> = {
  "sem-organizacao": () => "Escolha no Portal a entidade com que quer trabalhar.",
  "sem-perfil": (app) => `O seu perfil nesta entidade não inclui a aplicação ${app}.`,
  "sem-unidade": () => "A sua conta ainda não está associada a nenhuma unidade.",
  "tipo-organizacao": (app) => `A aplicação ${app} não está disponível para este tipo de entidade.`,
  "sem-associado": () =>
    "O Cartão Digital é para os associados das associações mutualistas. Esta conta não tem ficha de associado.",
};

/**
 * The one "no access" page of the ecosystem. Server-safe (no hooks).
 * Never sign the person out from here — the session belongs to every app.
 */
export function SemAcesso({
  app,
  motivo,
  utilizador,
  organizacao,
  variasOrganizacoes = false,
  acaoSair,
  acoes,
  portalHref = CAMINHOS.portal,
  lancamento,
  className,
}: {
  app: Exclude<MutualAppId, "portal">;
  /** `eu.lancamento` (or the public one): the configured platform name in the header. */
  lancamento?: Lancamento | null | undefined;
  motivo: MotivoSemAcesso;
  utilizador?: { nome: string; email: string } | null | undefined;
  organizacao?: string | null | undefined;
  /** Show "Mudar de organização" (the person belongs to several). */
  variasOrganizacoes?: boolean | undefined;
  /** The app's own sign-out button (it needs the app's auth client). */
  acaoSair?: ReactNode | undefined;
  /** Extra actions before "Ir para o Portal" (e.g. the Cartão's "Sou associado"). */
  acoes?: ReactNode | undefined;
  /** The Portal address — absolute for an app on another host (the Cartão). */
  portalHref?: string | undefined;
  className?: string | undefined;
}) {
  const nome = nomeDaApp(app) ?? "aplicação";
  const portal = portalHref.replace(/\/+$/, "");
  return (
    <main data-app={app} className={cx("m-canvas flex min-h-dvh flex-col", className)}>
      <header className="flex items-center justify-between gap-3 px-6 py-4">
        <MutualWordmark app={app} lancamento={lancamento} />
        <AcessibilidadeMenu compacto="md" />
      </header>
      <div className="flex flex-1 items-start justify-center px-4 pt-6 pb-16 sm:items-center">
        <section className="m-surface flex w-full max-w-[34rem] flex-col gap-5 p-7 sm:p-8">
          <ShieldAlert aria-hidden className="size-9 text-warning" />
          <div className="flex flex-col gap-2">
            <h1 className="text-pagina font-bold tracking-tight text-balance">Não tem acesso à aplicação {nome}</h1>
            <p className="text-base text-muted-foreground">{TEXTO[motivo](nome)}</p>
          </div>
          {(utilizador || organizacao) && (
            <dl className="flex flex-col gap-3 rounded-lg border border-border bg-muted px-4 py-3 text-[0.9375rem]">
              {utilizador && (
                <div>
                  <dt className="text-sm text-muted-foreground">Sessão iniciada como</dt>
                  <dd className="font-semibold">{utilizador.nome}</dd>
                  <dd className="text-muted-foreground">{utilizador.email}</dd>
                </div>
              )}
              {organizacao && (
                <div>
                  <dt className="text-sm text-muted-foreground">Entidade</dt>
                  <dd>{organizacao}</dd>
                </div>
              )}
            </dl>
          )}
          {motivo !== "sem-organizacao" && motivo !== "sem-associado" && (
            <p className="text-[0.9375rem]">Para ter acesso, contacte o super administrador da sua entidade.</p>
          )}
          {motivo === "sem-associado" && (
            <p className="text-[0.9375rem]">Para trabalhar na plataforma, use o Portal. Se também é associado, indique os seus dados de associado.</p>
          )}
          <div className="flex flex-wrap gap-3">
            {acoes}
            <a href={portal || "/"} className="m-btn m-btn-primary inline-flex min-h-12 items-center gap-2 rounded-lg px-5">
              <LayoutGrid aria-hidden className="size-[1.15em]" />
              Ir para o Portal
            </a>
            {(variasOrganizacoes || motivo === "sem-organizacao") && (
              <a href={`${portal}/organizacao`} className="m-btn m-btn-outline inline-flex min-h-12 items-center gap-2 rounded-lg px-5">
                <ArrowLeftRight aria-hidden className="size-[1.15em]" />
                {motivo === "sem-organizacao" ? "Escolher entidade" : "Mudar de entidade"}
              </a>
            )}
            {acaoSair}
          </div>
        </section>
      </div>
    </main>
  );
}
