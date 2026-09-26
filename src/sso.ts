/**
 * Single sign-on and addresses of the MUTU@L apps (ADR 0004: one host,
 * sub-paths, no sub-domains).
 *
 * Every app lives under the same origin (`MUTUAL_URL`, e.g.
 * https://mutual.mutualismo.pt) at a fixed path (`CAMINHOS`). The session
 * cookie is host-only, so it is shared by every app with no domain setting.
 *
 * - The Portal (`/`) hosts the only login (`/login`) and logout (`/sair`).
 *   An app with no session redirects to `portalLoginUrl(returnPath)`.
 * - An app that refuses a profile shows its own "sem acesso" page and NEVER
 *   signs the user out (that would sign them out of every app).
 * - Browsers call the Cérebro directly at `/api/v1/*` and `/api/auth/*`.
 *
 * Pure functions only: safe in proxy.ts (edge), server and client code.
 */

import type { AppNoEndereco } from "./apps";

/** Fixed path of each service under `MUTUAL_URL`. */
export const CAMINHOS = {
  portal: "/",
  backoffice: "/backoffice",
  eventos: "/eventos",
  simplex: "/simplex",
  saude: "/saude",
  qr: "/qr",
  dns: "/dns",
  ajuda: "/ajuda",
  api: "/api",
} as const satisfies Record<AppNoEndereco | "ajuda" | "api", string>;

export const PORTAL_LOGIN_PATH = "/login";
export const PORTAL_LOGOUT_PATH = "/sair";

export type LoginReason = "sessao-expirada" | "sem-sessao" | "saiu";

/** `/login?next=…&motivo=…` (same origin as every app). */
export function portalLoginUrl(next?: string | null, motivo?: LoginReason): string {
  const params = new URLSearchParams();
  const destino = safeReturnUrl(next);
  if (destino) params.set("next", destino);
  if (motivo) params.set("motivo", motivo);
  const q = params.toString();
  return q ? `${PORTAL_LOGIN_PATH}?${q}` : PORTAL_LOGIN_PATH;
}

/** Where an app sends the user after signing out: the Portal login. */
export function portalAfterLogoutUrl(): string {
  return portalLoginUrl(null, "saiu");
}

/** Link that opens an app (or the Portal home). */
export function caminhoApp(app: AppNoEndereco): string {
  return CAMINHOS[app];
}

/**
 * The path (+ query) of the current request, to use as the return address.
 * Next's `request.nextUrl.pathname` omits the basePath, so apps pass the raw
 * `request.url` (which includes it).
 */
export function caminhoDoPedido(requestUrl: string): string {
  const u = new URL(requestUrl);
  return u.pathname + u.search;
}

/**
 * Validates a `next` return address: only a same-origin path (starting with a
 * single "/"), with no control characters, resolved and normalised. Absolute
 * URLs are refused — every app lives on the same origin (ADR 0004).
 */
export function safeReturnUrl(next: string | null | undefined): string | null {
  if (!next || next.length > 2048) return null;
  // URL parsers strip tabs/newlines and trim spaces, so "/\t/evil.pt" would
  // become "//evil.pt" in the browser. Refuse any control char or whitespace.
  if (/[\u0000-\u001f\u007f\s]/.test(next)) return null;
  if (!next.startsWith("/")) return null;
  const base = "https://same-site.invalid";
  try {
    const r = new URL(next, base);
    return r.origin === base ? r.pathname + r.search + r.hash : null;
  } catch {
    return null;
  }
}

/** Absolute URL for emails and other out-of-band links: `MUTUAL_URL` + path. */
export function urlAbsoluta(mutualUrl: string, caminho: string): string {
  return mutualUrl.replace(/\/+$/, "") + (caminho.startsWith("/") ? caminho : `/${caminho}`);
}
