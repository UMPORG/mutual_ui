import { test } from "vite-plus/test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FormField } from "../src/campo.tsx";
import { NumberField } from "../src/escolhas.tsx";

/** The input's id, the − / + buttons' `aria-controls` and the label's `for` in the rendered HTML. */
function ligacoes(html: string) {
  const input = /<input[^>]*\bid="([^"]+)"/.exec(html)?.[1];
  const controla = [...html.matchAll(/<button[^>]*\baria-controls="([^"]+)"/g)].map((m) => m[1]);
  const rotulo = /<label[^>]*\bfor="([^"]+)"/.exec(html)?.[1];
  return { input, controla, rotulo };
}

test("NumberField in FormField: label and both buttons point at the input", () => {
  const html = renderToStaticMarkup(h(FormField, { label: "Quantidade", hint: "Entre 1 e 10.", required: true, children: h(NumberField, { min: 1, max: 10 }) }));
  const { input, controla, rotulo } = ligacoes(html);
  assert.ok(input?.startsWith("campo-"), "the input keeps the FormField id");
  assert.equal(rotulo, input);
  assert.deepEqual(controla, [input, input]);
  // The other ARIA props stay on the input.
  assert.match(html, new RegExp(`<input[^>]*aria-describedby="${input}-ajuda"`));
  assert.match(html, /<input[^>]*aria-required="true"/);
});

test("NumberField in FormField with its own id: the same id on input, label and buttons", () => {
  const html = renderToStaticMarkup(h(FormField, { label: "Quantidade", id: "quantidade", children: h(NumberField, {}) }));
  assert.deepEqual(ligacoes(html), { input: "quantidade", controla: ["quantidade", "quantidade"], rotulo: "quantidade" });
});

test("NumberField alone: with an id and without one, the buttons point at the input", () => {
  const comId = ligacoes(renderToStaticMarkup(h(NumberField, { id: "lugares", "aria-label": "Lugares" })));
  assert.deepEqual(comId, { input: "lugares", controla: ["lugares", "lugares"], rotulo: undefined });
  const semId = ligacoes(renderToStaticMarkup(h(NumberField, { "aria-label": "Lugares" })));
  assert.ok(semId.input);
  assert.deepEqual(semId.controla, [semId.input, semId.input]);
});
