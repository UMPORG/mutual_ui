"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import { Check, ChevronDown, Copy } from "lucide-react";
import { cx } from "./cx";
import {
  INDICATIVO_PT,
  INDICATIVOS,
  mascaraCodigoPostal,
  mascaraIban,
  mascaraNif,
  mascaraTelefoneNacional,
  maxDigitosNacionais,
  normalizarCodigoPostal,
  normalizarIban,
  normalizarNif,
  normalizarTelefone,
  posicaoAposMascara,
  separarIndicativo,
  significativosAte,
  soDigitos,
} from "./identificadores";

/**
 * Inputs for Portuguese identifiers (v0.8.9): `CampoTelefone`, `CampoNif`,
 * `CampoCodigoPostal`, `CampoIban`. Each one shows a mask while the person
 * types ("912 345 678", "4000-123", "PT50 0002 …"), keeps the caret where it
 * was, and hands the app the NORMALISED value (`onValueChange`): E.164 for
 * phones, 9 digits for NIF, "1234-567", IBAN without spaces. Validation
 * stays with the form (`validarTelefone`… from `@umporg/ui/validar`, or
 * `comZod`) and the message goes to `FormField error` — the field wires
 * `id` and the ARIA props into the visible input.
 *
 * `name` goes on a hidden input with the normalised value, so plain forms,
 * server actions and `DemoPreencher` (which fills it by name) work too.
 *
 * TanStack Form: `value={field.state.value} onValueChange={field.handleChange}
 * onBlur={field.handleBlur}`; react-hook-form: `Controller` with
 * `value`/`onChange` → `onValueChange`.
 */

type AtributosInput = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue" | "onChange" | "type" | "name" | "maxLength" | "size"
>;

export interface CampoMascaradoProps extends AtributosInput {
  /** The normalised value (controlled). */
  value?: string | undefined;
  /** Initial normalised value (uncontrolled). */
  defaultValue?: string | undefined;
  /** Called with the normalised value on every change ("" when empty). */
  onValueChange?: ((valor: string) => void) | undefined;
  /** Name of the hidden input that carries the normalised value in a plain form submit. */
  name?: string | undefined;
  /** Ref to the visible input (focus it on submit errors). */
  ref?: Ref<HTMLInputElement> | undefined;
  className?: string | undefined;
}

/** A hidden input that also reacts to scripted fills (DemoPreencher sets `.value` + an `input` event). */
function useEntradaOculta(aoPreencher: (valor: string) => void) {
  const ref = useRef<HTMLInputElement>(null);
  const cb = useRef(aoPreencher);
  cb.current = aoPreencher;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ouvir = () => cb.current(el.value);
    el.addEventListener("input", ouvir);
    return () => el.removeEventListener("input", ouvir);
  }, []);
  return ref;
}

/** Keeps the caret after the same letters/digits once the mask rewrote the text. */
function repor(el: HTMLInputElement, formatado: string, significativos: number) {
  const pos = posicaoAposMascara(formatado, significativos);
  requestAnimationFrame(() => {
    if (document.activeElement === el) el.setSelectionRange(pos, pos);
  });
}

interface Mascara {
  /** Display text from whatever was typed or stored. */
  mostrar: (texto: string) => string;
  /** Normalised value from the typed text ("" when empty; best effort when incomplete). */
  valor: (texto: string) => string;
}

function CampoMascarado({
  mascara,
  value,
  defaultValue,
  onValueChange,
  name,
  ref,
  className,
  ...props
}: CampoMascaradoProps & { mascara: Mascara }) {
  const controlado = value !== undefined;
  const [texto, setTexto] = useState(() => mascara.mostrar(value ?? defaultValue ?? ""));
  // The last value this field produced or received: a different `value` prop
  // comes from outside (form reset, a record loaded) and replaces the text.
  const [conhecido, setConhecido] = useState(value ?? defaultValue ?? "");
  if (controlado && value !== conhecido) {
    setConhecido(value);
    setTexto(mascara.mostrar(value));
  }

  const aplicar = (bruto: string) => {
    const formatado = mascara.mostrar(bruto);
    const normalizado = mascara.valor(formatado);
    setTexto(formatado);
    setConhecido(normalizado);
    onValueChange?.(normalizado);
    return formatado;
  };

  const oculto = useEntradaOculta((v) => aplicar(v));

  return (
    <>
      <input
        {...props}
        ref={ref}
        type="text"
        value={texto}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const el = e.currentTarget;
          const sig = significativosAte(el.value, el.selectionStart ?? el.value.length);
          const formatado = aplicar(el.value);
          repor(el, formatado, sig);
        }}
        className={cx("m-field h-11 w-full min-w-0 rounded-lg px-3 text-base text-foreground tabular-nums outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60", className)}
      />
      {name ? <input ref={oculto} type="hidden" name={name} value={controlado ? value : mascara.valor(texto)} /> : null}
    </>
  );
}

