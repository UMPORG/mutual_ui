"use client";

import { useCallback, useSyncExternalStore, type ReactNode } from "react";
import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { ChevronDown } from "lucide-react";
import { cx } from "./cx";
import { formatarNumero } from "./formatar";

/**
 * Showing and hiding content (v0.7): Accordion, Collapsible, Tabs, plus
 * `useUrlParam` to keep the open tab in the address (so "Voltar", reload
 * and shared links land on the same tab).
 *
 * - Accordion: FAQ, long forms split in optional sections, help pages.
 *   Content found by the browser's search opens its panel.
 * - Collapsible: one "Mostrar detalhes" block.
 * - Tabs: sibling views of the same thing (an event: Resumo, Inscrições,
 *   Pagamentos). Not for steps (use Stepper) and not for navigation between
 *   pages (use links with `aria-current`).
 */

// ─── Accordion ────────────────────────────────────────────────────────────

export interface AccordionItem {
  value: string;
  title: ReactNode;
  content: ReactNode;
  /** Small text next to the title ("3 documentos"). */
  meta?: ReactNode;
  disabled?: boolean;
}

export function Accordion({
  items,
  multiple = false,
  value,
  defaultValue,
  onValueChange,
  headingLevel = 3,
  variant = "separated",
  className,
}: {
  items: AccordionItem[];
  /** Several panels open at once (default: one at a time). */
  multiple?: boolean;
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** Level of the heading around each trigger (2 on a page, 3 inside a section). */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** "separated": each item a card; "plain": hairlines between items (inside a Card). */
  variant?: "separated" | "plain";
  className?: string;
}) {
  const H = `h${headingLevel}` as const;
  return (
    <BaseAccordion.Root
      multiple={multiple}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange ? (v) => onValueChange(v as string[]) : undefined}
      hiddenUntilFound
      className={cx("flex flex-col", variant === "separated" ? "gap-2" : "divide-y divide-border", className)}
    >
      {items.map((it) => (
        <BaseAccordion.Item
          key={it.value}
          value={it.value}
          disabled={it.disabled}
          className={cx(variant === "separated" && "m-surface overflow-hidden rounded-xl")}
        >
          <BaseAccordion.Header render={<H className="m-0" />}>
            <BaseAccordion.Trigger
              className={cx(
                "group flex w-full items-center gap-3 text-left text-base font-semibold",
                "min-h-12 hover:bg-foreground/[0.03] data-[disabled]:opacity-50",
                variant === "separated" ? "px-4 py-3 sm:px-5" : "px-1 py-3",
              )}
            >
              <span className="min-w-0 flex-1">{it.title}</span>
              {it.meta && <span className="shrink-0 text-[0.9375rem] font-normal text-muted-foreground">{it.meta}</span>}
              <ChevronDown aria-hidden size={20} className="m-seta shrink-0 text-muted-foreground group-data-[panel-open]:rotate-180" />
            </BaseAccordion.Trigger>
          </BaseAccordion.Header>
          <BaseAccordion.Panel className="m-painel">
            <div className={cx("text-base leading-relaxed text-foreground", variant === "separated" ? "px-4 pb-4 sm:px-5" : "px-1 pb-4")}>{it.content}</div>
          </BaseAccordion.Panel>
        </BaseAccordion.Item>
      ))}
    </BaseAccordion.Root>
  );
}

// ─── Collapsible ──────────────────────────────────────────────────────────

