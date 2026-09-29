/**
 * Pure helpers of shell G (src/shell.tsx) — no React, unit-tested in
 * tests/shell.test.ts.
 */

/**
 * The navigation entry of the current page: the LONGEST `href` that is the
 * path itself or a prefix of it at a `/` boundary («/admin/caracterizacao»
 * stays current on «/admin/caracterizacao/respostas» — its tabs). A root
 * href («/», «/admin») only wins when nothing longer matches, so «Início»
 * is not current everywhere. Query strings and hashes are ignored.
 */
export function hrefAtivo(hrefs: readonly string[], caminho: string): string | null {
  const limpar = (h: string) => {
    const sem = h.split(/[?#]/)[0] ?? "";
    return sem.length > 1 && sem.endsWith("/") ? sem.slice(0, -1) : sem || "/";
  };
  const atual = limpar(caminho);
  let melhor: string | null = null;
  let tamanho = -1;
  for (const href of hrefs) {
    const h = limpar(href);
    const casa = h === atual || (h === "/" ? false : atual.startsWith(`${h}/`));
    if (casa && h.length > tamanho) {
      melhor = href;
      tamanho = h.length;
    }
  }
  return melhor;
}

/** Initials for the account avatar: first and last name («Ana Maria Martins» → «AM»). */
export function iniciais(nome: string): string {
  const partes = nome
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0 && !/^(de|da|do|das|dos|e)$/i.test(p));
  if (partes.length === 0) return "?";
  const primeira = partes[0]!.charAt(0);
  const ultima = partes.length > 1 ? partes[partes.length - 1]!.charAt(0) : "";
  return (primeira + ultima).toLocaleUpperCase("pt-PT");
}

/** Where the Ajuda of an app lives by default: the Portal's help centre. */
export function ajudaDaApp(app: string, caminhoAjuda: string): string {
  return `${caminhoAjuda}/${app === "qr" ? "validador-qr" : app}`;
}
