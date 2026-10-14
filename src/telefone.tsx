import type { ReactNode } from "react";
import { Phone } from "lucide-react";
import { cx } from "./cx";
import { formatarTelefone, hrefTelefone, SEM_VALOR } from "./formatar";
import { BotaoCopiar } from "./campos-identificadores";

export interface TelefoneProps {
  numero: string | null | undefined;
  /** Show "+351" on Portuguese numbers too. */
  indicativo?: boolean | undefined;
  icone?: boolean | undefined;
  copiar?: boolean | undefined;
  /** No `tel:` link (e.g. inside a row that is already a link). */
  semLigacao?: boolean | undefined;
  vazio?: ReactNode | undefined;
  className?: string | undefined;
}

/** Shows `tel:` with the raw E.164 number; a non-phone value is shown as typed, without a link. Server-safe (copy button is a client island). */
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
