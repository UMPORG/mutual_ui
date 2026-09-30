/** Scrolling maths shared by useScrollShadow (pure, testable). */

/** Which edges have more content beyond them (1px tolerance for zoom rounding). */
export function bordasComMais(m: {
  scrollLeft: number;
  scrollWidth: number;
  clientWidth: number;
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}) {
  const maxX = m.scrollWidth - m.clientWidth;
  const x = m.scrollLeft; // pt-PT pages are left-to-right; the shadows use physical sides
  const maxY = m.scrollHeight - m.clientHeight;
  return {
    inicio: maxX > 1 && x > 1,
    fim: maxX > 1 && x < maxX - 1,
    cima: maxY > 1 && m.scrollTop > 1,
    baixo: maxY > 1 && m.scrollTop < maxY - 1,
    transbordaX: maxX > 1,
    transbordaY: maxY > 1,
  };
}
