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
 * One wrapper for label, hint, error, required/optional and a character count, plus the native controls. It only wires ids and ARIA, never owns the value. Server-safe (useId only).
 * Side by side: a grid with `m-campos-alinhados` (+ `m-campos-2|3|4`, per line from 40rem); each field takes four rows (label, hint, control, message)
 * so wrapping text never pushes a neighbour's control. A button of the line (e.g. «Retirar») goes in an element with `m-campos-acao`. See `css/controlos.css`.
 */

export interface FieldControlProps {
  id: string;
  "aria-describedby"?: string | undefined;
  "aria-invalid"?: true | undefined;
  "aria-required"?: true | undefined;
}

export interface FormFieldProps {
  label: ReactNode;
  hint?: ReactNode | undefined;
  error?: ReactNode | undefined;
  /** Marks the field as required (a "*" and "obrigatório" for screen readers). */
  required?: boolean | undefined;
  /** Shows "(opcional)" — mark whichever is the minority on the form. */
  optional?: boolean | undefined;
  /** Character count: "120 de 500". Pass the current length and the limit. */
  count?: { value: number; max: number } | undefined;
  id?: string | undefined;
  hideLabel?: boolean | undefined;
  className?: string | undefined;
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
    <div className={cx("m-campo", className)}>
      <label htmlFor={campoId} className={cx("m-campo-rotulo flex flex-wrap items-baseline gap-x-1.5 text-base font-medium", hideLabel && "sr-only")}>
        {label}
        <Marca required={required} optional={optional} />
      </label>
      {hint && (
        <p id={hintId} className="m-campo-ajuda -mt-0.5 text-[0.9375rem] text-muted-foreground">
          {hint}
        </p>
      )}
      {corpo}
      {(error || count) && (
        <div className="m-campo-mensagem flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
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

/** The "*" / "(opcional)" mark carries its own leading space inside a span: the label is a flex row, and a bare whitespace node between flex items is dropped, so the name would read "Nome(opcional)". */
function Marca({ required, optional }: { required?: boolean | undefined; optional?: boolean | undefined }) {
  if (required)
    return (
      <>
        {/* Generated content, so the "*" stays out of the label text: getByLabel("Nome (obrigatório)") and screen readers both get that name. */}
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
  hint?: ReactNode | undefined;
  error?: ReactNode | undefined;
  required?: boolean | undefined;
  children: ReactNode;
  className?: string | undefined;
  hideLegend?: boolean | undefined;
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

const CAMPO = "m-field w-full min-w-0 rounded-lg text-base text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60";

export function Input({
  className,
  ref,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> | undefined }) {
  return <input ref={ref} className={cx(CAMPO, "h-11 px-3", className)} {...props} />;
}

/** Multi-line text. `autoSize` grows with the text (CSS `field-sizing`, where supported). */
export function Textarea({
  className,
  autoSize,
  ref,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { autoSize?: boolean | undefined; ref?: Ref<HTMLTextAreaElement> | undefined }) {
  return (
    <textarea
      ref={ref}
      className={cx(CAMPO, "min-h-24 px-3 py-2.5 leading-relaxed", autoSize && "[field-sizing:content]", className)}
      {...props}
    />
  );
}

/** Native `<select>`: prefer over `Select` for long plain lists on phones (the OS picker), GET filter forms of server pages, and where no JavaScript is wanted. */
export function NativeSelect({
  className,
  children,
  ref,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { ref?: Ref<HTMLSelectElement> | undefined }) {
  return (
    <span className={cx("relative flex min-w-0", className)}>
      <select ref={ref} className={cx(CAMPO, "h-11 appearance-none py-0 pr-10 pl-3")} {...props}>
        {children}
      </select>
      <ChevronDown aria-hidden size={18} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" />
    </span>
  );
}
