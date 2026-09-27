"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Select as BaseSelect } from "@base-ui/react/select";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { Check, ChevronDown, ChevronsUpDown, Loader2, Plus, X } from "lucide-react";
import { cx } from "./cx";
import { filtrarOpcoes, normalizarTexto, textoParaCriar } from "./filtrar";
import { CLASSE_FLUTUANTE, CLASSE_POSICIONADOR, Destacado, useControlado } from "./controlos-comum";

/**
 * Choosing from lists (v0.7), built on Base UI:
 *
 * - `Select` — a closed list of up to ~15 options, no typing (estado, tipo).
 * - `Combobox` — many options or a remote search (associação, utente), with
 *   an optional "Criar «…»" entry.
 * - `MultiSelect` — several values shown as chips (distritos, etiquetas).
 *
 * Put each inside `FormField` for the label, hint and error: the field hands
 * `id` and the ARIA props to the control. For long plain lists on phones and
 * for GET filter forms of server pages use `NativeSelect` instead.
 */

export interface Option {
  value: string;
  label: string;
  /** Second line in the list (NIF, distrito…). */
  description?: string | undefined;
  disabled?: boolean | undefined;
  icon?: ReactNode;
}
export interface OptionGroup {
  label: string;
  options: Option[];
}

/** ARIA and id props a `FormField` hands to its control. */
interface PropsDeCampo {
  id?: string | undefined;
  "aria-describedby"?: string | undefined;
  "aria-invalid"?: boolean | "true" | "false" | undefined;
  "aria-required"?: boolean | "true" | "false" | undefined;
  "aria-label"?: string | undefined;
  "aria-labelledby"?: string | undefined;
}

function ariaDe(p: PropsDeCampo) {
  return {
    id: p.id,
    "aria-describedby": p["aria-describedby"],
    "aria-invalid": p["aria-invalid"],
    "aria-required": p["aria-required"],
    "aria-label": p["aria-label"],
    "aria-labelledby": p["aria-labelledby"],
  };
}

const eGrupo = (x: Option | OptionGroup): x is OptionGroup => "options" in x;

// ─── Select ───────────────────────────────────────────────────────────────

export interface SelectProps extends PropsDeCampo {
  options: Array<Option | OptionGroup>;
  value?: string | null | undefined;
  defaultValue?: string | null | undefined;
  onValueChange?: ((value: string | null) => void) | undefined;
  /** Shown while nothing is chosen. Default "Escolha uma opção". */
  placeholder?: string | undefined;
  /** Form field name (a hidden input carries the value). */
  name?: string | undefined;
  required?: boolean | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
}

