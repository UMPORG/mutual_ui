import { test } from "vite-plus/test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ContextMenu, ehTeclaDoMenuDeContexto } from "../src/menus.tsx";

const tecla = (key: string, mod: { shiftKey?: boolean; ctrlKey?: boolean; altKey?: boolean; metaKey?: boolean } = {}) => ({
  key,
  shiftKey: false,
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  ...mod,
});

test("ehTeclaDoMenuDeContexto: the Menu key and Shift+F10 open the context menu", () => {
  assert.equal(ehTeclaDoMenuDeContexto(tecla("ContextMenu")), true);
  assert.equal(ehTeclaDoMenuDeContexto(tecla("ContextMenu", { shiftKey: true })), true);
  assert.equal(ehTeclaDoMenuDeContexto(tecla("F10", { shiftKey: true })), true);
});

test("ehTeclaDoMenuDeContexto: either key alone, or with another modifier, does nothing", () => {
  assert.equal(ehTeclaDoMenuDeContexto(tecla("F10")), false);
  assert.equal(ehTeclaDoMenuDeContexto(tecla("Shift", { shiftKey: true })), false);
  assert.equal(ehTeclaDoMenuDeContexto(tecla("F10", { shiftKey: true, ctrlKey: true })), false);
  assert.equal(ehTeclaDoMenuDeContexto(tecla("F10", { shiftKey: true, altKey: true })), false);
  assert.equal(ehTeclaDoMenuDeContexto(tecla("ContextMenu", { metaKey: true })), false);
  assert.equal(ehTeclaDoMenuDeContexto(tecla("Enter")), false);
  assert.equal(ehTeclaDoMenuDeContexto(tecla("F9", { shiftKey: true })), false);
});

test("ContextMenu: renders the same trigger, with its class and children, and no menu until opened", () => {
  const html = renderToStaticMarkup(
    h(ContextMenu, { className: "area", items: [{ label: "Abrir ficha" }], children: h("button", { type: "button" }, "Ficha") }),
  );
  assert.equal(html, '<div style="-webkit-touch-callout:none" class="area"><button type="button">Ficha</button></div>');
  assert.doesNotMatch(html, /role="menu"/);
});
