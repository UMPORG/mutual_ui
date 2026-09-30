/**
 * A small, safe Markdown parser for assistant replies and help text.
 *
 * Safety by construction: the parser produces a tree of plain objects and the
 * renderer (`markdown.tsx`) turns it into React elements. There is no HTML
 * string anywhere, so raw HTML in the input (`<script>`, `<img onerror>`) is
 * shown as text. Link targets go through `sanitizarUrl` (http, https, mailto,
 * tel and relative paths only). Images are never loaded: `![alt](src)` becomes
 * a link, so a reply cannot make the browser fetch arbitrary addresses.
 *
 * Supported (CommonMark + GFM subset): paragraphs, headings, emphasis,
 * strong, strikethrough, inline code, fenced code, block quotes, ordered and
 * bulleted lists (nested, task items), tables with alignment, horizontal
 * rules, links, autolinks, hard breaks, citation markers "[1]".
 *
 * Tolerant of partial input (streaming): an unclosed fence is code to the
 * end, unclosed emphasis stays literal.
 */

export type Inline =
  | { t: "text"; v: string }
  | { t: "strong"; c: Inline[] }
  | { t: "em"; c: Inline[] }
  | { t: "del"; c: Inline[] }
  | { t: "code"; v: string }
  | { t: "link"; href: string | null; c: Inline[]; externo: boolean }
  | { t: "img"; href: string | null; alt: string }
  | { t: "cite"; n: number }
  | { t: "br" };

export type Alinhamento = "left" | "center" | "right" | null;

export type Block =
  | { t: "p"; c: Inline[] }
  | { t: "h"; n: number; c: Inline[] }
  | { t: "code"; lang: string; v: string; aberto: boolean }
  | { t: "quote"; c: Block[] }
  | { t: "list"; ordered: boolean; start: number; tight: boolean; items: Array<{ c: Block[]; checked: boolean | null }> }
  | { t: "table"; align: Alinhamento[]; head: Inline[][]; rows: Inline[][][] }
  | { t: "hr" };

const PROTOCOLOS = new Set(["http:", "https:", "mailto:", "tel:"]);

/**
 * Returns a safe href, or null. Allowed: http(s), mailto, tel, and relative
 * references ("/ajuda/quotas", "#secao", "?q=1", "ficha"). Control
 * characters and whitespace are stripped before the scheme check, so
 * "java\nscript:" and " javascript:" are caught.
 */
export function sanitizarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // eslint-disable-next-line no-control-regex
  const limpo = url.replace(/[\u0000-\u0020\u007f-\u009f]/g, "");
  if (!limpo) return null;
  const esquema = /^([a-z][a-z0-9+.\-]*):/i.exec(limpo);
  if (esquema) {
    return PROTOCOLOS.has(`${esquema[1]!.toLowerCase()}:`) ? limpo : null;
  }
  // "\\evil.com" is treated as "//evil.com" by browsers.
  if (limpo.startsWith("\\")) return null;
  return limpo;
}

/** True for absolute http(s) or protocol-relative addresses. */
export function urlExterna(href: string): boolean {
  return /^(https?:)?\/\//i.test(href);
}

// ─── Blocks ───────────────────────────────────────────────────────────────

