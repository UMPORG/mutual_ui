import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ajudaDaApp, hrefAtivo, hrefAtualDoMenu, iniciais } from "../src/shell-nav.ts";

test("hrefAtivo: the longest matching entry wins; tabs keep their page current", () => {
  const hrefs = ["/admin", "/admin/associacoes", "/admin/caracterizacao", "/admin/licencas"];
  assert.equal(hrefAtivo(hrefs, "/admin"), "/admin");
  assert.equal(hrefAtivo(hrefs, "/admin/associacoes/12"), "/admin/associacoes");
  assert.equal(hrefAtivo(hrefs, "/admin/caracterizacao/respostas"), "/admin/caracterizacao");
  assert.equal(hrefAtivo(hrefs, "/admin/licencas/planos"), "/admin/licencas");
  // «Início» (a prefix of everything) only when nothing longer matches.
  assert.equal(hrefAtivo(hrefs, "/admin/perfil"), "/admin");
});

test("hrefAtivo: a root «/» is current only on itself; no false prefix matches", () => {
  assert.equal(hrefAtivo(["/", "/eventos"], "/"), "/");
  assert.equal(hrefAtivo(["/", "/eventos"], "/eventos/3"), "/eventos");
  assert.equal(hrefAtivo(["/", "/eventos"], "/formacoes"), null);
  assert.equal(hrefAtivo(["/admin/kpi"], "/admin/kpis"), null);
  assert.equal(hrefAtivo(["/admin/kpis/"], "/admin/kpis?ano=2026#topo"), "/admin/kpis/");
});

test("hrefAtualDoMenu: one current entry — an explicit one beats a prefix like «/admin»", () => {
  const menu = [
    { href: "/admin" },
    { href: "/admin/associacoes" },
    { href: "/admin/caracterizacao/campanhas", ativo: true },
    { href: "/protocolos", externo: true },
  ];
  assert.equal(hrefAtualDoMenu(menu, "/admin/caracterizacao/respostas"), "/admin/caracterizacao/campanhas");
  const semExplicito = menu.map((i) => ({ ...i, ativo: i.href.includes("caracterizacao") ? false : undefined }));
  assert.equal(hrefAtualDoMenu(semExplicito, "/admin/associacoes/3"), "/admin/associacoes");
  assert.equal(hrefAtualDoMenu(semExplicito, "/admin/caracterizacao/respostas"), "/admin");
  assert.equal(hrefAtualDoMenu([{ href: "/protocolos", externo: true }], "/protocolos"), null);
});

test("iniciais: first and last name, without particles", () => {
  assert.equal(iniciais("Ana Maria Martins"), "AM");
  assert.equal(iniciais("Rui da Costa"), "RC");
  assert.equal(iniciais("  teresa  "), "T");
  assert.equal(iniciais("Élio Órfão"), "ÉÓ");
  assert.equal(iniciais(""), "?");
});

test("ajudaDaApp: the Portal's help centre; the QR's section is «validador-qr»", () => {
  assert.equal(ajudaDaApp("backoffice", "/ajuda"), "/ajuda/backoffice");
  assert.equal(ajudaDaApp("qr", "/ajuda"), "/ajuda/validador-qr");
});

test("shell G is wired: css/shell.css imported by index.css and exported; old sidebar pieces gone", () => {
  const index = readFileSync(new URL("../css/index.css", import.meta.url), "utf8");
  assert.match(index, /@import "\.\/shell\.css";/);
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { exports: Record<string, string> };
  assert.equal(pkg.exports["./css/shell.css"], "./css/shell.css");
  const src = readFileSync(new URL("../src/index.ts", import.meta.url), "utf8");
  for (const nome of ["AppShell", "NavApp", "AcaoPrincipal", "MenuConta", "ProcuraApp", "Separadores", "LancadorApps"]) {
    assert.match(src, new RegExp(`\\b${nome}\\b`), `${nome} exported`);
  }
  for (const nome of ["ShellBarraLateral", "ShellMarca", "ShellConta", "classeItemShell", "AppSwitcher"]) {
    assert.doesNotMatch(src, new RegExp(`\\b${nome}\\b`), `${nome} removed`);
  }
  const shell = readFileSync(new URL("../css/shell.css", import.meta.url), "utf8");
  // 8px content layer, pill for the current page, 48px items, 44px bar buttons.
  assert.match(shell, /\.m-camada \{[^}]*border-radius: 8px;/);
  assert.match(shell, /\.m-nav-item\[aria-current="page"\] \{[^}]*background: var\(--moldura-selecao\)/);
  assert.match(shell, /\.m-nav-item \{[^}]*min-height: 3rem;/);
  assert.match(shell, /\.m-barra-botao \{[^}]*width: 2\.75rem;[^}]*height: 2\.75rem;/);
});

test("motion (v0.14): one set of tokens, zero under Reduzir movimento, only opacity/transform/colour move", () => {
  const tokens = readFileSync(new URL("../css/tokens.css", import.meta.url), "utf8");
  for (const nome of ["--movimento-rapido", "--movimento-medio", "--movimento-lento", "--curva-entrada", "--curva-saida"]) {
    assert.match(tokens, new RegExp(`${nome}:`), `${nome} declared`);
  }
  assert.match(tokens, /html\[data-movimento="reduzido"\] \{[^}]*--movimento-medio: 0ms;/);
  assert.match(tokens, /prefers-reduced-motion: reduce\)[^{]*\{\s*:root \{[^}]*--movimento-lento: 0ms;/);
  const shell = readFileSync(new URL("../css/shell.css", import.meta.url), "utf8");
  const permitidas = new Set(["opacity", "transform", "background-color", "color", "box-shadow", "overlay", "display"]);
  for (const bloco of shell.matchAll(/transition:\s*([^;]+);/g)) {
    for (const parte of bloco[1]!.split(",")) {
      const propriedade = parte.trim().split(/\s+/)[0]!;
      assert.ok(permitidas.has(propriedade), `transition of «${propriedade}» in css/shell.css (layout must not animate)`);
    }
  }
  assert.doesNotMatch(shell, /\d{3,}ms/, "durations come from the tokens");
});
