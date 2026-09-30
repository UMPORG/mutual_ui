/**
 * Filtering for comboboxes and autocompletes. Pure, framework-free.
 *
 * Portuguese users type without accents and in any case: "evora" must find
 * "Évora", "sao joao" must find "São João da Madeira". Results are ranked:
 * whole label first, then start of the label, then start of a word, then
 * anywhere.
 */

/** Lower case, no accents, single spaces. "  São  JOÃO " → "sao joao". */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase("pt-PT")
    .replace(/\s+/g, " ")
    .trim();
}

/** 0 = no match; higher is better. Every word of the query must appear. */
export function pontuarCorrespondencia(rotulo: string, consulta: string): number {
  const r = normalizarTexto(rotulo);
  const q = normalizarTexto(consulta);
  if (!q) return 1;
  if (r === q) return 100;
  if (r.startsWith(q)) return 80;
  const palavras = q.split(" ");
  let total = 0;
  for (const p of palavras) {
    if (!r.includes(p)) return 0;
    const inicioPalavra = r.startsWith(p) || r.includes(` ${p}`) || r.includes(`-${p}`) || r.includes(`(${p}`);
    total += inicioPalavra ? 20 : 5;
  }
  if (r.includes(q)) total += 10;
  return Math.min(79, total);
}

/**
 * Filters and ranks `itens` by `consulta`. Stable for equal scores (keeps the
 * app's order). An empty query returns everything, in order.
 */
export function filtrarOpcoes<T>(itens: readonly T[], consulta: string, rotulo: (item: T) => string, limite?: number): T[] {
  if (!normalizarTexto(consulta)) return limite ? itens.slice(0, limite) : [...itens];
  const pontuados: Array<{ item: T; p: number; i: number }> = [];
  itens.forEach((item, i) => {
    const p = pontuarCorrespondencia(rotulo(item), consulta);
    if (p > 0) pontuados.push({ item, p, i });
  });
  pontuados.sort((a, b) => b.p - a.p || a.i - b.i);
  const r = pontuados.map((x) => x.item);
  return limite ? r.slice(0, limite) : r;
}

/**
 * The text to offer as "Criar «…»" in a creatable combobox, or null when the
 * query is empty or already matches an item exactly (ignoring case and
 * accents).
 */
export function textoParaCriar<T>(consulta: string, itens: readonly T[], rotulo: (item: T) => string): string | null {
  const limpo = consulta.replace(/\s+/g, " ").trim();
  if (!limpo) return null;
  const n = normalizarTexto(limpo);
  return itens.some((i) => normalizarTexto(rotulo(i)) === n) ? null : limpo;
}

/**
 * Splits `rotulo` into parts marking where the query matched (accent- and
 * case-insensitive), to bold the typed part in the list.
 */
export function partesDestacadas(rotulo: string, consulta: string): Array<{ texto: string; destaque: boolean }> {
  const q = normalizarTexto(consulta);
  if (!q) return [{ texto: rotulo, destaque: false }];
  // Map each char of the normalized label back to the original index.
  const mapa: number[] = [];
  let norm = "";
  for (let i = 0; i < rotulo.length; i++) {
    const c = rotulo[i]!
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLocaleLowerCase("pt-PT");
    for (const ch of c) {
      norm += ch;
      mapa.push(i);
    }
  }
  const marcado = new Array<boolean>(rotulo.length).fill(false);
  for (const palavra of q.split(" ")) {
    let desde = 0;
    let pos = norm.indexOf(palavra, desde);
    while (pos !== -1) {
      for (let k = pos; k < pos + palavra.length; k++) marcado[mapa[k]!] = true;
      desde = pos + palavra.length;
      pos = norm.indexOf(palavra, desde);
    }
  }
  const partes: Array<{ texto: string; destaque: boolean }> = [];
  for (let i = 0; i < rotulo.length; i++) {
    const d = marcado[i]!;
    const ultima = partes[partes.length - 1];
    if (ultima && ultima.destaque === d) ultima.texto += rotulo[i];
    else partes.push({ texto: rotulo[i]!, destaque: d });
  }
  return partes;
}
