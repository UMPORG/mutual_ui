/**
 * Pure helpers behind the data components: chart colours, text alternatives
 * for charts, "Outros" folding, deltas and pagination windows. No React, so
 * they run anywhere and are unit-tested.
 */

import { formatarNumero, formatarPercentagem, formatarValor, paraNumero, SEM_VALOR, type FormatoValor } from "./formatar";

// ─── Colours ──────────────────────────────────────────────────────────────

/** Categorical slot (1–8, fixed order), the de-emphasis grey, or a status. */
export type CorSerie = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | "outros" | "sucesso" | "aviso" | "perigo" | "info";

export const MAX_SERIES = 8;

/** CSS colour for a slot: `var(--serie-3)`, `var(--success)`… */
export function corSerie(cor: CorSerie): string {
  switch (cor) {
    case "outros":
      return "var(--serie-outros)";
    case "sucesso":
      return "var(--success)";
    case "aviso":
      return "var(--warning)";
    case "perigo":
      return "var(--destructive)";
    case "info":
      return "var(--info)";
    default:
      return `var(--serie-${cor})`;
  }
}

export interface SerieBase {
  /** Data key of the series in each row. */
  key: string;
  /** Name shown in the legend, tooltip and table. */
  label: string;
  /** Pin a slot so the entity keeps its colour on every page and after
   *  filtering. Default: the series' position in the declared list. */
  color?: CorSerie | undefined;
}

export interface SerieComCor extends SerieBase {
  cor: string;
}

/**
 * Colour follows the entity, never its rank: series take their declared
 * position (or pinned slot). More than 8 unpinned series is an error — fold
 * the tail into "Outros" or split the chart.
 */
export function atribuirCores<S extends SerieBase>(series: readonly S[]): Array<S & { cor: string }> {
  let proximo = 1;
  const usados = new Set(series.map((s) => s.color).filter((c): c is CorSerie => typeof c === "number"));
  return series.map((s) => {
    if (s.color !== undefined) return { ...s, cor: corSerie(s.color) };
    while (usados.has(proximo as CorSerie)) proximo++;
    if (proximo > MAX_SERIES) {
      throw new Error(
        `@umporg/ui: mais de ${MAX_SERIES} séries num gráfico ("${s.label}"). Agrupe o resto em "Outros" ou divida o gráfico.`,
      );
    }
    const cor = corSerie(proximo as CorSerie);
    usados.add(proximo as CorSerie);
    proximo++;
    return { ...s, cor };
  });
}

// ─── "Outros" ─────────────────────────────────────────────────────────────

export interface Fatia {
  label: string;
  value: number;
  color?: CorSerie | undefined;
}

/**
 * Keeps the `max - 1` largest slices and folds the rest into one "Outros"
 * slice (grey). Order of the kept slices is preserved (colour follows the
 * entity). With `max` or fewer slices nothing changes.
 */
export function agruparOutros(fatias: readonly Fatia[], max = 5, rotulo = "Outros"): Fatia[] {
  const validas = fatias.filter((f) => Number.isFinite(f.value) && f.value > 0);
  if (validas.length <= max) return [...validas];
  const manter = new Set(
    [...validas]
      .map((f, i) => ({ f, i }))
      .sort((a, b) => b.f.value - a.f.value || a.i - b.i)
      .slice(0, max - 1)
      .map((x) => x.f),
  );
  const resto = validas.filter((f) => !manter.has(f)).reduce((s, f) => s + f.value, 0);
  return [...validas.filter((f) => manter.has(f)), { label: rotulo, value: resto, color: "outros" }];
}

// ─── Text alternative ─────────────────────────────────────────────────────

export type Linha = Record<string, unknown>;

export interface TabelaGrafico {
  cabecalhos: string[];
  linhas: string[][];
}

/** The chart as a table: one row per category, one column per series. */
export function tabelaDoGrafico(
  dados: readonly Linha[],
  categoria: string,
  series: readonly SerieBase[],
  opcoes: {
    formato?: FormatoValor | undefined;
    formatarCategoria?: ((v: unknown) => string) | undefined;
    rotuloCategoria?: string | undefined;
  } = {},
): TabelaGrafico {
  const fc = opcoes.formatarCategoria ?? ((v: unknown) => (v === null || v === undefined ? SEM_VALOR : String(v)));
  return {
    cabecalhos: [opcoes.rotuloCategoria ?? "Categoria", ...series.map((s) => s.label)],
    linhas: dados.map((d) => [fc(d[categoria]), ...series.map((s) => formatarValor(d[s.key] as number, opcoes.formato))]),
  };
}

/**
 * One or two sentences describing the chart for screen readers (the svg
 * `desc`): what it shows, its size and the extremes of each series.
 */
