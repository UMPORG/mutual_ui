/**
 * Portuguese identifiers (v0.8.9): phone numbers, NIF/NIPC, código postal and
 * IBAN. Pure functions, no dependencies (server, client, edge, Bun).
 *
 * Three verbs for each identifier:
 * - `normalizar…` turns what a person typed ("912 345 678", "PT 501 234 560",
 *   "4000123", "pt50 0002…") into the stored form, or `null` when it is not
 *   one. Storage is always the normalised form: phones in E.164
 *   ("+351912345678"), NIF 9 digits, código postal "4000-123", IBAN in
 *   capitals without spaces.
 * - `validar…` returns `{ valido: true, valor }` (the normalised value) or
 *   `{ valido: false, erro }` with a plain pt-PT message for the field. Use it
 *   in zod (`comZod`), Effect Schema or by hand.
 * - `formatar…` (exported from `@umporg/ui/formatar`) shows the stored value to
 *   people: "222 084 177", "+44 207 946 0958", "501 234 560", "PT50 0002 …".
 *
 * Masks for the input components live here too (`mascara…`) so they are
 * unit-tested without a browser.
 */

export type ResultadoValidacao<T = string> = { valido: true; valor: T } | { valido: false; erro: string };

const ok = <T>(valor: T): ResultadoValidacao<T> => ({ valido: true, valor });
const falha = (erro: string): ResultadoValidacao<never> => ({ valido: false, erro });

/** Only the digits of a text. */
export function soDigitos(texto: string | null | undefined): string {
  return (texto ?? "").replace(/\D/g, "");
}

/** Groups digits: `agrupar("912345678", [3, 3, 3])` → "912 345 678". */
function agrupar(digitos: string, grupos: readonly number[]): string {
  const partes: string[] = [];
  let i = 0;
  for (const g of grupos) {
    if (i >= digitos.length) break;
    partes.push(digitos.slice(i, i + g));
    i += g;
  }
  if (i < digitos.length) partes.push(digitos.slice(i));
  return partes.join(" ");
}

/** Groups of three from the left; a last group of one joins the one before ("207 946 0958"). */
function gruposDeTres(n: number): number[] {
  const grupos: number[] = [];
  let resto = n;
  while (resto > 0) {
    grupos.push(Math.min(3, resto));
    resto -= 3;
  }
  if (grupos.length > 1 && grupos.at(-1) === 1) {
    grupos.pop();
    grupos[grupos.length - 1] = 4;
  }
  return grupos;
}

// ─── Telefones ─────────────────────────────────────────────────────────────

/** Portugal's calling code, the default everywhere. */
export const INDICATIVO_PT = "351";

// ITU calling codes are prefix-free: with the 1- and 2-digit codes known,
// every other code has 3 digits.
const INDICATIVOS_CURTOS = new Set([
  "1", "7",
  "20", "27", "30", "31", "32", "33", "34", "36", "39", "40", "41", "43", "44", "45", "46", "47", "48", "49",
  "51", "52", "53", "54", "55", "56", "57", "58", "60", "61", "62", "63", "64", "65", "66",
  "81", "82", "84", "86", "90", "91", "92", "93", "94", "95", "98",
]);

/** Splits the digits of an E.164 number into calling code and national number. */
export function separarIndicativo(digitos: string): { indicativo: string; nacional: string } {
  const d = soDigitos(digitos);
  const n = INDICATIVOS_CURTOS.has(d.slice(0, 1)) ? 1 : INDICATIVOS_CURTOS.has(d.slice(0, 2)) ? 2 : 3;
  return { indicativo: d.slice(0, n), nacional: d.slice(n) };
}

