# MUTU@L UI (`@umporg/ui`) — AGENTS.md

> Single source of truth for AI coding agents. `CLAUDE.md` imports this file.

The shared design system of the MUTU@L ecosystem: design tokens, brand
(logo, wordmark, app marks), shell pieces (app switcher, page header,
status callouts, empty states) and the single-sign-on contract.

Public GitHub repo `UMPORG/mutual_ui`, consumed as a **git dependency** (no
npm publishing):

```jsonc
// package.json of an app
"@umporg/ui": "github:UMPORG/mutual_ui#v0.1.0"
```

```js
// next.config.mjs
transpilePackages: ["@umporg/ui"],
```

```css
/* app/globals.css — tokens replace the app's own :root/.dark colour blocks */
@import "tailwindcss";
@import "@umporg/ui/css/index.css";
```

```tsx
// app/layout.tsx — the app identity
<html lang="pt-PT" data-app="eventos">
```

Release = bump `version`, commit, `git tag vX.Y.Z`, push the tag, then bump
the `#vX.Y.Z` ref in each app and regenerate its lockfile. Apps never pin a
branch.

## Identidade visual v2 (2026-09-25) — replaces `mutual_meta/docs/identidade-visual.md` v1

1. **One brand.** Every app shares the neutrals, the MUTU@L green (`--brand`
   `#1f6f36`, from the flag, 6.2:1 on white) as `--primary`, the type (Geist),
   the radius, the shadows and the status colours. Primary buttons, links and
   focus rings are brand green in every app.
2. **Each app stays recognisable** by its accent (`--app-accent`, set by
   `data-app` on `<html>`): its mark, the app name under the wordmark, the
   active navigation indicator, its Portal tile. Never for primary buttons or
   for status.

   | App | Accent (light) | Accent on ink / dark |
   | --- | --- | --- |
   | Portal, Cartão | brand `#1f6f36` | `#7cc97a` |
   | Backoffice | `#1d4ed8` | `#93b4fb` |
   | Eventos | `#6d28d9` | `#c4a8f7` |
   | Simplex | `#b45309` | `#f5b76a` |
   | Validador QR | `#0e7490` | `#7fd3e6` |
   | Saúde | `#be185d` (was teal — collided with the Associação role) | `#f59ac2` |

3. **Role colours** (`--role-accent`, via `data-role`) are unchanged:
   admin `#881337`, associação `#0f766e`, equipa de eventos `#3730a3`, plus
   saúde roles `#9d174d`. Shown only on the signed-in user's role badge.
4. **Status is semantic and shared**: `success`, `warning`, `info`,
   `destructive`, each with `-soft` / `-soft-foreground` pairs. No raw palette
   classes (`bg-green-100`, `text-amber-700`…) for status. Status is always
   icon + words, never colour alone.
5. **The desk shell is dark "MUTU@L ink"** (`--sidebar` `#12241a`) in both
   themes, with `MutualWordmark tone="ink"` at the top and `AppSwitcher`
   right under it.

## One family, shells per audience

Same anatomy everywhere (wordmark → app switcher → navigation → user card at
the bottom; page = `PageHeader` + content), adapted to who uses the app:

| App | Audience | Shell |
| --- | --- | --- |
| Portal | UMP and association teams | Gateway: light header with wordmark and user menu; login; launcher grid of the apps the role can use. |
| Backoffice | UMP admin services, association leaders | Desk shell: ink sidebar, grouped navigation, tables first. |
| Simplex | Treasurers, accountants, boards | Desk shell; forms and financial maps are the page, sticky action bar. |
| Saúde | Receptionists, health professionals, clinic managers | Desk shell with a unit selector in the top bar; Balcão is the home for receção; responsive navigation (tablets). |
| Eventos (gestão) | Organisers | Desk shell; one event workspace with tabs. |
| Eventos (público) | Associates and the public | Public site: light header (wordmark, Ajuda, Acessibilidade), large imagery, one clear call to action per page, footer with UMP identity. |
| Validador QR | Staff at the door / counter | Full-screen tool: compact header with wordmark, big result states, no navigation. |

## UX rules for every app

- pt-PT, formal register ("o senhor/a senhora" implied; imperative "Indique",
  "Guarde"). No abbreviations in navigation. No English words in UI
  ("scans" → "leituras").
- Base text 16px; secondary text ≥ 14px; targets ≥ 44px (48px in primary
  flows).
- Never show raw enum values or ISO dates; map them to words and
  `dd/MM/yyyy` / "sábado, 3 de outubro de 2026".
- Things the user must not miss (errors of their own action, results) are
  persistent `StatusCallout`s, not toasts. Toasts only confirm.
- Destructive actions: one confirmation dialog pattern, verb "Eliminar", and
  undo where the action is reversible.
- No single-key global shortcuts (WCAG 2.1.4) — e.g. the old `d` theme key.
- Theme: one control (in the user menu), values Sistema / Claro / Escuro.

## Single sign-on (see `src/sso.ts`)

- The Portal hosts the only login (`/login`) and logout (`/sair`).
- Apps redirect a missing session to `portalLoginUrl(PORTAL_URL, publicRequestUrl(req.url, APP_URL), "sem-sessao")`.
- An app refusing a role shows its own `/sem-acesso` page with a link to the
  Portal — it never calls `signOut()`.
- Logout: `signOut()` then `location.href = portalAfterLogoutUrl(PORTAL_URL)`.
- Cross-app links go through `portalAppUrl(PORTAL_URL, app)` (`/ir/<app>`).
- The Portal validates `next` with `safeReturnUrl(next, allowedAppOrigins)`.

## Scripts

```bash
pnpm install
pnpm typecheck
pnpm test        # node --test, SSO helpers
pnpm embed-logo  # regenerate src/logo-data.ts from assets/mutual-flag-96.webp
```
