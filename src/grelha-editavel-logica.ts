import { indiceNaGrelha } from "./grelha-teclado";
import { normalizarTexto } from "./filtrar";

/** Pure model of `GrelhaEditavel`: cell types, text → value parsing, spreadsheet paste and keyboard movement. No React, no DOM. */

export type TipoCelula = "numero" | "texto" | "data" | "simNao" | "escolha";

/** `numero` → number, `texto` → string, `data` → "AAAA-MM-DD", `simNao` → boolean, `escolha` → `valor` of an option. Empty = `null`. */
export type ValorCelula = string | number | boolean | null;

export interface OpcaoCelula {
  valor: string;
  rotulo: string;
}

export interface ColunaGrelha {
  /** Stable key of the column in `LinhaGrelha.valores`. */
  chave: string;
  rotulo: string;
  tipo: TipoCelula;
  obrigatoria?: boolean | undefined;
  apenasLeitura?: boolean | undefined;
  /** `numero` only. */
  min?: number | undefined;
  max?: number | undefined;
  /** Decimal places shown and accepted at most (`numero`). */
  casas?: number | undefined;
  /** `escolha` only. */
  opcoes?: readonly OpcaoCelula[] | undefined;
  /** Minimum column width, CSS length (default by type). */
  largura?: string | undefined;
}

export interface LinhaGrelha {
  /** Stable row id (never the position). */
  id: string;
  /** Fixed first column. */
  nome: string;
  valores: Readonly<Record<string, ValorCelula | undefined>>;
}

export interface AlteracaoCelula {
  linhaId: string;
  chave: string;
  valor: ValorCelula;
}

export interface ErroCelula {
  linhaId: string;
  chave: string;
  mensagem: string;
  /** The text that could not be read (typed or pasted). */
  texto: string;
}

export type ResultadoConversao = { ok: true; valor: ValorCelula } | { ok: false; mensagem: string };

/** Key of a cell in the `erros` / `alteradas` props. */
export function chaveCelula(linhaId: string, chave: string): string {
  return `${linhaId}\u0001${chave}`;
}

const SIM = new Set(["sim", "s", "yes", "y", "true", "verdadeiro", "1", "x"]);
const NAO = new Set(["nao", "n", "no", "false", "falso", "0"]);

