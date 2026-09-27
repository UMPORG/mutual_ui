"use client";

import type { ElementType, ReactElement, ReactNode } from "react";
import { Menu } from "@base-ui/react/menu";
import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu";
import { Check, ChevronRight } from "lucide-react";
import { cx } from "./cx";
import { CLASSE_FLUTUANTE, CLASSE_POSICIONADOR } from "./controlos-comum";

/**
 * Menus of actions (v0.7), built on Base UI Menu:
 *
 * - `DropdownMenu` — the "⋯"/"Ações" button of a row, card or page header.
 * - `ContextMenu` — the same items on right-click / long-press of an area.
 *   Always offer the same actions another way too (a visible button):
 *   context menus are hard to discover.
 *
 * Items are data, so every menu in every app looks and behaves the same.
 * Menus are for actions and view options — not for navigation (use links)
 * and not for choosing a form value (use Select).
 */

export type MenuEntry =
  | {
      type?: "item" | undefined;
      label: string;
      icon?: ReactNode | undefined;
      /** Secondary text under the label. */
      description?: string | undefined;
      /** Shown on the right in help style (e.g. "Ctrl + E"); informative only. */
      shortcut?: string | undefined;
      onSelect?: (() => void) | undefined;
      /** Red, for "Eliminar". Put it last, after a separator. */
      destructive?: boolean | undefined;
      disabled?: boolean | undefined;
      /** Keep the menu open after choosing (e.g. "Copiar"). */
      keepOpen?: boolean | undefined;
    }
  | { type: "link"; label: string; href: string; icon?: ReactNode | undefined; external?: boolean | undefined }
  | { type: "separator" }
  | { type: "group"; label: string; items: MenuEntry[] }
  | { type: "checkbox"; label: string; checked: boolean; onCheckedChange: (checked: boolean) => void; disabled?: boolean | undefined }
  | {
      type: "radio";
      label: string;
      value: string;
      onValueChange: (value: string) => void;
      options: Array<{ value: string; label: string; disabled?: boolean | undefined }>;
    }
  | { type: "submenu"; label: string; icon?: ReactNode | undefined; items: MenuEntry[]; disabled?: boolean | undefined };

