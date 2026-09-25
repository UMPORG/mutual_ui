/**
 * Single sign-on contract of the MUTU@L ecosystem.
 *
 * - The Portal hosts the only login page (`/login`). Every other app, when it
 *   finds no session, redirects to `${PORTAL_URL}/login?next=<absolute URL>`.
 * - The Cérebro sets one Better Auth session cookie for the parent domain
 *   (`AUTH_COOKIE_DOMAIN`, e.g. `.mutualismo.pt`), so the session made at the
 *   Portal is seen by every app through its own `/api/auth` proxy.
 * - Logging out anywhere ends the session everywhere (one session row).
 * - An app that refuses a role shows its own "sem acesso" page and NEVER
 *   signs the user out (that would sign them out of every app).
 *
 * Pure functions only: safe in proxy.ts (edge), server and client code.
 */

import type { MutualAppId } from "./apps";

export const PORTAL_LOGIN_PATH = "/login";
export const PORTAL_LOGOUT_PATH = "/sair";

export type LoginReason = "sessao-expirada" | "sem-sessao" | "saiu";

function trimSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/** `${portal}/login?next=…&motivo=…` */
export function portalLoginUrl(portalUrl: string, next?: string | null, motivo?: LoginReason): string {
  const u = new URL(trimSlash(portalUrl) + PORTAL_LOGIN_PATH);
  if (next) u.searchParams.set("next", next);
  if (motivo) u.searchParams.set("motivo", motivo);
  return u.toString();
}

/** Where an app sends the user after signing out: the Portal login. */
export function portalAfterLogoutUrl(portalUrl: string): string {
  return portalLoginUrl(portalUrl, null, "saiu");
}

/** Link that opens another app through the Portal (it knows every URL). */
export function portalAppUrl(portalUrl: string, app: MutualAppId): string {
  return app === "portal" ? trimSlash(portalUrl) + "/" : `${trimSlash(portalUrl)}/ir/${app}`;
}

/**
 * The public URL of the current request. Behind Coolify/Traefik
 * `request.url` can carry the container host, so apps pass their public
 * origin (`APP_URL`) and we keep only path + query from the request.
 */
export function publicRequestUrl(requestUrl: string, appUrl?: string | null): string {
  const req = new URL(requestUrl);
  if (!appUrl) return req.toString();
  return trimSlash(appUrl) + req.pathname + req.search;
}

/**
 * Validates a `next` return address against the allowed app origins.
 * Accepts only absolute http(s) URLs whose origin is in the list, or a
 * same-site relative path (starting with a single "/"). Anything else → null.
 */
export function safeReturnUrl(next: string | null | undefined, allowedOrigins: readonly string[]): string | null {
  if (!next || next.length > 2048) return null;
  // URL parsers strip tabs/newlines and trim spaces, so "/\t/evil.pt" would
  // become "//evil.pt" in the browser. Refuse any control char or whitespace.
  if (/[\u0000-\u001f\u007f\s]/.test(next)) return null;
  if (next.startsWith("/")) {
    // Resolve against a sentinel origin: a real same-site path stays on it.
    const base = "https://same-site.invalid";
    try {
      const r = new URL(next, base);
      return r.origin === base ? r.pathname + r.search + r.hash : null;
    } catch {
      return null;
    }
  }
  let u: URL;
  try {
    u = new URL(next);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  // "https://evil@app/" goes to the app but reads like another site.
  if (u.username || u.password) return null;
  const allowed = new Set(allowedOrigins.map((o) => {
    try { return new URL(o).origin; } catch { return null; }
  }).filter(Boolean));
  return allowed.has(u.origin) ? u.toString() : null;
}