function numeroPtPt(bruto: string): number | null {
  let t = bruto.replace(/[\s  ]/g, "");
  if (t === "" || !/^[+-]?[\d.,]+$/.test(t)) return null;
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function casasDe(n: number): number {
  const s = String(n);
  const i = s.indexOf(".");
  return i < 0 ? 0 : s.length - i - 1;
}

function dataIso(texto: string): string | null {
  let a: number, m: number, d: number;
  let r = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(texto);
  if (r) {
    a = Number(r[1]);
    m = Number(r[2]);
    d = Number(r[3]);
  } else {
    r = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(texto);
    if (!r) return null;
    d = Number(r[1]);
    m = Number(r[2]);
    a = Number(r[3]);
  }
  const dt = new Date(Date.UTC(a, m - 1, d));
  if (dt.getUTCFullYear() !== a || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${String(a).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function textoNumero(n: number, casas: number | undefined): string {
  const s = casas === undefined ? String(n) : n.toFixed(casas);
  return s.replace(".", ",");
}

/** Text as shown in a cell and as the starting text of an edit ("7,5", "03/10/2026", "Sim"). Empty = "". */
export function textoDaCelula(coluna: ColunaGrelha, valor: ValorCelula | undefined): string {
  if (valor === null || valor === undefined) return "";
  switch (coluna.tipo) {
    case "numero":
      return typeof valor === "number" ? textoNumero(valor, coluna.casas) : String(valor);
    case "data": {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(valor));
      return m ? `${m[3]}/${m[2]}/${m[1]}` : String(valor);
    }
    case "simNao":
      return valor === true ? "Sim" : valor === false ? "Não" : "";
    case "escolha":
      return coluna.opcoes?.find((o) => o.valor === valor)?.rotulo ?? String(valor);
    default:
      return String(valor);
  }
}

/** Reads typed or pasted text as the column's value. Blank = `null` (error when the column is required). Accepts the decimal comma. */
export function converterTexto(coluna: ColunaGrelha, texto: string): ResultadoConversao {
  const t = texto.trim();
  if (t === "") {
    return coluna.obrigatoria ? { ok: false, mensagem: "Preencha este valor." } : { ok: true, valor: null };
  }
  switch (coluna.tipo) {
    case "numero": {
      const n = numeroPtPt(t);
      if (n === null) return { ok: false, mensagem: "Escreva um número, por exemplo 7,5." };
      if (coluna.min !== undefined && n < coluna.min) {
        return { ok: false, mensagem: `O valor mínimo é ${textoNumero(coluna.min, undefined)}.` };
      }
      if (coluna.max !== undefined && n > coluna.max) {
        return { ok: false, mensagem: `O valor máximo é ${textoNumero(coluna.max, undefined)}.` };
      }
      if (coluna.casas !== undefined && casasDe(n) > coluna.casas) {
        return {
          ok: false,
          mensagem: coluna.casas === 0 ? "Escreva um número inteiro." : `Use no máximo ${coluna.casas} casas decimais.`,
        };
      }
      return { ok: true, valor: n };
    }
    case "data": {
      const iso = dataIso(t);
      return iso ? { ok: true, valor: iso } : { ok: false, mensagem: "Escreva uma data válida, por exemplo 03/10/2026." };
    }
    case "simNao": {
      const n = normalizarTexto(t);
      if (SIM.has(n)) return { ok: true, valor: true };
      if (NAO.has(n)) return { ok: true, valor: false };
      return { ok: false, mensagem: "Escreva Sim ou Não." };
    }
    case "escolha": {
      const n = normalizarTexto(t);
      const o = coluna.opcoes?.find((x) => normalizarTexto(x.valor) === n || normalizarTexto(x.rotulo) === n);
      return o ? { ok: true, valor: o.valor } : { ok: false, mensagem: "Escolha uma das opções da lista." };
    }
    default:
      return { ok: true, valor: t };
  }
}

/** Splits spreadsheet clipboard text (tab/newline separated, "quoted" cells allowed) into rows of cells. The trailing line break is ignored. */
export function analisarColagem(texto: string): string[][] {
  const linhas: string[][] = [];
  let linha: string[] = [];
  let campo = "";
  let aspas = false;
  const t = texto.replace(/\r\n?/g, "\n");
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (aspas) {
      if (c === '"') {
        if (t[i + 1] === '"') {
          campo += '"';
          i++;
        } else aspas = false;
      } else campo += c;
    } else if (c === '"' && campo === "") aspas = true;
    else if (c === "\t") {
      linha.push(campo);
      campo = "";
    } else if (c === "\n") {
      linha.push(campo);
      linhas.push(linha);
      linha = [];
      campo = "";
    } else campo += c;
  }
  if (campo !== "" || linha.length > 0) {
    linha.push(campo);
    linhas.push(linha);
  }
  return linhas;
}

export interface ResultadoColagem {
  alteracoes: AlteracaoCelula[];
  erros: ErroCelula[];
  /** Pasted cells that fell outside the grid (more rows/columns than exist). */
  ignoradas: number;
  /** Cells read from the clipboard. */
  total: number;
}

/** Fills the block starting at `origem` (row and data-column indexes). Read-only columns and unreadable values become errors; nothing is dropped silently except what falls outside the grid (`ignoradas`). */
export function aplicarColagem(
  colunas: readonly ColunaGrelha[],
  linhas: readonly LinhaGrelha[],
  origem: { linha: number; coluna: number },
  matriz: readonly (readonly string[])[],
): ResultadoColagem {
  const r: ResultadoColagem = { alteracoes: [], erros: [], ignoradas: 0, total: 0 };
  matriz.forEach((cels, i) => {
    cels.forEach((texto, j) => {
      r.total++;
      const linha = linhas[origem.linha + i];
      const coluna = colunas[origem.coluna + j];
      if (!linha || !coluna) {
        r.ignoradas++;
        return;
      }
      if (coluna.apenasLeitura) {
        r.erros.push({ linhaId: linha.id, chave: coluna.chave, texto, mensagem: "Esta coluna não se pode alterar." });
        return;
      }
      const c = converterTexto(coluna, texto);
      if (!c.ok) r.erros.push({ linhaId: linha.id, chave: coluna.chave, texto, mensagem: c.mensagem });
      else if ((linha.valores[coluna.chave] ?? null) !== c.valor) {
        r.alteracoes.push({ linhaId: linha.id, chave: coluna.chave, valor: c.valor });
      }
    });
  });
  return r;
}

export interface PosicaoGrelha {
  linha: number;
  coluna: number;
}

/** Next focused cell for a navigation key in a grid of `linhas` × `colunas`; same position when the key does not move. ←/→/Home/End stop at the row ends; Ctrl+Home/End go to the first/last cell; PageUp/PageDown jump 10 rows. */
export function moverNaGrelha(pos: PosicaoGrelha, tecla: string, linhas: number, colunas: number, ctrl: boolean): PosicaoGrelha {
  if (linhas <= 0 || colunas <= 0) return pos;
  const i = pos.linha * colunas + pos.coluna;
  const n = linhas * colunas;
  if (tecla === "ArrowLeft" || tecla === "ArrowRight") {
    const c = pos.coluna + (tecla === "ArrowRight" ? 1 : -1);
    return c < 0 || c >= colunas ? pos : { linha: pos.linha, coluna: c };
  }
  if (tecla === "Home" || tecla === "End") {
    if (!ctrl) return { linha: pos.linha, coluna: tecla === "Home" ? 0 : colunas - 1 };
  }
  if (tecla === "PageUp" || tecla === "PageDown") {
    const l = Math.min(Math.max(pos.linha + (tecla === "PageDown" ? 10 : -10), 0), linhas - 1);
    return { linha: l, coluna: pos.coluna };
  }
  const novo = indiceNaGrelha(i, tecla, n, colunas);
  if (novo === null) return pos;
  return { linha: Math.floor(novo / colunas), coluna: novo % colunas };
}
