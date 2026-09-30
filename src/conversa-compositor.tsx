"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUp, FileText, Loader2, Paperclip, Square, X } from "lucide-react";
import { cx } from "./cx";
import { Kbd } from "./basicos";
import { formatarNumero } from "./formatar";
import { teclaEnvia } from "./conversa-dados";

/**
 * Composer (v0.7): where the person writes to the assistant.
 *
 * - Grows with the text up to ~8 lines, then scrolls.
 * - Enter sends, Shift + Enter starts a new line (IME-safe).
 * - While a reply is being written, "Parar" replaces "Enviar"; the text
 *   already typed is kept.
 * - Character limit with a counter from 80%; sending is blocked above it.
 * - An attachments slot (`attachments`) and a leading actions slot
 *   (`actions`, e.g. an "Anexar" button) for later.
 * - Focus stays in the text box after sending and after "Parar".
 */
export interface ComposerProps {
  onSubmit: (text: string) => void;
  /** Stops the reply being written. */
  onStop?: (() => void) | undefined;
  /** A reply is being written (shows "Parar"). */
  streaming?: boolean | undefined;
  /** Controlled text (optional). */
  value?: string | undefined;
  onValueChange?: ((text: string) => void) | undefined;
  placeholder?: string | undefined;
  /** Default 4000 characters. */
  maxLength?: number | undefined;
  disabled?: boolean | undefined;
  /** Why it is disabled, shown under the box ("Sem ligação. A tentar de novo…"). */
  disabledReason?: ReactNode | undefined;
  /** Chips of attached files (AttachmentChip). */
  attachments?: ReactNode | undefined;
  /** Buttons at the bottom-left (e.g. "Anexar ficheiro"). */
  actions?: ReactNode | undefined;
  /** Line under the box. Default: the reminder to confirm important data. `false` hides it. */
  disclaimer?: ReactNode | false | undefined;
  /** Spoken name of the text box. */
  label?: string | undefined;
  autoFocus?: boolean | undefined;
  className?: string | undefined;
}

