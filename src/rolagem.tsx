"use client";

import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode, type RefObject } from "react";
import { cx } from "./cx";
import { bordasComMais } from "./rolagem-bordas";

export { bordasComMais };

/**
 * Scrolling helpers (v0.8). The look lives in css/rolagem.css:
 *
 * - `.m-scroll-x` / `.m-scroll-y` (CSS only, server-safe): styled scrollbar
 *   plus a soft shadow at each edge while there is more content that way.
 *   Chrome, Edge and Safari 26+ drive the shadows with a scroll timeline.
 * - `useScrollShadow(ref)` adds the same shadows where scroll timelines are
 *   missing (Firefox) by setting `data-rolo-*` on the element, and says
 *   whether the element overflows (so it can join the Tab order).
 * - `ScrollShadow` wraps both: a scroller that keyboard users can reach
 *   (tabindex 0 only while it overflows) with a spoken name.
 */

type Eixo = "x" | "y" | "ambos";

const temLinhaDeRolagem = () =>
  typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("animation-timeline: scroll()");

export function useScrollShadow(ref: RefObject<HTMLElement | null>, { eixo = "x" }: { eixo?: Eixo } = {}) {
  const [transborda, setTransborda] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const nativo = temLinhaDeRolagem();
    let quadro = 0;
    const medir = () => {
      quadro = 0;
      const b = bordasComMais(el);
      const x = eixo !== "y", y = eixo !== "x";
      setTransborda((x && b.transbordaX) || (y && b.transbordaY));
      if (nativo) return;
      el.toggleAttribute("data-rolo-inicio", x && b.inicio);
      el.toggleAttribute("data-rolo-fim", x && b.fim);
      el.toggleAttribute("data-rolo-cima", y && b.cima);
      el.toggleAttribute("data-rolo-baixo", y && b.baixo);
    };
    const pedir = () => { if (!quadro) quadro = requestAnimationFrame(medir); };
    medir();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(pedir) : null;
    ro?.observe(el);
    if (el.firstElementChild) ro?.observe(el.firstElementChild);
    if (!nativo) el.addEventListener("scroll", pedir, { passive: true });
    return () => {
      ro?.disconnect();
      el.removeEventListener("scroll", pedir);
      if (quadro) cancelAnimationFrame(quadro);
    };
  }, [ref, eixo]);
  return { transborda };
}

/**
 * A scrolling region with the MUTU@L scrollbar and edge shadows. Use it for
 * anything wider than a phone that must not be squeezed (wide tables, tab
 * rows, code, timelines). Give it a `label` when it holds content people
 * read ("Tabela de quotas"): it becomes a named region that keyboard users
 * can focus and scroll with the arrow keys while it overflows.
 */
export function ScrollShadow({
  children,
  eixo = "x",
  label,
  className,
  ...rest
}: {
  children: ReactNode;
  /** Scroll direction: "x" (default), "y" or "ambos". */
  eixo?: Eixo;
  /** Spoken name of the region. */
  label?: string;
  className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "children" | "className">) {
  const ref = useRef<HTMLDivElement>(null);
  const { transborda } = useScrollShadow(ref, { eixo });
  return (
    <div
      ref={ref}
      {...rest}
      role={label ? "region" : rest.role}
      aria-label={label ?? rest["aria-label"]}
      tabIndex={transborda ? 0 : rest.tabIndex}
      className={cx(eixo !== "y" && "m-scroll-x", eixo !== "x" && "m-scroll-y", "min-w-0", className)}
    >
      {children}
    </div>
  );
}
