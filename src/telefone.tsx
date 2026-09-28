import type { ReactNode } from "react";
import { Phone } from "lucide-react";
import { cx } from "./cx";
import { formatarTelefone, hrefTelefone, SEM_VALOR } from "./formatar";
import { BotaoCopiar } from "./campos-identificadores";

export interface TelefoneProps {
  /** The stored number (E.164 or anything a person typed). */
  numero: string | null | undefined;
  /** Show "+351" on Portuguese numbers too. */
  indicativo?: boolean | undefined;
  /** A phone icon before the number. */
  icone?: boolean | undefined;
  /** A 44px «Copiar número» button after the link. */
  copiar?: boolean | undefined;
  /** No `tel:` link (e.g. inside a row that is already a link). */
  semLigacao?: boolean | undefined;
  /** What to show when there is no number. Default "—". */
  vazio?: ReactNode | undefined;
  className?: string | undefined;
}

/**
 * A phone number as people read it — "222 084 177", "+44 207 946 0958" —
 * and a `tel:` link with the raw E.164 number so phones dial it. A value that
 * is not a phone number is shown as it came, without a link. Server-safe (the
 * copy button is a small client island).
 *
 * ```tsx
 * <Telefone numero={associacao.telefone} icone copiar />
 * ```
 */
export function Telefone({ numero, indicativo, icone, copiar, semLigacao, vazio, className }: TelefoneProps) {
  const texto = formatarTelefone(numero, { indicativo });
  if (texto === SEM_VALOR) return <span className={className}>{vazio ?? SEM_VALOR}</span>;
  const href = semLigacao ? null : hrefTelefone(numero);
  const conteudo = (
    <>
      {icone ? <Phone aria-hidden size={18} className="shrink-0" /> : null}
      <span className="tabular-nums whitespace-nowrap">{texto}</span>
    </>
  );
  return (
    <span className={cx("inline-flex max-w-full flex-wrap items-center gap-x-1", className)}>
      {href ? (
        <a
          href={href}
          // 44px hit area without growing the line (dense tables, description lists).
          className="relative inline-flex items-center gap-1.5 rounded-md font-medium text-primary underline underline-offset-2 outline-none after:absolute after:-inset-x-1 after:-inset-y-2.5 after:content-[''] hover:decoration-2 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {conteudo}
        </a>
      ) : (
        <span className="inline-flex items-center gap-1.5">{conteudo}</span>
      )}
      {copiar && href ? <BotaoCopiar texto={texto} rotulo="Copiar número" feito="Número copiado" className="-my-2.5" /> : null}
    </span>
  );
}
