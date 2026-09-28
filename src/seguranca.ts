/**
 * Cabeçalhos de segurança de TODAS as apps MUTU@L (Onda 0, 2026-09-29).
 *
 * As apps dos funcionários partilham UMA origem (ADR 0004): um XSS numa delas
 * vale a sessão de todas. Por isso a política é a mesma em todas e estrita por
 * omissão; cada app só ACRESCENTA o que precisa (`PermissoesCsp`), nunca afrouxa
 * a base.
 *
 * Dois pedaços, porque o Next os aplica em sítios diferentes:
 *
 *   - `cabecalhosSeguranca()` / `cabecalhosNext()` — os cabeçalhos fixos
 *     (nosniff, Referrer-Policy, Permissions-Policy, COOP, CORP, X-Frame-Options,
 *     HSTS em produção), para o `headers()` do `next.config`;
 *   - `comCsp()` — a Content-Security-Policy com um NONCE novo por pedido, para
 *     o `proxy.ts`: o Next lê a CSP do pedido, tira o nonce e põe-no nos seus
 *     scripts; o layout raiz lê `x-nonce` (`NONCE_CABECALHO`) para o
 *     `PreferenciasScript`. Com nonce as páginas têm de ser dinâmicas.
 *
 * Sem dependências do Next: só Web Crypto e `Headers` (servidor Node e Edge).
 */

/** Origens extra que uma app precisa, diretiva a diretiva (só acrescentam). */
export interface PermissoesCsp {
  /** Scripts de outra origem (ex.: Stripe.js no Cartão). */
  readonly script?: readonly string[];
  /** `fetch`/XHR/WebSocket para outra origem. */
  readonly connect?: readonly string[];
  readonly img?: readonly string[];
  readonly style?: readonly string[];
  readonly font?: readonly string[];
  /** iframes que a app mostra (omissão: nenhum). `'self'` para pré-visualizar PDFs próprios. */
  readonly frame?: readonly string[];
  readonly worker?: readonly string[];
  readonly media?: readonly string[];
  /** Quem pode enquadrar a app (omissão: ninguém — `frame-ancestors 'none'`). */
  readonly frameAncestors?: readonly string[];
}

/**
 * «Letra legível» do menu Acessibilidade (todas as apps): folha e ficheiros do
 * Google Fonts, só quando a pessoa a escolhe.
 */
const GOOGLE_FONTS = {
  style: "https://fonts.googleapis.com",
  font: "https://fonts.gstatic.com",
} as const;

/** Cabeçalho do pedido onde o `proxy.ts` deixa o nonce para o layout raiz. */
export const NONCE_CABECALHO = "x-nonce";

/** Nonce de 128 bits, em base64, novo em cada pedido. */
export function gerarNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

const junta = (...partes: (string | readonly string[] | false | undefined)[]): string =>
  partes
    .flat()
    .filter((p): p is string => typeof p === "string" && p.length > 0)
    .join(" ");

export interface OpcoesCsp {
  readonly nonce: string;
  /** `next dev`: o React precisa de `eval` e o HMR de WebSocket. Nunca em produção. */
  readonly dev?: boolean;
  readonly permissoes?: PermissoesCsp;
}

/**
 * A política: scripts só com o nonce do pedido (`'strict-dynamic'` deixa os
 * chunks que esses scripts carregam), nada de `eval` em produção, sem plugins,
 * sem `<base>` alheio, formulários só para a própria origem e ninguém a
 * enquadrar a app. Os estilos mantêm `'unsafe-inline'`: os componentes (Base UI,
 * gráficos) usam atributos `style`, que um nonce não cobre.
 */
export function politicaCsp({ nonce, dev = false, permissoes = {} }: OpcoesCsp): string {
  const p = permissoes;
  return [
    "default-src 'self'",
    `script-src ${junta("'self'", `'nonce-${nonce}'`, "'strict-dynamic'", dev && "'unsafe-eval'", p.script)}`,
    `style-src ${junta("'self'", "'unsafe-inline'", GOOGLE_FONTS.style, p.style)}`,
    `img-src ${junta("'self'", "data:", "blob:", p.img)}`,
    `font-src ${junta("'self'", "data:", GOOGLE_FONTS.font, p.font)}`,
    `connect-src ${junta("'self'", dev && "ws: wss:", p.connect)}`,
    `frame-src ${p.frame?.length ? junta(p.frame) : "'none'"}`,
    `worker-src ${junta("'self'", "blob:", p.worker)}`,
    `media-src ${junta("'self'", "blob:", p.media)}`,
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    `frame-ancestors ${p.frameAncestors?.length ? junta(p.frameAncestors) : "'none'"}`,
  ].join("; ");
}