// ─── NIF, código postal, IBAN ─────────────────────────────────────────────

const MASCARA_NIF: Mascara = {
  mostrar: (t) => mascaraNif(t.trim().toUpperCase().replace(/^PT/, "")),
  valor: (t) => normalizarNif(t) ?? soDigitos(t),
};

/** NIF / NIPC: "501 234 560" on screen, 9 digits in the value. Pair with `validarNif`. */
export function CampoNif(props: CampoMascaradoProps) {
  return <CampoMascarado inputMode="numeric" autoComplete="off" placeholder="123 456 789" {...props} mascara={MASCARA_NIF} />;
}

const MASCARA_CP: Mascara = {
  mostrar: mascaraCodigoPostal,
  valor: (t) => normalizarCodigoPostal(t) ?? mascaraCodigoPostal(t),
};

/** Código postal: types "4000123", shows and stores "4000-123". Pair with `validarCodigoPostal`. */
export function CampoCodigoPostal({ className, ...props }: CampoMascaradoProps) {
  return (
    <CampoMascarado
      inputMode="numeric"
      autoComplete="postal-code"
      placeholder="1234-567"
      {...props}
      className={cx("max-w-40", className)}
      mascara={MASCARA_CP}
    />
  );
}

const MASCARA_IBAN: Mascara = {
  mostrar: mascaraIban,
  valor: (t) => normalizarIban(t) ?? t.replace(/[^A-Za-z0-9]/g, "").toUpperCase(),
};

/** IBAN: groups of four in capitals on screen, no spaces in the value. Pair with `validarIban`. */
export function CampoIban(props: CampoMascaradoProps) {
  return (
    <CampoMascarado
      autoComplete="off"
      autoCapitalize="characters"
      spellCheck={false}
      placeholder="PT50 0000 0000 0000 0000 0000 0"
      {...props}
      mascara={MASCARA_IBAN}
    />
  );
}

// ─── Telefone ─────────────────────────────────────────────────────────────

export interface CampoTelefoneProps extends Omit<CampoMascaradoProps, "inputMode"> {
  /** Calling code chosen when the value has none. Default "351" (Portugal). */
  indicativoPadrao?: string | undefined;
  /** Hide the country list (Portuguese numbers only; "+…" typed still works). */
  semIndicativo?: boolean | undefined;
}

/** Reads a stored value into calling code + national digits. */
function lerTelefone(valor: string, padrao: string): { indicativo: string; nacional: string } {
  const t = valor.trim();
  if (!t) return { indicativo: padrao, nacional: "" };
  const d = soDigitos(t);
  if (t.startsWith("+") || d.startsWith("00")) return separarIndicativo(t.startsWith("+") ? d : d.slice(2));
  return { indicativo: padrao, nacional: d };
}

/**
 * Phone number with the country code (+351 by default). The number is masked
 * while typing ("912 345 678"); pasting "+44 20 7946 0958" or "00351…"
 * switches the country by itself. The value is E.164 ("+351912345678"; ""
 * when empty; "+351912" while incomplete, so `validarTelefone` can say what
 * is missing).
 */
