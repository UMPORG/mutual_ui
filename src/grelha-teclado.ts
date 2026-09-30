/**
 * Keyboard movement in a grid of `n` items laid out in `colunas` columns
 * (the grid launcher). Returns the new index, or `null` when the key does
 * not move (the caller then lets the browser handle it). Stops at the edges
 * (no wrap): ←/→ one item (across rows), ↑/↓ one row (↓ on the last,
 * incomplete row stays), Home/End first/last.
 */
export function indiceNaGrelha(i: number, tecla: string, n: number, colunas: number): number | null {
  if (n <= 0 || i < 0 || i >= n) return null;
  switch (tecla) {
    case "ArrowRight":
      return Math.min(i + 1, n - 1);
    case "ArrowLeft":
      return Math.max(i - 1, 0);
    case "ArrowDown":
      return i + colunas < n ? i + colunas : i;
    case "ArrowUp":
      return i - colunas >= 0 ? i - colunas : i;
    case "Home":
      return 0;
    case "End":
      return n - 1;
    default:
      return null;
  }
}
