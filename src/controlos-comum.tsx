"use client";

import { useCallback, useRef, useState } from "react";
import { partesDestacadas } from "./filtrar";

/** Classes of every floating layer (menus, selects, popovers). */
export const CLASSE_FLUTUANTE = "m-float m-pop outline-none";
/** Positioner layer: above sticky headers and the desk sidebar. */
export const CLASSE_POSICIONADOR = "z-50 outline-none";

/** Controlled/uncontrolled state, the usual way. */
export function useControlado<T>(valor: T | undefined, padrao: T, aoMudar?: (v: T) => void): [T, (v: T) => void] {
  const [interno, setInterno] = useState<T>(padrao);
  const controlado = valor !== undefined;
  const atual = controlado ? valor : interno;
  const aoMudarRef = useRef(aoMudar);
  aoMudarRef.current = aoMudar;
  const definir = useCallback(
    (v: T) => {
      if (!controlado) setInterno(v);
      aoMudarRef.current?.(v);
    },
    [controlado],
  );
  return [atual, definir];
}

/** The label with the typed part in bold (accent-insensitive). */
export function Destacado({ texto, consulta }: { texto: string; consulta: string }) {
  const partes = partesDestacadas(texto, consulta);
  return (
    <>
      {partes.map((p, i) =>
        p.destaque ? (
          <strong key={i} className="font-semibold text-foreground">
            {p.texto}
          </strong>
        ) : (
          <span key={i}>{p.texto}</span>
        ),
      )}
    </>
  );
}
