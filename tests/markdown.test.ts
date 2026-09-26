import { test } from "node:test";
import assert from "node:assert/strict";
import { analisarInline, analisarMarkdown, markdownParaTexto, sanitizarUrl, type Block, type Inline } from "../src/markdown-ast.ts";

function texto(c: Inline[]): string {
  return c.map((x) => ("v" in x ? x.v : "c" in x ? texto(x.c) : x.t === "br" ? "\n" : "")).join("");
}

test("sanitizarUrl aceita http(s), mailto, tel e caminhos relativos", () => {
  assert.equal(sanitizarUrl("https://mutual.mutualismo.pt/ajuda"), "https://mutual.mutualismo.pt/ajuda");
  assert.equal(sanitizarUrl("/ajuda/quotas#prazos"), "/ajuda/quotas#prazos");
  assert.equal(sanitizarUrl("#secao"), "#secao");
  assert.equal(sanitizarUrl("mailto:apoio@mutualismo.pt"), "mailto:apoio@mutualismo.pt");
  assert.equal(sanitizarUrl("tel:+351213000000"), "tel:+351213000000");
  assert.equal(sanitizarUrl("ficha?id=3"), "ficha?id=3");
});

test("sanitizarUrl recusa esquemas perigosos, mesmo disfarçados", () => {
  for (const mau of [
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    " javascript:alert(1)",
    "java\nscript:alert(1)",
    "java\tscript:alert(1)",
    "\u0000javascript:alert(1)",
    "data:text/html;base64,PHNjcmlwdD4=",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "\\\\evil.example",
  ]) {
    assert.equal(sanitizarUrl(mau), null, mau);
  }
  assert.equal(sanitizarUrl(""), null);
  assert.equal(sanitizarUrl(null), null);
});

test("HTML cru fica como texto (nunca é interpretado)", () => {
  const b = analisarMarkdown('<script>alert("x")</script>\n\n<img src=x onerror=alert(1)>');
  assert.equal(b.length, 2);
  assert.equal(b[0]!.t, "p");
  assert.equal(texto((b[0] as Extract<Block, { t: "p" }>).c), '<script>alert("x")</script>');
  assert.equal(texto((b[1] as Extract<Block, { t: "p" }>).c), "<img src=x onerror=alert(1)>");
});

test("ligações com esquema perigoso ficam sem destino; imagens nunca carregam", () => {
  const [l] = analisarInline("[clique](javascript:alert(1))");
  assert.equal(l!.t, "link");
  assert.equal((l as Extract<Inline, { t: "link" }>).href, null);
  const [img] = analisarInline("![logótipo](https://exemplo.pt/x.png)");
  assert.equal(img!.t, "img");
  assert.equal((img as Extract<Inline, { t: "img" }>).href, "https://exemplo.pt/x.png");
});

test("ênfase, código, riscado, ligações e citações", () => {
  const c = analisarInline("As **quotas** de *março* estão em `atraso`, ~~não~~ [ver ajuda](/ajuda/quotas) [1][2].");
  const tipos = c.map((x) => x.t);
  assert.deepEqual(tipos, ["text", "strong", "text", "em", "text", "code", "text", "del", "text", "link", "text", "cite", "cite", "text"]);
  const link = c.find((x) => x.t === "link") as Extract<Inline, { t: "link" }>;
  assert.equal(link.href, "/ajuda/quotas");
  assert.equal(link.externo, false);
});

test("snake_case e asteriscos soltos ficam literais", () => {
  assert.equal(texto(analisarInline("o campo data_de_inicio")), "o campo data_de_inicio");
  assert.equal(texto(analisarInline("3 * 4 = 12")), "3 * 4 = 12");
  assert.equal(texto(analisarInline("**sem fecho")), "**sem fecho");
});

