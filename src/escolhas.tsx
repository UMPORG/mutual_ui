"use client";

import { useId, useRef, type ReactNode } from "react";
import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { Radio } from "@base-ui/react/radio";
import { Slider as BaseSlider } from "@base-ui/react/slider";
import { NumberField as BaseNumberField } from "@base-ui/react/number-field";
import { Check, Minus, Plus } from "lucide-react";
import { cx } from "./cx";

/**
 * On/off and one-of-many controls (v0.7), built on Base UI:
 *
 * - Switch — a setting that applies at once ("Receber avisos por email").
 *   In a form that is saved with a button, use Checkbox instead.
 * - Checkbox — a yes/no inside a form, or several independent choices
 *   (group them in a `Fieldset`).
 * - RadioGroup — one of 2–6 visible options. More than that: Select.
 * - RadioCards — one of a few options that need a description or an icon
 *   (plano, tipo de inscrição).
 * - SegmentedControl — switch between views of the same content (Lista /
 *   Mapa, Mês / Semana). Not for form values.
 * - Slider — an approximate value on a range (raio de pesquisa). For exact
 *   values use NumberField.
 * - NumberField — a number with − / + buttons, pt-PT formatting and limits.
 */

type Aria = {
  id?: string | undefined;
  "aria-describedby"?: string | undefined;
  "aria-invalid"?: boolean | "true" | "false" | undefined;
  "aria-label"?: string | undefined;
  "aria-labelledby"?: string | undefined;
};

/**
 * The visible label of a Base UI checkbox / switch / radio. Base UI renders
 * the focusable control as a `<span role=…>` plus a hidden native input that
 * takes our `id`, so a `<label for>` named the hidden input, not the control:
 * in server HTML the control had no name and getByLabel found the hidden
 * input; after hydration getByLabel found both. The control now names itself
 * with `aria-labelledby` (server HTML included) and a click on the label
 * clicks the control.
 */
function Rotulo({ id, alvo, className, children }: { id: string; alvo: { current: HTMLElement | null }; className: string; children: ReactNode }) {
  return (
    <label id={id} className={className} onClick={() => alvo.current?.click()}>
      {children}
    </label>
  );
}

// ─── Switch ───────────────────────────────────────────────────────────────

export function Switch({
  label,
  description,
  checked,
  defaultChecked,
  onCheckedChange,
  name,
  disabled,
  align = "start",
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
}: {
  label: ReactNode;
  description?: ReactNode | undefined;
  checked?: boolean | undefined;
  defaultChecked?: boolean | undefined;
  onCheckedChange?: ((checked: boolean) => void) | undefined;
  name?: string | undefined;
  disabled?: boolean | undefined;
  /** "end" puts the switch on the right (settings lists). */
  align?: "start" | "end" | undefined;
  className?: string | undefined;
  /**
   * Accessible name when the visible `label` is only the state («Ligada»):
   * `aria-labelledby` points at the field's own label and is read BEFORE the
   * visible label («Proteção, Ligada»); `aria-label` replaces the name (keep
   * the visible words in it — WCAG 2.5.3).
   */
  "aria-label"?: string | undefined;
  "aria-labelledby"?: string | undefined;
}) {
  const id = useId();
  const controlo = useRef<HTMLElement>(null);
  const nome = ariaLabel
    ? { "aria-label": ariaLabel }
    : { "aria-labelledby": ariaLabelledby ? `${ariaLabelledby} ${id}-l` : `${id}-l` };
  return (
    <div className={cx("flex items-start gap-3", align === "end" && "flex-row-reverse justify-between", disabled && "opacity-60", className)}>
      <BaseSwitch.Root
        ref={controlo}
        id={id}
        {...nome}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange ? (v) => onCheckedChange(v) : undefined}
        name={name}
        disabled={disabled}
        aria-describedby={description ? `${id}-d` : undefined}
        className="m-switch mt-0.5"
      >
        <BaseSwitch.Thumb className="m-switch-polegar" />
      </BaseSwitch.Root>
      <span className="flex min-w-0 flex-col gap-0.5">
        <Rotulo id={`${id}-l`} alvo={controlo} className="text-base leading-snug font-medium">
          {label}
        </Rotulo>
        {description && (
          <span id={`${id}-d`} className="text-[0.9375rem] text-muted-foreground">
            {description}
          </span>
        )}
      </span>
    </div>
  );
}

