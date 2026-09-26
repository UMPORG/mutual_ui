import {
  cloneElement,
  isValidElement,
  useId,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { AlertCircle, ChevronDown } from "lucide-react";
import { cx } from "./cx";
import { formatarNumero } from "./formatar";

/**
 * Form fields (v0.7): one wrapper for label, hint, error, required/optional
 * and a character count, plus the three native controls with the MUTU@L
 * look. Works with react-hook-form (`{...register("nome")}`), with zod
 * messages, with server actions and with plain `<form>`s — the wrapper only
 * wires ids and ARIA; it never owns the value.
 *
 * Server-safe (useId only).
 */

/** Props the wrapper hands to its control. */
export interface FieldControlProps {
  id: string;
  "aria-describedby"?: string | undefined;
  "aria-invalid"?: true | undefined;
  "aria-required"?: true | undefined;
}

export interface FormFieldProps {
  label: ReactNode;
  /** A short explanation, only when the meaning is not obvious. */
  hint?: ReactNode;
  /** The validation message (e.g. `errors.nome?.message`). Shown with an icon. */
  error?: ReactNode;
  /** Marks the field as required (a "*" and "obrigatório" for screen readers). */
  required?: boolean;
  /** Shows "(opcional)" — mark whichever is the minority on the form. */
  optional?: boolean;
  /** Character count: "120 de 500". Pass the current length and the limit. */
  count?: { value: number; max: number } | undefined;
  /** Id for the control (default: generated). */
  id?: string;
  /** Visually hide the label (it stays for screen readers). */
  hideLabel?: boolean;
  className?: string;
  /**
   * The control: an element (it receives id and ARIA props) or a function
   * `(props) => <input {...props} {...register("x")} />`.
   */
  children: ReactElement | ((props: FieldControlProps) => ReactNode);
}

export function FormField({
  label,
  hint,
  error,
  required,
  optional,
  count,
  id,
  hideLabel,
  className,
  children,
}: FormFieldProps) {
  const auto = useId();
  const campoId = id ?? `campo-${auto}`;
  const hintId = hint ? `${campoId}-ajuda` : undefined;
  const erroId = error ? `${campoId}-erro` : undefined;
  const contaId = count ? `${campoId}-conta` : undefined;
  const describedBy = [erroId, hintId, contaId].filter(Boolean).join(" ") || undefined;
  const controlo: FieldControlProps = {
    id: campoId,
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : undefined,
    "aria-required": required ? true : undefined,
  };
  let corpo: ReactNode;
  if (typeof children === "function") corpo = children(controlo);
  else if (isValidElement(children)) {
    const proprias = children.props as Record<string, unknown>;
    corpo = cloneElement(children as ReactElement<Record<string, unknown>>, {
      ...controlo,
      id: (proprias.id as string | undefined) ?? campoId,
      "aria-describedby": [describedBy, proprias["aria-describedby"]].filter(Boolean).join(" ") || undefined,
    });
  } else corpo = children;

  const excedido = count ? count.value > count.max : false;
  const perto = count ? count.value >= count.max * 0.9 : false;

  return (
    <div className={cx("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={campoId} className={cx("flex flex-wrap items-baseline gap-x-1.5 text-base font-medium", hideLabel && "sr-only")}>
        {label}
        <Marca required={required} optional={optional} />
      </label>
      {hint && (
        <p id={hintId} className="-mt-0.5 text-[0.9375rem] text-muted-foreground">
          {hint}
        </p>
      )}
      {corpo}
      {(error || count) && (
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          {error ? (
            <p id={erroId} className="flex items-start gap-1.5 text-[0.9375rem] font-medium text-destructive">
              <AlertCircle aria-hidden size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </p>
          ) : (
            <span />
          )}
          {count && (
            <p
              id={contaId}
              aria-live={perto ? "polite" : "off"}
              className={cx("ml-auto text-sm tabular-nums", excedido ? "font-semibold text-destructive" : "text-muted-foreground")}
            >
              {formatarNumero(count.value, { casas: 0 })} de {formatarNumero(count.max, { casas: 0 })}
              <span className="sr-only"> caracteres</span>
              {excedido && <span> — texto demasiado longo</span>}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * The "*" / "(opcional)" mark after a label or legend. The label is a flex
 * row (the gap does the visual spacing), but the accessible name is built from
 * the text, so each mark carries its own leading space — otherwise the name
 * would be "Nome(opcional)". The space lives inside a span (a bare whitespace
 * text node between flex items is dropped from layout, and some browsers drop
 * it from the name too).
 */
function Marca({ required, optional }: { required?: boolean | undefined; optional?: boolean | undefined }) {
  if (required)
    return (
      <>
        {/* The "*" is generated content so it stays out of the label's text:
            getByLabel("Nome (obrigatório)") and screen readers both get
            "Nome (obrigatório)". */}
        <span aria-hidden className="text-destructive after:content-['*']" />
        <span className="sr-only">{" (obrigatório)"}</span>
      </>
    );
  if (optional)
    return (
      <span className="text-[0.9375rem] font-normal text-muted-foreground">
        <span className="sr-only"> </span>(opcional)
      </span>
    );
  return null;
}

/**
 * A group of related controls (radio group, checkboxes, a date range) with a
 * legend, hint and error — the grouping version of `FormField`.
 */
export function Fieldset({
  legend,
  hint,
  error,
  required,
  children,
  className,
  hideLegend,
}: {
  legend: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
  hideLegend?: boolean;
}) {
  const id = useId();
  const hintId = hint ? `${id}-ajuda` : undefined;
  const erroId = error ? `${id}-erro` : undefined;
  return (
    <fieldset
      aria-describedby={[erroId, hintId].filter(Boolean).join(" ") || undefined}
      aria-invalid={error ? true : undefined}
      className={cx("flex min-w-0 flex-col gap-2 border-0 p-0", className)}
    >
      <legend className={cx("mb-1 flex flex-wrap items-baseline gap-x-1.5 p-0 text-base font-medium", hideLegend && "sr-only")}>
        {legend}
        <Marca required={required} />
      </legend>
      {hint && (
        <p id={hintId} className="-mt-1 text-[0.9375rem] text-muted-foreground">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={erroId} className="flex items-start gap-1.5 text-[0.9375rem] font-medium text-destructive">
          <AlertCircle aria-hidden size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </fieldset>
  );
}

// ─── Native controls with the MUTU@L look ─────────────────────────────────

const CAMPO = "m-field w-full min-w-0 rounded-lg text-base text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60";

/** Text input (`m-field`, 44px). Pass-through: works with `register()`. */
export function Input({
  className,
  ref,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  return <input ref={ref} className={cx(CAMPO, "h-11 px-3", className)} {...props} />;
}

/** Multi-line text. `autoSize` grows with the text (CSS `field-sizing`, where supported). */
export function Textarea({
  className,
  autoSize,
  ref,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { autoSize?: boolean; ref?: Ref<HTMLTextAreaElement> }) {
  return (
    <textarea
      ref={ref}
      className={cx(CAMPO, "min-h-24 px-3 py-2.5 leading-relaxed", autoSize && "[field-sizing:content]", className)}
      {...props}
    />
  );
}

/**
 * The native `<select>` with the MUTU@L look. Prefer it over `Select` for
 * long plain lists on phones (the OS picker is the best there), inside GET
 * filter forms of server pages, and wherever no JavaScript is wanted.
 */
export function NativeSelect({
  className,
  children,
  ref,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { ref?: Ref<HTMLSelectElement> }) {
  return (
    <span className={cx("relative flex min-w-0", className)}>
      <select ref={ref} className={cx(CAMPO, "h-11 appearance-none py-0 pr-10 pl-3")} {...props}>
        {children}
      </select>
      <ChevronDown aria-hidden size={18} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" />
    </span>
  );
}