function Entradas({ items, LinkComponent }: { items: MenuEntry[]; LinkComponent: ElementType }) {
  return (
    <>
      {items.map((e, i) => {
        const chave = `${e.type ?? "item"}-${"label" in e ? e.label : i}-${i}`;
        switch (e.type) {
          case "separator":
            return <Menu.Separator key={chave} className="m-item-separador" />;
          case "group":
            return (
              <Menu.Group key={chave}>
                <Menu.GroupLabel className="m-item-rotulo">{e.label}</Menu.GroupLabel>
                <Entradas items={e.items} LinkComponent={LinkComponent} />
              </Menu.Group>
            );
          case "link": {
            const L = LinkComponent;
            return (
              <Menu.LinkItem
                key={chave}
                className="m-item"
                render={
                  <L
                    href={e.href}
                    {...(e.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  />
                }
              >
                {e.icon}
                <span className="min-w-0 flex-1 truncate">{e.label}</span>
                {e.external && <span className="sr-only">(abre noutro separador)</span>}
              </Menu.LinkItem>
            );
          }
          case "checkbox":
            return (
              <Menu.CheckboxItem
                key={chave}
                checked={e.checked}
                onCheckedChange={(v) => e.onCheckedChange(v)}
                disabled={e.disabled}
                closeOnClick={false}
                className="m-item"
              >
                <span aria-hidden className="m-check m-check-menu size-5">
                  <Menu.CheckboxItemIndicator>
                    <Check size={14} strokeWidth={3} />
                  </Menu.CheckboxItemIndicator>
                </span>
                <span className="min-w-0 flex-1">{e.label}</span>
              </Menu.CheckboxItem>
            );
          case "radio":
            return (
              <Menu.Group key={chave}>
                <Menu.GroupLabel className="m-item-rotulo">{e.label}</Menu.GroupLabel>
                <Menu.RadioGroup value={e.value} onValueChange={(v) => e.onValueChange(v as string)}>
                  {e.options.map((o) => (
                    <Menu.RadioItem key={o.value} value={o.value} disabled={o.disabled} closeOnClick={false} className="m-item">
                      <span aria-hidden className="grid size-5 shrink-0 place-items-center">
                        <Menu.RadioItemIndicator>
                          <span className="block size-2 rounded-full bg-brand" />
                        </Menu.RadioItemIndicator>
                      </span>
                      <span className="min-w-0 flex-1">{o.label}</span>
                    </Menu.RadioItem>
                  ))}
                </Menu.RadioGroup>
              </Menu.Group>
            );
          case "submenu":
            return (
              <Menu.SubmenuRoot key={chave}>
                <Menu.SubmenuTrigger disabled={e.disabled} className="m-item data-[popup-open]:bg-accent">
                  {e.icon}
                  <span className="min-w-0 flex-1">{e.label}</span>
                  <ChevronRight aria-hidden size={18} className="ml-auto" />
                </Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner sideOffset={4} alignOffset={-6} className={CLASSE_POSICIONADOR}>
                    <Menu.Popup className={cx(CLASSE_FLUTUANTE, "max-h-[var(--available-height)] min-w-52 max-w-[min(22rem,var(--available-width))] overflow-y-auto p-1.5")}>
                      <Entradas items={e.items} LinkComponent={LinkComponent} />
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.SubmenuRoot>
            );
          default:
            return (
              <Menu.Item
                key={chave}
                onClick={() => e.onSelect?.()}
                disabled={e.disabled}
                closeOnClick={!e.keepOpen}
                className={cx("m-item", e.destructive && "m-item-perigo")}
              >
                {e.icon}
                <span className="flex min-w-0 flex-1 flex-col">
                  <span>{e.label}</span>
                  {e.description && <span className="text-sm text-muted-foreground">{e.description}</span>}
                </span>
                {e.shortcut && <span className="m-item-atalho">{e.shortcut}</span>}
              </Menu.Item>
            );
        }
      })}
    </>
  );
}

export interface DropdownMenuProps {
  /** The button that opens the menu (e.g. `<Button variant="outline">Ações</Button>`). */
  trigger: ReactElement;
  items: MenuEntry[];
  side?: "top" | "bottom" | "left" | "right" | undefined;
  align?: "start" | "center" | "end" | undefined;
  /** Next's `Link` for `type: "link"` entries. */
  LinkComponent?: ElementType | undefined;
  open?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  className?: string | undefined;
}

export function DropdownMenu({ trigger, items, side = "bottom", align = "start", LinkComponent = "a", open, onOpenChange, className }: DropdownMenuProps) {
  return (
    <Menu.Root open={open} onOpenChange={onOpenChange ? (a) => onOpenChange(a) : undefined}>
      <Menu.Trigger render={trigger} />
      <Menu.Portal>
        <Menu.Positioner side={side} align={align} sideOffset={6} className={CLASSE_POSICIONADOR}>
          <Menu.Popup className={cx(CLASSE_FLUTUANTE, "max-h-[var(--available-height)] min-w-56 max-w-[min(22rem,var(--available-width))] overflow-y-auto p-1.5", className)}>
            <Entradas items={items} LinkComponent={LinkComponent} />
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

export interface ContextMenuProps {
  /** The area that reacts to right-click / long-press. */
  children: ReactNode;
  items: MenuEntry[];
  LinkComponent?: ElementType | undefined;
  className?: string | undefined;
}

export function ContextMenu({ children, items, LinkComponent = "a", className }: ContextMenuProps) {
  return (
    <BaseContextMenu.Root>
      <BaseContextMenu.Trigger className={className}>{children}</BaseContextMenu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={CLASSE_POSICIONADOR}>
          <Menu.Popup className={cx(CLASSE_FLUTUANTE, "max-h-[var(--available-height)] min-w-56 max-w-[min(22rem,var(--available-width))] overflow-y-auto p-1.5")}>
            <Entradas items={items} LinkComponent={LinkComponent} />
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </BaseContextMenu.Root>
  );
}
