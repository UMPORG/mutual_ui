import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cx } from "./cx";

export interface Crumb {
  label: string;
  href?: string;
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
  className,
  LinkComponent = "a",
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: Crumb[];
  /** Small label above the title (e.g. state or category). */
  eyebrow?: ReactNode;
  className?: string;
  /** Pass Next's `Link` for client-side navigation. */
  LinkComponent?: React.ElementType;
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
          <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight text-balance">{title}</h1>
          {description && <p className="max-w-3xl text-base text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