const RE_FENCE = /^ {0,3}(`{3,}|~{3,})\s*([^`\s]*)[^`]*$/;
const RE_HEADING = /^ {0,3}(#{1,6})(?:\s+(.*?))?\s*#*\s*$/;
const RE_HR = /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/;
const RE_QUOTE = /^ {0,3}> ?(.*)$/;
const RE_LIST = /^( *)([-*+]|\d{1,9}[.)])(\s+|$)(.*)$/;
const RE_TABLE_SEP = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

function vazia(l: string | undefined): boolean {
  return l === undefined || /^\s*$/.test(l);
}

function iniciaBloco(l: string): boolean {
  return RE_FENCE.test(l) || RE_HEADING.test(l) || RE_HR.test(l) || RE_QUOTE.test(l) || RE_LIST.test(l);
}

function dividirLinhaTabela(l: string): string[] {
  let s = l.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|") && !s.endsWith("\\|")) s = s.slice(0, -1);
  const celulas: string[] = [];
  let atual = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!;
    if (c === "\\" && s[i + 1] === "|") {
      atual += "|";
      i++;
    } else if (c === "|") {
      celulas.push(atual.trim());
      atual = "";
    } else atual += c;
  }
  celulas.push(atual.trim());
  return celulas;
}

export function analisarMarkdown(fonte: string): Block[] {
  const linhas = fonte.replace(/\r\n?/g, "\n").replace(/\t/g, "    ").split("\n");
  return analisarBlocos(linhas);
}

function analisarBlocos(linhas: string[]): Block[] {
  const blocos: Block[] = [];
  let i = 0;
  while (i < linhas.length) {
    const l = linhas[i]!;
    if (vazia(l)) {
      i++;
      continue;
    }

    const fence = RE_FENCE.exec(l);
    if (fence) {
      const marca = fence[1]!;
      const corpo: string[] = [];
      i++;
      let fechado = false;
      while (i < linhas.length) {
        const f = linhas[i]!;
        if (new RegExp(`^ {0,3}${marca[0] === "`" ? "`" : "~"}{${marca.length},}\\s*$`).test(f)) {
          fechado = true;
          i++;
          break;
        }
        corpo.push(f);
        i++;
      }
      blocos.push({ t: "code", lang: fence[2] ?? "", v: corpo.join("\n"), aberto: !fechado });
      continue;
    }

    const h = RE_HEADING.exec(l);
    if (h) {
      blocos.push({ t: "h", n: h[1]!.length, c: analisarInline(h[2] ?? "") });
      i++;
      continue;
    }

    if (RE_HR.test(l)) {
      blocos.push({ t: "hr" });
      i++;
      continue;
    }

    if (RE_QUOTE.test(l)) {
      const corpo: string[] = [];
      while (i < linhas.length && !vazia(linhas[i])) {
        const q = RE_QUOTE.exec(linhas[i]!);
        if (q) corpo.push(q[1]!);
        else if (corpo.length && !iniciaBloco(linhas[i]!)) corpo.push(linhas[i]!); // lazy continuation
        else break;
        i++;
      }
      blocos.push({ t: "quote", c: analisarBlocos(corpo) });
      continue;
    }

    const li = RE_LIST.exec(l);
    if (li) {
      const r = analisarLista(linhas, i);
      blocos.push(r.bloco);
      i = r.fim;
      continue;
    }

    // Table: a row with pipes followed by a delimiter row.
    if (l.includes("|") && linhas[i + 1] !== undefined && RE_TABLE_SEP.test(linhas[i + 1]!) && linhas[i + 1]!.includes("-")) {
      const head = dividirLinhaTabela(l);
      const align: Alinhamento[] = dividirLinhaTabela(linhas[i + 1]!).map((c) => {
        const e = c.startsWith(":");
        const d = c.endsWith(":");
        return e && d ? "center" : d ? "right" : e ? "left" : null;
      });
      i += 2;
      const rows: Inline[][][] = [];
      while (i < linhas.length && !vazia(linhas[i]) && linhas[i]!.includes("|")) {
        const celulas = dividirLinhaTabela(linhas[i]!);
        rows.push(head.map((_, k) => analisarInline(celulas[k] ?? "")));
        i++;
      }
      blocos.push({ t: "table", align: head.map((_, k) => align[k] ?? null), head: head.map((c) => analisarInline(c)), rows });
      continue;
    }

    // Paragraph.
    const corpo: string[] = [];
    while (i < linhas.length && !vazia(linhas[i]) && (corpo.length === 0 || !iniciaBloco(linhas[i]!))) {
      // A table can start right after a paragraph line only with a blank line; keep it simple.
      corpo.push(linhas[i]!);
      i++;
    }
    blocos.push({ t: "p", c: analisarInline(juntarParagrafo(corpo)) });
  }
  return blocos;
}

/** Joins paragraph lines: "  \n" or "\\\n" is a hard break, other newlines are kept for the inline pass. */
function juntarParagrafo(linhas: string[]): string {
  return linhas.map((l) => l.replace(/^\s+/, "")).join("\n");
}

function analisarLista(linhas: string[], inicio: number): { bloco: Block; fim: number } {
  const primeira = RE_LIST.exec(linhas[inicio]!)!;
  const recuoBase = primeira[1]!.length;
  const ordenada = /\d/.test(primeira[2]!);
  const marcaTipo = ordenada ? primeira[2]!.slice(-1) : primeira[2]!;
  const items: Array<{ c: Block[]; checked: boolean | null }> = [];
  let tight = true;
  let i = inicio;
  let houveVazia = false;

  while (i < linhas.length) {
    const m = RE_LIST.exec(linhas[i]!);
    if (!m || m[1]!.length !== recuoBase) break;
    const eOrdenada = /\d/.test(m[2]!);
    if (eOrdenada !== ordenada || (ordenada ? m[2]!.slice(-1) : m[2]) !== marcaTipo) break;
    if (houveVazia) tight = false;
    houveVazia = false;
    const recuoConteudo = m[1]!.length + m[2]!.length + Math.max(1, Math.min(4, m[3]!.length || 1));
    const corpo: string[] = [m[4] ?? ""];
    i++;
    while (i < linhas.length) {
      const l = linhas[i]!;
      if (vazia(l)) {
        // Blank line: the item continues only if the next non-blank line is indented.
        let k = i + 1;
        while (k < linhas.length && vazia(linhas[k])) k++;
        const prox = linhas[k];
        if (prox !== undefined && prox.search(/\S/) >= recuoConteudo) {
          corpo.push("");
          i++;
          tight = false;
          continue;
        }
        houveVazia = true;
        i++;
        break;
      }
      const recuo = l.search(/\S/);
      if (recuo >= recuoConteudo) {
        corpo.push(l.slice(recuoConteudo));
        i++;
        continue;
      }
      const mm = RE_LIST.exec(l);
      if (mm && mm[1]!.length > recuoBase) {
        // Nested list with a smaller indent than the content: accept it.
        corpo.push(l.slice(Math.min(recuo, recuoConteudo)));
        i++;
        continue;
      }
      if (mm || iniciaBloco(l)) break;
      corpo.push(l.trim()); // lazy continuation of the paragraph
      i++;
    }
    let checked: boolean | null = null;
    const tarefa = /^\[([ xX])\]\s+/.exec(corpo[0] ?? "");
    if (tarefa) {
      checked = tarefa[1] !== " ";
      corpo[0] = corpo[0]!.slice(tarefa[0].length);
    }
    items.push({ c: analisarBlocos(corpo), checked });
    if (houveVazia) {
      // A blank line followed by another item of the same list → loose list.
      const m2 = linhas[i] !== undefined ? RE_LIST.exec(linhas[i]!) : null;
      if (!m2 || m2[1]!.length !== recuoBase) break;
    }
  }
  const start = ordenada ? Number.parseInt(primeira[2]!, 10) : 1;
  return { bloco: { t: "list", ordered: ordenada, start, tight, items }, fim: i };
}

// ─── Inlines ──────────────────────────────────────────────────────────────

const ESCAPAVEIS = "\\`*_{}[]()#+-.!|~<>\"'";

function textoPara(saida: Inline[], v: string) {
  const ultimo = saida[saida.length - 1];
  if (ultimo && ultimo.t === "text") ultimo.v += v;
  else saida.push({ t: "text", v });
}

/** Finds the `]` that closes the `[` at `inicio`, honouring nesting and escapes. */
function fechoParenteses(s: string, inicio: number, abre: string, fecha: string): number {
  let nivel = 0;
  for (let i = inicio; i < s.length; i++) {
    const c = s[i];
    if (c === "\\") {
      i++;
      continue;
    }
    if (c === "`") {
      const f = s.indexOf("`", i + 1);
      if (f !== -1) i = f;
      continue;
    }
    if (c === abre) nivel++;
    else if (c === fecha) {
      nivel--;
      if (nivel === 0) return i;
    }
  }
  return -1;
}

function destinoLink(bruto: string): string {
  let d = bruto.trim();
  // Optional title: (url "title")
  const t = /^(\S+)\s+["'(].*["')]$/.exec(d);
  if (t) d = t[1]!;
  if (d.startsWith("<") && d.endsWith(">")) d = d.slice(1, -1);
  return d;
}

function eLetra(c: string | undefined): boolean {
  return !!c && /[\p{L}\p{N}]/u.test(c);
}

export function analisarInline(s: string): Inline[] {
  const saida: Inline[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i]!;

    // Hard break: backslash or two spaces before a newline.
    if (c === "\n") {
      if (/ {2,}$/.test(s.slice(0, i))) {
        const ultimo = saida[saida.length - 1];
        if (ultimo && ultimo.t === "text") ultimo.v = ultimo.v.replace(/ +$/, "");
        saida.push({ t: "br" });
      } else textoPara(saida, " ");
      i++;
      continue;
    }
    if (c === "\\") {
      const p = s[i + 1];
      if (p === "\n") {
        saida.push({ t: "br" });
        i += 2;
        continue;
      }
      if (p && ESCAPAVEIS.includes(p)) {
        textoPara(saida, p);
        i += 2;
        continue;
      }
    }

    // Code span.
    if (c === "`") {
      let n = 1;
      while (s[i + n] === "`") n++;
      const marca = "`".repeat(n);
      const fim = s.indexOf(marca, i + n);
      if (fim !== -1) {
        let v = s.slice(i + n, fim).replace(/\n/g, " ");
        if (/^ .* $/.test(v) && v.trim()) v = v.slice(1, -1);
        saida.push({ t: "code", v });
        i = fim + n;
        continue;
      }
      textoPara(saida, marca);
      i += n;
      continue;
    }

    // Image → link (never loaded).
    if (c === "!" && s[i + 1] === "[") {
      const fim = fechoParenteses(s, i + 1, "[", "]");
      if (fim !== -1 && s[fim + 1] === "(") {
        const fp = fechoParenteses(s, fim + 1, "(", ")");
        if (fp !== -1) {
          saida.push({ t: "img", alt: s.slice(i + 2, fim), href: sanitizarUrl(destinoLink(s.slice(fim + 2, fp))) });
          i = fp + 1;
          continue;
        }
      }
    }

    if (c === "[") {
      const fim = fechoParenteses(s, i, "[", "]");
      if (fim !== -1) {
        // Link [text](url)
        if (s[fim + 1] === "(") {
          const fp = fechoParenteses(s, fim + 1, "(", ")");
          if (fp !== -1) {
            const href = sanitizarUrl(destinoLink(s.slice(fim + 2, fp)));
            saida.push({ t: "link", href, externo: href ? urlExterna(href) : false, c: analisarInline(s.slice(i + 1, fim)) });
            i = fp + 1;
            continue;
          }
        }
        // Citation marker [1] or [1, 2]
        const cit = /^\[(\d{1,3}(?:\s*,\s*\d{1,3})*)\]/.exec(s.slice(i));
        if (cit) {
          for (const n of cit[1]!.split(",")) saida.push({ t: "cite", n: Number(n.trim()) });
          i += cit[0].length;
          continue;
        }
      }
    }

    // Autolink <https://…> / <email@…>
    if (c === "<") {
      const a = /^<((?:https?:\/\/|mailto:)[^\s<>]+|[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+)>/i.exec(s.slice(i));
      if (a) {
        const bruto = a[1]!;
        const href = sanitizarUrl(bruto.includes(":") ? bruto : `mailto:${bruto}`);
        saida.push({ t: "link", href, externo: href ? urlExterna(href) : false, c: [{ t: "text", v: bruto.replace(/^mailto:/i, "") }] });
        i += a[0].length;
        continue;
      }
    }

    // Bare URL (GFM autolink literal).
    if ((c === "h" || c === "w") && !eLetra(s[i - 1])) {
      const u = /^(?:https?:\/\/|www\.)[^\s<]*[^\s<.,:;"')\]!?]/i.exec(s.slice(i));
      if (u) {
        const bruto = u[0];
        const href = sanitizarUrl(bruto.startsWith("www.") ? `https://${bruto}` : bruto);
        saida.push({ t: "link", href, externo: true, c: [{ t: "text", v: bruto }] });
        i += bruto.length;
        continue;
      }
    }

    // Strikethrough ~~x~~
    if (c === "~" && s[i + 1] === "~") {
      const fim = s.indexOf("~~", i + 2);
      if (fim > i + 2 && s[i + 2] !== " ") {
        saida.push({ t: "del", c: analisarInline(s.slice(i + 2, fim)) });
        i = fim + 2;
        continue;
      }
    }

    // Strong / emphasis.
    if (c === "*" || c === "_") {
      const duplo = s[i + 1] === c;
      const n = duplo ? 2 : 1;
      const seguinte = s[i + n];
      const anterior = s[i - 1];
      // "_" only at word boundaries (snake_case stays literal).
      const podeAbrir = seguinte !== undefined && !/\s/.test(seguinte) && !(c === "_" && eLetra(anterior));
      if (podeAbrir) {
        const fim = procurarFecho(s, i + n, c, n);
        if (fim !== -1) {
          const dentro = analisarInline(s.slice(i + n, fim));
          saida.push(duplo ? { t: "strong", c: dentro } : { t: "em", c: dentro });
          i = fim + n;
          continue;
        }
      }
      textoPara(saida, c.repeat(n));
      i += n;
      continue;
    }

    textoPara(saida, c);
    i++;
  }
  return saida;
}

function procurarFecho(s: string, desde: number, c: string, n: number): number {
  for (let k = desde; k < s.length; k++) {
    const ch = s[k];
    if (ch === "\\") {
      k++;
      continue;
    }
    if (ch === "`") {
      const f = s.indexOf("`", k + 1);
      if (f !== -1) k = f;
      continue;
    }
    if (ch !== c) continue;
    const corre = s.slice(k).match(new RegExp(`^\\${c}+`))![0].length;
    if (n === 1 && corre >= 2) {
      // skip a "**" run inside "*…*" (it is a nested strong)
      const fechoDuplo = procurarFecho(s, k + 2, c, 2);
      if (fechoDuplo !== -1) {
        k = fechoDuplo + 1;
        continue;
      }
    }
    if (corre >= n && k > desde && !/\s/.test(s[k - 1]!)) {
      if (c === "_" && eLetra(s[k + n])) continue;
      return k;
    }
    k += corre - 1;
  }
  return -1;
}

// ─── Plain text (screen-reader announcements, copy, previews) ─────────────

function inlineParaTexto(c: Inline[]): string {
  return c
    .map((x) => {
      switch (x.t) {
        case "text":
        case "code":
          return x.v;
        case "br":
          return "\n";
        case "cite":
          return "";
        case "img":
          return x.alt;
        default:
          return inlineParaTexto(x.c);
      }
    })
    .join("");
}

function blocosParaTexto(b: Block[]): string {
  return b
    .map((x) => {
      switch (x.t) {
        case "p":
        case "h":
          return inlineParaTexto(x.c);
        case "code":
          return x.v;
        case "quote":
          return blocosParaTexto(x.c);
        case "list":
          return x.items.map((it, k) => `${x.ordered ? `${x.start + k}.` : "•"} ${blocosParaTexto(it.c)}`).join("\n");
        case "table":
          return [x.head, ...x.rows].map((r) => r.map(inlineParaTexto).join(" — ")).join("\n");
        case "hr":
          return "";
      }
    })
    .filter(Boolean)
    .join("\n\n");
}

/** Markdown → readable plain text (no markers). */
export function markdownParaTexto(fonte: string): string {
  return blocosParaTexto(analisarMarkdown(fonte))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]+([.,;:!?])/g, "$1")
    .trim();
}

/**
 * While a reply is still being written, hides an emphasis/code marker that
 * has not been closed yet in the last paragraph ("indicação *se" →
 * "indicação se"), so readers never see stray asterisks. Code fences are
 * left alone (an open fence already renders as code).
 */
export function estabilizarParcial(texto: string): string {
  if ((texto.match(/^ {0,3}(```|~~~)/gm)?.length ?? 0) % 2 === 1) return texto;
  const corte = texto.lastIndexOf("\n\n");
  const antes = corte === -1 ? "" : texto.slice(0, corte + 2);
  let ultimo = corte === -1 ? texto : texto.slice(corte + 2);
  const padroes: Array<[string, RegExp]> = [
    ["`", /`/g],
    ["**", /\*\*/g],
    ["~~", /~~/g],
    ["*", /(?<!\*)\*(?!\*)/g],
    ["_", /(?<![\p{L}\p{N}_])_|_(?![\p{L}\p{N}_])/gu],
  ];
  for (const [marca, re] of padroes) {
    const alvo = marca === "`" ? ultimo : ultimo.replace(/`[^`]*`/g, (m) => " ".repeat(m.length));
    const posicoes = [...alvo.matchAll(re)].map((m) => m.index ?? -1).filter((i) => i >= 0 && ultimo[i - 1] !== "\\");
    if (posicoes.length % 2 === 1) {
      const i = posicoes[posicoes.length - 1]!;
      ultimo = ultimo.slice(0, i) + ultimo.slice(i + marca.length);
    }
  }
  return antes + ultimo;
}
