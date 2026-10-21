/** One origin (`MUTUAL_URL`), fixed paths (`CAMINHOS`) and a host-only session cookie shared by every app (ADR 0004). An app that refuses a profile NEVER signs out: that would end every app's session. Pure: safe in proxy.ts (edge). */

import type { AppNoEndereco } from "./apps";

export const CAMINHOS = {
  portal: "/",
  backoffice: "/backoffice",
  eventos: "/eventos",
  simplex: "/simplex",
  saude: "/saude",
  qr: "/qr",
  dns: "/dns",
  assistente: "/assistente",
  protocolos: "/protocolos",
  monitor: "/monitor",
  carta: "/carta",
  comunicacao: "/comunicacao",
  ajuda: "/ajuda",
  api: "/api",
} as const satisfies Record<AppNoEndereco | "ajuda" | "api", string>;

export const PORTAL_LOGIN_PATH = "/login";
export const PORTAL_LOGOUT_PATH = "/sair";

export type LoginReason = "sessao-expirada" | "sem-sessao" | "saiu";

export function portalLoginUrl(next?: string | null, motivo?: LoginReason): string {
  const params = new URLSearchParams();
  const destino = safeReturnUrl(next);
  if (destino) params.set("next", destino);
  if (motivo) params.set("motivo", motivo);
  const q = params.toString();
  return q ? `${PORTAL_LOGIN_PATH}?${q}` : PORTAL_LOGIN_PATH;
}

export function portalAfterLogoutUrl(): string {
  return portalLoginUrl(null, "saiu");
}

export function caminhoApp(app: AppNoEndereco): string {
  return CAMINHOS[app];
}

/** Apps pass the raw `request.url`: `nextUrl.pathname` omits the basePath. */
export function caminhoDoPedido(requestUrl: string): string {
  const u = new URL(requestUrl);
  return u.pathname + u.search;
}

/** Only a same-origin path is accepted; absolute URLs are refused. */
export function safeReturnUrl(next: string | null | undefined): string | null {
  if (!next || next.length > 2048) return null;
  // URL parsers strip tabs/newlines and trim spaces, so "/\t/evil.pt" would
  // become "//evil.pt" in the browser. Refuse any control char or whitespace.
  if (/[\u0000-\u001f\u007f\s]/.test(next)) return null;
  if (!next.startsWith("/")) return null;
  // Browsers read «\» as «/» in a path: «/\evil.pt» would leave the site.
  if (next.includes("\\")) return null;
  const base = "https://same-site.invalid";
  try {
    const r = new URL(next, base);
    if (r.origin !== base) return null;
    const destino = r.pathname + r.search + r.hash;
    // The NORMALISED path must still be one path on this site: «/..//evil.pt» normalises to
    // «//evil.pt», which a browser reads as another host (protocol-relative) — an open redirect.
    return destino.startsWith("//") ? null : destino;
  } catch {
    return null;
  }
}

/** The only app on its own host (ADR 0004 exception); its sessions never mix with staff ones. */
export const CARTAO_URL_PRODUCAO = "https://id.mutualismo.pt";

export function urlCartao(base: string = CARTAO_URL_PRODUCAO, caminho = "/"): string {
  return urlAbsoluta(base, caminho);
}

export function urlAbsoluta(mutualUrl: string, caminho: string): string {
  return mutualUrl.replace(/\/+$/, "") + (caminho.startsWith("/") ? caminho : `/${caminho}`);
}
