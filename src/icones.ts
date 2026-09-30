/**
 * The MUTU@L app icon family («folha» base). Plain data + a string renderer,
 * no React: `IconeApp` (src/icone-app.tsx) draws it in the page; `svgIconeApp` gives the standalone SVG for favicons
 * and home-screen icons (scripts/gerar-icones.mjs → assets/icones/).
 *
 * One 24-unit grid for every app (the method of Google Workspace and Proton —
 * one base, one glyph per product — with ORIGINAL drawings):
 * - base «folha»: a square with alternating corners (7 / 2.5 units), the
 *   signature of the family;
 * - live area 4.5–19.5 (62 % of the base, legible at 16 px);
 * - stroke 2 units, round caps and joins; shapes ≥ 2.5, gaps ≥ 1.5;
 * - roles: `p` the shape that says what it is, `r` the highlight, `s`
 *   secondary (white at 72 %), `k` a cut-out in the colour of the base.
 * The base is the app's colour (`--app-marca`, the same in light and dark),
 * the glyph white (≥ 5.0:1). Forced colours: Canvas / CanvasText.
 */
import type { MutualAppId } from "./apps";

export type PapelGlifo = "p" | "r" | "s" | "k";
export type FormaGlifo =
  | { t: "traco"; d: string; papel?: PapelGlifo }
  | { t: "cheio"; d: string; papel?: PapelGlifo }
  | { t: "circulo"; x: number; y: number; r: number; traco?: boolean; papel?: PapelGlifo };

/** The «folha» base (24 × 24). */
export const BASE_ICONE = "M7 0H21.5A2.5 2.5 0 0 1 24 2.5V17A7 7 0 0 1 17 24H2.5A2.5 2.5 0 0 1 0 21.5V7A7 7 0 0 1 7 0Z";

/** The tile colour of each app (= `--app-marca` in css/tokens.css; tests/icones.test.ts keeps them equal). */
export const COR_MARCA_APP: Record<MutualAppId, string> = {
  portal: "#1f6f36",
  backoffice: "#1d4ed8",
  eventos: "#7a1fc4",
  simplex: "#9c6100",
  saude: "#b8166e",
  qr: "#0e7490",
  dns: "#475569",
  assistente: "#0b7a72",
  protocolos: "#b93a2e",
  monitor: "#6b7500",
  cartao: "#1f6f36",
};