test("ligações diretas e autolinks", () => {
  const c = analisarInline("Veja https://mutual.mutualismo.pt/ajuda. Ou <apoio@mutualismo.pt>.");
  const links = c.filter((x) => x.t === "link") as Array<Extract<Inline, { t: "link" }>>;
  assert.equal(links[0]!.href, "https://mutual.mutualismo.pt/ajuda");
  assert.equal(links[0]!.externo, true);
  assert.equal(links[1]!.href, "mailto:apoio@mutualismo.pt");
});

test("blocos: títulos, listas aninhadas, tarefas, citação, código, regra", () => {
  const md = [
    "## Passos",
    "",
    "1. Abra a ficha",
    "2. Escolha **Quotas**",
    "   - Filtre por ano",
    "   - Exporte",
    "",
    "- [x] feito",
    "- [ ] por fazer",
    "",
    "> Nota importante",
    "",
    "```ts",
    "const x = 1;",
    "```",
    "",
    "---",
  ].join("\n");
  const b = analisarMarkdown(md);
  assert.deepEqual(
    b.map((x) => x.t),
    ["h", "list", "list", "quote", "code", "hr"],
  );
  const ol = b[1] as Extract<Block, { t: "list" }>;
  assert.equal(ol.ordered, true);
  assert.equal(ol.items.length, 2);
  assert.equal(ol.items[1]!.c[1]!.t, "list");
  const tarefas = b[2] as Extract<Block, { t: "list" }>;
  assert.deepEqual(tarefas.items.map((i) => i.checked), [true, false]);
  const code = b[4] as Extract<Block, { t: "code" }>;
  assert.equal(code.lang, "ts");
  assert.equal(code.v, "const x = 1;");
  assert.equal(code.aberto, false);
});

test("tabelas com alinhamento e barras escapadas", () => {
  const b = analisarMarkdown("| Mês | Valor |\n| :-- | --: |\n| janeiro | 1 250,00 € |\n| a \\| b | 3 |");
  const t = b[0] as Extract<Block, { t: "table" }>;
  assert.equal(t.t, "table");
  assert.deepEqual(t.align, ["left", "right"]);
  assert.equal(t.rows.length, 2);
  assert.equal(texto(t.rows[1]![0]!), "a | b");
});

test("texto parcial (a ser escrito): bloco de código aberto vai até ao fim", () => {
  const b = analisarMarkdown("Aqui está:\n\n```sql\nselect *\nfrom quotas");
  const code = b[1] as Extract<Block, { t: "code" }>;
  assert.equal(code.aberto, true);
  assert.equal(code.v, "select *\nfrom quotas");
});

test("quebras de linha: suave vira espaço, dois espaços viram quebra", () => {
  const [p] = analisarMarkdown("linha um\nlinha dois  \nlinha três");
  const c = (p as Extract<Block, { t: "p" }>).c;
  assert.equal(texto(c), "linha um linha dois\nlinha três");
});

test("markdownParaTexto tira as marcas", () => {
  assert.equal(markdownParaTexto("**Olá**, veja [a ajuda](/ajuda) [1]."), "Olá, veja a ajuda.");
  assert.equal(markdownParaTexto("- um\n- dois"), "• um\n• dois");
});

test("texto a ser escrito: marcas por fechar ficam escondidas", async () => {
  const { estabilizarParcial } = await import("../src/markdown-ast.ts");
  assert.equal(estabilizarParcial("a indicação *se"), "a indicação se");
  assert.equal(estabilizarParcial("As **quo"), "As quo");
  assert.equal(estabilizarParcial("use `npm"), "use npm");
  assert.equal(estabilizarParcial("já **fechado** e *ok*"), "já **fechado** e *ok*");
  assert.equal(estabilizarParcial("o campo data_de_inicio"), "o campo data_de_inicio");
  assert.equal(estabilizarParcial("para *todos*\n\ne agora **isto"), "para *todos*\n\ne agora isto");
  assert.equal(estabilizarParcial("```sql\nselect *"), "```sql\nselect *");
  assert.equal(estabilizarParcial("3 * 4"), "3  4");
});
