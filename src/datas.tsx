"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Popover } from "@base-ui/react/popover";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cx } from "./cx";
import { Button } from "./basicos";
import { CLASSE_FLUTUANTE, CLASSE_POSICIONADOR } from "./controlos-comum";
import {
  dentroDoIntervalo,
  diasDaSemana,
  formatarDataCurta,
  grelhaDoMes,
  hojeLisboa,
  interpretarData,
  intervalosRapidos,
  lerIso,
  limitarData,
  moverFoco,
  paraIso,
  rotuloDoDia,
  somarMeses,
  tituloDoMes,
  type DataIso,
} from "./calendario";

/**
 * Dates (v0.7): `Calendar`, `DatePicker`, `DateRangePicker`.
 *
 * Values are ISO calendar days ("2026-10-03"): no time, no time zone, so a
 * date never moves a day. pt-PT names, weeks start on Monday, "today" is the
 * day in Lisbon. People can type the date ("3/10/2026", "hoje") or pick it.
 *
 * On phones, for a single date far from today (birth date), `native`
 * gives the OS date wheel, which is faster there.
 */

type Aria = {
  id?: string | undefined;
  "aria-describedby"?: string | undefined;
  "aria-invalid"?: boolean | "true" | "false" | undefined;
  "aria-required"?: boolean | "true" | "false" | undefined;
  "aria-label"?: string | undefined;
  "aria-labelledby"?: string | undefined;
};

// ─── Calendar ─────────────────────────────────────────────────────────────

export interface CalendarProps {
  /** Single date. */
  value?: DataIso | null | undefined;
  onSelect?: ((iso: DataIso) => void) | undefined;
  /** Range mode: both ends (fim may be null while choosing). */
  range?: { inicio: DataIso | null; fim: DataIso | null } | undefined;
  min?: DataIso | null | undefined;
  max?: DataIso | null | undefined;
  /** Days that cannot be chosen (weekends, full days). */
  isDisabled?: ((iso: DataIso) => boolean) | undefined;
  /** Months side by side (range picker on desktop: 2). */
  months?: 1 | 2 | undefined;
  /** Month shown first (default: the value's, or today's). */
  defaultMonth?: DataIso | undefined;
  /** Focus the active day when shown (inside a popover). */
  autoFocus?: boolean | undefined;
  className?: string | undefined;
}

function primeiroDoMes(iso: DataIso): DataIso {
  const p = lerIso(iso)!;
  return paraIso(p.ano, p.mes, 1);
}