/** The calling codes offered by `CampoTelefone` (Portugal first, then the Portuguese-speaking world and the emigration countries). */
export const INDICATIVOS: ReadonlyArray<{ codigo: string; pais: string }> = [
  { codigo: "351", pais: "Portugal" },
  { codigo: "34", pais: "Espanha" },
  { codigo: "33", pais: "França" },
  { codigo: "41", pais: "Suíça" },
  { codigo: "352", pais: "Luxemburgo" },
  { codigo: "49", pais: "Alemanha" },
  { codigo: "44", pais: "Reino Unido" },
  { codigo: "32", pais: "Bélgica" },
  { codigo: "31", pais: "Países Baixos" },
  { codigo: "39", pais: "Itália" },
  { codigo: "55", pais: "Brasil" },
  { codigo: "244", pais: "Angola" },
  { codigo: "238", pais: "Cabo Verde" },
  { codigo: "245", pais: "Guiné-Bissau" },
  { codigo: "258", pais: "Moçambique" },
  { codigo: "239", pais: "São Tomé e Príncipe" },
  { codigo: "670", pais: "Timor-Leste" },
  { codigo: "853", pais: "Macau" },
  { codigo: "1", pais: "Estados Unidos e Canadá" },
  { codigo: "58", pais: "Venezuela" },
  { codigo: "27", pais: "África do Sul" },
];

/** Portuguese numbers: 2x fixed, 30 nomadic, 70x/76x, 80x, mobiles 91/92/93/96. */
const PT_VALIDO = /^(?:2\d|30|7[0-6]|8\d|9[1236])\d{7}$/;
const PT_MOVEL = /^9[1236]\d{7}$/;

export type TipoTelefone = "movel" | "fixo" | "qualquer";

export interface OpcoesTelefone {
  /** Calling code for numbers typed without one. Default "351". */
  indicativo?: string | undefined;
}

/**
 * The E.164 form of a phone number, or `null`. Accepts spaces, dots, dashes,
 * brackets, "+351", "00351" and national numbers (Portugal by default):
 * `normalizarTelefone("912 345 678")` → "+351912345678".
 */
