/**
 * pt-PT formatting for every number, amount, percentage and date the apps
 * show. Pure functions (server, client, edge). Missing or invalid values
 * render as "—" so a table never shows "NaN", "undefined" or an ISO date.
 *
 * pt-PT conventions (CLDR): decimal comma, a space groups thousands from
 * 10 000 up ("1234", "12 345"), the euro sign after the amount
 * ("1234,50 €"), "12,5%", dates as dd/MM/yyyy and everything in the
 * Europe/Lisbon time zone. Spaces inside numbers are non-breaking.
 */

export const LOCALE = "pt-PT";
export const FUSO_HORARIO = "Europe/Lisbon";
/** What we show when a value is missing. */
export const SEM_VALOR = "—";

export type ValorNumerico = number | bigint | string | null | undefined;

const cache = new Map<string, Intl.NumberFormat>();
function nf(opcoes: Intl.NumberFormatOptions): Intl.NumberFormat {
  const chave = JSON.stringify(opcoes);
  let f = cache.get(chave);
  if (!f) {
    f = new Intl.NumberFormat(LOCALE, opcoes);
    cache.set(chave, f);
  }
  return f;
}

/** Accepts numbers and numeric strings ("12.5", from JSON/Decimal columns). */
export function paraNumero(valor: ValorNumerico): number | null {
  if (valor === null || valor === undefined || valor === "") return null;
  const n = typeof valor === "number" ? valor : Number(valor);
  return Number.isFinite(n) ? n : null;
}

export interface OpcoesNumero {
  /** Exact number of decimals. Default: up to 2, none if the value is whole. */
  casas?: number | undefined;
  /** "1,2 mil", "3,4 M" — for tiles and axis ticks, never for tables. */
  compacto?: boolean | undefined;
  /** Always show the sign ("+12", "-3", "0"). */
  sinal?: boolean | undefined;
}

function decimais(o: { casas?: number | undefined; compacto?: boolean | undefined }, padraoMax: number): Intl.NumberFormatOptions {
  if (o.casas !== undefined) return { minimumFractionDigits: o.casas, maximumFractionDigits: o.casas };
  return { minimumFractionDigits: 0, maximumFractionDigits: o.compacto ? 1 : padraoMax };
}

/** `formatarNumero(12345.6)` → "12 345,6"; `{ compacto: true }` → "12,3 mil". */
export function formatarNumero(valor: ValorNumerico, opcoes: OpcoesNumero = {}): string {
  const n = paraNumero(valor);
  if (n === null) return SEM_VALOR;
  return nf({
    ...decimais(opcoes, 2),
    ...(opcoes.compacto ? { notation: "compact", compactDisplay: "short" } : {}),
    ...(opcoes.sinal ? { signDisplay: "exceptZero" } : {}),
  }).format(n);
}

export interface OpcoesMoeda extends OpcoesNumero {
  /** ISO 4217 code. Default "EUR". */
  moeda?: string | undefined;
}

/** `formatarMoeda(1234.5)` → "1234,50 €"; `{ compacto: true }` on 2 500 000 → "2,5 M €". */
export function formatarMoeda(valor: ValorNumerico, opcoes: OpcoesMoeda = {}): string {
  const n = paraNumero(valor);
  if (n === null) return SEM_VALOR;
  const casas = opcoes.casas ?? (opcoes.compacto ? undefined : 2);
  return nf({
    style: "currency",
    currency: opcoes.moeda ?? "EUR",
    ...decimais({ casas, compacto: opcoes.compacto }, 2),
    ...(opcoes.compacto ? { notation: "compact", compactDisplay: "short" } : {}),
    ...(opcoes.sinal ? { signDisplay: "exceptZero" } : {}),
  }).format(n);
}

export interface OpcoesPercentagem extends Omit<OpcoesNumero, "compacto"> {
  /**
   * "fracao" (default): 0.125 is 12,5%. "cem": the value is already a
   * percentage (12.5 is 12,5%) — what most APIs return.
   */
  escala?: "fracao" | "cem" | undefined;
}

/** `formatarPercentagem(0.125)` → "12,5%"; `(12.5, { escala: "cem" })` → "12,5%". */
export function formatarPercentagem(valor: ValorNumerico, opcoes: OpcoesPercentagem = {}): string {
  const n = paraNumero(valor);
  if (n === null) return SEM_VALOR;
  const fracao = opcoes.escala === "cem" ? n / 100 : n;
  return nf({
    style: "percent",
    ...decimais({ casas: opcoes.casas }, 1),
    ...(opcoes.sinal ? { signDisplay: "exceptZero" } : {}),
  }).format(fracao);
}

/** How a value is shown by stat tiles, charts and tables. */
export type FormatoValor =
  | "numero"
  | "inteiro"
  | "moeda"
  | "percentagem"
  | ((valor: number) => string)
  | ({ tipo: "numero"; opcoes?: OpcoesNumero })
  | ({ tipo: "moeda"; opcoes?: OpcoesMoeda })
  | ({ tipo: "percentagem"; opcoes?: OpcoesPercentagem });

/**
 * One entry point for components: `formatarValor(v, "moeda")`.
 * `compacto` shortens numbers from 10 000 up (tiles, axis ticks).
 */
