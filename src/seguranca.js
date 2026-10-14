// JavaScript (com os tipos em seguranca.d.ts), não TypeScript: o `next.config.mjs`
// das apps importa este ficheiro com o Node, que não tira tipos em node_modules.
/** Cabeçalhos de segurança de todas as apps: a origem é partilhada (ADR 0004), logo um XSS vale a sessão de todas; cada app só acrescenta (`PermissoesCsp`), nunca afrouxa. */
/** «Letra legível» do menu Acessibilidade: carregada só quando a pessoa a escolhe. */
const GOOGLE_FONTS = {
    style: "https://fonts.googleapis.com",
    font: "https://fonts.gstatic.com",
};
export const NONCE_CABECALHO = "x-nonce";
/** Nonce de 128 bits, em base64, novo em cada pedido. */
export function gerarNonce() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    let bin = "";
    for (const b of bytes)
        bin += String.fromCharCode(b);
    return btoa(bin);
}
const junta = (...partes) => partes
    .flat()
    .filter((p) => typeof p === "string" && p.length > 0)
    .join(" ");
/** `'unsafe-inline'` nos estilos: Base UI e os gráficos usam `style`, que um nonce não cobre. */
export function politicaCsp({ nonce, dev = false, permissoes = {} }) {
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
/** Para o `proxy.ts`: o Next tira o nonce da CSP do pedido para os seus scripts. */
export function comCsp(cabecalhos, opcoes) {
    const nonce = gerarNonce();
    const csp = politicaCsp({ ...opcoes, nonce });
    const cabecalhosPedido = new Headers(cabecalhos);
    cabecalhosPedido.set(NONCE_CABECALHO, nonce);
    cabecalhosPedido.set("Content-Security-Policy", csp);
    return { nonce, csp, cabecalhosPedido };
}
const FUNCIONALIDADES = [
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
const origemPermissao = (o) => (o === "self" || o === "*" ? o : `"${o}"`);
export function politicaPermissoes(funcionalidades = {}) {
    const nomes = new Set([
        ...FUNCIONALIDADES,
        ...Object.keys(funcionalidades),
    ]);
    return [...nomes]
        .map((f) => `${f}=(${(funcionalidades[f] ?? []).map(origemPermissao).join(" ")})`)
        .join(", ");
}
export function cabecalhosSeguranca(opcoes) {
    const c = {
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": politicaPermissoes(opcoes.funcionalidades),
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Resource-Policy": "same-origin",
        "X-Frame-Options": opcoes.enquadrar === "mesma-origem" ? "SAMEORIGIN" : "DENY",
        "Origin-Agent-Cluster": "?1",
    };
    if (opcoes.producao)
        c["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains";
    return c;
}
export function cabecalhosNext(opcoes) {
    return [
        {
            source: "/:path*",
            headers: Object.entries(cabecalhosSeguranca(opcoes)).map(([key, value]) => ({ key, value })),
        },
    ];
}
