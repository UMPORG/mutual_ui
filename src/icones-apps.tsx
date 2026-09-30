import type { ReactNode } from "react";
import { nomeDaApp, type MutualAppId } from "./apps";
import { cx } from "./cx";

/**
 * PRÉ-VISUALIZAÇÃO (ramo icones-preview) — família de ícones MUTU@L.
 *
 * Um só grid de 24 unidades para todas as apps (inspirado no método de
 * Google Workspace e Proton — base comum, glifo próprio — mas com desenhos
 * ORIGINAIS):
 * - base «folha»: quadrado com cantos alternados (7 / 2,5 unidades), a
 *   assinatura da família;
 * - área viva 4,5–19,5 (62 % da base, legível a 16 px);
 * - traço 2 unidades, pontas e junções redondas; formas ≥ 2,5 unidades e
 *   intervalos ≥ 1,5 unidades;
 * - cada glifo tem papéis: `p` (a forma que diz o que é), `r` (o destaque),
 *   `s` (secundário, decorativo) e `k` (recorte da cor da base).
 *
 * As cores vêm de css/icones.css (variáveis), por isso o tema escuro e as
 * cores forçadas (monocromático) são só CSS:
 * - direção "a": a base na cor da app (`--app-marca`), glifo branco;
 * - direção "b": base neutra, glifo na paleta da marca (verde da bandeira,
 *   vermelho da bandeira, verde claro) — multi-tom à maneira da Google.
 */
export type DirecaoIcone = "a" | "b";

const BASE = "M7 0H21.5A2.5 2.5 0 0 1 24 2.5V17A7 7 0 0 1 17 24H2.5A2.5 2.5 0 0 1 0 21.5V7A7 7 0 0 1 7 0Z";

type Papel = "p" | "r" | "s" | "k";
const T = ({ d, papel = "p" }: { d: string; papel?: Papel }) => <path d={d} className={`m-ic-${papel} m-ic-traco`} />;
const F = ({ d, papel = "p" }: { d: string; papel?: Papel }) => <path d={d} className={`m-ic-${papel} m-ic-cheio`} />;
const C = ({ x, y, r, papel = "p", traco = false }: { x: number; y: number; r: number; papel?: Papel; traco?: boolean }) => (
  <circle cx={x} cy={y} r={r} className={`m-ic-${papel} ${traco ? "m-ic-traco" : "m-ic-cheio"}`} />
);