export const GLIFOS_APPS: Record<MutualAppId, readonly FormaGlifo[]> = {
  // Portal — the way in: an arch, the open door and the floor.
  portal: [
    { t: "traco", d: "M7.5 18.5V11a4.5 4.5 0 0 1 9 0v7.5" },
    { t: "cheio", d: "M10.5 18.5v-5.25a1.5 1.5 0 0 1 3 0v5.25Z", papel: "r" },
    { t: "traco", d: "M5 19.25h14", papel: "s" },
  ],
  // Backoffice — the institution: pediment, three columns, base.
  backoffice: [
    { t: "cheio", d: "M12 4.5l7.25 4.75H4.75Z", papel: "r" },
    { t: "traco", d: "M7.5 12v4M12 12v4M16.5 12v4" },
    { t: "traco", d: "M5 19h14", papel: "s" },
  ],
  // Eventos — a calendar with its rings and the day marked.
  eventos: [
    { t: "traco", d: "M7.5 7h9a2.5 2.5 0 0 1 2.5 2.5v7a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 16.5v-7A2.5 2.5 0 0 1 7.5 7Z" },
    { t: "cheio", d: "M4 10.5V9.5A3.5 3.5 0 0 1 7.5 6h9A3.5 3.5 0 0 1 20 9.5v1Z" },
    { t: "traco", d: "M9 4.25v2.5M15 4.25v2.5" },
    { t: "circulo", x: 15, y: 15, r: 1.9, papel: "r" },
  ],
  // Simplex — the accounts: a pie chart with one slice pulled out.
  simplex: [
    { t: "cheio", d: "M11 13V6.5A6.5 6.5 0 1 0 17.5 13Z" },
    { t: "cheio", d: "M13 11V4.5A6.5 6.5 0 0 1 19.5 11Z", papel: "r" },
  ],
  // Saúde — the cross.
  saude: [
    {
      t: "cheio",
      d: "M10.5 4.75h3a1.25 1.25 0 0 1 1.25 1.25v3.75H18.5a1.25 1.25 0 0 1 1.25 1.25v2a1.25 1.25 0 0 1-1.25 1.25h-3.75V18a1.25 1.25 0 0 1-1.25 1.25h-3A1.25 1.25 0 0 1 9.25 18v-3.75H5.5A1.25 1.25 0 0 1 4.25 13v-2A1.25 1.25 0 0 1 5.5 9.75h3.75V6a1.25 1.25 0 0 1 1.25-1.25Z",
      papel: "r",
    },
  ],
  // Validador QR — the scan frame and the reading line.
  qr: [
    { t: "traco", d: "M5 9V7a2 2 0 0 1 2-2h2M15 5h2a2 2 0 0 1 2 2v2M19 15v2a2 2 0 0 1-2 2h-2M9 19H7a2 2 0 0 1-2-2v-2" },
    { t: "traco", d: "M8 12h8", papel: "r" },
  ],
  // Servidores e DNS — two stacked servers, each with its light.
  dns: [
    { t: "cheio", d: "M6.5 4.5h11a1.75 1.75 0 0 1 1.75 1.75v2.75a1.75 1.75 0 0 1-1.75 1.75h-11A1.75 1.75 0 0 1 4.75 9V6.25A1.75 1.75 0 0 1 6.5 4.5Z" },
    { t: "cheio", d: "M6.5 13.25h11a1.75 1.75 0 0 1 1.75 1.75v2.75a1.75 1.75 0 0 1-1.75 1.75h-11a1.75 1.75 0 0 1-1.75-1.75V15a1.75 1.75 0 0 1 1.75-1.75Z", papel: "s" },
    { t: "circulo", x: 8.75, y: 7.625, r: 1.5, papel: "k" },
    { t: "circulo", x: 8.75, y: 16.375, r: 1.5, papel: "k" },
  ],
  // Assistente — a speech bubble with the spark.
  assistente: [
    { t: "traco", d: "M7 5h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-6.5L7 19v-3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" },
    { t: "cheio", d: "M12 7.25q.5 2.75 3.25 3.25-2.75.5-3.25 3.25-.5-2.75-3.25-3.25 2.75-.5 3.25-3.25Z", papel: "r" },
  ],
  // Protocolos — two linked rings: two parties, one agreement.
  protocolos: [
    { t: "circulo", x: 9.25, y: 12, r: 4.5, traco: true },
    { t: "circulo", x: 14.75, y: 12, r: 4.5, traco: true, papel: "r" },
  ],
  // Monitorização — the pulse and the dot that watches it.
  monitor: [
    { t: "traco", d: "M4.75 13h2.75l2-5 3.5 9 2-5.5h1" },
    { t: "circulo", x: 18.25, y: 11.5, r: 1.9, papel: "r" },
  ],
  // Cartão Digital — an ID card: photo and two lines.
  cartao: [
    { t: "traco", d: "M6.5 6.5h11a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" },
    { t: "circulo", x: 9, y: 12, r: 2.1, papel: "r" },
    { t: "traco", d: "M13.25 10.5h3M13.25 13.5h3", papel: "s" },
  ],
};

/**
 * The standalone SVG of an app icon (favicon, home screen). `mascaravel`:
 * full-bleed square with the glyph shrunk into the safe zone (Android
 * maskable icons); otherwise the «folha» on a transparent background.
 */
export function svgIconeApp(app: MutualAppId, { mascaravel = false }: { mascaravel?: boolean | undefined } = {}): string {
  const cor = COR_MARCA_APP[app];
  const pinta = (papel: PapelGlifo | undefined) => (papel === "k" ? cor : "#ffffff");
  const opaco = (papel: PapelGlifo | undefined) => (papel === "s" ? ' opacity="0.72"' : "");
  const formas = GLIFOS_APPS[app]
    .map((f) => {
      const c = pinta(f.papel);
      const o = opaco(f.papel);
      if (f.t === "circulo") {
        return f.traco
          ? `<circle cx="${f.x}" cy="${f.y}" r="${f.r}" fill="none" stroke="${c}" stroke-width="2"${o}/>`
          : `<circle cx="${f.x}" cy="${f.y}" r="${f.r}" fill="${c}"${o}/>`;
      }
      return f.t === "traco"
        ? `<path d="${f.d}" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${o}/>`
        : `<path d="${f.d}" fill="${c}"${o}/>`;
    })
    .join("");
  const base = mascaravel ? `<rect width="24" height="24" fill="${cor}"/>` : `<path d="${BASE_ICONE}" fill="${cor}"/>`;
  const glifo = mascaravel ? `<g transform="translate(12 12) scale(0.78) translate(-12 -12)">${formas}</g>` : formas;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${base}${glifo}</svg>`;
}
