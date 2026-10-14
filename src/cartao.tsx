import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

type CardAccent = "app" | "brand";

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /** Element to render. Default `div`; use `section`/`article`/`li` when it fits. */
  as?: "div" | "section" | "article" | "li" | "aside" | undefined;
  interactive?: boolean | undefined;
  /** A 3px line on top in the app's accent (or the brand). Identity, never status. */
  accent?: CardAccent | undefined;
  href?: string | undefined;
  LinkComponent?: ElementType | undefined;
  variant?: "raised" | "muted" | undefined;
}

/** The one card of the system (`m-surface`); padding lives in CardHeader/CardContent/CardFooter so a table can sit flush. */
export function Card({
  as = "div",
  interactive,
  accent,
  href,
  LinkComponent = "a",
  variant = "raised",
  className,
  children,
  ...rest
}: CardProps) {
  const classes = cx(
    "relative flex min-w-0 flex-col",
    variant === "raised" ? "m-surface" : "rounded-xl border border-border bg-muted/60 text-foreground",
    (interactive || href) && "m-surface-interactive",
    accent &&
      cx(
        "overflow-hidden before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-[3px]",
        accent === "app" ? "before:bg-app-accent" : "before:bg-brand",
      ),
    href && "no-underline text-inherit focus-visible:outline-offset-4",
    className,
  );
  if (href) {
    const Link = LinkComponent;
    const Wrapper = as === "li" ? "li" : null;
    const link = (
      <Link href={href} className={Wrapper ? cx(classes, "h-full") : classes} {...(Wrapper ? {} : rest)}>
        {children}
      </Link>
    );
    return Wrapper ? (
      <li className="flex min-w-0 flex-col" {...rest}>
        {link}
      </li>
    ) : (
      link
    );
  }
  const Tag = as;
  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}

export interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode | undefined;
  actions?: ReactNode | undefined;
  icon?: ReactNode | undefined;
  eyebrow?: ReactNode | undefined;
  /** Heading level: 2 on a page, 3 inside a Section. */
  level?: 2 | 3 | 4 | undefined;
  divider?: boolean | undefined;
  id?: string | undefined;
  className?: string | undefined;
}

export function CardHeader({
  title,
  description,
  actions,
  icon,
  eyebrow,
  level = 2,
  divider,
  id,
  className,
}: CardHeaderProps) {
  const H = `h${level}` as "h2";
  return (
    <div
      className={cx(
        "flex flex-wrap items-start justify-between gap-x-4 gap-y-3 px-5 pt-5 sm:px-6",
        divider ? "border-b border-border/80 pb-4" : "pb-1",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 basis-56 items-start gap-3">
        {icon && (
          <span
            aria-hidden
            className="grid size-10 shrink-0 place-items-center rounded-lg bg-app-accent-soft text-app-accent [&_svg]:size-5"
          >
            {icon}
          </span>
        )}
        <div className="flex min-w-0 flex-col gap-1">
          {eyebrow && <div className="text-sm font-medium text-muted-foreground">{eyebrow}</div>}
          <H id={id} className="text-lg leading-snug font-semibold tracking-tight text-balance">
            {title}
          </H>
          {description && <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardContent({
  className,
  flush,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  flush?: boolean | undefined;
}) {
  return (
    <div className={cx("min-w-0 flex-1", !flush && "px-5 py-4 sm:px-6", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        "flex flex-wrap items-center justify-between gap-3 rounded-b-[inherit] border-t border-border/80 bg-muted/40 px-5 py-3 text-[0.9375rem] text-muted-foreground sm:px-6",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Section({
  title,
  description,
  actions,
  level = 2,
  id,
  className,
  children,
}: {
  title: ReactNode;
  description?: ReactNode | undefined;
  actions?: ReactNode | undefined;
  level?: 2 | 3 | undefined;
  /** Heading id; derived from nothing — pass one when several sections share a page. */
  id?: string | undefined;
  className?: string | undefined;
  children: ReactNode;
}) {
  const H = `h${level}` as "h2";
  return (
    <section aria-labelledby={id} className={cx("flex min-w-0 flex-col gap-4", className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-col gap-1">
          <H id={id} className={cx("font-semibold tracking-tight text-balance", level === 2 ? "text-xl" : "text-lg")}>
            {title}
          </H>
          {description && <p className="max-w-3xl text-[0.9375rem] text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

export interface DescriptionItem {
  term: ReactNode;
  details: ReactNode;
  icon?: ReactNode | undefined;
  /** Span the whole row in the `grid` layout (long text, addresses). */
  wide?: boolean | undefined;
}

/** Key facts as a `<dl>`. `grid`: term above value, in columns; `rows`: term left, value right, stacking when narrower than 28rem. */
export function DescriptionList({
  items,
  layout = "grid",
  columns = 2,
  className,
}: {
  items: DescriptionItem[];
  layout?: "grid" | "rows" | undefined;
  columns?: 1 | 2 | 3 | undefined;
  className?: string | undefined;
}) {
  if (layout === "rows") {
    return (
      <dl className={cx("@container divide-y divide-border/70", className)}>
        {items.map((it, i) => (
          <div key={i} className="grid gap-x-6 gap-y-0.5 py-3 first:pt-0 last:pb-0 @md:grid-cols-[minmax(9rem,13rem)_1fr]">
            <dt className="flex items-center gap-2 text-[0.9375rem] text-muted-foreground [&_svg]:size-4 [&_svg]:shrink-0">
              {it.icon && <span aria-hidden>{it.icon}</span>}
              {it.term}
            </dt>
            <dd className="min-w-0 font-medium break-words">{it.details}</dd>
          </div>
        ))}
      </dl>
    );
  }
  const cols = columns === 1 ? "" : columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <dl className={cx("grid gap-x-8 gap-y-4", cols, className)}>
      {items.map((it, i) => (
        <div key={i} className={cx("flex min-w-0 flex-col gap-1", it.wide && "sm:col-span-full")}>
          <dt className="flex items-center gap-2 text-[0.9375rem] text-muted-foreground [&_svg]:size-4 [&_svg]:shrink-0">
            {it.icon && <span aria-hidden>{it.icon}</span>}
            {it.term}
          </dt>
          <dd className="min-w-0 font-medium break-words">{it.details}</dd>
        </div>
      ))}
    </dl>
  );
}