export function formatarValor(valor: ValorNumerico, formato: FormatoValor = "numero", compacto = false): string {
  const n = paraNumero(valor);
  if (n === null) return SEM_VALOR;
  // Below 10 000 the full number is as short as the compact one, and exact.
  if (compacto && Math.abs(n) < 10_000) compacto = false;
  if (typeof formato === "function") return formato(n);
  if (typeof formato === "object") {
    if (formato.tipo === "moeda") return formatarMoeda(n, { compacto, ...formato.opcoes });
    if (formato.tipo === "percentagem") return formatarPercentagem(n, formato.opcoes);
    return formatarNumero(n, { compacto, ...formato.opcoes });
  }
  switch (formato) {
    case "moeda":
      return formatarMoeda(n, { compacto });
    case "percentagem":
      return formatarPercentagem(n);
    case "inteiro":
      return formatarNumero(n, { casas: compacto ? undefined : 0, compacto });
    default:
      return formatarNumero(n, { compacto });
  }
}

/**
 * Axis ticks: short and without decimals that carry no information
 * ("26 mil €", "6500 €", "40%").
 */
export function formatarEixo(valor: ValorNumerico, formato: FormatoValor = "numero"): string {
  const n = paraNumero(valor);
  if (n === null) return "";
  if (typeof formato === "function") return formato(n);
  const tipo = typeof formato === "object" ? formato.tipo : formato;
  const grande = Math.abs(n) >= 10_000;
  if (tipo === "moeda") {
    const moeda = typeof formato === "object" && formato.tipo === "moeda" ? formato.opcoes?.moeda : undefined;
    return formatarMoeda(n, { moeda, compacto: grande, casas: grande ? undefined : 0 });
  }
  if (tipo === "percentagem") {
    const escala = typeof formato === "object" && formato.tipo === "percentagem" ? formato.opcoes?.escala : undefined;
    return formatarPercentagem(n, { escala });
  }
  return formatarNumero(n, { compacto: grande });
}

// ─── Datas ────────────────────────────────────────────────────────────────

export type ValorData = Date | string | number | null | undefined;

export type EstiloData =
  /** 03/10/2026 */
  | "curta"
  /** sábado, 3 de outubro de 2026 */
  | "longa"
  /** 3 de outubro de 2026 */
  | "media"
  /** 3 out. (axis ticks, compact tables) */
  | "diaMes"
  /** outubro de 2026 */
  | "mesAno"
  /** out. 2026 (axis ticks) */
  | "mesAnoCurto"
  /** 03/10/2026, 14:30 */
  | "dataHora"
  /** 14:30 */
  | "hora";

const OPCOES_DATA: Record<EstiloData, Intl.DateTimeFormatOptions> = {
  curta: { day: "2-digit", month: "2-digit", year: "numeric" },
  longa: { weekday: "long", day: "numeric", month: "long", year: "numeric" },
  media: { day: "numeric", month: "long", year: "numeric" },
  diaMes: { day: "numeric", month: "short" },
  mesAno: { month: "long", year: "numeric" },
  mesAnoCurto: { month: "short", year: "numeric" },
  dataHora: { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" },
  hora: { hour: "2-digit", minute: "2-digit", hourCycle: "h23" },
};

const cacheData = new Map<string, Intl.DateTimeFormat>();

const SO_DATA = /^\d{4}-\d{2}-\d{2}$/;

/** Parses Date, epoch ms and ISO strings. A date-only ISO string ("2026-10-03")
 *  is a calendar day, never shifted by the time zone. */
export function paraData(valor: ValorData): Date | null {
  if (valor === null || valor === undefined || valor === "") return null;
  let d: Date;
  if (valor instanceof Date) d = valor;
  else if (typeof valor === "string" && SO_DATA.test(valor)) d = new Date(`${valor}T12:00:00Z`);
  else d = new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * `formatarData("2026-10-03")` → "03/10/2026";
 * `formatarData(d, "longa")` → "sábado, 3 de outubro de 2026".
 * Always in Europe/Lisbon, whatever the server's time zone.
 */
export function formatarData(valor: ValorData, estilo: EstiloData = "curta"): string {
  const d = paraData(valor);
  if (!d) return SEM_VALOR;
  // ICU renders pt-PT "day + short month" as "3/10"; the UI wants words.
  if (estilo === "diaMes") return `${partes(d, { day: "numeric" })} ${partes(d, { month: "short" })}`;
  if (estilo === "mesAnoCurto") return `${partes(d, { month: "short" })} ${partes(d, { year: "numeric" })}`;
  return dtf(estilo, OPCOES_DATA[estilo]).format(d);
}

function dtf(chave: string, opcoes: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  let f = cacheData.get(chave);
  if (!f) {
    f = new Intl.DateTimeFormat(LOCALE, { ...opcoes, timeZone: FUSO_HORARIO });
    cacheData.set(chave, f);
  }
  return f;
}

function partes(d: Date, opcoes: Intl.DateTimeFormatOptions): string {
  return dtf(JSON.stringify(opcoes), opcoes).format(d);
}

/** Pluralises a count in words: `contar(1, "associação", "associações")` → "1 associação". */
export function contar(n: number, singular: string, plural: string): string {
  return `${formatarNumero(n, { casas: 0 })} ${Math.abs(n) === 1 ? singular : plural}`;
}
