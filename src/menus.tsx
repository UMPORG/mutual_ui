"use client";

import { useEffect, useRef } from "react";
import type { ElementType, FocusEvent as ReactFocusEvent, KeyboardEvent as ReactKeyboardEvent, ReactElement, ReactNode } from "react";
import { Menu } from "@base-ui/react/menu";
import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu";
import { Check, ChevronRight } from "lucide-react";
import { cx } from "./cx";
import { CLASSE_FLUTUANTE, CLASSE_POSICIONADOR } from "./controlos-comum";

/** Action menus on Base UI Menu: `DropdownMenu` (the "⋯"/"Ações" button) and `ContextMenu` (right-click/long-press, or the Menu key/Shift+F10 on the focused element; also offer the same actions visibly, they are hard to discover). For actions and view options, not navigation (links) or form values (Select). */

export type MenuEntry =
  | {
      type?: "item" | undefined;
      label: string;
      icon?: ReactNode | undefined;
      description?: string | undefined;
      /** Shown on the right in help style (e.g. "Ctrl + E"); informative only. */
      shortcut?: string | undefined;
      onSelect?: (() => void) | undefined;
      /** Red, for "Eliminar". Put it last, after a separator. */
      destructive?: boolean | undefined;
      disabled?: boolean | undefined;
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
  trigger: ReactElement;
  items: MenuEntry[];
  side?: "top" | "bottom" | "left" | "right" | undefined;
  align?: "start" | "center" | "end" | undefined;
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
  children: ReactNode;
  items: MenuEntry[];
  LinkComponent?: ElementType | undefined;
  className?: string | undefined;
}

type TeclaPremida = Pick<KeyboardEvent, "key" | "shiftKey" | "ctrlKey" | "altKey" | "metaKey">;

/** The keyboard's context-menu keys: the Menu key, or Shift+F10 (no other modifier). Anything else, including either key alone, is not. */
export function ehTeclaDoMenuDeContexto(e: TeclaPremida): boolean {
  if (e.ctrlKey || e.altKey || e.metaKey) return false;
  return e.key === "ContextMenu" || (e.key === "F10" && e.shiftKey);
}

/** Text fields keep the browser's own menu (paste, spelling) on these keys. */
function ehCampoDeTexto(el: Element): boolean {
  if (el instanceof HTMLElement && el.isContentEditable) return true;
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return true;
  return el instanceof HTMLInputElement && !["button", "checkbox", "radio", "reset", "submit", "image", "range", "color", "file"].includes(el.type);
}

const ITEM_ATIVO = '[role^="menuitem"]:not([aria-disabled="true"]):not([data-disabled])';

export function ContextMenu({ children, items, LinkComponent = "a", className }: ContextMenuProps) {
  const gatilho = useRef<HTMLDivElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  /** Opened from the keyboard: the first item active takes the focus. */
  const pelaTecla = useRef(false);
  /** Ends the guard against the browser's own menu that the same key press may still open. */
  const desarmar = useRef<(() => void) | null>(null);

  useEffect(() => () => desarmar.current?.(), []);

  /**
   * The Menu key or Shift+F10 on the focused element inside the trigger opens the menu at the bottom-left corner of
   * that element, through the primitive's own trigger (a `contextmenu` event, as the browser sends for the Menu key).
   * On Windows the browser may send its own `contextmenu` when the key is released, at the menu that now has the
   * focus: only that one event, aimed at this trigger or this menu, is stopped, until the next key or pointer press.
   */
  function aoPremirTecla(evento: ReactKeyboardEvent<HTMLDivElement>) {
    const alvo = evento.target;
    if (evento.defaultPrevented || !ehTeclaDoMenuDeContexto(evento) || !(alvo instanceof HTMLElement)) return;
    if (!gatilho.current?.contains(alvo) || ehCampoDeTexto(alvo)) return;
    evento.preventDefault();
    desarmar.current?.();
    const caixa = alvo.getBoundingClientRect();
    pelaTecla.current = true;
    alvo.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, button: 2, clientX: caixa.left, clientY: caixa.bottom }));

    const doc = alvo.ownerDocument;
    const travar = (e: MouseEvent) => {
      const t = e.target;
      if (!e.isTrusted || !(t instanceof Node)) return;
      if (gatilho.current?.contains(t) || popup.current?.contains(t)) {
        e.preventDefault();
        e.stopPropagation();
      }
      parar();
    };
    const parar = () => {
      doc.removeEventListener("contextmenu", travar, true);
      doc.removeEventListener("keydown", parar, true);
      doc.removeEventListener("pointerdown", parar, true);
      if (desarmar.current === parar) desarmar.current = null;
    };
    doc.addEventListener("contextmenu", travar, true);
    doc.addEventListener("keydown", parar, true);
    doc.addEventListener("pointerdown", parar, true);
    desarmar.current = parar;
  }

  /** The primitive focuses the popup itself on open; from the keyboard, the focus goes on to the first item active. */
  function aoFocarPopup(evento: ReactFocusEvent<HTMLDivElement>) {
    if (!pelaTecla.current || evento.target !== evento.currentTarget) return;
    pelaTecla.current = false;
    evento.currentTarget.querySelector<HTMLElement>(ITEM_ATIVO)?.focus();
  }

  return (
    <BaseContextMenu.Root
      onOpenChange={(aberto) => {
        if (!aberto) pelaTecla.current = false;
      }}
    >
      <BaseContextMenu.Trigger ref={gatilho} className={className} onKeyDown={aoPremirTecla}>
        {children}
      </BaseContextMenu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={CLASSE_POSICIONADOR}>
          <Menu.Popup ref={popup} onFocus={aoFocarPopup} className={cx(CLASSE_FLUTUANTE, "max-h-[var(--available-height)] min-w-56 max-w-[min(22rem,var(--available-width))] overflow-y-auto p-1.5")}>
            <Entradas items={items} LinkComponent={LinkComponent} />
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </BaseContextMenu.Root>
  );
}
