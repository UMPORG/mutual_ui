import type { ReactNode } from "react";
import { nomeDaApp, type MutualAppId } from "./apps";
import { BASE_ICONE, GLIFOS_APPS, type FormaGlifo } from "./icones";
import { cx } from "./cx";

function Forma({ f }: { f: FormaGlifo }) {
  const papel = `m-ic-${f.papel ?? "p"}`;
  if (f.t === "circulo") return <circle cx={f.x} cy={f.y} r={f.r} className={cx(papel, f.traco ? "m-ic-traco" : "m-ic-cheio")} />;
  return <path d={f.d} className={cx(papel, f.t === "traco" ? "m-ic-traco" : "m-ic-cheio")} />;
}

/** App icon: the «folha» base in the app colour (`--app-marca`) with its white glyph. Decorative unless `titulo` is given (`true` = the app's name). Colours in css/icones.css (forced colours: monochrome). */
export function IconeApp({
  app,
  tamanho = 24,
  titulo,
  className,
}: {
  app: MutualAppId;
  tamanho?: number | undefined;
  titulo?: string | boolean | undefined;
  className?: string | undefined;
}) {
  const nome = titulo === true ? nomeDaApp(app) : titulo || undefined;
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamanho}
      height={tamanho}
      data-app={app}
      className={cx("m-icone-app", className)}
      role={nome ? "img" : undefined}
      aria-label={nome}
      aria-hidden={nome ? undefined : true}
      focusable="false"
    >
      <path d={BASE_ICONE} className="m-ic-base" />
      {GLIFOS_APPS[app].map((f, i) => (
        <Forma key={i} f={f} />
      ))}
    </svg>
  );
}

/** The app glyph WITHOUT the base, in `currentColor` so it follows every theme (incl. forced colours). For buttons and titles that name the app; the launcher and tiles keep `IconeApp`. Decorative unless `titulo`. */
export function GlifoApp({
  app,
  tamanho = 20,
  titulo,
  className,
}: {
  app: MutualAppId;
  tamanho?: number | undefined;
  titulo?: string | undefined;
  className?: string | undefined;
}) {
  // The cut-outs (`k`, the base colour on the tile) become real holes here: a mask,
  // so they show whatever is behind the button in any theme.
  const mascara = `m-glifo-furos-${app}`; // the same mask for every instance of an app
  const formas = GLIFOS_APPS[app];
  const furos = formas.filter((f) => f.papel === "k");
  return (
    <svg
      viewBox="4 4 16 16"
      width={tamanho}
      height={tamanho}
      data-app-glifo={app}
      className={cx("m-glifo-app", className)}
      role={titulo ? "img" : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
      focusable="false"
    >
      {furos.length > 0 ? (
        <defs>
          <mask id={mascara} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
            <rect width="24" height="24" fill="#fff" />
            {furos.map((f, i) =>
              f.t === "circulo" ? (
                <circle key={i} cx={f.x} cy={f.y} r={f.r} fill="#000" />
              ) : (
                <path key={i} d={f.d} fill="#000" />
              ),
            )}
          </mask>
        </defs>
      ) : null}
      <g mask={furos.length > 0 ? `url(#${mascara})` : undefined}>
        {formas
          .filter((f) => f.papel !== "k")
          .map((f, i) => (
            <Forma key={i} f={f} />
          ))}
      </g>
    </svg>
  );
}

export function IconeWaffle({ tamanho = 24 }: { tamanho?: number | undefined }) {
  const pontos: ReactNode[] = [];
  for (const y of [5, 12, 19]) for (const x of [5, 12, 19]) pontos.push(<circle key={`${x}-${y}`} cx={x} cy={y} r={2.1} />);
  return (
    <svg viewBox="0 0 24 24" width={tamanho} height={tamanho} fill="currentColor" aria-hidden focusable="false">
      {pontos}
    </svg>
  );
}
