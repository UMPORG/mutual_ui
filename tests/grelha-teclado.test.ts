import { test } from "node:test";
import assert from "node:assert/strict";
import { indiceNaGrelha } from "../src/grelha-teclado.ts";

test("indiceNaGrelha: arrows move by one item or one row of 3, stopping at the edges", () => {
  // 8 items: rows [0 1 2] [3 4 5] [6 7]
  assert.equal(indiceNaGrelha(0, "ArrowRight", 8, 3), 1);
  assert.equal(indiceNaGrelha(2, "ArrowRight", 8, 3), 3);
  assert.equal(indiceNaGrelha(7, "ArrowRight", 8, 3), 7);
  assert.equal(indiceNaGrelha(0, "ArrowLeft", 8, 3), 0);
  assert.equal(indiceNaGrelha(3, "ArrowLeft", 8, 3), 2);
  assert.equal(indiceNaGrelha(1, "ArrowDown", 8, 3), 4);
  assert.equal(indiceNaGrelha(4, "ArrowDown", 8, 3), 7);
  assert.equal(indiceNaGrelha(5, "ArrowDown", 8, 3), 5); // no item below
  assert.equal(indiceNaGrelha(4, "ArrowUp", 8, 3), 1);
  assert.equal(indiceNaGrelha(1, "ArrowUp", 8, 3), 1);
  assert.equal(indiceNaGrelha(5, "Home", 8, 3), 0);
  assert.equal(indiceNaGrelha(1, "End", 8, 3), 7);
});

test("indiceNaGrelha: other keys and bad input do not move", () => {
  assert.equal(indiceNaGrelha(1, "Enter", 8, 3), null);
  assert.equal(indiceNaGrelha(1, "Tab", 8, 3), null);
  assert.equal(indiceNaGrelha(0, "ArrowRight", 0, 3), null);
  assert.equal(indiceNaGrelha(9, "ArrowRight", 8, 3), null);
});
