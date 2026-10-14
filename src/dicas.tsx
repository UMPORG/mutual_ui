"use client";

import { useId, useRef, useState, useSyncExternalStore, type ElementType, type ReactNode } from "react";
import { ChevronDown, ChevronRight, Info, X } from "lucide-react";
import { cx } from "./cx";
import { dicaDispensada, dispensarDica, reporDica, subscreverDicas } from "./dicas-estado";

export { dicaDispensada, dispensarDica, reporDica } from "./dicas-estado";

/**
 * Dica: a calm tip about the screen. One line (icon + `titulo`); `children` and «Saber mais» open on demand,
 * so it never pushes the main action down. Close button (44 px, icon only); the choice is kept on the device
 * under `id` (`<app>.dica.<nome>`). `rotuloReabrir` adds a link-like button to bring it back; without it say
 * where the help lives in `avisoAoFechar` (read by screen readers). `dispensavel={false}`: help line without
 * close button, rendered on the server too. `role="note"`. Colours `--dica*` (contrast measured in
 * tests/dicas.test.ts), no entrance animation, not printed.
 * Place it AFTER the action it explains, never between a card and its primary button.
 */
export interface DicaProps {
  /** Device memory key, prefixed by the app: "cartao.dica.passe-digital". */
  id: string;
  titulo: ReactNode;
  children?: ReactNode | undefined;
  saberMais?: { href: string; rotulo?: string | undefined } | undefined;
  LinkComponent?: ElementType | undefined;
  aberta?: boolean | undefined;
  dispensavel?: boolean | undefined;
  /** Label of the button that brings a closed tip back («Mostrar a ajuda deste ecrã»). */
  rotuloReabrir?: string | undefined;
  /** Said to screen readers when the tip closes («As respostas ficam na Ajuda.»). */
  avisoAoFechar?: string | undefined;
  rotuloFechar?: string | undefined;
  className?: string | undefined;
}

type Estado = "carregando" | "visivel" | "dispensada";

const lerNoServidor = (): Estado => "carregando";

export function Dica({
  id,
  titulo,
  children,
  saberMais,
  LinkComponent = "a",
  aberta: abertaInicial = false,
  dispensavel = true,
  rotuloReabrir,
  avisoAoFechar,
  rotuloFechar = "Fechar a dica",
  className,
}: DicaProps) {
  const estado = useSyncExternalStore<Estado>(
    subscreverDicas,
    () => (dispensavel && dicaDispensada(id) ? "dispensada" : "visivel"),
    dispensavel ? lerNoServidor : () => "visivel",
  );
  const [aberta, setAberta] = useState(abertaInicial);
  const [fechadaAgora, setFechadaAgora] = useState(false);
  const reabrirRef = useRef<HTMLButtonElement>(null);
  const base = useId();
  const tituloId = `${base}-titulo`;
  const corpoId = `${base}-corpo`;
  const Link = LinkComponent;
  const temCorpo = children != null || saberMais != null;

  if (estado === "carregando") return null;

  const aviso = (
    <span role="status" className="sr-only">
      {fechadaAgora && estado === "dispensada" ? (avisoAoFechar ?? "Dica fechada.") : ""}
    </span>
  );

  if (estado === "dispensada") {
    return (
      <>
        {aviso}
        {rotuloReabrir && (
          <button
            ref={reabrirRef}
            type="button"
            className={cx("m-nota-reabrir", className)}
            onClick={() => {
              setFechadaAgora(false);
              setAberta(true);
              reporDica(id);
            }}
          >
            <Info aria-hidden />
            {rotuloReabrir}
          </button>
        )}
      </>
    );
  }

  const icone = <Info className="m-nota-icone" aria-hidden />;

  return (
    <>
      {aviso}
      <aside role="note" aria-labelledby={tituloId} className={cx("m-nota", className)} data-aberta={aberta ? "" : undefined}>
        <div className="m-nota-linha">
          {temCorpo ? (
            <button
              type="button"
              className="m-nota-alternar"
              aria-expanded={aberta}
              aria-controls={corpoId}
              onClick={() => setAberta((a) => !a)}
            >
              {icone}
              <span id={tituloId} className="m-nota-titulo">
                {titulo}
              </span>
              <ChevronDown className="m-nota-seta" aria-hidden />
            </button>
          ) : (
            <p className="m-nota-cabeca">
              {icone}
              <span id={tituloId} className="m-nota-titulo">
                {titulo}
              </span>
            </p>
          )}
          {dispensavel && (
            <button
              type="button"
              className="m-nota-fechar"
              aria-label={rotuloFechar}
              onClick={() => {
                setFechadaAgora(true);
                dispensarDica(id);
                // The close button disappears: keep the keyboard next to where it was.
                requestAnimationFrame(() => reabrirRef.current?.focus());
              }}
            >
              <X aria-hidden />
            </button>
          )}
        </div>
        {temCorpo && (
          <div id={corpoId} className="m-nota-corpo" hidden={!aberta}>
            {children}
            {saberMais && (
              <p>
                <Link href={saberMais.href} className="m-nota-mais">
                  {saberMais.rotulo ?? "Saber mais"}
                  <ChevronRight aria-hidden />
                </Link>
              </p>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