export const GLIFOS_APPS: Record<MutualAppId, ReactNode> = {
  // Portal — a porta de entrada: arco com a porta aberta e o chão.
  portal: (
    <>
      <T d="M7.5 18.5V11a4.5 4.5 0 0 1 9 0v7.5" />
      <F d="M10.5 18.5v-5.25a1.5 1.5 0 0 1 3 0v5.25Z" papel="r" />
      <T d="M5 19.25h14" papel="s" />
    </>
  ),
  // Backoffice — a instituição: frontão, três colunas, base.
  backoffice: (
    <>
      <F d="M12 4.5l7.25 4.75H4.75Z" papel="r" />
      <T d="M7.5 12v4M12 12v4M16.5 12v4" />
      <T d="M5 19h14" papel="s" />
    </>
  ),
  // Eventos — calendário com argolas e o dia marcado.
  eventos: (
    <>
      <T d="M7.5 7h9a2.5 2.5 0 0 1 2.5 2.5v7a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 16.5v-7A2.5 2.5 0 0 1 7.5 7Z" />
      <F d="M4 10.5V9.5A3.5 3.5 0 0 1 7.5 6h9A3.5 3.5 0 0 1 20 9.5v1Z" />
      <T d="M9 4.25v2.5M15 4.25v2.5" />
      <C x={15} y={15} r={1.9} papel="r" />
    </>
  ),
  // Simplex — as contas: gráfico circular com uma fatia destacada.
  simplex: (
    <>
      <F d="M11 13V6.5A6.5 6.5 0 1 0 17.5 13Z" />
      <F d="M13 11V4.5A6.5 6.5 0 0 1 19.5 11Z" papel="r" />
    </>
  ),
  // Saúde — a cruz.
  saude: <F d="M10.5 4.75h3a1.25 1.25 0 0 1 1.25 1.25v3.75H18.5a1.25 1.25 0 0 1 1.25 1.25v2a1.25 1.25 0 0 1-1.25 1.25h-3.75V18a1.25 1.25 0 0 1-1.25 1.25h-3A1.25 1.25 0 0 1 9.25 18v-3.75H5.5A1.25 1.25 0 0 1 4.25 13v-2A1.25 1.25 0 0 1 5.5 9.75h3.75V6a1.25 1.25 0 0 1 1.25-1.25Z" papel="r" />,
  // Validador QR — moldura de leitura e a linha que lê.
  qr: (
    <>
      <T d="M5 9V7a2 2 0 0 1 2-2h2M15 5h2a2 2 0 0 1 2 2v2M19 15v2a2 2 0 0 1-2 2h-2M9 19H7a2 2 0 0 1-2-2v-2" />
      <T d="M8 12h8" papel="r" />
    </>
  ),
  // Servidores e DNS — dois servidores empilhados, com a luz de cada um.
  dns: (
    <>
      <F d="M6.5 4.5h11a1.75 1.75 0 0 1 1.75 1.75v2.75a1.75 1.75 0 0 1-1.75 1.75h-11A1.75 1.75 0 0 1 4.75 9V6.25A1.75 1.75 0 0 1 6.5 4.5Z" />
      <F d="M6.5 13.25h11a1.75 1.75 0 0 1 1.75 1.75v2.75a1.75 1.75 0 0 1-1.75 1.75h-11a1.75 1.75 0 0 1-1.75-1.75V15a1.75 1.75 0 0 1 1.75-1.75Z" papel="s" />
      <C x={8.75} y={7.625} r={1.5} papel="k" />
      <C x={8.75} y={16.375} r={1.5} papel="k" />
    </>
  ),
  // Assistente — balão de conversa com a centelha.
  assistente: (
    <>
      <T d="M7 5h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-6.5L7 19v-3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      <F d="M12 7.25q.5 2.75 3.25 3.25-2.75.5-3.25 3.25-.5-2.75-3.25-3.25 2.75-.5 3.25-3.25Z" papel="r" />
    </>
  ),
  // Protocolos — dois anéis entrelaçados: duas partes, um acordo.
  protocolos: (
    <>
      <C x={9.25} y={12} r={4.5} traco />
      <C x={14.75} y={12} r={4.5} traco papel="r" />
    </>
  ),
  // Monitorização — o pulso e o ponto que o vigia.
  monitor: (
    <>
      <T d="M4.75 13h2.75l2-5 3.5 9 2-5.5h1" />
      <C x={18.25} y={11.5} r={1.9} papel="r" />
    </>
  ),
  // Cartão Digital — cartão de identificação: foto e duas linhas.
  cartao: (
    <>
      <T d="M6.5 6.5h11a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" />
      <C x={9} y={12} r={2.1} papel="r" />
      <T d="M13.25 10.5h3M13.25 13.5h3" papel="s" />
    </>
  ),
};

/**
 * O ícone de uma app MUTU@L (pré-visualização). Decorativo por omissão (o
 * nome da app está ao lado); `titulo` dá-lhe um nome acessível.
 */
export function IconeApp({
  app,
  direcao = "a",
  tamanho = 24,
  titulo,
  className,
}: {
  app: MutualAppId;
  direcao?: DirecaoIcone | undefined;
  tamanho?: number | undefined;
  /** `true` = o nome da app; texto = esse nome. */
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
      data-direcao={direcao}
      className={cx("m-icone-app", className)}
      role={nome ? "img" : undefined}
      aria-label={nome}
      aria-hidden={nome ? undefined : true}
      focusable="false"
    >
      <path d={BASE} className="m-ic-base" />
      {GLIFOS_APPS[app]}
    </svg>
  );
}

/** O botão «waffle» de nove pontos (3 × 3), desenhado na mesma grelha. */
export function IconeWaffle({ tamanho = 24 }: { tamanho?: number | undefined }) {
  const pontos: ReactNode[] = [];
  for (const y of [5, 12, 19]) for (const x of [5, 12, 19]) pontos.push(<circle key={`${x}-${y}`} cx={x} cy={y} r={2.1} />);
  return (
    <svg viewBox="0 0 24 24" width={tamanho} height={tamanho} fill="currentColor" aria-hidden focusable="false">
      {pontos}
    </svg>
  );
}
