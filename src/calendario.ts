/**
 * Calendar maths for the date pickers (v0.7). Pure and framework-free.
 *
 * Dates are ISO calendar days ("2026-10-03") — no time, no time zone — so a
 * date never shifts a day between the server, the browser and the Cérebro.
 * "Today" is the day in Europe/Lisbon. Weeks start on Monday (pt-PT).
 */

export type DataIso = string;

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const FUSO = "Europe/Lisbon";

/** { ano, mes (1–12), dia } or null when not a real calendar day. */
export function lerIso(iso: string | null | undefined): { ano: number; mes: number; dia: number } | null {
  const m = ISO.exec(iso ?? "");
  if (!m) return null;
  const ano = Number(m[1]);
  const mes = Number(m[2]);
  const dia = Number(m[3]);
  if (mes < 1 || mes > 12 || dia < 1 || dia > diasNoMes(ano, mes)) return null;
  return { ano, mes, dia };
}

export function paraIso(ano: number, mes: number, dia: number): DataIso {
  return `${String(ano).padStart(4, "0")}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export function diasNoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

/** Today's date in Lisbon (whatever the device's time zone). */
export function hojeLisboa(agora: Date = new Date()): DataIso {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit" }).format(agora);
}

function utc(iso: DataIso): Date {
  const p = lerIso(iso);
  if (!p) throw new RangeError(`Data inválida: ${iso}`);
  return new Date(Date.UTC(p.ano, p.mes - 1, p.dia));
}
function deUtc(d: Date): DataIso {
  return paraIso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

export function somarDias(iso: DataIso, n: number): DataIso {
  const d = utc(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return deUtc(d);
}

/** Adds months, keeping the day when possible (31 Jan + 1 month → 28/29 Feb). */
export function somarMeses(iso: DataIso, n: number): DataIso {
  const p = lerIso(iso);
  if (!p) throw new RangeError(`Data inválida: ${iso}`);
  const total = p.ano * 12 + (p.mes - 1) + n;
  const ano = Math.floor(total / 12);
  const mes = (total % 12) + 1;
  return paraIso(ano, mes, Math.min(p.dia, diasNoMes(ano, mes)));
}

/** 0 = Monday … 6 = Sunday. */
export function diaDaSemana(iso: DataIso): number {
  return (utc(iso).getUTCDay() + 6) % 7;
}

export function inicioDaSemana(iso: DataIso): DataIso {
  return somarDias(iso, -diaDaSemana(iso));
}
export function fimDaSemana(iso: DataIso): DataIso {
  return somarDias(iso, 6 - diaDaSemana(iso));
}

/** -1, 0 or 1 (ISO strings compare lexicographically). */
export function compararDatas(a: DataIso, b: DataIso): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function limitarData(iso: DataIso, min?: DataIso | null, max?: DataIso | null): DataIso {
  if (min && iso < min) return min;
  if (max && iso > max) return max;
  return iso;
}

export function dentroDoIntervalo(iso: DataIso, inicio?: DataIso | null, fim?: DataIso | null): boolean {
  if (!inicio || !fim) return false;
  const [a, b] = inicio <= fim ? [inicio, fim] : [fim, inicio];
  return iso >= a && iso <= b;
}

export interface DiaGrelha {
  iso: DataIso;
  dia: number;
  /** Belongs to the previous or next month (shown faded). */
  fora: boolean;
}

/**
 * The month as weeks of 7 days, Monday first, always 6 weeks (the calendar
 * keeps the same height when the month changes).
 */
export function grelhaDoMes(ano: number, mes: number): DiaGrelha[][] {
  const primeiro = paraIso(ano, mes, 1);
  let atual = inicioDaSemana(primeiro);
  const semanas: DiaGrelha[][] = [];
  for (let s = 0; s < 6; s++) {
    const semana: DiaGrelha[] = [];
    for (let d = 0; d < 7; d++) {
      const p = lerIso(atual)!;
      semana.push({ iso: atual, dia: p.dia, fora: p.mes !== mes });
      atual = somarDias(atual, 1);
    }
    semanas.push(semana);
  }
  return semanas;
}

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const DIAS = ["segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado", "domingo"];
const DIAS_CURTOS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

/** "outubro" (1–12). */
export function nomeDoMes(mes: number): string {
  return MESES[mes - 1] ?? "";
}
/** "outubro de 2026" */
export function tituloDoMes(ano: number, mes: number): string {
  return `${nomeDoMes(mes)} de ${ano}`;
}
/** Column headers, Monday first: [{ curto: "seg", longo: "segunda-feira" }, …]. */
export function diasDaSemana(): Array<{ curto: string; longo: string }> {
  return DIAS.map((longo, i) => ({ curto: DIAS_CURTOS[i]!, longo }));
}
/** "sábado, 3 de outubro de 2026" — spoken name of a day cell. */
export function rotuloDoDia(iso: DataIso): string {
  const p = lerIso(iso);
  if (!p) return "";
  return `${DIAS[diaDaSemana(iso)]}, ${p.dia} de ${nomeDoMes(p.mes)} de ${p.ano}`;
}
/** "03/10/2026" (empty for null). */
export function formatarDataCurta(iso: DataIso | null | undefined): string {
  const p = lerIso(iso);
  return p ? `${String(p.dia).padStart(2, "0")}/${String(p.mes).padStart(2, "0")}/${p.ano}` : "";
}

/**
 * Reads what a person types in a date field: "3/10/2026", "03-10-2026",
 * "3.10.26", "03102026", "2026-10-03", "hoje", "amanhã", "ontem".
 * Two-digit years are 20xx. Returns null when it is not a real day.
 */
export function interpretarData(texto: string, hoje: DataIso = hojeLisboa()): DataIso | null {
  const t = texto.trim().toLocaleLowerCase("pt-PT");
  if (!t) return null;
  if (t === "hoje") return hoje;
  if (t === "amanhã" || t === "amanha") return somarDias(hoje, 1);
  if (t === "ontem") return somarDias(hoje, -1);
  if (lerIso(t)) return t;
  let dia: number, mes: number, ano: number;
  const sep = /^(\d{1,2})[/.\-\s](\d{1,2})[/.\-\s](\d{2}|\d{4})$/.exec(t);
  const junto = /^(\d{2})(\d{2})(\d{4})$/.exec(t);
  if (sep) {
    dia = Number(sep[1]);
    mes = Number(sep[2]);
    ano = Number(sep[3]);
    if (sep[3]!.length === 2) ano += 2000;
  } else if (junto) {
    dia = Number(junto[1]);
    mes = Number(junto[2]);
    ano = Number(junto[3]);
  } else return null;
  const iso = paraIso(ano, mes, dia);
  return lerIso(iso) ? iso : null;
}

/** Keyboard navigation inside the calendar grid (APG date picker pattern). */
export function moverFoco(iso: DataIso, tecla: string, shift = false): DataIso | null {
  switch (tecla) {
    case "ArrowLeft":
      return somarDias(iso, -1);
    case "ArrowRight":
      return somarDias(iso, 1);
    case "ArrowUp":
      return somarDias(iso, -7);
    case "ArrowDown":
      return somarDias(iso, 7);
    case "Home":
      return inicioDaSemana(iso);
    case "End":
      return fimDaSemana(iso);
    case "PageUp":
      return shift ? somarMeses(iso, -12) : somarMeses(iso, -1);
    case "PageDown":
      return shift ? somarMeses(iso, 12) : somarMeses(iso, 1);
    default:
      return null;
  }
}

/** Ready-made ranges for the range picker ("Últimos 30 dias"…), relative to today. */
export function intervalosRapidos(hoje: DataIso = hojeLisboa()): Array<{ id: string; rotulo: string; inicio: DataIso; fim: DataIso }> {
  const p = lerIso(hoje)!;
  const inicioMes = paraIso(p.ano, p.mes, 1);
  const mesAnterior = somarMeses(inicioMes, -1);
  const pa = lerIso(mesAnterior)!;
  return [
    { id: "7d", rotulo: "Últimos 7 dias", inicio: somarDias(hoje, -6), fim: hoje },
    { id: "30d", rotulo: "Últimos 30 dias", inicio: somarDias(hoje, -29), fim: hoje },
    { id: "mes", rotulo: "Este mês", inicio: inicioMes, fim: hoje },
    { id: "mes-anterior", rotulo: "Mês anterior", inicio: mesAnterior, fim: paraIso(pa.ano, pa.mes, diasNoMes(pa.ano, pa.mes)) },
    { id: "ano", rotulo: "Este ano", inicio: paraIso(p.ano, 1, 1), fim: hoje },
  ];
}