/**
 * Para o `proxy.ts`: nonce novo + a política + os cabeçalhos do PEDIDO com
 * `x-nonce` e a CSP (é daí que o Next tira o nonce para os seus scripts).
 *
 * ```ts
 * const { csp, cabecalhosPedido } = comCsp(request.headers, { dev, permissoes });
 * const res = NextResponse.next({ request: { headers: cabecalhosPedido } });
 * res.headers.set("Content-Security-Policy", csp);
 * ```
 */
export function comCsp(
  cabecalhos: Headers,
  opcoes: Omit<OpcoesCsp, "nonce">,
): { nonce: string; csp: string; cabecalhosPedido: Headers } {
  const nonce = gerarNonce();
  const csp = politicaCsp({ ...opcoes, nonce });
  const cabecalhosPedido = new Headers(cabecalhos);
  cabecalhosPedido.set(NONCE_CABECALHO, nonce);
  cabecalhosPedido.set("Content-Security-Policy", csp);
  return { nonce, csp, cabecalhosPedido };
}

/** Funcionalidades do browser: todas desligadas, exceto as que a app pede. */
export type Funcionalidade =
  | "camera"
  | "microphone"
  | "geolocation"
  | "payment"
  | "usb"
  | "serial"
  | "bluetooth"
  | "midi"
  | "magnetometer"
  | "gyroscope"
  | "accelerometer"
  | "display-capture"
  | "fullscreen"
  | "clipboard-write"
  | "publickey-credentials-get"
  | "screen-wake-lock";

const FUNCIONALIDADES: readonly Funcionalidade[] = [
  "camera",
  "microphone",
  "geolocation",
  "payment",
  "usb",
  "serial",
  "bluetooth",
  "midi",
  "magnetometer",
  "gyroscope",
  "accelerometer",
  "display-capture",
];

export interface OpcoesCabecalhos {
  /**
   * Produção (HTTPS): envia HSTS (2 anos, subdomínios). Num http local o
   * browser ignora-o, por isso basta `process.env.NODE_ENV === "production"`.
   */
  readonly producao: boolean;
  /**
   * Funcionalidades que a app usa, com as origens (`self` = a própria;
   * ex.: `{ camera: ["self"] }` no leitor QR, `{ payment: ["self", "https://js.stripe.com"] }`).
   */
  readonly funcionalidades?: Partial<Record<Funcionalidade, readonly string[]>>;
  /** Só `'self'` quando a própria origem precisa de enquadrar a app (omissão: DENY). */
  readonly enquadrar?: "ninguem" | "mesma-origem";
}

const origemPermissao = (o: string) => (o === "self" || o === "*" ? o : `"${o}"`);

/** `Permissions-Policy`: a lista fixa desligada + o que a app pede. */
export function politicaPermissoes(
  funcionalidades: OpcoesCabecalhos["funcionalidades"] = {},
): string {
  const nomes = new Set<Funcionalidade>([
    ...FUNCIONALIDADES,
    ...(Object.keys(funcionalidades) as Funcionalidade[]),
  ]);
  return [...nomes]
    .map((f) => `${f}=(${(funcionalidades[f] ?? []).map(origemPermissao).join(" ")})`)
    .join(", ");
}

/** Os cabeçalhos fixos (os mesmos em todas as respostas da app). */
export function cabecalhosSeguranca(opcoes: OpcoesCabecalhos): Record<string, string> {
  const c: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": politicaPermissoes(opcoes.funcionalidades),
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "X-Frame-Options": opcoes.enquadrar === "mesma-origem" ? "SAMEORIGIN" : "DENY",
    "Origin-Agent-Cluster": "?1",
  };
  if (opcoes.producao) c["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains";
  return c;
}

/**
 * O mesmo, no formato do `headers()` do `next.config`:
 * `async headers() { return cabecalhosNext({ producao }); }`.
 */
export function cabecalhosNext(
  opcoes: OpcoesCabecalhos,
): { source: string; headers: { key: string; value: string }[] }[] {
  return [
    {
      source: "/:path*",
      headers: Object.entries(cabecalhosSeguranca(opcoes)).map(([key, value]) => ({ key, value })),
    },
  ];
}
