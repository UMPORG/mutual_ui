import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cx } from "./cx";

export interface Crumb {
  label: string;
  href?: string | undefined;
}

/**
 * The one page header of the ecosystem: breadcrumbs (optional), title,
 * one-line description, and the page's actions on the right (wrapping under
 * the title on narrow screens). The primary action goes last.
 */
export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  eyebrow,
  separadores,
  className,
  LinkComponent = "a",
}: {
  title: ReactNode;
  description?: ReactNode | undefined;
  actions?: ReactNode | undefined;
  breadcrumbs?: Crumb[] | undefined;
  /** Small label above the title (e.g. state or category). */
  eyebrow?: ReactNode | undefined;
  /** Sub-pages of this page as tabs, under the title (`<Separadores …/>`, v0.13). */
  separadores?: ReactNode | undefined;
  className?: string | undefined;
  /** Pass Next's `Link` for client-side navigation. */
  LinkComponent?: React.ElementType | undefined;
}) {
  const Link = LinkComponent;
  return (
    <header className={cx("mb-6 flex flex-col gap-3", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Localização">
          <ol className="flex flex-wrap items-center gap-1 text-[0.9375rem] text-muted-foreground">
            {breadcrumbs.map((c, i) => {
              const last = i === breadcrumbs.length - 1;
              return (
                <li key={`${c.label}-${i}`} className="inline-flex items-center gap-1">
                  {c.href && !last ? (
                    <Link href={c.href} className="rounded-sm underline-offset-4 hover:text-foreground hover:underline">
                      {c.label}
                    </Link>
                  ) : (
                    <span aria-current={last ? "page" : undefined} className={last ? "text-foreground" : undefined}>
                      {c.label}
                    </span>
                  )}
                  {!last && <ChevronRight size={16} aria-hidden />}
                </li>
              );
            })}
          </ol>
        </nav>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          {eyebrow && <div className="text-sm font-medium text-muted-foreground">{eyebrow}</div>}
          <h1 className="text-pagina font-bold tracking-tight text-balance">{title}</h1>
          {description && <p className="max-w-3xl text-base text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {separadores && <div className="mt-2">{separadores}</div>}
    </header>
  );
}
