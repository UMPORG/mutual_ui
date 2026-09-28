"use client";
/**
 * Monitorização (ADR 0007) — peças React para as apps:
 *
 *   // app/layout.tsx (raiz): erros não apanhados do browser
 *   <MonitorCliente app="eventos" versao={versao} />
 *
 *   // app/error.tsx e app/global-error.tsx
 *   export default function Erro({ error, reset }) {
 *     return <ErroReportado error={error} reset={reset} app="eventos" />;
 *   }
 *
 *   // uma parte da página que pode falhar sozinha
 *   <FronteiraErro app="eventos" alternativa={<p>…</p>}>…</FronteiraErro>
 *
 * Tudo o que é reportado passa por `reportarErro` (`@umporg/ui/monitor`).
 */
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, useEffect, useRef, type ReactNode } from "react";
import type { MutualAppId } from "./apps";
import { Button } from "./basicos";
import { EmptyState } from "./feedback";
import { instalarReporteGlobal, reportarErro, type OpcoesReporte } from "./monitor";

type Opcoes = Omit<OpcoesReporte, "lado" | "chave" | "fetch">;

/** Liga o reporte dos erros não apanhados do browser (uma vez, no layout raiz). */
export function MonitorCliente({
  app,
  versao,
}: {
  app: MutualAppId;
  versao?: string | null | undefined;
}) {
  useEffect(() => instalarReporteGlobal({ app, versao }), [app, versao]);
  return null;
}

/** Reporta este erro uma vez (em `error.tsx`, num `catch` de um componente…). */
export function useReportarErro(error: unknown, opcoes: Opcoes): void {
  const enviado = useRef<unknown>(null);
  const { app, versao, url, pedidoId, contexto, endpoint } = opcoes;
  useEffect(() => {
    if (!error || enviado.current === error) return;
    enviado.current = error;
    void reportarErro(error, { app, versao, url, pedidoId, contexto, endpoint, lado: "browser" });
  }, [error, app, versao, url, pedidoId, contexto, endpoint]);
}

/**
 * O ecrã de erro das apps (`error.tsx` / `global-error.tsx`): diz o que
 * aconteceu em linguagem simples, que já ficou registado, e deixa tentar de
 * novo. Mostra a referência do erro (o `digest` do Next) para quem der apoio.
 */
export function ErroReportado({
  error,
  reset,
  app,
  versao,
  titulo = "Ocorreu um erro inesperado",
  inicio,
  className,
}: {
  error: Error & { digest?: string | undefined };
  reset?: (() => void) | undefined;
  app: MutualAppId;
  versao?: string | null | undefined;
  titulo?: string | undefined;
  /** caminho do início da app (ex.: `/eventos`); omissão: sem ligação */
  inicio?: string | undefined;
  className?: string | undefined;
}) {
  useReportarErro(error, { app, versao });
  return (
    <EmptyState
      className={className}
      icon={<AlertTriangle aria-hidden />}
      title={titulo}
      action={
        <>
          {reset && (
            <Button onClick={() => reset()}>
              <RotateCcw size={18} aria-hidden />
              Tentar de novo
            </Button>
          )}
          {inicio && (
            <a href={inicio} className="inline-flex min-h-11 items-center rounded-md px-4 font-medium text-primary underline-offset-4 hover:underline">
              Voltar ao início
            </a>
          )}
        </>
      }
    >
      <p>A página não conseguiu terminar o que estava a fazer. O erro ficou registado para a equipa de informática.</p>
      {error.digest && (
        <p className="mt-2 text-sm">
          Referência: <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{error.digest}</code>
        </p>
      )}
    </EmptyState>
  );
}

interface EstadoFronteira {
  erro: Error | null;
}

/**
 * Fronteira de erro que reporta: uma parte da página que falha mostra a
 * `alternativa` (ou uma mensagem curta) sem derrubar o resto.
 */
export class FronteiraErro extends Component<
  {
    app: MutualAppId;
    versao?: string | null | undefined;
    alternativa?: ReactNode | ((tentarDeNovo: () => void) => ReactNode) | undefined;
    children?: ReactNode | undefined;
  },
  EstadoFronteira
> {
  override state: EstadoFronteira = { erro: null };

  static getDerivedStateFromError(erro: unknown): EstadoFronteira {
    return { erro: erro instanceof Error ? erro : new Error(String(erro)) };
  }

  override componentDidCatch(erro: unknown, info: { componentStack?: string | null | undefined }): void {
    void reportarErro(erro, {
      app: this.props.app,
      versao: this.props.versao,
      lado: "browser",
      contexto: { origem: "fronteira", componente: info.componentStack?.split("\n").find((l) => l.trim())?.trim() ?? null },
    });
  }

  private tentarDeNovo = () => this.setState({ erro: null });

  override render(): ReactNode {
    if (!this.state.erro) return this.props.children;
    const { alternativa } = this.props;
    if (typeof alternativa === "function") return alternativa(this.tentarDeNovo);
    if (alternativa !== undefined) return alternativa;
    return (
      <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/40 p-4 text-base">
        <AlertTriangle size={20} aria-hidden className="text-destructive" />
        <span className="flex-1">Esta parte da página não abriu. O erro ficou registado.</span>
        <Button variant="outline" size="sm" onClick={this.tentarDeNovo}>
          Tentar de novo
        </Button>
      </div>
    );
  }
}
