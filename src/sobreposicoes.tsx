"use client";

import { useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from "react";
import { Popover as BasePopover } from "@base-ui/react/popover";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { X } from "lucide-react";
import { cx } from "./cx";
import { Button } from "./basicos";
import { StatusCallout } from "./feedback";
import { CLASSE_FLUTUANTE, CLASSE_POSICIONADOR } from "./controlos-comum";

/**
 * Layers over the page, built on Base UI: Tooltip, Popover, Dialog,
 * ConfirmDialog (with the typed-confirmation variant) and Sheet.
 *
 * - Tooltip: a short name for an icon-only button. Never essential
 *   information (touch screens have no hover) and never interactive.
 * - Popover: a small panel tied to a button (a filter, a detail, a colour
 *   picker). Interactive content is fine.
 * - Dialog: a task that must be finished or cancelled before going on.
 * - ConfirmDialog: the one confirmation pattern (Eliminar, Revogar…).
 * - Sheet: a side panel for details or a secondary form next to a list.
 */

// ─── Tooltip ──────────────────────────────────────────────────────────────

/** Wrap the app (or a toolbar) once so neighbouring tooltips open instantly after the first. */
export function TooltipProvider({ children, delay = 500 }: { children: ReactNode; delay?: number | undefined }) {
  return <BaseTooltip.Provider delay={delay}>{children}</BaseTooltip.Provider>;
}

export function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
}: {
  content: ReactNode;
  /** The trigger — usually an icon-only `Button` with the same `aria-label`. */
  children: ReactElement;
  side?: "top" | "bottom" | "left" | "right" | undefined;
  align?: "start" | "center" | "end" | undefined;
}) {
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side={side} align={align} sideOffset={8} className={CLASSE_POSICIONADOR}>
          <BaseTooltip.Popup className="m-dica m-pop">{content}</BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}

// ─── Popover ──────────────────────────────────────────────────────────────