export function Select({
  options,
  value,
  defaultValue = null,
  onValueChange,
  placeholder = "Escolha uma opção",
  name,
  required,
  disabled,
  className,
  ...campo
}: SelectProps) {
  const planas = useMemo(() => options.flatMap((o) => (eGrupo(o) ? o.options : [o])), [options]);
  const [atual, definir] = useControlado<string | null>(value, defaultValue, onValueChange);
  const item = (o: Option) => (
    <BaseSelect.Item key={o.value} value={o.value} disabled={o.disabled} className="m-item pr-9">
      {o.icon}
      <span className="flex min-w-0 flex-col">
        <BaseSelect.ItemText className="truncate">{o.label}</BaseSelect.ItemText>
        {o.description && <span className="truncate text-sm text-muted-foreground">{o.description}</span>}
      </span>
      <BaseSelect.ItemIndicator className="absolute right-3 text-brand">
        <Check aria-hidden size={18} />
      </BaseSelect.ItemIndicator>
    </BaseSelect.Item>
  );
  return (
    <BaseSelect.Root
      items={planas.map((o) => ({ value: o.value, label: o.label }))}
      value={atual}
      onValueChange={(v) => definir((v as string | null) ?? null)}
      name={name}
      required={required}
      disabled={disabled}
    >
      <BaseSelect.Trigger {...ariaDe(campo)} className={cx("m-field m-gatilho w-full", className)}>
        <BaseSelect.Value placeholder={placeholder} className="min-w-0 truncate" />
        <BaseSelect.Icon className="shrink-0 text-muted-foreground">
          <ChevronsUpDown aria-hidden size={18} />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner sideOffset={6} alignItemWithTrigger={false} className={CLASSE_POSICIONADOR}>
          <BaseSelect.Popup className={cx(CLASSE_FLUTUANTE, "min-w-[var(--anchor-width)] max-w-[min(28rem,var(--available-width))]")}>
            <BaseSelect.List className="max-h-[min(24rem,var(--available-height))] overflow-y-auto overscroll-contain p-1.5">
              {options.map((o, i) =>
                eGrupo(o) ? (
                  <BaseSelect.Group key={`g-${o.label}`}>
                    {i > 0 && <div aria-hidden className="m-item-separador" />}
                    <BaseSelect.GroupLabel className="m-item-rotulo">{o.label}</BaseSelect.GroupLabel>
                    {o.options.map(item)}
                  </BaseSelect.Group>
                ) : (
                  item(o)
                ),
              )}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}

// ─── Combobox (single) ────────────────────────────────────────────────────

type ItemInterno = Option & { criar?: string };

export interface ComboboxProps extends PropsDeCampo {
  /** Local options (filtered as the person types, accents ignored). */
  options?: Option[] | undefined;
  /**
   * Remote search: called (debounced) with what the person typed. Abort
   * the request when `signal` fires. Return the matching options.
   */
  onSearch?: ((query: string, signal: AbortSignal) => Promise<Option[]>) | undefined;
  /** Minimum characters before searching remotely. Default 2. */
  minChars?: number | undefined;
  /**
   * Offers "Criar «texto»" when nothing matches exactly. Return the new
   * option (it becomes the value) or nothing to keep the current value.
   */
  onCreate?: ((text: string) => Option | void | Promise<Option | void>) | undefined;
  value?: string | null | undefined;
  defaultValue?: string | null | undefined;
  onValueChange?: ((value: string | null, option: Option | null) => void) | undefined;
  /** The option of the initial value when options load remotely (for its label). */
  initialOption?: Option | undefined;
  placeholder?: string | undefined;
  name?: string | undefined;
  required?: boolean | undefined;
  disabled?: boolean | undefined;
  /** Max options shown (local filtering). Default 50. */
  limit?: number | undefined;
  className?: string | undefined;
}

function usePesquisaRemota(onSearch: ComboboxProps["onSearch"], consulta: string, minChars: number, ativa: boolean) {
  const [estado, setEstado] = useState<{ a: boolean; erro: boolean; resultados: Option[] | null }>({ a: false, erro: false, resultados: null });
  useEffect(() => {
    if (!onSearch || !ativa) return;
    const q = consulta.trim();
    if (q.length < minChars) {
      setEstado({ a: false, erro: false, resultados: null });
      return;
    }
    const ctrl = new AbortController();
    setEstado((e) => ({ ...e, a: true, erro: false }));
    const t = setTimeout(() => {
      onSearch(q, ctrl.signal).then(
        (r) => !ctrl.signal.aborted && setEstado({ a: false, erro: false, resultados: r }),
        () => !ctrl.signal.aborted && setEstado({ a: false, erro: true, resultados: [] }),
      );
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [onSearch, consulta, minChars, ativa]);
  return estado;
}

function ItemCombobox({ o, consulta, multiplo }: { o: ItemInterno; consulta: string; multiplo?: boolean }) {
  return (
    <BaseCombobox.Item value={o} disabled={o.disabled} className={cx("m-item", o.criar ? "text-brand" : "pr-9")}>
      {o.criar ? (
        <>
          <Plus aria-hidden size={18} className="text-brand" />
          <span className="min-w-0">
            Criar <strong className="font-semibold">«{o.criar}»</strong>
          </span>
        </>
      ) : (
        <>
          {multiplo && (
            <span aria-hidden className="m-check m-check-item shrink-0">
              <BaseCombobox.ItemIndicator>
                <Check size={14} strokeWidth={3} />
              </BaseCombobox.ItemIndicator>
            </span>
          )}
          {o.icon}
          <span className="flex min-w-0 flex-col">
            <span className="truncate">
              <Destacado texto={o.label} consulta={consulta} />
            </span>
            {o.description && <span className="truncate text-sm text-muted-foreground">{o.description}</span>}
          </span>
          {!multiplo && (
            <BaseCombobox.ItemIndicator className="absolute right-3 text-brand">
              <Check aria-hidden size={18} />
            </BaseCombobox.ItemIndicator>
          )}
        </>
      )}
    </BaseCombobox.Item>
  );
}

function Lista({
  itens,
  consulta,
  estado,
  remoto,
  minChars,
  multiplo,
}: {
  itens: ItemInterno[];
  consulta: string;
  estado: { a: boolean; erro: boolean; resultados: Option[] | null };
  remoto: boolean;
  minChars: number;
  multiplo?: boolean;
}) {
  const q = consulta.trim();
  let mensagem: ReactNode = null;
  if (remoto && estado.a)
    mensagem = (
      <span className="inline-flex items-center gap-2">
        <Loader2 aria-hidden size={16} className="m-spinner" /> A pesquisar…
      </span>
    );
  else if (remoto && estado.erro) mensagem = "Não foi possível pesquisar. Tente novamente.";
  else if (remoto && q.length < minChars && !itens.length) mensagem = minChars > 1 ? `Escreva pelo menos ${minChars} letras para pesquisar.` : "Escreva para pesquisar.";
  else if (!itens.length) mensagem = q ? `Nenhum resultado para «${q}».` : "Não há opções.";
  return (
    <>
      <BaseCombobox.Status className="empty:hidden px-3 py-2.5 text-[0.9375rem] text-muted-foreground">{mensagem}</BaseCombobox.Status>
      <BaseCombobox.List className="max-h-[min(22rem,var(--available-height))] overflow-y-auto overscroll-contain p-1.5 empty:p-0">
        {(o: ItemInterno) => <ItemCombobox key={o.value} o={o} consulta={consulta} multiplo={multiplo} />}
      </BaseCombobox.List>
    </>
  );
}

const iguais = (a: ItemInterno, b: ItemInterno) => a.value === b.value;

export function Combobox({
  options = [],
  onSearch,
  minChars = 2,
  onCreate,
  value,
  defaultValue = null,
  onValueChange,
  initialOption,
  placeholder = "Escreva para procurar",
  name,
  required,
  disabled,
  limit = 50,
  className,
  ...campo
}: ComboboxProps) {
  const conhecidas = useRef(new Map<string, Option>());
  for (const o of options) conhecidas.current.set(o.value, o);
  if (initialOption) conhecidas.current.set(initialOption.value, initialOption);

  const [atual, definir] = useControlado<string | null>(value, defaultValue, (v) => onValueChange?.(v, v ? conhecidas.current.get(v) ?? null : null));
  const selecionada = atual ? conhecidas.current.get(atual) ?? null : null;
  const [consulta, setConsulta] = useState(selecionada?.label ?? "");
  const [aberto, setAberto] = useState(false);
  const remoto = !!onSearch;

  // When the input shows the chosen label, list everything (not just that one).
  const filtro = selecionada && consulta === selecionada.label ? "" : consulta;
  const estado = usePesquisaRemota(onSearch, filtro, minChars, aberto);
  for (const o of estado.resultados ?? []) conhecidas.current.set(o.value, o);

  const base = remoto ? estado.resultados ?? (selecionada ? [selecionada] : []) : filtrarOpcoes(options, filtro, (o) => o.label, limit);
  const criar = onCreate && !estado.a ? textoParaCriar(filtro, base, (o) => o.label) : null;
  const itens: ItemInterno[] = criar ? [...base, { value: `__criar__:${normalizarTexto(criar)}`, label: criar, criar }] : base;

  const escolher = async (o: ItemInterno | null) => {
    if (o?.criar && onCreate) {
      const nova = await onCreate(o.criar);
      if (nova) {
        conhecidas.current.set(nova.value, nova);
        definir(nova.value);
        setConsulta(nova.label);
      }
      return;
    }
    definir(o?.value ?? null);
    setConsulta(o?.label ?? "");
  };

  return (
    <BaseCombobox.Root<ItemInterno>
      items={itens}
      filter={null}
      value={selecionada}
      onValueChange={(o) => void escolher(o as ItemInterno | null)}
      inputValue={consulta}
      onInputValueChange={(v) => setConsulta(v)}
      onOpenChange={(a) => {
        setAberto(a);
        if (!a) setConsulta(selecionada?.label ?? "");
      }}
      isItemEqualToValue={iguais}
      itemToStringLabel={(o) => o.label}
      itemToStringValue={(o) => o.value}
      name={name}
      required={required}
      disabled={disabled}
    >
      <BaseCombobox.InputGroup className={cx("m-field relative flex h-11 w-full items-center rounded-lg", className)}>
        <BaseCombobox.Input
          {...ariaDe(campo)}
          placeholder={placeholder}
          className="h-full w-full min-w-0 rounded-lg bg-transparent pr-20 pl-3 text-base outline-none placeholder:text-muted-foreground"
        />
        <span className="absolute right-1 flex items-center">
          {selecionada && !disabled && (
            <BaseCombobox.Clear aria-label="Limpar" className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-foreground/8 hover:text-foreground">
              <X aria-hidden size={18} />
            </BaseCombobox.Clear>
          )}
          <BaseCombobox.Trigger aria-label="Mostrar opções" className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-foreground/8 hover:text-foreground">
            <ChevronDown aria-hidden size={18} className="m-seta" />
          </BaseCombobox.Trigger>
        </span>
      </BaseCombobox.InputGroup>
      <BaseCombobox.Portal>
        <BaseCombobox.Positioner sideOffset={6} className={CLASSE_POSICIONADOR}>
          <BaseCombobox.Popup
            aria-busy={estado.a || undefined}
            className={cx(CLASSE_FLUTUANTE, "w-[var(--anchor-width)] min-w-64 max-w-[var(--available-width)]")}
          >
            <Lista itens={itens} consulta={filtro} estado={estado} remoto={remoto} minChars={minChars} />
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>
  );
}

// ─── MultiSelect (chips) ──────────────────────────────────────────────────

export interface MultiSelectProps extends Omit<ComboboxProps, "value" | "defaultValue" | "onValueChange" | "initialOption"> {
  value?: string[] | undefined;
  defaultValue?: string[] | undefined;
  onValueChange?: ((value: string[], options: Option[]) => void) | undefined;
  /** Options of the initial values when options load remotely. */
  initialOptions?: Option[] | undefined;
  /** Max number of values; the list disables the rest when reached. */
  max?: number | undefined;
}

export function MultiSelect({
  options = [],
  onSearch,
  minChars = 2,
  onCreate,
  value,
  defaultValue = [],
  onValueChange,
  initialOptions,
  placeholder = "Escreva para procurar",
  name,
  required,
  disabled,
  limit = 50,
  max,
  className,
  ...campo
}: MultiSelectProps) {
  const conhecidas = useRef(new Map<string, Option>());
  for (const o of options) conhecidas.current.set(o.value, o);
  for (const o of initialOptions ?? []) conhecidas.current.set(o.value, o);

  const [atual, definir] = useControlado<string[]>(value, defaultValue, (v) =>
    onValueChange?.(v, v.map((x) => conhecidas.current.get(x)).filter((o): o is Option => !!o)),
  );
  const selecionadas = atual.map((v) => conhecidas.current.get(v) ?? { value: v, label: v });
  const [consulta, setConsulta] = useState("");
  const [aberto, setAberto] = useState(false);
  const remoto = !!onSearch;
  const estado = usePesquisaRemota(onSearch, consulta, minChars, aberto);
  for (const o of estado.resultados ?? []) conhecidas.current.set(o.value, o);

  const cheio = max !== undefined && atual.length >= max;
  const base = (remoto ? estado.resultados ?? [] : filtrarOpcoes(options, consulta, (o) => o.label, limit)).map((o) =>
    cheio && !atual.includes(o.value) ? { ...o, disabled: true } : o,
  );
  const criar = onCreate && !estado.a && !cheio ? textoParaCriar(consulta, [...base, ...selecionadas], (o) => o.label) : null;
  const itens: ItemInterno[] = criar ? [...base, { value: `__criar__:${normalizarTexto(criar)}`, label: criar, criar }] : base;

  const mudar = async (novas: ItemInterno[]) => {
    const pedido = novas.find((o) => o.criar);
    let lista = novas.filter((o) => !o.criar);
    if (pedido?.criar && onCreate) {
      const nova = await onCreate(pedido.criar);
      if (nova) {
        conhecidas.current.set(nova.value, nova);
        lista = [...lista, nova];
      }
    }
    definir(lista.map((o) => o.value));
    setConsulta("");
  };

  return (
    <BaseCombobox.Root<ItemInterno, true>
      multiple
      items={itens}
      filter={null}
      value={selecionadas}
      onValueChange={(v) => void mudar(v as ItemInterno[])}
      inputValue={consulta}
      onInputValueChange={(v) => setConsulta(v)}
      onOpenChange={setAberto}
      isItemEqualToValue={iguais}
      itemToStringLabel={(o) => o.label}
      itemToStringValue={(o) => o.value}
      name={name}
      required={required}
      disabled={disabled}
    >
      <BaseCombobox.InputGroup className={cx("m-field relative flex min-h-11 w-full cursor-text flex-wrap items-center gap-1.5 rounded-lg py-1.5 pr-10 pl-1.5", className)}>
        <BaseCombobox.Chips className="contents">
          {selecionadas.map((o) => (
            <BaseCombobox.Chip
              key={o.value}
              className="inline-flex max-w-full items-center gap-0.5 rounded-md border border-border bg-secondary py-0.5 pr-0.5 pl-2 text-[0.9375rem] text-secondary-foreground outline-none data-[highlighted]:border-brand data-[highlighted]:bg-brand-soft focus-within:border-brand"
            >
              <span className="truncate">{o.label}</span>
              <BaseCombobox.ChipRemove aria-label={`Remover ${o.label}`} className="relative grid size-7 shrink-0 place-items-center rounded text-muted-foreground after:absolute after:-inset-2 after:rounded-md hover:bg-foreground/10 hover:text-foreground">
                <X aria-hidden size={16} />
              </BaseCombobox.ChipRemove>
            </BaseCombobox.Chip>
          ))}
        </BaseCombobox.Chips>
        <BaseCombobox.Input
          {...ariaDe(campo)}
          placeholder={selecionadas.length ? "" : placeholder}
          className="h-8 min-w-24 flex-1 bg-transparent px-1.5 text-base outline-none placeholder:text-muted-foreground"
        />
        <BaseCombobox.Trigger aria-label="Mostrar opções" className="absolute top-1 right-1 grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-foreground/8 hover:text-foreground">
          <ChevronDown aria-hidden size={18} />
        </BaseCombobox.Trigger>
      </BaseCombobox.InputGroup>
      <BaseCombobox.Portal>
        <BaseCombobox.Positioner sideOffset={6} className={CLASSE_POSICIONADOR}>
          <BaseCombobox.Popup
            aria-busy={estado.a || undefined}
            className={cx(CLASSE_FLUTUANTE, "w-[var(--anchor-width)] min-w-64 max-w-[var(--available-width)]")}
          >
            {cheio && (
              <p className="border-b border-border px-3 py-2 text-sm text-muted-foreground">
                Pode escolher até {max}. Remova uma para escolher outra.
              </p>
            )}
            <Lista itens={itens} consulta={consulta} estado={estado} remoto={remoto} minChars={minChars} multiplo />
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>
  );
}