export function Composer({
  onSubmit,
  onStop,
  streaming = false,
  value,
  onValueChange,
  placeholder = "Escreva a sua pergunta",
  maxLength = 4000,
  disabled,
  disabledReason,
  attachments,
  actions,
  disclaimer = "As respostas podem conter erros. Confirme a informação importante.",
  label = "Mensagem para o assistente",
  autoFocus,
  className,
}: ComposerProps) {
  const [interno, setInterno] = useState("");
  const texto = value ?? interno;
  const definir = (t: string) => {
    if (value === undefined) setInterno(t);
    onValueChange?.(t);
  };
  const ref = useRef<HTMLTextAreaElement>(null);
  const ajudaId = useId();
  const contaId = useId();
  const n = texto.length;
  const excedido = n > maxLength;
  const mostrarConta = n >= maxLength * 0.8;
  const podeEnviar = !disabled && !streaming && texto.trim().length > 0 && !excedido;

  // Auto-size: grow with the content up to max-height (CSS), then scroll.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [texto]);
  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  const enviar = () => {
    if (!podeEnviar) return;
    onSubmit(texto.trim());
    definir("");
    ref.current?.focus();
  };

  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <form
        className={cx("m-compositor flex flex-col rounded-2xl", disabled && "opacity-70")}
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
      >
        {attachments && <div className="flex flex-wrap gap-2 px-3 pt-3">{attachments}</div>}
        <label className="sr-only" htmlFor={`${ajudaId}-campo`}>
          {label}
        </label>
        <textarea
          ref={ref}
          id={`${ajudaId}-campo`}
          rows={1}
          value={texto}
          onChange={(e) => definir(e.target.value)}
          onKeyDown={(e) => {
            if (teclaEnvia({ key: e.key, shiftKey: e.shiftKey, altKey: e.altKey, isComposing: e.nativeEvent.isComposing, keyCode: e.keyCode })) {
              e.preventDefault();
              enviar();
            } else if (e.key === "Escape" && streaming && onStop) {
              e.preventDefault();
              onStop();
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          aria-describedby={[ajudaId, mostrarConta ? contaId : ""].filter(Boolean).join(" ")}
          aria-invalid={excedido || undefined}
          className="max-h-[min(14rem,40dvh)] min-h-14 w-full resize-none bg-transparent px-4 pt-3.5 pb-1 text-base leading-relaxed outline-none placeholder:text-muted-foreground"
        />
        <div className="flex items-center gap-2 px-2 pb-2">
          <div className="flex min-w-0 flex-1 items-center gap-1">{actions}</div>
          {mostrarConta && (
            <span id={contaId} aria-live="polite" className={cx("text-sm tabular-nums", excedido ? "font-semibold text-destructive" : "text-muted-foreground")}>
              {formatarNumero(n, { casas: 0 })} de {formatarNumero(maxLength, { casas: 0 })}
              <span className="sr-only"> caracteres</span>
              {excedido && <span> — texto demasiado longo</span>}
            </span>
          )}
          {streaming && onStop ? (
            <button
              type="button"
              onClick={() => {
                onStop();
                ref.current?.focus();
              }}
              aria-label="Parar resposta"
              title="Parar resposta"
              className="m-btn m-btn-outline grid size-10 shrink-0 place-items-center rounded-full"
            >
              <Square aria-hidden size={14} fill="currentColor" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!podeEnviar}
              aria-label="Enviar mensagem"
              title="Enviar mensagem"
              className="m-btn m-btn-primary grid size-10 shrink-0 place-items-center rounded-full disabled:opacity-40 disabled:shadow-none"
            >
              <ArrowUp aria-hidden size={20} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-1 text-sm text-muted-foreground">
        <p id={ajudaId} className="max-sm:sr-only">
          <Kbd>Enter</Kbd> para enviar, <Kbd keys={["Shift", "Enter"]} /> para mudar de linha
          {streaming && onStop ? (
            <>
              , <Kbd>Esc</Kbd> para parar
            </>
          ) : null}
          .
        </p>
        {disabled && disabledReason ? <p role="status">{disabledReason}</p> : disclaimer ? <p>{disclaimer}</p> : null}
      </div>
    </div>
  );
}

/** A file attached to the next message. */
export function AttachmentChip({
  name,
  size,
  status = "pronto",
  onRemove,
}: {
  name: string;
  /** Bytes. */
  size?: number | undefined;
  status?: "a-carregar" | "pronto" | "erro" | undefined;
  onRemove?: (() => void) | undefined;
}) {
  const tamanho =
    size === undefined ? null : size < 1024 * 1024 ? `${formatarNumero(Math.max(1, Math.round(size / 1024)), { casas: 0 })} KB` : `${formatarNumero(size / 1024 / 1024, { casas: 1 })} MB`;
  return (
    <span
      className={cx(
        "inline-flex max-w-full items-center gap-2 rounded-lg border py-1 pr-1 pl-2 text-[0.9375rem]",
        status === "erro" ? "border-destructive/40 bg-destructive-soft text-destructive-soft-foreground" : "border-border bg-card",
      )}
    >
      {status === "a-carregar" ? <Loader2 aria-hidden size={16} className="m-spinner shrink-0" /> : <FileText aria-hidden size={16} className="shrink-0 text-muted-foreground" />}
      <span className="min-w-0 truncate">{name}</span>
      {tamanho && <span className="shrink-0 text-sm text-muted-foreground tabular-nums">{tamanho}</span>}
      <span className="sr-only">{status === "a-carregar" ? "(a carregar)" : status === "erro" ? "(não foi possível anexar)" : ""}</span>
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Remover ${name}`} className="grid size-7 shrink-0 place-items-center rounded text-muted-foreground hover:bg-foreground/10 hover:text-foreground">
          <X aria-hidden size={15} />
        </button>
      )}
    </span>
  );
}

/**
 * «Anexar documento» for the Composer's `actions` slot (v0.17): opens the file
 * picker; the app uploads the files and shows them as `AttachmentChip`s.
 */
export function AttachButton({
  onFiles,
  accept,
  multiple = true,
  disabled,
  label = "Anexar documento",
}: {
  onFiles: (files: File[]) => void;
  /** e.g. ".pdf,.docx,.xlsx,.csv,.jpg,.jpeg,.png" */
  accept?: string | undefined;
  multiple?: boolean | undefined;
  disabled?: boolean | undefined;
  label?: string | undefined;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={disabled}
        aria-label={label}
        title={label}
        className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-foreground/8 hover:text-foreground disabled:opacity-40"
      >
        <Paperclip aria-hidden size={19} />
      </button>
      <input
        ref={ref}
        type="file"
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        accept={accept}
        multiple={multiple}
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = "";
          if (files.length > 0) onFiles(files);
        }}
      />
    </>
  );
}
