import { test } from "node:test";
import assert from "node:assert/strict";
import { areaSobreposta, escolherDoca, retanguloDaDoca } from "../src/demo-doca.ts";

const VP = { w: 1440, h: 900 };
const PILULA = { w: 48, h: 48 };

test("retanguloDaDoca: corners and the middle of the right edge", () => {
  assert.deepEqual(retanguloDaDoca("fim", PILULA, 1440, 900, 20), { x: 1372, y: 832, w: 48, h: 48 });
  assert.deepEqual(retanguloDaDoca("inicio", PILULA, 1440, 900, 20), { x: 20, y: 832, w: 48, h: 48 });
  assert.deepEqual(retanguloDaDoca("meio", PILULA, 1440, 900, 20), { x: 1372, y: 426, w: 48, h: 48 });
});

test("areaSobreposta counts the gap (folga) around obstacles", () => {
  const a = { x: 0, y: 0, w: 10, h: 10 };
  assert.equal(areaSobreposta(a, { x: 20, y: 0, w: 10, h: 10 }), 0);
  assert.equal(areaSobreposta(a, { x: 12, y: 0, w: 10, h: 10 }), 0);
  assert.equal(areaSobreposta(a, { x: 12, y: 0, w: 10, h: 10 }, 4), 20);
  assert.equal(areaSobreposta(a, { x: 5, y: 5, w: 10, h: 10 }), 25);
});

test("escolherDoca keeps the bottom-right corner when nothing is there", () => {
  assert.equal(escolherDoca(PILULA, VP, []), "fim");
  // An obstacle far away.
  assert.equal(escolherDoca(PILULA, VP, [{ x: 100, y: 100, w: 200, h: 44 }]), "fim");
});

test("escolherDoca leaves a submit button in the bottom-right corner", () => {
  const guardar = { x: 1300, y: 830, w: 120, h: 48 };
  assert.equal(escolherDoca(PILULA, VP, [guardar]), "inicio");
});

test("escolherDoca goes to the middle of the edge when both corners are taken", () => {
  // Mobile: a full-width actions row at the bottom.
  const mobile = { w: 390, h: 844 };
  const cancelar = { x: 16, y: 780, w: 170, h: 48 };
  const guardar = { x: 204, y: 780, w: 170, h: 48 };
  assert.equal(escolherDoca(PILULA, mobile, [cancelar, guardar], { margem: 16 }), "meio");
});

test("escolherDoca takes the dock that covers least when every dock collides", () => {
  const fundo = { x: 0, y: 820, w: 1440, h: 80 }; // covers both corners fully
  const meio = { x: 1380, y: 440, w: 10, h: 10 }; // a small part of the middle dock
  assert.equal(escolherDoca(PILULA, VP, [fundo, meio]), "meio");
});

test("escolherDoca ignores empty rectangles (hidden elements)", () => {
  assert.equal(escolherDoca(PILULA, VP, [{ x: 1380, y: 840, w: 0, h: 0 }]), "fim");
});

test("escolherDoca with the pill lifted above a bottom navigation bar (fundo)", () => {
  const mobile = { w: 390, h: 844 };
  // A bottom nav 72px high: with fundo 88 the corners sit above it, so it is no obstacle.
  const nav = { x: 0, y: 772, w: 390, h: 72 };
  assert.equal(escolherDoca(PILULA, mobile, [nav], { margem: 16, fundo: 88 }), "fim");
  assert.equal(escolherDoca(PILULA, mobile, [nav], { margem: 16 }), "meio");
  assert.deepEqual(retanguloDaDoca("inicio", PILULA, 390, 844, 16, 88), { x: 16, y: 708, w: 48, h: 48 });
});
