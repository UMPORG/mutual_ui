/** Longest `href` equal to the path or a prefix of it at a `/` boundary; a root href («/», «/admin») only wins when nothing longer matches. Query and hash ignored. */
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

/** An explicit `ativo: true` wins and nothing is inferred (so «/admin» never lights up beside it); otherwise the longest match among entries with `ativo` undefined; external links never match. */
export function hrefAtualDoMenu(
  itens: readonly { href: string; ativo?: boolean | undefined; externo?: boolean | undefined }[],
  caminho: string,
): string | null {
  const explicito = itens.find((i) => i.ativo === true);
  if (explicito) return explicito.href;
  return hrefAtivo(
    itens.filter((i) => i.ativo === undefined && !i.externo).map((i) => i.href),
    caminho,
  );
}

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

export function ajudaDaApp(app: string, caminhoAjuda: string): string {
  return `${caminhoAjuda}/${app === "qr" ? "validador-qr" : app}`;
}