export function normalizarTelefone(texto: string | null | undefined, opcoes: OpcoesTelefone = {}): string | null {
  const bruto = (texto ?? "").trim();
  if (!bruto) return null;
  if (/[^\d\s+().\-/]/.test(bruto)) return null;
  let digitos = soDigitos(bruto);
  let internacional = /^\(?\+/.test(bruto);
  if (!internacional && digitos.startsWith("00")) {
    digitos = digitos.slice(2);
    internacional = true;
  }
  if (!internacional) {
    const codigo = soDigitos(opcoes.indicativo ?? INDICATIVO_PT) || INDICATIVO_PT;
    // Portugal has no trunk prefix; elsewhere the national "0" drops (UK 020… → +44 20…).
    const nacional = codigo === INDICATIVO_PT ? digitos : digitos.replace(/^0/, "");
    digitos = codigo + nacional;
  }
  const { indicativo, nacional } = separarIndicativo(digitos);
  if (indicativo === INDICATIVO_PT) return PT_VALIDO.test(nacional) ? `+${digitos}` : null;
  if (digitos.length < 8 || digitos.length > 15 || nacional.length < 4) return null;
  return `+${digitos}`;
}

/**
 * Checks a phone number: `{ valido: true, valor: "+351912345678" }` or a pt-PT
 * message. `tipo: "movel"` accepts only mobiles (91, 92, 93, 96 in Portugal).
 */
export function validarTelefone(
  texto: string | null | undefined,
  opcoes: OpcoesTelefone & { tipo?: TipoTelefone | undefined } = {},
): ResultadoValidacao {
  const bruto = (texto ?? "").trim();
  if (!bruto) return falha(opcoes.tipo === "movel" ? "Indique o número de telemóvel." : "Indique o número de telefone.");
  const e164 = normalizarTelefone(bruto, opcoes);
  if (!e164) {
    const nacionalPt = nacionalPortugues(bruto, opcoes.indicativo);
    if (nacionalPt === null) return falha("Verifique o número e o indicativo do país.");
    return nacionalPt.length === 9
      ? falha("Este número não existe em Portugal. Verifique os algarismos.")
      : falha("Um número português tem 9 algarismos (por exemplo 912 345 678).");
  }
  const { indicativo, nacional } = separarIndicativo(e164);
  if (opcoes.tipo === "movel" && indicativo === INDICATIVO_PT && !PT_MOVEL.test(nacional))
    return falha("Indique um telemóvel (começa por 91, 92, 93 ou 96).");
  if (opcoes.tipo === "fixo" && indicativo === INDICATIVO_PT && PT_MOVEL.test(nacional))
    return falha("Indique um telefone fixo, não um telemóvel.");
  return ok(e164);
}

/** The national digits when the text is meant as a Portuguese number, else `null`. */
function nacionalPortugues(bruto: string, indicativoPadrao: string | undefined): string | null {
  const d = soDigitos(bruto);
  if (/^\(?\+/.test(bruto)) return d.startsWith(INDICATIVO_PT) ? d.slice(3) : null;
  if (d.startsWith("00")) return d.startsWith(`00${INDICATIVO_PT}`) ? d.slice(5) : null;
  return (soDigitos(indicativoPadrao ?? INDICATIVO_PT) || INDICATIVO_PT) === INDICATIVO_PT ? d : null;
}

/** `true` when the E.164 number is a Portuguese mobile. */
export function eTelemovel(texto: string | null | undefined): boolean {
  const e164 = normalizarTelefone(texto);
  if (!e164) return false;
  const { indicativo, nacional } = separarIndicativo(e164);
  return indicativo === INDICATIVO_PT && PT_MOVEL.test(nacional);
}

/**
 * The display digits of a national number while typing or showing it:
 * Portugal "912 345 678", elsewhere groups of three ("207 946 0958").
 */
export function mascaraTelefoneNacional(digitos: string, indicativo: string = INDICATIVO_PT): string {
  const d = soDigitos(digitos);
  if (indicativo === INDICATIVO_PT) return agrupar(d.slice(0, 9), [3, 3, 3]);
  return agrupar(d.slice(0, Math.max(4, 15 - indicativo.length)), gruposDeTres(d.length));
}

/** Longest national number for a calling code (the input's `maxLength` counts the digits). */
export function maxDigitosNacionais(indicativo: string = INDICATIVO_PT): number {
  return indicativo === INDICATIVO_PT ? 9 : Math.max(4, 15 - indicativo.length);
}

// ─── NIF / NIPC ────────────────────────────────────────────────────────────

/** 9 digits without spaces nor the "PT" prefix, or `null` when it is not 9 digits. */
export function normalizarNif(texto: string | null | undefined): string | null {
  const t = (texto ?? "").trim().toUpperCase().replace(/^PT/, "");
  if (/[^\d\s.\-]/.test(t)) return null;
  const d = soDigitos(t);
  return d.length === 9 ? d : null;
}

function digitoControloNif(d: string): boolean {
  let soma = 0;
  for (let i = 0; i < 8; i++) soma += Number(d[i]) * (9 - i);
  const resto = soma % 11;
  const controlo = resto < 2 ? 0 : 11 - resto;
  return controlo === Number(d[8]);
}

/** People: 1, 2, 3 and 45 (non-residents). */
const NIF_SINGULAR = /^(?:[123]|45)/;
/** Organisations (NIPC): 5, 6, 70–79, 8 (old sole traders), 90, 91, 98, 99. */
const NIF_COLETIVA = /^(?:[568]|7[0-9]|9[0189])/;

export type TipoNif = "singular" | "coletiva" | "qualquer";

/** Which kind of NIF this is (by its first digits), or `null` when the prefix is not issued. */
export function tipoDeNif(nif: string): Exclude<TipoNif, "qualquer"> | null {
  if (NIF_SINGULAR.test(nif)) return "singular";
  if (NIF_COLETIVA.test(nif)) return "coletiva";
  return null;
}

/**
 * Checks a NIF (check digit and issued prefixes). `tipo: "singular"` accepts
 * only people, `"coletiva"` only organisations (NIPC).
 */
export function validarNif(texto: string | null | undefined, opcoes: { tipo?: TipoNif | undefined } = {}): ResultadoValidacao {
  const bruto = (texto ?? "").trim();
  if (!bruto) return falha(opcoes.tipo === "coletiva" ? "Indique o NIPC." : "Indique o NIF.");
  const nif = normalizarNif(bruto);
  const nome = opcoes.tipo === "coletiva" ? "O NIPC" : "O NIF";
  if (!nif) return falha(`${nome} tem 9 algarismos.`);
  const tipo = tipoDeNif(nif);
  if (!tipo || !digitoControloNif(nif)) return falha(`${nome} não é válido. Verifique os algarismos.`);
  if (opcoes.tipo === "singular" && tipo !== "singular") return falha("Indique o NIF de uma pessoa (começa por 1, 2, 3 ou 45).");
  if (opcoes.tipo === "coletiva" && tipo !== "coletiva") return falha("Indique o NIPC de uma entidade (começa por 5, 6, 7, 8 ou 9).");
  return ok(nif);
}

/** Checks an organisation's NIPC: `validarNif(texto, { tipo: "coletiva" })`. */
export function validarNipc(texto: string | null | undefined): ResultadoValidacao {
  return validarNif(texto, { tipo: "coletiva" });
}

/** Display while typing: "501 234 560". */
export function mascaraNif(texto: string): string {
  return agrupar(soDigitos(texto).slice(0, 9), [3, 3, 3]);
}

// ─── Código postal ─────────────────────────────────────────────────────────

/** "4000-123" from "4000123", "4000 123" or "4000-123"; `null` otherwise. */
export function normalizarCodigoPostal(texto: string | null | undefined): string | null {
  const t = (texto ?? "").trim();
  if (!/^\d{4}[\s-]?\d{3}$/.test(t)) return null;
  const d = soDigitos(t);
  if (d.startsWith("0")) return null;
  return `${d.slice(0, 4)}-${d.slice(4)}`;
}

export function validarCodigoPostal(texto: string | null | undefined): ResultadoValidacao {
  if (!(texto ?? "").trim()) return falha("Indique o código postal.");
  const cp = normalizarCodigoPostal(texto);
  return cp ? ok(cp) : falha("Use o formato 1234-567.");
}

/** Display while typing: "4000", "4000-1", "4000-123". */
export function mascaraCodigoPostal(texto: string): string {
  const d = soDigitos(texto).slice(0, 7);
  return d.length > 4 ? `${d.slice(0, 4)}-${d.slice(4)}` : d;
}

// ─── IBAN ──────────────────────────────────────────────────────────────────

const COMPRIMENTO_IBAN: Record<string, number> = {
  PT: 25, ES: 24, FR: 27, DE: 22, GB: 22, LU: 20, CH: 21, BE: 16, NL: 18, IT: 27, IE: 22, AT: 20, BR: 29,
};

/** Capitals without spaces ("PT50000201231234567890154"), or `null` when it is not an IBAN. */
export function normalizarIban(texto: string | null | undefined): string | null {
  const t = (texto ?? "").replace(/[\s.\-]/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(t)) return null;
  return t;
}

function mod97(iban: string): number {
  const rearranjado = iban.slice(4) + iban.slice(0, 4);
  let resto = 0;
  for (const c of rearranjado) {
    const v = c >= "A" && c <= "Z" ? String(c.charCodeAt(0) - 55) : c;
    for (const d of v) resto = (resto * 10 + Number(d)) % 97;
  }
  return resto;
}

/** Checks an IBAN (length per country and the ISO 13616 check digits). `pais: "PT"` accepts only Portuguese accounts. */
export function validarIban(texto: string | null | undefined, opcoes: { pais?: string | undefined } = {}): ResultadoValidacao {
  if (!(texto ?? "").trim()) return falha("Indique o IBAN.");
  const iban = normalizarIban(texto);
  if (!iban) return falha("O IBAN começa por duas letras do país (PT50 em Portugal) seguidas de algarismos.");
  const pais = iban.slice(0, 2);
  if (opcoes.pais && pais !== opcoes.pais.toUpperCase()) return falha(`Indique um IBAN de ${opcoes.pais.toUpperCase() === "PT" ? "Portugal (começa por PT50)" : opcoes.pais.toUpperCase()}.`);
  const esperado = COMPRIMENTO_IBAN[pais];
  if (esperado && iban.length !== esperado)
    return falha(pais === "PT" ? "Um IBAN português tem 25 caracteres (PT50 e 21 algarismos)." : `Um IBAN de ${pais} tem ${esperado} caracteres.`);
  if (pais === "PT" && !/^PT50\d{21}$/.test(iban)) return falha("Um IBAN português começa por PT50, seguido de 21 algarismos.");
  if (mod97(iban) !== 1) return falha("Este IBAN não é válido. Verifique os caracteres.");
  return ok(iban);
}

/** Display while typing: groups of four, capitals ("PT50 0002 0123 …"). */
export function mascaraIban(texto: string): string {
  const t = texto.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 34);
  return t.replace(/(.{4})(?=.)/g, "$1 ");
}

// ─── Mask caret ───────────────────────────────────────────────────────────

/**
 * Where the caret goes after a mask rewrote the text: after the same number of
 * significant characters (letters and digits) it had before.
 */
export function posicaoAposMascara(textoFormatado: string, significativosAntes: number): number {
  if (significativosAntes <= 0) return 0;
  let vistos = 0;
  for (let i = 0; i < textoFormatado.length; i++) {
    if (/[A-Za-z0-9]/.test(textoFormatado[i]!)) vistos++;
    if (vistos === significativosAntes) return i + 1;
  }
  return textoFormatado.length;
}

/** Significant characters (letters and digits) before a position. */
export function significativosAte(texto: string, posicao: number): number {
  return texto.slice(0, posicao).replace(/[^A-Za-z0-9]/g, "").length;
}

// ─── zod / Effect ─────────────────────────────────────────────────────────

/** The part of a zod 4 transform/check context that `comZod` needs (no zod dependency). */
export interface ContextoZod {
  issues: { push(issue: { code: "custom"; message: string; input: unknown }): unknown };
}

/**
 * Turns a `validar…` function into a zod 4 transform that stores the
 * normalised value and reports the pt-PT message:
 *
 * ```ts
 * import { comZod, validarTelefone, validarNif } from "@umporg/ui/validar";
 * const esquema = z.object({
 *   telefone: z.string().transform(comZod(validarTelefone)),          // "+351912345678"
 *   telemovel: z.string().transform(comZod((v) => validarTelefone(v, { tipo: "movel" }))),
 *   nif: z.string().transform(comZod(validarNif)),                    // "501234560"
 *   fax: z.string().transform(comZod(validarTelefone, { opcional: true })), // "" → null
 * });
 * ```
 */
export function comZod<T = string>(
  validar: (valor: string) => ResultadoValidacao<T>,
  opcoes: { opcional?: false | undefined },
): (valor: string, ctx: ContextoZod) => T;
export function comZod<T = string>(
  validar: (valor: string) => ResultadoValidacao<T>,
  opcoes: { opcional: true },
): (valor: string, ctx: ContextoZod) => T | null;
export function comZod<T = string>(validar: (valor: string) => ResultadoValidacao<T>): (valor: string, ctx: ContextoZod) => T;
export function comZod<T = string>(
  validar: (valor: string) => ResultadoValidacao<T>,
  opcoes: { opcional?: boolean | undefined } = {},
): (valor: string, ctx: ContextoZod) => T | null {
  return (valor, ctx) => {
    if (opcoes.opcional && !valor.trim()) return null;
    const r = validar(valor);
    if (r.valido) return r.valor;
    ctx.issues.push({ code: "custom", message: r.erro, input: valor });
    // zod ignores the value of a transform that reported an issue.
    return null as T;
  };
}
