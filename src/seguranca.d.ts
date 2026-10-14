/** Cabeçalhos de segurança de todas as apps: a origem é partilhada (ADR 0004), logo um XSS vale a sessão de todas; cada app só acrescenta (`PermissoesCsp`), nunca afrouxa. */
export interface PermissoesCsp {
    readonly script?: readonly string[];
    readonly connect?: readonly string[];
    readonly img?: readonly string[];
    readonly style?: readonly string[];
    readonly font?: readonly string[];
    readonly frame?: readonly string[];
    readonly worker?: readonly string[];
    readonly media?: readonly string[];
    /** Quem pode enquadrar a app (omissão: ninguém — `frame-ancestors 'none'`). */
    readonly frameAncestors?: readonly string[];
}
export declare const NONCE_CABECALHO = "x-nonce";
/** Nonce de 128 bits, em base64, novo em cada pedido. */
export declare function gerarNonce(): string;
export interface OpcoesCsp {
    readonly nonce: string;
    /** `next dev`: o React precisa de `eval` e o HMR de WebSocket. Nunca em produção. */
    readonly dev?: boolean;
    readonly permissoes?: PermissoesCsp;
}
/** `'unsafe-inline'` nos estilos: Base UI e os gráficos usam `style`, que um nonce não cobre. */
export declare function politicaCsp({ nonce, dev, permissoes }: OpcoesCsp): string;
/** Para o `proxy.ts`: o Next tira o nonce da CSP do pedido para os seus scripts. */
export declare function comCsp(cabecalhos: Headers, opcoes: Omit<OpcoesCsp, "nonce">): {
    nonce: string;
    csp: string;
    cabecalhosPedido: Headers;
};
export type Funcionalidade = "camera" | "microphone" | "geolocation" | "payment" | "usb" | "serial" | "bluetooth" | "midi" | "magnetometer" | "gyroscope" | "accelerometer" | "display-capture" | "fullscreen" | "clipboard-write" | "publickey-credentials-get" | "screen-wake-lock";
export interface OpcoesCabecalhos {
/** Produção (HTTPS): HSTS; o browser ignora-o em http local. */
    readonly producao: boolean;
    readonly funcionalidades?: Partial<Record<Funcionalidade, readonly string[]>>;
    /** Só `'self'` quando a própria origem precisa de enquadrar a app (omissão: DENY). */
    readonly enquadrar?: "ninguem" | "mesma-origem";
}
export declare function politicaPermissoes(funcionalidades?: OpcoesCabecalhos["funcionalidades"]): string;
export declare function cabecalhosSeguranca(opcoes: OpcoesCabecalhos): Record<string, string>;
export declare function cabecalhosNext(opcoes: OpcoesCabecalhos): {
    source: string;
    headers: {
        key: string;
        value: string;
    }[];
}[];
