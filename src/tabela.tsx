import type { ElementType, InputHTMLAttributes, ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, RotateCcw, Search, X, XCircle } from "lucide-react";
import { cx } from "./cx";
import { EmptyState } from "./feedback";
import { intervaloPagina, paginasVisiveis } from "./dados";
import { formatarNumero } from "./formatar";

/**
 * The list/table shell. Library-agnostic: the app keeps its data logic
 * (fetching, URL state, TanStack, server pagination) and hands rows and
 * render functions in. Server-safe: no hooks — interactive props
 * (`onSort`, `onPageChange`…) only make sense from client components;
 * server pages use the `…Href` props instead.
 */

// ─── Skeleton ─────────────────────────────────────────────────────────────

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <span aria-hidden className={cx("m-skeleton", className ?? "h-4 w-full")} style={style} />;
}

// ─── Toolbar ──────────────────────────────────────────────────────────────

/**
 * One row above the list it scopes: search + filters on the left, actions
 * (export, "Nova …") on the right; a second line for the result count and
 * the active filter chips. Wraps on narrow screens.
 */
export function Toolbar({
  search,
  filters,
  actions,
  summary,
  chips,
  className,
}: {
  search?: ReactNode | undefined;
  filters?: ReactNode | undefined;
  actions?: ReactNode | undefined;
  /** "48 associações" — use `ResultCount`. */
  summary?: ReactNode | undefined;
  /** Active filters — use `FilterChips`. */
  chips?: ReactNode | undefined;
  className?: string | undefined;
}) {
  return (
    <div className={cx("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-end gap-x-3 gap-y-3">
        {search && <div className="min-w-0 flex-[1_1_16rem] sm:max-w-md">{search}</div>}
        {filters && <div className="flex min-w-0 flex-wrap items-end gap-2">{filters}</div>}
        {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {(summary || chips) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {summary}
          {chips}
        </div>
      )}
    </div>
  );
}

/** "48 associações" / "48 associações de 312" — polite live region. */
export function ResultCount({
  count,
  total,
  singular,
  plural,
  className,
}: {
  count: number;
  total?: number | undefined;
  singular: string;
  plural: string;
  className?: string | undefined;
}) {
  return (
    <p role="status" className={cx("text-[0.9375rem] text-muted-foreground", className)}>
      <span className="font-semibold text-foreground">{formatarNumero(count, { casas: 0 })}</span>{" "}
      {count === 1 ? singular : plural}
      {total !== undefined && total !== count && <> de {formatarNumero(total, { casas: 0 })}</>}
    </p>
  );
}

/**
 * Search input with a visible-on-demand label. Uncontrolled with `name="q"`
 * inside a GET form (server pages), or controlled with `value`/`onChange`.
 */
export function SearchField({
  label = "Pesquisar",
  hideLabel = true,
  className,
  ...input
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label?: string; hideLabel?: boolean }) {
  return (
    <label className={cx("flex min-w-0 flex-col gap-1.5", className)}>
      <span className={cx("text-[0.9375rem] font-medium", hideLabel && "sr-only")}>{label}</span>
      <span className="m-field relative flex h-11 items-center rounded-lg">
        <Search aria-hidden size={18} className="pointer-events-none absolute left-3 text-muted-foreground" />
        <input
          type="search"
          name="q"
          autoComplete="off"
          placeholder="Pesquisar"
          {...input}
          className="h-full w-full min-w-0 rounded-lg bg-transparent pr-3 pl-10 text-base outline-none placeholder:text-muted-foreground"
        />
      </span>
    </label>
  );
}

export interface ActiveFilter {
  id: string;
  /** "Estado" */
  label: string;
  /** "Em atraso" */
  value: string;
  onRemove?: (() => void) | undefined;
  removeHref?: string | undefined;
}

/** The filters in force, each removable, plus "Limpar filtros". */
export function FilterChips({
  filters,
  onClear,
  clearHref,
  LinkComponent = "a",
  className,
}: {
  filters: ActiveFilter[];
  onClear?: (() => void) | undefined;
  clearHref?: string | undefined;
  LinkComponent?: ElementType | undefined;
  className?: string | undefined;
}) {
  if (filters.length === 0) return null;
  const Link = LinkComponent;
  const chip =
    "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-card pl-3 text-[0.9375rem] shadow-xs";
  const remove =
    "grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground";
  return (
    <ul aria-label="Filtros ativos" className={cx("flex flex-wrap items-center gap-2", className)}>
      {filters.map((f) => (
        <li key={f.id} className={chip}>
          <span>
            <span className="text-muted-foreground">{f.label}:</span> <span className="font-medium">{f.value}</span>
          </span>
          {f.removeHref ? (
            <Link href={f.removeHref} className={remove} aria-label={`Remover filtro ${f.label}: ${f.value}`}>
              <X aria-hidden size={16} />
            </Link>
          ) : f.onRemove ? (
            <button type="button" onClick={f.onRemove} className={remove} aria-label={`Remover filtro ${f.label}: ${f.value}`}>
              <X aria-hidden size={16} />
            </button>
          ) : (
            <span className="w-3" />
          )}
        </li>
      ))}
      {(onClear || clearHref) && (
        <li>
          {clearHref ? (
            <Link href={clearHref} className="m-btn m-btn-ghost inline-flex min-h-9 items-center rounded-lg px-3 text-[0.9375rem] underline-offset-4 hover:underline">
              Limpar filtros
            </Link>
          ) : (
            <button type="button" onClick={onClear} className="m-btn m-btn-ghost inline-flex min-h-9 items-center rounded-lg px-3 text-[0.9375rem]">
              Limpar filtros
            </button>
          )}
        </li>
      )}
    </ul>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────

/**
 * "A mostrar 21–40 de 312" + Anterior / pages / Seguinte. Links (`hrefFor`)
 * for server pages, `onPageChange` for client state. Page numbers collapse
 * to "Página 2 de 16" on phones.
 */
export function Pagination({
  page,
  pageCount,
  totalItems,
  pageSize,
  hrefFor,
  onPageChange,
  LinkComponent = "a",
  pageSizeControl,
  className,
}: {
  /** 1-based. */
  page: number;
  pageCount: number;
  totalItems?: number | undefined;
  pageSize?: number | undefined;
  hrefFor?: ((page: number) => string) | undefined;
  onPageChange?: ((page: number) => void) | undefined;
  LinkComponent?: ElementType | undefined;
  /** A select for "Linhas por página" (the app's own control). */
  pageSizeControl?: ReactNode | undefined;
  className?: string | undefined;
}) {
  const Link = LinkComponent;
  const atual = Math.min(Math.max(1, page), Math.max(1, pageCount));
  const intervalo = totalItems !== undefined && pageSize ? intervaloPagina(atual, pageSize, totalItems) : null;
  const base =
    "inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-lg px-3 text-[0.9375rem] font-medium m-num";
  const ir = (p: number, conteudo: ReactNode, rotulo: string, extra?: string, disabled?: boolean, current?: boolean) => {
    const cls = cx(
      base,
      current
        ? "bg-primary text-primary-foreground shadow-xs"
        : disabled
          ? "cursor-not-allowed text-muted-foreground/60"
          : "text-foreground hover:bg-accent",
      extra,
    );
    if (disabled || current)
      return (
        <span className={cls} aria-current={current ? "page" : undefined} aria-disabled={disabled || undefined}>
          {conteudo}
        </span>
      );
    if (hrefFor)
      return (
        <Link href={hrefFor(p)} className={cx(cls, "no-underline")} aria-label={rotulo}>
          {conteudo}
        </Link>
      );
    return (
      <button type="button" className={cls} onClick={() => onPageChange?.(p)} aria-label={rotulo}>
        {conteudo}
      </button>
    );
  };
  if (pageCount <= 1 && !intervalo) return null;
  return (
    <nav aria-label="Paginação" className={cx("flex flex-wrap items-center justify-between gap-x-4 gap-y-2", className)}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.9375rem] text-muted-foreground">
        {intervalo && (
          <p>
            A mostrar{" "}
            <span className="font-medium text-foreground m-num">
              {formatarNumero(intervalo.de, { casas: 0 })}–{formatarNumero(intervalo.ate, { casas: 0 })}
            </span>{" "}
            de <span className="font-medium text-foreground m-num">{formatarNumero(totalItems, { casas: 0 })}</span>
          </p>
        )}
        {pageSizeControl}
      </div>
      {pageCount > 1 && (
        <ul className="flex items-center gap-1">
          <li>
            {ir(
              atual - 1,
              <>
                <ChevronLeft aria-hidden size={18} />
                <span className="max-sm:sr-only">Anterior</span>
              </>,
              "Página anterior",
              undefined,
              atual <= 1,
            )}
          </li>
          <li className="px-2 text-[0.9375rem] text-muted-foreground sm:hidden" aria-current="page">
            Página {atual} de {pageCount}
          </li>
          {paginasVisiveis(atual, pageCount).map((p, i) => (
            <li key={p ?? `gap-${i}`} className="max-sm:hidden">
              {p === null ? (
                <span aria-hidden className="px-1 text-muted-foreground">
                  …
                </span>
              ) : (
                ir(p, formatarNumero(p, { casas: 0 }), `Página ${p}`, undefined, false, p === atual)
              )}
            </li>
          ))}
          <li>
            {ir(
              atual + 1,
              <>
                <span className="max-sm:sr-only">Seguinte</span>
                <ChevronRight aria-hidden size={18} />
              </>,
              "Página seguinte",
              undefined,
              atual >= pageCount,
            )}
          </li>
        </ul>
      )}
    </nav>
  );
}

// ─── DataTable ────────────────────────────────────────────────────────────

export interface Column<T> {
  id: string;
  header: ReactNode;
  cell: (row: T, index: number) => ReactNode;
  /** Right-aligned, tabular figures (amounts, counts). */
  numeric?: boolean | undefined;
  align?: "start" | "center" | "end" | undefined;
  sortable?: boolean | undefined;
  /** The row's title on phones (first column by default). */
  primary?: boolean | undefined;
  /** Not shown in the phone card (secondary details, actions duplicated elsewhere). */
  hideOnMobile?: boolean | undefined;
  /** Header text for the phone card when `header` is not plain text. */
  mobileLabel?: string | undefined;
  className?: string | undefined;
  headerClassName?: string | undefined;
}

export type SortDirection = "asc" | "desc";

export interface DataTableProps<T> {
  /** Names the table for screen readers ("Associações"). */
  caption: string;
  showCaption?: boolean | undefined;
  columns: Column<T>[];
  rows: readonly T[];
  rowKey: (row: T, index: number) => string;
  /** First load: skeleton rows. */
  loading?: boolean | undefined;
  /** Refetch: keeps the rows at reduced opacity (no flash). */
  refreshing?: boolean | undefined;
  /** Message when loading failed. */
  error?: ReactNode | undefined;
  onRetry?: (() => void) | undefined;
  /** Shown when there are no rows (use `EmptyState variant="inline"`). */
  empty?: ReactNode | undefined;
  toolbar?: ReactNode | undefined;
  /** Usually `Pagination`. */
  footer?: ReactNode | undefined;
  sort?: { id: string; direction: SortDirection } | undefined;
  onSort?: ((id: string) => void) | undefined;
  sortHref?: ((id: string) => string) | undefined;
  /** Rows open a detail page: the primary cell becomes the link. */
  rowHref?: ((row: T) => string) | undefined;
  LinkComponent?: ElementType | undefined;
  /** Phones: "cards" (default) or keep the table with horizontal scroll. */
  mobile?: "cards" | "scroll" | undefined;
  skeletonRows?: number | undefined;
  /** Wrap in a card surface. Default true. */
  surface?: boolean | undefined;
  className?: string | undefined;
}

function alinhamento(c: Column<unknown>): string {
  const a = c.align ?? (c.numeric ? "end" : "start");
  return a === "end" ? "text-right" : a === "center" ? "text-center" : "text-left";
}

/**
 * A list page's table: toolbar, header with sorting, rows, phone cards,
 * loading/empty/error states and a footer for pagination.
 */
export function DataTable<T>({
  caption,
  showCaption = false,
  columns,
  rows,
  rowKey,
  loading,
  refreshing,
  error,
  onRetry,
  empty,
  toolbar,
  footer,
  sort,
  onSort,
  sortHref,
  rowHref,
  LinkComponent = "a",
  mobile = "cards",
  skeletonRows = 5,
  surface = true,
  className,
}: DataTableProps<T>) {
  const Link = LinkComponent;
  const primaryIdx = Math.max(
    0,
    columns.findIndex((c) => c.primary),
  );
  const cols = columns as Column<unknown>[];
  const semLinhas = rows.length === 0;
  const mostrarSkeleton = loading && semLinhas;

  const conteudoPrimario = (row: T, i: number) => {
    const col = columns[primaryIdx];
    if (!col) return null;
    const c = col.cell(row, i);
    return rowHref ? (
      <Link href={rowHref(row)} className="font-semibold text-foreground underline-offset-4 hover:underline">
        {c}
      </Link>
    ) : (
      c
    );
  };

  const cabecalho = (c: Column<unknown>) => {
    const ativo = sort?.id === c.id;
    const Icon = ativo ? (sort?.direction === "asc" ? ArrowUp : ArrowDown) : ChevronsUpDown;
    if (!c.sortable || (!onSort && !sortHref)) return c.header;
    const conteudo = (
      <>
        <span>{c.header}</span>
        <Icon aria-hidden size={16} className={cx("shrink-0", ativo ? "text-foreground" : "text-muted-foreground/70")} />
      </>
    );
    const cls = cx(
      "-mx-2 inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 font-semibold hover:bg-accent",
      (c.align ?? (c.numeric ? "end" : "start")) === "end" && "flex-row-reverse",
    );
    return sortHref ? (
      <Link href={sortHref(c.id)} className={cx(cls, "no-underline text-inherit")}>
        {conteudo}
      </Link>
    ) : (
      <button type="button" className={cls} onClick={() => onSort?.(c.id)}>
        {conteudo}
      </button>
    );
  };

  const estado = error ? (
    <div role="alert" className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-destructive-soft text-destructive-soft-foreground">
        <XCircle aria-hidden size={24} />
      </span>
      <p className="max-w-prose text-base font-medium">{error}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="m-btn m-btn-outline inline-flex h-11 items-center gap-2 rounded-lg px-4">
          <RotateCcw aria-hidden size={16} />
          Tentar novamente
        </button>
      )}
    </div>
  ) : !loading && semLinhas ? (
    (empty ?? <EmptyState variant="inline" title="Sem resultados" />)
  ) : null;

  const tabela = (
    <div className={cx(mobile === "cards" && "max-md:hidden", "overflow-x-auto")}>
      <table className="w-full border-collapse text-base">
        <caption className={cx(showCaption ? "px-5 pt-4 pb-2 text-left text-lg font-semibold" : "sr-only")}>{caption}</caption>
        <thead>
          <tr className="border-b border-border">
            {cols.map((c) => (
              <th
                key={c.id}
                scope="col"
                aria-sort={sort?.id === c.id ? (sort.direction === "asc" ? "ascending" : "descending") : undefined}
                className={cx(
                  "bg-muted/50 px-4 py-2 text-[0.9375rem] font-semibold whitespace-nowrap text-muted-foreground first:pl-5 last:pr-5",
                  alinhamento(c),
                  c.headerClassName,
                )}
              >
                {cabecalho(c)}
              </th>
            ))}
          </tr>
        </thead>
        {!estado && (
          <tbody className="divide-y divide-border/70">
            {mostrarSkeleton
              ? Array.from({ length: skeletonRows }, (_, i) => (
                  <tr key={i}>
                    {cols.map((c, j) => (
                      <td key={c.id} className={cx("px-4 py-3.5 first:pl-5 last:pr-5", alinhamento(c))}>
                        <Skeleton className={cx("inline-block h-4", j === 0 ? "w-40" : c.numeric ? "w-16" : "w-24")} />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row, i) => (
                  <tr key={rowKey(row, i)} className="transition-colors hover:bg-accent/50">
                    {columns.map((c, j) => (
                      <td
                        key={c.id}
                        className={cx(
                          "px-4 py-3 align-middle first:pl-5 last:pr-5",
                          alinhamento(c as Column<unknown>),
                          c.numeric && "m-num whitespace-nowrap",
                          c.className,
                        )}
                      >
                        {j === primaryIdx ? conteudoPrimario(row, i) : c.cell(row, i)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        )}
      </table>
      {estado}
    </div>
  );

  const cartoes =
    mobile === "cards" ? (
      <div className="md:hidden">
        {estado ?? (
          <ul aria-label={caption} className="divide-y divide-border/70">
            {mostrarSkeleton
              ? Array.from({ length: Math.min(skeletonRows, 3) }, (_, i) => (
                  <li key={i} className="flex flex-col gap-2 px-4 py-4">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-40" />
                  </li>
                ))
              : rows.map((row, i) => (
                  <li key={rowKey(row, i)} className="flex flex-col gap-2 px-4 py-4">
                    <div className="text-base font-semibold">{conteudoPrimario(row, i)}</div>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[0.9375rem]">
                      {columns.map((c, j) =>
                        j === primaryIdx || c.hideOnMobile ? null : (
                          <div key={c.id} className="contents">
                            <dt className="text-muted-foreground">{c.mobileLabel ?? c.header}</dt>
                            <dd className={cx("min-w-0 text-right break-words", c.numeric && "m-num")}>{c.cell(row, i)}</dd>
                          </div>
                        ),
                      )}
                    </dl>
                  </li>
                ))}
          </ul>
        )}
      </div>
    ) : null;

  return (
    <div className={cx("flex min-w-0 flex-col gap-4", className)}>
      {toolbar}
      <div
        aria-busy={loading || refreshing || undefined}
        className={cx(
          "min-w-0 overflow-hidden transition-opacity",
          surface && "m-surface",
          refreshing && "opacity-60",
        )}
      >
        {tabela}
        {cartoes}
      </div>
      {footer}
    </div>
  );
}