export function Popover({
  trigger,
  title,
  description,
  children,
  side = "bottom",
  align = "start",
  open,
  onOpenChange,
  className,
  showClose = false,
}: {
  trigger: ReactElement;
  /** Heading of the panel (names it for screen readers). */
  title?: ReactNode | undefined;
  description?: ReactNode | undefined;
  children?: ReactNode | undefined;
  side?: "top" | "bottom" | "left" | "right" | undefined;
  align?: "start" | "center" | "end" | undefined;
  open?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  className?: string | undefined;
  /** A "Fechar" button in the corner (for panels with a lot inside). */
  showClose?: boolean | undefined;
}) {
  return (
    <BasePopover.Root open={open} onOpenChange={onOpenChange ? (a) => onOpenChange(a) : undefined}>
      <BasePopover.Trigger render={trigger} />
      <BasePopover.Portal>
        <BasePopover.Positioner side={side} align={align} sideOffset={8} collisionPadding={16} className={CLASSE_POSICIONADOR}>
          <BasePopover.Popup className={cx(CLASSE_FLUTUANTE, "relative w-80 max-w-[var(--available-width)] p-4", className)}>
            {showClose && (
              <BasePopover.Close aria-label="Fechar" className="absolute top-2 right-2 grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-foreground/8 hover:text-foreground">
                <X aria-hidden size={18} />
              </BasePopover.Close>
            )}
            {title && <BasePopover.Title className={cx("text-base font-semibold", showClose && "pr-8")}>{title}</BasePopover.Title>}
            {description && <BasePopover.Description className="mt-1 text-[0.9375rem] text-muted-foreground">{description}</BasePopover.Description>}
            {children && <div className={(title || description) ? "mt-3" : undefined}>{children}</div>}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}

// ─── Dialog ───────────────────────────────────────────────────────────────

const LARGURA = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" } as const;

export interface DialogProps {
  open?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** Button that opens it (uncontrolled use). */
  trigger?: ReactElement | undefined;
  title: ReactNode;
  description?: ReactNode | undefined;
  children?: ReactNode | undefined;
  /** Buttons row; primary action last. */
  footer?: ReactNode | undefined;
  size?: keyof typeof LARGURA | undefined;
  /** Close by clicking outside (default true). Turn off for forms with data. */
  dismissible?: boolean | undefined;
  /** Element to focus first (default: the first focusable one). */
  initialFocus?: React.RefObject<HTMLElement | null> | undefined;
  className?: string | undefined;
}

/** Body + footer for dialogs and sheets: the body scrolls, the footer stays. */
function Moldura({ title, description, children, footer, fechar = true, Title, Description, Close }: {
  title: ReactNode;
  description?: ReactNode | undefined;
  children?: ReactNode | undefined;
  footer?: ReactNode | undefined;
  fechar?: boolean | undefined;
  Title: typeof BaseDialog.Title;
  Description: typeof BaseDialog.Description;
  Close: typeof BaseDialog.Close;
}) {
  return (
    <>
      <div className="flex items-start gap-3 px-5 pt-5 pb-3 sm:px-6 sm:pt-6">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Title className="text-xl leading-tight font-semibold tracking-tight text-balance">{title}</Title>
          {description && <Description className="text-base text-muted-foreground">{description}</Description>}
        </div>
        {fechar && (
          <Close aria-label="Fechar" className="-mt-1.5 -mr-2 grid size-11 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-foreground/8 hover:text-foreground">
            <X aria-hidden size={20} />
          </Close>
        )}
      </div>
      {children && <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 text-base sm:px-6">{children}</div>}
      {footer && (
        <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/50 px-5 py-4 sm:flex-row sm:flex-wrap sm:justify-end sm:px-6 [&>*]:w-full sm:[&>*]:w-auto">
          {footer}
        </div>
      )}
    </>
  );
}

export function Dialog({ open, onOpenChange, trigger, title, description, children, footer, size = "md", dismissible = true, initialFocus, className }: DialogProps) {
  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange ? (a) => onOpenChange(a) : undefined} disablePointerDismissal={!dismissible}>
      {trigger && <BaseDialog.Trigger render={trigger} />}
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="m-backdrop z-50" />
        <BaseDialog.Popup
          initialFocus={initialFocus}
          className={cx(
            CLASSE_FLUTUANTE.replace("m-pop", "m-dialog"),
            "fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden",
            LARGURA[size],
            className,
          )}
        >
          <Moldura title={title} description={description} footer={footer} Title={BaseDialog.Title} Description={BaseDialog.Description} Close={BaseDialog.Close}>
            {children}
          </Moldura>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

/** A button that closes the dialog it sits in ("Cancelar"). */
export function DialogClose({ children = "Cancelar", variant = "outline" as const }: { children?: ReactNode | undefined; variant?: "outline" | "ghost" | undefined }) {
  return <BaseDialog.Close render={<Button variant={variant} />}>{children}</BaseDialog.Close>;
}

// ─── ConfirmDialog ────────────────────────────────────────────────────────

const PROTECAO_DUPLO_CLIQUE_MS = 400;

export interface ConfirmDialogProps {
  open: boolean;
  /** "Cancelar", Escape and the close button. */
  onCancel: () => void;
  onConfirm: () => void;
  title: ReactNode;
  /** What will happen, in plain words, and whether it can be undone. */
  description?: ReactNode | undefined;
  /** The verb: "Eliminar", "Revogar", "Aprovar". Never "OK" or "Sim". */
  confirmLabel: string;
  cancelLabel?: string | undefined;
  /** "danger" (default): red confirm button. "default": brand button. */
  tone?: "danger" | "default" | undefined;
  /** Disables the buttons and shows a spinner while the action runs. */
  pending?: boolean | undefined;
  /** Error of the action — it stays in the dialog, not in a toast. */
  error?: ReactNode | undefined;
  /**
   * Typed confirmation for actions that are hard to undo (delete a DNS
   * zone, revoke all accesses): the person must type this exact text.
   */
  confirmText?: string | undefined;
  /** Label of the typed-confirmation field. Default: "Para confirmar, escreva «…»". */
  confirmTextLabel?: ReactNode | undefined;
  children?: ReactNode | undefined;
}

/**
 * The one confirmation dialog. A separate dialog, never a button that
 * changes its label on the first click; the focus starts on "Cancelar" (or
 * on the typed-confirmation field) so a habitual Enter does not confirm; a
 * double-click on the button that opened it is ignored.
 */
export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  tone = "danger",
  pending = false,
  error,
  confirmText,
  confirmTextLabel,
  children,
}: ConfirmDialogProps) {
  const cancelarRef = useRef<HTMLButtonElement>(null);
  const campoRef = useRef<HTMLInputElement>(null);
  const abertoEm = useRef(0);
  const [escrito, setEscrito] = useState("");
  const campoId = useId();
  useEffect(() => {
    if (open) {
      abertoEm.current = Date.now();
      setEscrito("");
    }
  }, [open]);
  const certo = !confirmText || escrito.trim() === confirmText;
  const confirmar = () => {
    if (Date.now() - abertoEm.current < PROTECAO_DUPLO_CLIQUE_MS || !certo || pending) return;
    onConfirm();
  };
  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(a) => {
        if (!a && !pending) onCancel();
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="m-backdrop z-50" />
        <AlertDialog.Popup
          initialFocus={confirmText ? campoRef : cancelarRef}
          className={cx(
            CLASSE_FLUTUANTE.replace("m-pop", "m-dialog"),
            "fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden",
          )}
        >
          <form
            className="contents"
            onSubmit={(e) => {
              e.preventDefault();
              confirmar();
            }}
          >
            <Moldura
              title={title}
              description={description}
              fechar={false}
              Title={AlertDialog.Title}
              Description={AlertDialog.Description}
              Close={AlertDialog.Close}
              footer={
                <>
                  <Button ref={cancelarRef} variant="outline" onClick={onCancel} disabled={pending}>
                    {cancelLabel}
                  </Button>
                  <Button type="submit" variant={tone === "danger" ? "destructive" : "primary"} pending={pending} disabled={!certo}>
                    {confirmLabel}
                  </Button>
                </>
              }
            >
              {(children || confirmText || error) && (
                <div className="flex flex-col gap-4">
                  {children}
                  {confirmText && (
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor={campoId} className="text-base font-medium">
                        {confirmTextLabel ?? (
                          <>
                            Para confirmar, escreva <strong className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9375rem] select-all">{confirmText}</strong>
                          </>
                        )}
                      </label>
                      <input
                        ref={campoRef}
                        id={campoId}
                        value={escrito}
                        onChange={(e) => setEscrito(e.target.value)}
                        autoComplete="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        disabled={pending}
                        className="m-field h-11 w-full rounded-lg px-3 font-mono text-base outline-none"
                      />
                    </div>
                  )}
                  {error && (
                    <StatusCallout tone="danger" role="alert">
                      {error}
                    </StatusCallout>
                  )}
                </div>
              )}
            </Moldura>
          </form>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

// ─── Sheet ────────────────────────────────────────────────────────────────

export interface SheetProps extends Omit<DialogProps, "size"> {
  /** Where it comes from. "bottom" suits phones (short content). */
  side?: "right" | "left" | "bottom" | undefined;
  /** Width of side sheets. Default "md" (28rem). */
  size?: "sm" | "md" | "lg" | undefined;
}

const LARGURA_LADO = { sm: "sm:max-w-sm", md: "sm:max-w-md", lg: "sm:max-w-2xl" } as const;

export function Sheet({ open, onOpenChange, trigger, title, description, children, footer, side = "right", size = "md", dismissible = true, initialFocus, className }: SheetProps) {
  const baixo = side === "bottom";
  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange ? (a) => onOpenChange(a) : undefined} disablePointerDismissal={!dismissible}>
      {trigger && <BaseDialog.Trigger render={trigger} />}
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="m-backdrop z-50" />
        <BaseDialog.Popup
          initialFocus={initialFocus}
          data-lado={side}
          className={cx(
            "m-sheet fixed z-50 flex flex-col overflow-hidden bg-popover text-popover-foreground shadow-xl outline-none",
            "border-border",
            baixo
              ? "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-2xl border-t"
              : cx("inset-y-0 w-full", LARGURA_LADO[size], side === "right" ? "right-0 border-l" : "left-0 border-r"),
            className,
          )}
        >
          {baixo && <span aria-hidden className="mx-auto mt-2.5 h-1.5 w-12 shrink-0 rounded-full bg-border" />}
          <Moldura title={title} description={description} footer={footer} Title={BaseDialog.Title} Description={BaseDialog.Description} Close={BaseDialog.Close}>
            {children}
          </Moldura>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
