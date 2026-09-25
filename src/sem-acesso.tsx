import type { ReactNode } from "react";
import { ArrowLeftRight, LayoutGrid, ShieldAlert } from "lucide-react";
import { getMutualApp, type AppNoEndereco } from "./apps";
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
  | "tipo-organizacao";

const TEXTO: Record<MotivoSemAcesso, (app: string) => string> = {
  "sem-organizacao": () => "Escolha no Portal a organização com que quer trabalhar.",
  "sem-perfil": (app) => `O seu perfil nesta organização não inclui o ${app}.`,
  "sem-unidade": () => "A sua conta ainda não está associada a nenhuma unidade.",
  "tipo-organizacao": (app) => `O ${app} não está disponível para este tipo de organização.`,
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
  className,
}: {
  app: Exclude<AppNoEndereco, "portal">;
  motivo: MotivoSemAcesso;
  utilizador?: { nome: string; email: string } | null;
  organizacao?: string | null;
  /** Show "Mudar de organização" (the person belongs to several). */
  variasOrganizacoes?: boolean;
  /** The app's own sign-out button (it needs the app's auth client). */
  acaoSair?: ReactNode;
  className?: string;
}) {
  const nome = getMutualApp(app)?.nome ?? "aplicação";
  return (
    <main data-app={app} className={cx("m-canvas flex min-h-dvh flex-col", className)}>
      <header className="flex items-center justify-between gap-3 px-6 py-4">
        <MutualWordmark app={app} />
        <AcessibilidadeMenu compacto="md" />
      </header>
      <div className="flex flex-1 items-start justify-center px-4 pt-6 pb-16 sm:items-center">
        <section className="m-surface flex w-full max-w-[34rem] flex-col gap-5 p-7 sm:p-8">
          <ShieldAlert aria-hidden className="size-9 text-warning" />
          <div className="flex flex-col gap-2">
            <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight text-balance">Não tem acesso ao {nome}</h1>
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
                  <dt className="text-sm text-muted-foreground">Organização</dt>
                  <dd>{organizacao}</dd>
                </div>
              )}
            </dl>
          )}
          {motivo !== "sem-organizacao" && (
            <p className="text-[0.9375rem]">Para ter acesso, contacte o super administrador da sua organização.</p>
          )}
          <div className="flex flex-wrap gap-3">
            <a href={CAMINHOS.portal} className="m-btn m-btn-primary inline-flex min-h-12 items-center gap-2 rounded-lg px-5">
              <LayoutGrid aria-hidden className="size-[1.15em]" />
              Ir para o Portal MUTU@L
            </a>
            {(variasOrganizacoes || motivo === "sem-organizacao") && (
              <a href="/organizacao" className="m-btn m-btn-outline inline-flex min-h-12 items-center gap-2 rounded-lg px-5">
                <ArrowLeftRight aria-hidden className="size-[1.15em]" />
                {motivo === "sem-organizacao" ? "Escolher organização" : "Mudar de organização"}
              </a>
            )}
            {acaoSair}
          </div>
        </section>
      </div>
    </main>
  );
}