// ─── Checkbox ─────────────────────────────────────────────────────────────

export function Checkbox({
  label,
  description,
  checked,
  defaultChecked,
  indeterminate,
  onCheckedChange,
  name,
  value,
  disabled,
  required,
  className,
  ...aria
}: Aria & {
  label?: ReactNode | undefined;
  description?: ReactNode | undefined;
  checked?: boolean | undefined;
  defaultChecked?: boolean | undefined;
  /** "Some selected" (a select-all box). */
  indeterminate?: boolean | undefined;
  onCheckedChange?: ((checked: boolean) => void) | undefined;
  name?: string | undefined;
  value?: string | undefined;
  disabled?: boolean | undefined;
  required?: boolean | undefined;
  className?: string | undefined;
}) {
  const auto = useId();
  const id = aria.id ?? auto;
  const controlo = useRef<HTMLElement>(null);
  const caixa = (
    <BaseCheckbox.Root
      {...aria}
      ref={controlo}
      id={id}
      aria-labelledby={aria["aria-labelledby"] ?? (label ? `${id}-l` : undefined)}
      checked={checked}
      defaultChecked={defaultChecked}
      indeterminate={indeterminate}
      onCheckedChange={onCheckedChange ? (v) => onCheckedChange(v) : undefined}
      name={name}
      value={value}
      disabled={disabled}
      required={required}
      aria-describedby={[aria["aria-describedby"], description ? `${id}-d` : ""].filter(Boolean).join(" ") || undefined}
      className="m-check mt-0.5"
    >
      <BaseCheckbox.Indicator className="grid place-items-center">
        {indeterminate ? <Minus aria-hidden size={16} strokeWidth={3} /> : <Check aria-hidden size={16} strokeWidth={3} />}
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
  if (!label) return caixa;
  return (
    <div className={cx("flex items-start gap-3", disabled && "opacity-60", className)}>
      {caixa}
      <span className="flex min-w-0 flex-col gap-0.5">
        <Rotulo id={`${id}-l`} alvo={controlo} className="text-base leading-snug">
          {label}
        </Rotulo>
        {description && (
          <span id={`${id}-d`} className="text-[0.9375rem] text-muted-foreground">
            {description}
          </span>
        )}
      </span>
    </div>
  );
}

// ─── RadioGroup & RadioCards ──────────────────────────────────────────────

export interface RadioOption {
  value: string;
  label: ReactNode;
  description?: ReactNode | undefined;
  icon?: ReactNode | undefined;
  disabled?: boolean | undefined;
}

interface PropsGrupo extends Aria {
  options: RadioOption[];
  value?: string | undefined;
  defaultValue?: string | undefined;
  onValueChange?: ((value: string) => void) | undefined;
  name?: string | undefined;
  disabled?: boolean | undefined;
  required?: boolean | undefined;
  className?: string | undefined;
}

function OpcaoRadio({ id, opcao: o }: { id: string; opcao: RadioOption }) {
  const controlo = useRef<HTMLElement>(null);
  return (
    <div className={cx("flex items-start gap-3", o.disabled && "opacity-60")}>
      <Radio.Root
        ref={controlo}
        id={id}
        value={o.value}
        disabled={o.disabled}
        aria-labelledby={`${id}-l`}
        aria-describedby={o.description ? `${id}-d` : undefined}
        className="m-radio mt-0.5"
      >
        <Radio.Indicator className="m-radio-ponto" />
      </Radio.Root>
      <span className="flex min-w-0 flex-col gap-0.5">
        <Rotulo id={`${id}-l`} alvo={controlo} className="text-base leading-snug">
          {o.label}
        </Rotulo>
        {o.description && (
          <span id={`${id}-d`} className="text-[0.9375rem] text-muted-foreground">
            {o.description}
          </span>
        )}
      </span>
    </div>
  );
}

/** Put it inside a `Fieldset` (the legend names the group). */
export function RadioGroup({
  options,
  value,
  defaultValue,
  onValueChange,
  name,
  disabled,
  required,
  orientation = "vertical",
  className,
  ...aria
}: PropsGrupo & { orientation?: "vertical" | "horizontal" | undefined }) {
  const base = useId();
  return (
    <BaseRadioGroup
      {...aria}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange ? (v) => onValueChange(v as string) : undefined}
      name={name}
      disabled={disabled}
      required={required}
      className={cx("flex gap-3", orientation === "vertical" ? "flex-col" : "flex-row flex-wrap gap-x-6", className)}
    >
      {options.map((o, i) => (
        <OpcaoRadio key={o.value} id={`${base}-${i}`} opcao={o} />
      ))}
    </BaseRadioGroup>
  );
}

