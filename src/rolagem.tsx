"use client";

import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode, type RefObject } from "react";
import { cx } from "./cx";
import { bordasComMais } from "./rolagem-bordas";

export { bordasComMais };

/** `.m-scroll-x`/`.m-scroll-y` (CSS only, server-safe: styled scrollbar + edge shadows via scroll timeline; css/rolagem.css), `useScrollShadow(ref)` (same shadows where timelines are missing, Firefox; says whether it overflows) and `ScrollShadow` (a scroller keyboard users reach: tabindex 0 only while it overflows). */

type Eixo = "x" | "y" | "ambos";

const temLinhaDeRolagem = () =>
  typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("animation-timeline: scroll()");

export function useScrollShadow(ref: RefObject<HTMLElement | null>, { eixo = "x" }: { eixo?: Eixo | undefined } = {}) {
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

/** Scrolling region with edge shadows for anything that must not be squeezed (wide tables, tab rows, code). Give it a `label` for content people read: it becomes a named, focusable region. */
export function ScrollShadow({
  children,
  eixo = "x",
  label,
  className,
  ...rest
}: {
  children: ReactNode;
  eixo?: Eixo | undefined;
  label?: string | undefined;
  className?: string | undefined;
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