export function Calendar({ value, onSelect, range, min, max, isDisabled, months = 1, defaultMonth, autoFocus, className }: CalendarProps) {
  const hoje = useMemo(() => hojeLisboa(), []);
  const inicial = limitarData(defaultMonth ?? value ?? range?.inicio ?? hoje, min, max);
  const [mes, setMes] = useState(() => primeiroDoMes(inicial));
  const [foco, setFoco] = useState<DataIso>(inicial);
  const [passar, setPassar] = useState<DataIso | null>(null);
  const grelhaRef = useRef<HTMLDivElement>(null);
  const titulo = useId();
  const moverTeclado = useRef(false);

  const mesesVisiveis = Array.from({ length: months }, (_, k) => somarMeses(mes, k));
  const ultimoVisivel = somarMeses(mes, months - 1);

  useEffect(() => {
    if (!autoFocus) return;
    const t = setTimeout(() => grelhaRef.current?.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.focus(), 30);
    return () => clearTimeout(t);
  }, [autoFocus]);

  useEffect(() => {
    if (!moverTeclado.current) return;
    moverTeclado.current = false;
    grelhaRef.current?.querySelector<HTMLButtonElement>(`button[data-iso="${foco}"]`)?.focus();
  }, [foco, mes]);

  const bloqueado = (iso: DataIso) => (min && iso < min) || (max && iso > max) || !!isDisabled?.(iso);

  const focar = (iso: DataIso) => {
    const alvo = limitarData(iso, min, max);
    setFoco(alvo);
    if (alvo < mes) setMes(primeiroDoMes(alvo));
    else if (primeiroDoMes(alvo) > ultimoVisivel) setMes(somarMeses(primeiroDoMes(alvo), -(months - 1)));
  };

  const aoTeclar = (e: KeyboardEvent) => {
    const novo = moverFoco(foco, e.key, e.shiftKey);
    if (!novo) return;
    e.preventDefault();
    moverTeclado.current = true;
    focar(novo);
  };

  const mudarMes = (n: number) => {
    const novo = somarMeses(mes, n);
    setMes(novo);
    setFoco(limitarData(somarMeses(foco, n), min, max));
  };

  const podeAntes = !min || somarMeses(mes, -1) >= primeiroDoMes(min) || primeiroDoMes(min) < mes;
  const podeDepois = !max || somarMeses(ultimoVisivel, 1) <= max;
  const pm = lerIso(mes)!;
  const anos = min && max ? lerIso(max)!.ano - lerIso(min)!.ano : 0;
  const mostrarAnos = months === 1 && anos >= 2;

  const fimPrevisto = range && range.inicio && !range.fim ? passar : range?.fim ?? null;

  return (
    <div className={cx("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="md" iconOnly aria-label="Mês anterior" onClick={() => mudarMes(-1)} disabled={!podeAntes}>
          <ChevronLeft aria-hidden />
        </Button>
        <div id={titulo} aria-live="polite" className="flex min-w-0 flex-1 items-center justify-center gap-6 text-center text-base font-semibold first-letter:uppercase">
          {mesesVisiveis.map((m, k) => {
            const p = lerIso(m)!;
            return (
              <span key={m} className={cx("first-letter:uppercase", k > 0 && "hidden sm:inline")}>
                {tituloDoMes(p.ano, p.mes)}
              </span>
            );
          })}
        </div>
        <Button variant="ghost" size="md" iconOnly aria-label="Mês seguinte" onClick={() => mudarMes(1)} disabled={!podeDepois}>
          <ChevronRight aria-hidden />
        </Button>
      </div>
      {mostrarAnos && (
        <div className="-mt-1 flex justify-center">
          <label className="sr-only" htmlFor={`${titulo}-ano`}>
            Ano
          </label>
          <select
            id={`${titulo}-ano`}
            value={pm.ano}
            onChange={(e) => {
              const novo = paraIso(Number(e.target.value), pm.mes, 1);
              setMes(novo);
              setFoco(limitarData(paraIso(Number(e.target.value), pm.mes, Math.min(lerIso(foco)!.dia, 28)), min, max));
            }}
            className="m-field h-9 rounded-md px-2 text-[0.9375rem]"
          >
            {Array.from({ length: 121 }, (_, k) => lerIso(hoje)!.ano + 10 - k)
              .filter((a) => (!min || a >= lerIso(min)!.ano) && (!max || a <= lerIso(max)!.ano))
              .map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
          </select>
        </div>
      )}
      <div ref={grelhaRef} onKeyDown={aoTeclar} className={cx("grid gap-4", months === 2 && "sm:grid-cols-2")}>
        {mesesVisiveis.map((m, k) => {
          const p = lerIso(m)!;
          return (
            <table key={m} role="grid" aria-label={tituloDoMes(p.ano, p.mes)} className={cx("w-full border-collapse", k > 0 && "hidden sm:table")}>
              <thead>
                <tr>
                  {diasDaSemana().map((d) => (
                    <th key={d.curto} scope="col" abbr={d.longo} className="h-8 text-center text-sm font-medium text-muted-foreground">
                      {d.curto}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grelhaDoMes(p.ano, p.mes).map((semana) => (
                  <tr key={semana[0]!.iso}>
                    {semana.map((d) => {
                      if (d.fora) return <td key={d.iso} />;
                      const sel = range ? d.iso === range.inicio || d.iso === fimPrevisto : d.iso === value;
                      const noIntervalo = range ? dentroDoIntervalo(d.iso, range.inicio, fimPrevisto) && !sel : false;
                      const bl = bloqueado(d.iso);
                      return (
                        <td key={d.iso} role="gridcell" aria-selected={sel || undefined} className="p-0 text-center">
                          <button
                            type="button"
                            data-iso={d.iso}
                            tabIndex={d.iso === foco ? 0 : -1}
                            aria-label={`${rotuloDoDia(d.iso)}${d.iso === hoje ? " (hoje)" : ""}`}
                            aria-pressed={sel}
                            aria-disabled={bl || undefined}
                            data-hoje={d.iso === hoje || undefined}
                            data-selecionado={sel || undefined}
                            data-no-intervalo={noIntervalo || undefined}
                            onClick={() => {
                              if (bl) return;
                              setFoco(d.iso);
                              onSelect?.(d.iso);
                            }}
                            onPointerEnter={() => range && setPassar(d.iso)}
                            onFocus={() => range && setPassar(d.iso)}
                            className="m-dia mx-auto"
                          >
                            {d.dia}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })}
      </div>
    </div>
  );
}

// ─── DatePicker ───────────────────────────────────────────────────────────

export interface DatePickerProps extends Aria {
  value?: DataIso | null | undefined;
  defaultValue?: DataIso | null | undefined;
  onValueChange?: ((iso: DataIso | null) => void) | undefined;
  min?: DataIso | null | undefined;
  max?: DataIso | null | undefined;
  isDisabled?: ((iso: DataIso) => boolean) | undefined;
  /** Hidden input with the ISO value, for forms. */
  name?: string | undefined;
  required?: boolean | undefined;
  disabled?: boolean | undefined;
  /** The OS date control (phones, birth dates). */
  native?: boolean | undefined;
  placeholder?: string | undefined;
  className?: string | undefined;
}

export function DatePicker({
  value,
  defaultValue = null,
  onValueChange,
  min,
  max,
  isDisabled,
  name,
  required,
  disabled,
  native,
  placeholder = "dd/mm/aaaa",
  className,
  ...aria
}: DatePickerProps) {
  const [interno, setInterno] = useState<DataIso | null>(defaultValue);
  const atual = value !== undefined ? value : interno;
  const [texto, setTexto] = useState(formatarDataCurta(atual));
  const [invalido, setInvalido] = useState(false);
  const [aberto, setAberto] = useState(false);
  const msgId = useId();
  useEffect(() => {
    setTexto(formatarDataCurta(atual));
    setInvalido(false);
  }, [atual]);

  const definir = (iso: DataIso | null) => {
    if (value === undefined) setInterno(iso);
    onValueChange?.(iso);
  };

  if (native) {
    return (
      <input
        {...aria}
        type="date"
        name={name}
        required={required}
        disabled={disabled}
        min={min ?? undefined}
        max={max ?? undefined}
        value={atual ?? ""}
        onChange={(e) => definir(e.target.value || null)}
        className={cx("m-field h-11 w-full rounded-lg px-3 text-base outline-none", className)}
      />
    );
  }

  const confirmarTexto = () => {
    if (!texto.trim()) {
      setInvalido(false);
      if (atual !== null) definir(null);
      return;
    }
    const iso = interpretarData(texto);
    const fora = iso && ((min && iso < min) || (max && iso > max) || isDisabled?.(iso));
    if (!iso || fora) {
      setInvalido(true);
      return;
    }
    setInvalido(false);
    setTexto(formatarDataCurta(iso));
    if (iso !== atual) definir(iso);
  };

  const mensagem = invalido
    ? min || max
      ? `Indique uma data válida${min ? ` a partir de ${formatarDataCurta(min)}` : ""}${max ? `${min ? " e" : ""} até ${formatarDataCurta(max)}` : ""}, como dd/mm/aaaa.`
      : "Indique a data como dd/mm/aaaa (por exemplo, 03/10/2026)."
    : null;

  return (
    <div className={cx("flex w-full min-w-0 flex-col gap-1.5", className)}>
      <Popover.Root open={aberto} onOpenChange={(a) => setAberto(a)}>
        <div className="m-field relative flex h-11 w-full items-center rounded-lg" data-disabled={disabled || undefined}>
          <input
            {...aria}
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              if (invalido) setInvalido(false);
            }}
            onBlur={confirmarTexto}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                confirmarTexto();
              } else if (e.key === "ArrowDown" && e.altKey) {
                e.preventDefault();
                setAberto(true);
              }
            }}
            placeholder={placeholder}
            inputMode="numeric"
            autoComplete="off"
            disabled={disabled}
            aria-invalid={invalido || aria["aria-invalid"] || undefined}
            aria-describedby={[aria["aria-describedby"], invalido ? msgId : ""].filter(Boolean).join(" ") || undefined}
            className="h-full w-full min-w-0 rounded-lg bg-transparent pr-12 pl-3 text-base tabular-nums outline-none placeholder:text-muted-foreground"
          />
          <Popover.Trigger
            disabled={disabled}
            aria-label={atual ? `Escolher data, atual: ${rotuloDoDia(atual)}` : "Escolher data no calendário"}
            className="absolute right-1 grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-foreground/8 hover:text-foreground data-[popup-open]:text-brand"
          >
            <CalendarDays aria-hidden size={20} />
          </Popover.Trigger>
        </div>
        <Popover.Portal>
          <Popover.Positioner side="bottom" align="start" sideOffset={6} collisionPadding={12} className={CLASSE_POSICIONADOR}>
            <Popover.Popup aria-label="Calendário" className={cx(CLASSE_FLUTUANTE, "w-[21rem] max-w-[var(--available-width)] p-3")}>
              <Calendar
                value={atual}
                min={min}
                max={max}
                isDisabled={isDisabled}
                autoFocus
                onSelect={(iso) => {
                  definir(iso);
                  setAberto(false);
                }}
              />
              <div className="mt-2 flex justify-between border-t border-border pt-2">
                <Button variant="ghost" size="sm" onClick={() => (definir(hojeLisboa()), setAberto(false))} disabled={!!((min && hojeLisboa() < min) || (max && hojeLisboa() > max))}>
                  Hoje
                </Button>
                {atual && (
                  <Button variant="ghost" size="sm" onClick={() => (definir(null), setAberto(false))}>
                    Limpar
                  </Button>
                )}
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      {name && <input type="hidden" name={name} value={atual ?? ""} />}
      {mensagem && (
        <p id={msgId} className="text-[0.9375rem] font-medium text-destructive">
          {mensagem}
        </p>
      )}
    </div>
  );
}

// ─── DateRangePicker ──────────────────────────────────────────────────────

export interface DateRange {
  inicio: DataIso | null;
  fim: DataIso | null;
}

export interface DateRangePickerProps extends Aria {
  value?: DateRange | undefined;
  defaultValue?: DateRange | undefined;
  onValueChange?: ((range: DateRange) => void) | undefined;
  min?: DataIso | null | undefined;
  max?: DataIso | null | undefined;
  isDisabled?: ((iso: DataIso) => boolean) | undefined;
  /** Quick choices ("Últimos 30 dias"…). `true` = the default set; false hides them. */
  presets?: boolean | Array<{ id: string; rotulo: string; inicio: DataIso; fim: DataIso }> | undefined;
  /** Hidden inputs `${name}_inicio` / `${name}_fim` for forms. */
  name?: string | undefined;
  disabled?: boolean | undefined;
  placeholder?: string | undefined;
  className?: string | undefined;
}

export function DateRangePicker({
  value,
  defaultValue = { inicio: null, fim: null },
  onValueChange,
  min,
  max,
  isDisabled,
  presets = true,
  name,
  disabled,
  placeholder = "Escolha as datas",
  className,
  ...aria
}: DateRangePickerProps) {
  const [interno, setInterno] = useState<DateRange>(defaultValue);
  const atual = value ?? interno;
  const [rascunho, setRascunho] = useState<DateRange>(atual);
  const [aberto, setAberto] = useState(false);
  const rapidos = presets === true ? intervalosRapidos() : presets || [];

  const definir = (r: DateRange) => {
    if (!value) setInterno(r);
    onValueChange?.(r);
  };
  const escolherDia = (iso: DataIso) => {
    setRascunho((r) => {
      if (!r.inicio || r.fim) return { inicio: iso, fim: null };
      return iso < r.inicio ? { inicio: iso, fim: r.inicio } : { inicio: r.inicio, fim: iso };
    });
  };
  const texto =
    atual.inicio && atual.fim ? `${formatarDataCurta(atual.inicio)} – ${formatarDataCurta(atual.fim)}` : atual.inicio ? `A partir de ${formatarDataCurta(atual.inicio)}` : null;
  const falado = atual.inicio && atual.fim ? `de ${rotuloDoDia(atual.inicio)} a ${rotuloDoDia(atual.fim)}` : "nenhum período escolhido";

  let resumo: ReactNode = "Escolha o primeiro dia.";
  if (rascunho.inicio && !rascunho.fim) resumo = <>Desde {formatarDataCurta(rascunho.inicio)}. Escolha o último dia.</>;
  if (rascunho.inicio && rascunho.fim) resumo = <>{formatarDataCurta(rascunho.inicio)} – {formatarDataCurta(rascunho.fim)}</>;

  return (
    <div className={cx("min-w-0", className)}>
      <Popover.Root
        open={aberto}
        onOpenChange={(a) => {
          setAberto(a);
          if (a) setRascunho(atual);
        }}
      >
        <Popover.Trigger
          {...aria}
          disabled={disabled}
          aria-label={aria["aria-label"] ? `${aria["aria-label"]}: ${falado}` : undefined}
          className="m-field m-gatilho w-full rounded-lg"
        >
          <span className={cx("flex min-w-0 items-center gap-2 truncate tabular-nums", !texto && "text-muted-foreground")}>
            <CalendarDays aria-hidden size={18} className="shrink-0 text-muted-foreground" />
            {texto ?? placeholder}
          </span>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner side="bottom" align="start" sideOffset={6} collisionPadding={12} className={CLASSE_POSICIONADOR}>
            <Popover.Popup aria-label="Escolher período" className={cx(CLASSE_FLUTUANTE, "flex max-w-[var(--available-width)] flex-col sm:flex-row")}>
              {rapidos.length > 0 && (
                <div className="m-scroll-x flex gap-1 overflow-x-auto border-b border-border p-2 sm:w-44 sm:flex-col sm:overflow-visible sm:border-r sm:border-b-0">
                  {rapidos.map((r) => {
                    const ativo = rascunho.inicio === r.inicio && rascunho.fim === r.fim;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        aria-pressed={ativo}
                        onClick={() => setRascunho({ inicio: r.inicio, fim: r.fim })}
                        className={cx(
                          "min-h-10 shrink-0 rounded-md px-3 text-left text-[0.9375rem] whitespace-nowrap hover:bg-foreground/6",
                          ativo && "bg-brand-soft font-semibold text-brand-soft-foreground",
                        )}
                      >
                        {r.rotulo}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="flex flex-col gap-2 p-3">
                <Calendar
                  range={rascunho}
                  onSelect={escolherDia}
                  min={min}
                  max={max}
                  isDisabled={isDisabled}
                  months={2}
                  defaultMonth={rascunho.inicio ? somarMeses(rascunho.inicio, 0) : somarMeses(hojeLisboa(), -1)}
                  autoFocus
                  className="sm:w-[40rem]"
                />
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                  <p aria-live="polite" className="text-[0.9375rem] text-muted-foreground tabular-nums">
                    {resumo}
                  </p>
                  <div className="ml-auto flex gap-2">
                    {(atual.inicio || rascunho.inicio) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRascunho({ inicio: null, fim: null });
                          definir({ inicio: null, fim: null });
                        }}
                      >
                        <X aria-hidden /> Limpar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      disabled={!rascunho.inicio || !rascunho.fim}
                      onClick={() => {
                        definir(rascunho);
                        setAberto(false);
                      }}
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      {name && (
        <>
          <input type="hidden" name={`${name}_inicio`} value={atual.inicio ?? ""} />
          <input type="hidden" name={`${name}_fim`} value={atual.fim ?? ""} />
        </>
      )}
    </div>
  );
}

export type { DataIso } from "./calendario";