/** Options as cards: the whole card is the radio. */
export function RadioCards({
  options,
  value,
  defaultValue,
  onValueChange,
  name,
  disabled,
  required,
  columns = 3,
  className,
  ...aria
}: PropsGrupo & { columns?: 1 | 2 | 3 | 4 | undefined }) {
  const base = useId();
  return (
    <BaseRadioGroup
      {...aria}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange ? (v) => onValueChange(v as string) : undefined}
      name={name}
      disabled={disabled}
      required={required}
      className={cx("grid gap-3", className)}
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${columns >= 4 ? 11 : columns === 3 ? 13 : columns === 2 ? 17 : 100}rem), 1fr))` }}
    >
      {options.map((o, i) => {
        const id = `${base}-${i}`;
        return (
          <Radio.Root
            key={o.value}
            value={o.value}
            disabled={o.disabled}
            aria-labelledby={`${id}-l`}
            aria-describedby={o.description ? `${id}-d` : undefined}
            className="m-radio-cartao group relative flex items-start gap-3 p-4 text-left data-[disabled]:opacity-55"
          >
            {o.icon && <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-foreground [&_svg]:size-5 group-data-[checked]:bg-brand-soft group-data-[checked]:text-brand-soft-foreground">{o.icon}</span>}
            <span className="flex min-w-0 flex-1 flex-col gap-1 pr-7">
              <span id={`${id}-l`} className="text-base leading-snug font-semibold">
                {o.label}
              </span>
              {o.description && (
                <span id={`${id}-d`} className="text-[0.9375rem] text-muted-foreground">
                  {o.description}
                </span>
              )}
            </span>
            <span aria-hidden className="m-radio-deco absolute top-4 right-4">
              <Radio.Indicator className="block size-2.5 rounded-full bg-brand" />
            </span>
          </Radio.Root>
        );
      })}
    </BaseRadioGroup>
  );
}

// ─── SegmentedControl ─────────────────────────────────────────────────────

export function SegmentedControl({
  options,
  value,
  defaultValue,
  onValueChange,
  label,
  className,
}: {
  options: Array<{ value: string; label: ReactNode; icon?: ReactNode | undefined; disabled?: boolean | undefined }>;
  value?: string | undefined;
  defaultValue?: string | undefined;
  onValueChange?: ((value: string) => void) | undefined;
  /** Spoken name ("Vista"). */
  label: string;
  className?: string | undefined;
}) {
  return (
    <BaseRadioGroup
      aria-label={label}
      value={value}
      defaultValue={defaultValue ?? options[0]?.value}
      onValueChange={onValueChange ? (v) => onValueChange(v as string) : undefined}
      className={cx("m-segmentos", className)}
    >
      {options.map((o) => (
        <Radio.Root key={o.value} value={o.value} disabled={o.disabled} className="m-segmento [&_svg]:size-[1.125rem]">
          {o.icon}
          {o.label}
        </Radio.Root>
      ))}
    </BaseRadioGroup>
  );
}

// ─── Slider ───────────────────────────────────────────────────────────────

export function Slider({
  label,
  value,
  defaultValue,
  onValueChange,
  onValueCommitted,
  min = 0,
  max = 100,
  step = 1,
  format,
  showValue = true,
  name,
  disabled,
  className,
}: {
  label: ReactNode;
  /** One number, or two for a range. */
  value?: number | readonly number[] | undefined;
  defaultValue?: number | readonly number[] | undefined;
  onValueChange?: ((value: number | readonly number[]) => void) | undefined;
  /** After the drag ends (fetch here, not on every move). */
  onValueCommitted?: ((value: number | readonly number[]) => void) | undefined;
  min?: number | undefined;
  max?: number | undefined;
  step?: number | undefined;
  /** Intl options for the shown value, e.g. `{ style: "unit", unit: "kilometer" }`. */
  format?: Intl.NumberFormatOptions | undefined;
  showValue?: boolean | undefined;
  name?: string | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
}) {
  return (
    <BaseSlider.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange ? (v) => onValueChange(v as number | readonly number[]) : undefined}
      onValueCommitted={onValueCommitted ? (v) => onValueCommitted(v as number | readonly number[]) : undefined}
      min={min}
      max={max}
      step={step}
      format={format}
      locale="pt-PT"
      name={name}
      disabled={disabled}
      className={cx("flex w-full flex-col gap-3 data-[disabled]:opacity-60", className)}
    >
      <div className="flex items-baseline justify-between gap-4">
        <BaseSlider.Label className="text-base font-medium">{label}</BaseSlider.Label>
        {showValue && <BaseSlider.Value className="text-base font-semibold tabular-nums" />}
      </div>
      <BaseSlider.Control className="flex h-6 w-full touch-none items-center py-3 select-none">
        <BaseSlider.Track className="m-slider-trilho">
          <BaseSlider.Indicator className="m-slider-indicador" />
          {(Array.isArray(value ?? defaultValue) ? ((value ?? defaultValue) as readonly number[]) : [0]).map((_, i) => (
            <BaseSlider.Thumb key={i} index={i} className="m-slider-polegar" />
          ))}
        </BaseSlider.Track>
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
}

// ─── NumberField ──────────────────────────────────────────────────────────

export function NumberField({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  step = 1,
  format,
  name,
  disabled,
  required,
  className,
  ...aria
}: Aria & {
  value?: number | null | undefined;
  defaultValue?: number | undefined;
  onValueChange?: ((value: number | null) => void) | undefined;
  min?: number | undefined;
  max?: number | undefined;
  step?: number | undefined;
  /** Intl options, e.g. `{ style: "currency", currency: "EUR" }` or `{ maximumFractionDigits: 2 }`. */
  format?: Intl.NumberFormatOptions | undefined;
  name?: string | undefined;
  disabled?: boolean | undefined;
  required?: boolean | undefined;
  className?: string | undefined;
}) {
  const botao = "grid h-full w-11 shrink-0 place-items-center text-muted-foreground hover:bg-foreground/6 hover:text-foreground disabled:opacity-40";
  return (
    <BaseNumberField.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange ? (v) => onValueChange(v) : undefined}
      min={min}
      max={max}
      step={step}
      format={format}
      locale="pt-PT"
      name={name}
      disabled={disabled}
      required={required}
      className={cx("w-full max-w-56", className)}
    >
      <BaseNumberField.Group className="m-field flex h-11 w-full items-stretch overflow-hidden rounded-lg">
        <BaseNumberField.Decrement aria-label="Diminuir" className={cx(botao, "border-r border-border")}>
          <Minus aria-hidden size={18} />
        </BaseNumberField.Decrement>
        <BaseNumberField.Input {...aria} className="w-full min-w-0 bg-transparent px-2 text-center text-base tabular-nums outline-none" />
        <BaseNumberField.Increment aria-label="Aumentar" className={cx(botao, "border-l border-border")}>
          <Plus aria-hidden size={18} />
        </BaseNumberField.Increment>
      </BaseNumberField.Group>
    </BaseNumberField.Root>
  );
}
