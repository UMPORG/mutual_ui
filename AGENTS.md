# MUTU@L UI (`@umporg/ui`) — AGENTS.md

> Single source of truth for AI coding agents. `CLAUDE.md` imports this file.

The shared design system of the MUTU@L ecosystem: design tokens, brand
(logo, wordmark, app marks), shell pieces (app switcher, page header,
status callouts, empty states) and the single-sign-on contract.

Public GitHub repo `UMPORG/mutual_ui`, consumed as a **git dependency** (no
npm publishing):

```jsonc
// package.json of an app
"@umporg/ui": "github:UMPORG/mutual_ui#v0.5.1"
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

## Identidade visual v2 (2026-09-25) — full rationale in [docs/identidade-visual.md](docs/identidade-visual.md)

This repo is the home of the visual identity (the former `mutual_meta`
workspace was retired on 2026-09-25).

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

## v0.2 — Acessibilidade, profundidade, fundo animado, texto de produção

### Acessibilidade (one menu, whole system)

- Root layout: `<html lang="pt-PT" data-app="<id>" suppressHydrationWarning>`
  and `<PreferenciasScript />` inside `<head>`. **Remove `next-themes`** (and
  every local theme toggle, theme page and `d` hotkey): the theme is one of
  the Acessibilidade choices (Automático / Claro / Escuro / Alto contraste).
- Put `<AcessibilidadeMenu />`
  where people always see it: the public header (Eventos, Portal, QR), the
  desk shell's sidebar footer or top bar (`tone="ink"` on the dark sidebar),
  and the mobile top bar (`compacto`). Link `declaracaoHref` to the app's
  accessibility statement when it has one.
- The choices follow the person across apps because every app shares one
  origin (ADR 0004) — no cookie-domain setting.
- Never hard-code light-only colours: everything must work in Claro, Escuro,
  Alto contraste, at 150% text and with Espaçamento amplo (no clipped text,
  no overlapping, no horizontal scroll at 390px).

### Profundidade (less flat)

- Map the app's Button variants onto the shared classes:
  `default` → `m-btn m-btn-primary`, `destructive` → `m-btn m-btn-destructive`,
  `outline` → `m-btn m-btn-outline`, `secondary` → `m-btn m-btn-secondary`,
  `ghost` → `m-btn m-btn-ghost` (keep the app's sizes/radius/focus classes).
- Cards and panels: `m-surface` (clickable: add `m-surface-interactive`);
  popovers, menus, dialogs: `m-float`; inputs/selects/textareas: `m-field`;
  page background of shells and public pages: `m-canvas`.
- High contrast flattens all of these automatically.

### Fundo animado (`AsciiFundo`)

- Only on entry and landing surfaces (Portal login and launcher header area,
  Eventos home hero, QR first-visit screen, `/sem-acesso`), never behind work
  screens, tables or forms people fill in daily.
- Always mask the content area (`mascara`) so characters never run behind
  text; keep the default top fade under a header. It pauses when hidden,
  stops with Reduzir movimento and disappears in Alto contraste.

### Tours

- Never start a tour automatically. Offer it with a quiet "Ver como funciona"
  button (page header or help page). No idle hints, no pop-ups on first
  visit, no badges nagging to take a tour.

### Voz e texto (production copy, all of Portugal)

The apps are used in production by the UMP and by associações across the
country. Text is for them, not for us:

- Say what the person gets or must do, never how the system works. Banned in
  UI text: "ecossistema", "SSO", "sessão partilhada", "Cérebro", "API",
  "token", "proxy", "cookie" (except the cookie notice), "sistema de
  design", internal app codes, English words.
- Short, formal pt-PT (tratamento por "você" implícito; imperativos
  "Indique", "Escolha", "Guarde"). One idea per sentence. No exclamation
  marks, no emoji.
- Headlines name the place: "Portal MUTU@L", "Entrar na MUTU@L",
  "Eventos e formações". Sub-lines are optional and ≤ 1 line.
- Examples:
  - "Uma só entrada para as aplicações da UMP e das associações." →
    "Uma só entrada para a MUTU@L."
  - "Entre uma vez e passe de uma aplicação para outra sem voltar a indicar
    a palavra-passe." → remove (it describes mechanics), or "Todas as
    aplicações num só lugar."
  - "Use o email e a palavra-passe da sua conta MUTU@L." → "Indique o seu
    email e palavra-passe."
  - "Acesso reservado às equipas da UMP e das associações. Se ainda não tem
    conta, peça-a aos serviços da UMP." → "Ainda não tem conta? Contacte o
    super administrador da sua organização."
- Help text explains a field's meaning only when it isn't obvious; never
  explain the obvious ("Carregue em Guardar para guardar").

### Modo demonstração (`DemoPreencher`)

The demo environment is used to present MUTU@L to UMP leadership and to
associações. With `DEMO_MODE=true` (server env, runtime; never set in
production) each app renders `<DemoPreencher ativo cenarios={…} />` once in
its root layout:

- Mark every form with `data-demo-form="<id>"` and give each field a `name`.
- Keep the app's catalogue in `lib/demo/cenarios.ts`: for every form at least
  "Dados válidos" and one scenario that shows the form's reaction to a
  problem (validation error, full event, negative amount, expired card…).
  Realistic Portuguese data only (names, NIF with valid check digit, IBAN
  PT50, moradas reais de sedes fictícias) — never real people.
- Non-native widgets (rich text, money cells, comboboxes) register with
  `registarPreenchedor(formId, fn)`.
- The demo seed in the Cérebro (`DEMO_MODE`) provides the matching data.

### `PreferenciasScript` must run before the first paint

Render `<PreferenciasScript />` (a plain inline `<script>`) inside `<head>` of
the **server** root layout, with `suppressHydrationWarning` on `<html>`. Do
NOT use `next/script` (`beforeInteractive` runs only once Next's JavaScript
starts, so dark/high-contrast/large-text users see the default theme flash on
slow connections). React may print a development-only notice about the
inline script; it has no effect in production.

## v0.4 — access comes from profiles, not roles (breaking)

- `MUTUAL_APPS[i].roles` is gone; `publica: boolean` says whether an app
  needs no login. `canUseApp`, `ROLE_LABELS` and `roleLabel` are gone.
- `AppSwitcher` takes `disponiveis` = the app ids whose `apps.<id>` is not
  null in `GET /api/v1/acessos/eu` (public apps are always listed).
- Show the person's **profile name** (`apps.<app>.nome`) and organisation in
  user cards and badges, never a login role.

## Um só endereço, subcaminhos (ADR 0004) — v0.5 (breaking)

All apps live on ONE origin (`MUTUAL_URL`, production
`https://mutual.mutualismo.pt`) at fixed paths (`CAMINHOS`): Portal `/`,
`/backoffice`, `/eventos` (public site; organisers at `/eventos/gestao`),
`/simplex`, `/saude`, `/qr`, Cérebro `/api`, help centre `/ajuda`. No
sub-domains. The Cartão Digital keeps its own host.

- Next apps set `basePath` to their path (Portal: none). Browsers call the
  Cérebro at `/api/v1` and `/api/auth` on the same origin — no rewrites, no
  build-time `CEREBRO_URL`. Server code uses `CEREBRO_URL_INTERNO` (optional)
  or `${MUTUAL_URL}/api`.
- Session and preference cookies are host-only. There is no cookie domain,
  `PORTAL_URL`, `APP_URL` or `PORTAL_*_URL`.
- Login: `portalLoginUrl(caminhoDoPedido(request.url), "sem-sessao")` (a
  relative `/login?next=…`); `safeReturnUrl` accepts same-origin paths only;
  logout → `portalAfterLogoutUrl()`.
- Emails and other out-of-band links: `urlAbsoluta(MUTUAL_URL, caminho)`.
- "No access": render `<SemAcesso app motivo utilizador organizacao
  variasOrganizacoes acaoSair />` — the same page and wording everywhere.
- `localStorage` keys must be prefixed per app (`<app>.`): all apps share
  the origin.

## Scripts

```bash
pnpm install
pnpm typecheck
pnpm test        # node --test, SSO helpers
pnpm embed-logo  # regenerate src/logo-data.ts from assets/mutual-flag-96.webp
```