export function Collapsible({
  label,
  openLabel,
  children,
  open,
  defaultOpen,
  onOpenChange,
  className,
}: {
  /** "Mostrar detalhes" */
  label: ReactNode;
  /** "Esconder detalhes" (default: same as label). */
  openLabel?: ReactNode;
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}) {
  return (
    <BaseCollapsible.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange ? (a) => onOpenChange(a) : undefined} className={className}>
      <BaseCollapsible.Trigger className="group inline-flex min-h-11 items-center gap-1.5 rounded-md text-base font-medium text-brand underline-offset-4 hover:underline">
        <ChevronDown aria-hidden size={18} className="m-seta group-data-[panel-open]:rotate-180" />
        <span className="group-data-[panel-open]:hidden">{label}</span>
        <span className="hidden group-data-[panel-open]:inline">{openLabel ?? label}</span>
      </BaseCollapsible.Trigger>
      <BaseCollapsible.Panel className="m-painel">
        <div className="pt-2">{children}</div>
      </BaseCollapsible.Panel>
    </BaseCollapsible.Root>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────

export interface TabItem {
  value: string;
  label: ReactNode;
  icon?: ReactNode;
  /** A count next to the label ("Inscrições 128"). */
  count?: number;
  content: ReactNode;
  disabled?: boolean;
}

export function Tabs({
  tabs,
  value,
  defaultValue,
  onValueChange,
  variant = "line",
  label,
  keepMounted = false,
  className,
}: {
  tabs: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** "line": under a page header (the app accent marks the tab). "pill": inside a card or a panel. */
  variant?: "line" | "pill";
  /** Spoken name of the tab list ("Secções do evento"). */
  label: string;
  /** Keep hidden panels in the DOM (forms whose state must survive). */
  keepMounted?: boolean;
  className?: string;
}) {
  return (
    <BaseTabs.Root
      value={value}
      defaultValue={defaultValue ?? tabs[0]?.value}
      onValueChange={onValueChange ? (v) => onValueChange(v as string) : undefined}
      className={cx("flex min-w-0 flex-col gap-5", className)}
    >
      <BaseTabs.List aria-label={label} className={variant === "line" ? "m-tabs-linha m-scroll-x" : "m-tabs-pilula"}>
        {tabs.map((t) => (
          <BaseTabs.Tab key={t.value} value={t.value} disabled={t.disabled} className="m-tab [&_svg]:size-[1.125rem]">
            {t.icon}
            {t.label}
            {t.count !== undefined && (
              <span className="rounded-full bg-muted px-2 py-px text-sm font-medium text-muted-foreground tabular-nums">{formatarNumero(t.count, { casas: 0 })}</span>
            )}
          </BaseTabs.Tab>
        ))}
        {variant === "line" && <BaseTabs.Indicator className="m-tabs-indicador" />}
      </BaseTabs.List>
      {tabs.map((t) => (
        <BaseTabs.Panel key={t.value} value={t.value} keepMounted={keepMounted} className="min-w-0 outline-none focus-visible:rounded-lg focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring">
          {t.content}
        </BaseTabs.Panel>
      ))}
    </BaseTabs.Root>
  );
}

// ─── URL sync ─────────────────────────────────────────────────────────────

const EVENTO_URL = "mutual:url";
function subscrever(aoMudar: () => void) {
  window.addEventListener("popstate", aoMudar);
  window.addEventListener(EVENTO_URL, aoMudar);
  return () => {
    window.removeEventListener("popstate", aoMudar);
    window.removeEventListener(EVENTO_URL, aoMudar);
  };
}

/**
 * A value kept in the query string (`?separador=inscricoes`), for tabs,
 * segmented views and filters. Uses `history.replaceState` (no navigation,
 * no scroll jump, Next's `useSearchParams` stays in sync). Server-rendered
 * pages render `fallback` first, then the value in the address.
 *
 * ```tsx
 * const [separador, setSeparador] = useUrlParam("separador", "resumo", ["resumo", "inscricoes"]);
 * <Tabs label="Secções do evento" value={separador} onValueChange={setSeparador} tabs={…} />
 * ```
 */
export function useUrlParam<T extends string>(name: string, fallback: T, allowed?: readonly T[]): [T, (value: T) => void] {
  const ler = () => {
    const v = new URLSearchParams(window.location.search).get(name);
    return v !== null && (!allowed || allowed.includes(v as T)) ? (v as T) : fallback;
  };
  const valor = useSyncExternalStore(subscrever, ler, () => fallback);
  const definir = useCallback(
    (v: T) => {
      const url = new URL(window.location.href);
      if (v === fallback) url.searchParams.delete(name);
      else url.searchParams.set(name, v);
      window.history.replaceState(window.history.state, "", url);
      window.dispatchEvent(new Event(EVENTO_URL));
    },
    [name, fallback],
  );
  return [valor, definir];
}