export function CampoTelefone({
  value,
  defaultValue,
  onValueChange,
  name,
  ref,
  className,
  indicativoPadrao = INDICATIVO_PT,
  semIndicativo,
  disabled,
  onBlur,
  ...props
}: CampoTelefoneProps) {
  const controlado = value !== undefined;
  const inicial = lerTelefone(value ?? defaultValue ?? "", indicativoPadrao);
  const [indicativo, setIndicativo] = useState(inicial.indicativo);
  const [texto, setTexto] = useState(mascaraTelefoneNacional(inicial.nacional, inicial.indicativo));
  const [conhecido, setConhecido] = useState(value ?? defaultValue ?? "");
  const selectId = useId();

  const valorDe = (codigo: string, nacional: string) => {
    const d = soDigitos(nacional);
    if (!d) return "";
    return normalizarTelefone(`+${codigo}${d}`) ?? `+${codigo}${d}`;
  };

  if (controlado && value !== conhecido) {
    setConhecido(value);
    const lido = lerTelefone(value, indicativoPadrao);
    setIndicativo(lido.indicativo);
    setTexto(mascaraTelefoneNacional(lido.nacional, lido.indicativo));
  }

  const emitir = (codigo: string, nacional: string) => {
    const v = valorDe(codigo, nacional);
    setConhecido(v);
    onValueChange?.(v);
  };

  /** Typed, pasted or filled text: a "+…"/"00…" switches the country. */
  const aplicar = (bruto: string, codigoAtual: string) => {
    const t = bruto.trim();
    let codigo = codigoAtual;
    let nacional = soDigitos(t);
    if (t.startsWith("+") || (nacional.startsWith("00") && nacional.length > 4)) {
      const lido = separarIndicativo(t.startsWith("+") ? nacional : nacional.slice(2));
      if (lido.indicativo) {
        codigo = lido.indicativo;
        nacional = lido.nacional;
      }
    } else if (codigo !== INDICATIVO_PT) {
      nacional = nacional.replace(/^0/, "");
    }
    nacional = nacional.slice(0, maxDigitosNacionais(codigo));
    const formatado = mascaraTelefoneNacional(nacional, codigo);
    setIndicativo(codigo);
    setTexto(formatado);
    emitir(codigo, nacional);
    return formatado;
  };

  const oculto = useEntradaOculta((v) => aplicar(v, indicativo));
  const naLista = INDICATIVOS.some((i) => i.codigo === indicativo);
  const pais = INDICATIVOS.find((i) => i.codigo === indicativo)?.pais;

  return (
    <div className={cx("m-field flex h-11 w-full min-w-0 items-stretch overflow-hidden rounded-lg", disabled && "opacity-60", className)}>
      {semIndicativo ? null : (
        <span className="relative flex shrink-0 items-center border-r border-border">
          {/* The native list (the OS picker on phones) sits over the short "+351" label. */}
          <span aria-hidden className="pointer-events-none flex items-center gap-1 pr-2 pl-3 text-base text-foreground tabular-nums">
            +{indicativo}
            <ChevronDown size={16} className="text-muted-foreground" />
          </span>
          <select
            id={selectId}
            aria-label={`Indicativo do país${pais ? `: ${pais}` : ""}`}
            value={indicativo}
            disabled={disabled}
            onChange={(e) => {
              const codigo = e.currentTarget.value;
              setIndicativo(codigo);
              const nacional = soDigitos(texto).slice(0, maxDigitosNacionais(codigo));
              setTexto(mascaraTelefoneNacional(nacional, codigo));
              emitir(codigo, nacional);
            }}
            className="absolute inset-0 min-h-11 w-full cursor-pointer appearance-none opacity-0 disabled:cursor-not-allowed"
          >
            {naLista ? null : <option value={indicativo}>+{indicativo}</option>}
            {INDICATIVOS.map((i) => (
              <option key={i.codigo} value={i.codigo}>
                {i.pais} (+{i.codigo})
              </option>
            ))}
          </select>
        </span>
      )}
      <input
        {...props}
        ref={ref}
        type="tel"
        inputMode="tel"
        autoComplete={props.autoComplete ?? "tel-national"}
        placeholder={props.placeholder ?? (indicativo === INDICATIVO_PT ? "912 345 678" : undefined)}
        disabled={disabled}
        value={texto}
        onChange={(e) => {
          const el = e.currentTarget;
          const sig = significativosAte(el.value, el.selectionStart ?? el.value.length);
          const tinhaIndicativo = el.value.trim().startsWith("+") || soDigitos(el.value).startsWith("00");
          const formatado = aplicar(el.value, indicativo);
          // After "+44 …" the code left the text: put the caret at the end.
          if (tinhaIndicativo) repor(el, formatado, soDigitos(formatado).length);
          else repor(el, formatado, sig);
        }}
        onBlur={onBlur}
        className="w-full min-w-0 bg-transparent px-3 text-base text-foreground tabular-nums outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
      />
      {name ? <input ref={oculto} type="hidden" name={name} value={controlado ? value : valorDe(indicativo, texto)} /> : null}
    </div>
  );
}

// ─── Copiar ───────────────────────────────────────────────────────────────

/** A 44px copy button with a spoken confirmation («Número copiado»). */
export function BotaoCopiar({
  texto,
  rotulo = "Copiar",
  feito = "Copiado",
  className,
  children,
}: {
  texto: string;
  rotulo?: string | undefined;
  feito?: string | undefined;
  className?: string | undefined;
  children?: ReactNode | undefined;
}) {
  const [copiado, setCopiado] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(t.current), []);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setCopiado(true);
          clearTimeout(t.current);
          t.current = setTimeout(() => setCopiado(false), 2000);
        } catch {
          /* clipboard blocked: nothing to do */
        }
      }}
      className={cx(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-foreground/8 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      {copiado ? <Check aria-hidden size={18} className="text-success" /> : <Copy aria-hidden size={18} />}
      <span className="sr-only" aria-live="polite">
        {copiado ? feito : rotulo}
      </span>
      {children}
    </button>
  );
}