export function descreverGrafico(
  tipo: "barras" | "linhas" | "area" | "donut",
  dados: readonly Linha[],
  categoria: string,
  series: readonly SerieBase[],
  opcoes: { formato?: FormatoValor | undefined; formatarCategoria?: ((v: unknown) => string) | undefined } = {},
): string {
  const nomes: Record<typeof tipo, string> = {
    barras: "Gráfico de barras",
    linhas: "Gráfico de linhas",
    area: "Gráfico de área",
    donut: "Gráfico circular",
  };
  const fc = opcoes.formatarCategoria ?? ((v: unknown) => String(v ?? SEM_VALOR));
  if (dados.length === 0) return `${nomes[tipo]} sem dados.`;
  const partes = [
    `${nomes[tipo]} com ${formatarNumero(dados.length, { casas: 0 })} ${dados.length === 1 ? "categoria" : "categorias"}` +
      (series.length > 1 ? ` e ${series.length} séries (${series.map((s) => s.label).join(", ")}).` : "."),
  ];
  for (const s of series.slice(0, 4)) {
    let max: { v: number; c: unknown } | null = null;
    let min: { v: number; c: unknown } | null = null;
    for (const d of dados) {
      const v = paraNumero(d[s.key] as number);
      if (v === null) continue;
      if (!max || v > max.v) max = { v, c: d[categoria] };
      if (!min || v < min.v) min = { v, c: d[categoria] };
    }
    if (!max || !min) continue;
    const prefixo = series.length > 1 ? `${s.label}: máximo` : "Máximo";
    partes.push(
      `${prefixo} ${formatarValor(max.v, opcoes.formato)} (${fc(max.c)}), mínimo ${formatarValor(min.v, opcoes.formato)} (${fc(min.c)}).`,
    );
  }
  return partes.join(" ");
}

// ─── Deltas ───────────────────────────────────────────────────────────────

/** Which direction is good news for this indicator. */
export type Melhor = "subir" | "descer" | "neutro";
export type FormatoVariacao = "percentagem" | "pontos" | "numero" | "moeda";
export type SentidoVariacao = "subiu" | "desceu" | "igual";
export type Avaliacao = "positiva" | "negativa" | "neutra";

/** Relative change between two periods (0.1 = +10 %). `null` when the
 *  previous value is 0 or missing (a percentage would be meaningless). */
export function calcularVariacao(atual: number | null | undefined, anterior: number | null | undefined): number | null {
  if (atual === null || atual === undefined || anterior === null || anterior === undefined) return null;
  if (!Number.isFinite(atual) || !Number.isFinite(anterior) || anterior === 0) return null;
  return (atual - anterior) / Math.abs(anterior);
}

export function avaliarVariacao(valor: number, melhor: Melhor = "subir"): { sentido: SentidoVariacao; avaliacao: Avaliacao } {
  const sentido: SentidoVariacao = valor > 0 ? "subiu" : valor < 0 ? "desceu" : "igual";
  if (sentido === "igual" || melhor === "neutro") return { sentido, avaliacao: "neutra" };
  const boa = (sentido === "subiu") === (melhor === "subir");
  return { sentido, avaliacao: boa ? "positiva" : "negativa" };
}

/** "+12,3%", "−2,1 p.p.", "+340", "+1250,00 €". */
export function formatarVariacao(valor: number, formato: FormatoVariacao = "percentagem"): string {
  switch (formato) {
    case "percentagem":
      return formatarPercentagem(valor, { sinal: true });
    case "pontos":
      return `${formatarNumero(valor, { casas: 1, sinal: true })} p.p.`;
    case "moeda":
      return formatarValor(valor, { tipo: "moeda", opcoes: { sinal: true } });
    default:
      return formatarNumero(valor, { sinal: true });
  }
}

/** The delta in words, for screen readers and titles:
 *  "Subiu 12,3% face ao mês anterior." */
export function descreverVariacao(valor: number, formato: FormatoVariacao = "percentagem", referencia?: string): string {
  const { sentido } = avaliarVariacao(valor);
  const ref = referencia ? ` ${referencia}` : "";
  if (sentido === "igual") return `Sem alteração${ref}.`;
  const abs = Math.abs(valor);
  const quanto =
    formato === "percentagem"
      ? formatarPercentagem(abs)
      : formato === "pontos"
        ? `${formatarNumero(abs, { casas: 1 })} pontos percentuais`
        : formato === "moeda"
          ? formatarValor(abs, "moeda")
          : formatarNumero(abs);
  return `${sentido === "subiu" ? "Subiu" : "Desceu"} ${quanto}${ref}.`;
}

// ─── Pagination ───────────────────────────────────────────────────────────

/**
 * Page numbers to show, with `null` for a gap: first, last, and `vizinhos`
 * pages either side of the current one. `paginasVisiveis(6, 20)` →
 * [1, null, 5, 6, 7, null, 20].
 */
export function paginasVisiveis(pagina: number, total: number, vizinhos = 1): Array<number | null> {
  if (total <= 0) return [];
  const atual = Math.min(Math.max(1, pagina), total);
  const paginas = new Set<number>([1, total]);
  for (let p = atual - vizinhos; p <= atual + vizinhos; p++) if (p >= 1 && p <= total) paginas.add(p);
  const ordenadas = [...paginas].sort((a, b) => a - b);
  const out: Array<number | null> = [];
  ordenadas.forEach((p, i) => {
    const anterior = ordenadas[i - 1];
    if (anterior !== undefined && p - anterior === 2) out.push(anterior + 1);
    else if (anterior !== undefined && p - anterior > 2) out.push(null);
    out.push(p);
  });
  return out;
}

/** "A mostrar 21–40 de 312" range for a page (1-based). */
export function intervaloPagina(pagina: number, porPagina: number, total: number): { de: number; ate: number } {
  if (total <= 0) return { de: 0, ate: 0 };
  const de = (Math.max(1, pagina) - 1) * porPagina + 1;
  return { de: Math.min(de, total), ate: Math.min(de + porPagina - 1, total) };
}

/** Share of each count in the total (0–1), for status summaries. */
export function proporcoes(valores: readonly number[]): number[] {
  const total = valores.reduce((s, v) => s + (Number.isFinite(v) && v > 0 ? v : 0), 0);
  return valores.map((v) => (total > 0 && Number.isFinite(v) && v > 0 ? v / total : 0));
}
