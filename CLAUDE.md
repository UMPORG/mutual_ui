# MUTU@L UI (`@umporg/ui`)

Design system and shared helpers of every MUTU@L app. The **UI rules below apply to every app** that
uses it. Detail per topic (props, examples): [docs/guia/README.md](docs/guia/README.md) — open only the
topic you need. **Public repo** `UMPORG/mutual_ui`: never commit secrets, credentials or internal hostnames.

## Package

- Consumed as `"@umporg/ui": "github:UMPORG/mutual_ui#vX.Y.Z"` (always a tag). Release = bump
  `package.json` `version`, commit, `git tag vX.Y.Z`, push the tag; apps bump the ref and regenerate the
  lockfile. **No tag for a docs-only change.** Setup in an app: [docs/guia/pacote.md](docs/guia/pacote.md).
- Commands: `pnpm typecheck` (with and without `exactOptionalPropertyTypes`) · `pnpm test` (`node --test`,
  CI sets `TZ=Europe/Lisbon`) · `pnpm icones` (favicons) · `pnpm embed-logo`. Showcase (unpublished review
  page, :5199): see pacote.md. Before push: `pnpm typecheck` + `pnpm test` (no git hook; no lint or format
  script). CI skips commits touching only `**/*.md`/`docs/**`.
- Optional props are `name?: T | undefined` (`tests/tipos-exatos.tsx` fails otherwise); props handed to
  Recharts/Base UI that reject `undefined` go through `opcional()`.
- The main entry never imports Recharts or Base UI: heavy deps sit behind a sub-path + optional peer.
- `src/seguranca.js` and `src/seguranca.d.ts` stay in step (plain JS: `next.config.mjs` imports it).
- New app: checklist in pacote.md (`MUTUAL_APPS`, `CAMINHOS`, tokens, glyph, `pnpm icones`).
- Every visible string is pt-PT production copy; every new component gets a showcase state and, if it
  has logic, a unit test.
- Git: `main` only; `feat:`/`fix:`/`docs:` messages in Portuguese; never force-push or skip hooks;
  commits end with `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.

## Identity

- One brand: `--brand` `#1f6f36` = `--primary` (buttons, links, focus); neutrals, Geist, radius, shadows
  and status colours identical in every app. Content greys are pure neutral, never tinted.
- App colour (`--app-accent`, from `data-app` on `<html>`) ONLY on the frame tint (`--moldura*`), app
  tile, current page icon, current tab underline and Portal tile — never on buttons, links, focus, badges
  or status. Every app is shown by its `IconeApp`, never a Lucide icon on a square.
- Status = `success|warning|info|destructive` (+ `-soft`), always icon + words, never colour alone. No raw
  palette classes (`bg-green-100`…) or hex in apps.
- Surfaces `m-btn m-btn-*`, `m-surface`, `m-float`, `m-field`, `m-canvas` (screens without the shell);
  page title `text-pagina`. Scrollbars are global: never set `scrollbar-width`/`scrollbar-color` in an app.
- **Motion** only from `--movimento-*`/`--curva-*` tokens, opacity/transform only, never hand-set `ms`;
  everything goes instant under Reduzir movimento and `prefers-reduced-motion`.

## Shell G and navigation (every desk app)

- One `AppShell`, no local variants: top bar (tile + «MUTU@L» + app name, search, Ajuda, Acessibilidade,
  launcher, account) → navigation → one neutral content layer. Pages in `.m-pagina`, starting with
  `PageHeader`. Details: [docs/guia/shell.md](docs/guia/shell.md).
- **Actions go in the page header, never in the navigation**: the page's action is the brand-green primary
  button in `PageHeader actions`, only on the pages where it applies.
- Navigation holds destinations only: ≤ 8 in 2–3 groups, exactly one current entry; sub-pages are
  `Separadores` tabs, never a second menu level; other MUTU@L apps are `externo`.
- The top-bar search (`ProcuraApp`) is a **neutral field with a visible border**, never tinted.
- `disponiveis = appsDisponiveis(eu.apps)` (same set as the Portal launcher; Cartão never in it). Show
  the profile name + organisation, never a login role.

## Accessibility floor and copy

- WCAG AA (Alto contraste 7:1). Text 16px (secondary ≥ 14px); targets ≥ 44px (48px in primary flows and
  shell). Works in every theme, at 150% text, with Espaçamento amplo and at 390px (no page scroll sideways).
- One `AcessibilidadeMenu` (theme lives there); no `next-themes`, local toggles or single-key shortcuts.
  `<PreferenciasScript />` inline in the server root layout `<head>` (never `next/script`).
- Errors and results: persistent `StatusCallout`; toasts only confirm. Destructive: `ConfirmDialog`,
  «Eliminar». Tips only via `<Dica>`. No native `title` tooltips.
- Forms: `FormField` around every control, `required`/`optional` via props; aligned fields
  `m-campos-alinhados m-campos-N`; sub-sections `m-subseccao`; actions `m-barra-acoes`
  ([docs/guia/formularios.md](docs/guia/formularios.md)).
- **Tours are opt-in only** («Ver como funciona»); nothing starts automatically.
- Copy: short formal pt-PT imperatives, one idea per sentence; no «ecossistema/SSO/Cérebro/API/token/
  proxy», no English, no exclamation marks, no emoji, no raw enums or ISO dates.
- Data: `formatar*` helpers (missing = «—»); identifiers stored normalised, validated with `/validar`,
  typed through `Campo*`; `StatCard`/`StatGroup`/`StatusSummary`, one `Toolbar`, `DataTable`, charts with
  `--serie-1..8`, ≤ 8 series, never two y-axes ([docs/guia/dados.md](docs/guia/dados.md)).
- Effects (`/efeitos`): one backdrop per screen, never behind work screens, tables or forms.

## Demo mode (`DEMO_MODE=true`, never in production)

**Everything demo-only lives in the floating «Demonstração» widget**: no demo badges, banners, notices,
panels or demo-only buttons on pages (actions register with `useAcoesDemo`; logins with
`useEntrarComoDemo`, never hard-coded accounts). One `<DemoPreencher ativo cenarios>` in the root layout;
forms `data-demo-form="<id>"`; scenarios in the app's `lib/demo/cenarios.ts`. See
[docs/guia/demo.md](docs/guia/demo.md).

## Platform (one origin, SSO, Cérebro, security, monitoring)

- One origin `MUTUAL_URL`, paths in `CAMINHOS`; browsers call `/api/v1` same-origin; `localStorage` keys
  `<app>.` (shared `assistente.flutuante.*` only). Login is the Portal's; no access → `<SemAcesso>`.
- `pedirAoCerebro`: network/timeout/5xx throw `CerebroIndisponivel` → `proxy.ts` rewrites to
  `/indisponivel` with 503, never a redirect to login (loop). 401 = no session.
- `cabecalhosNext` in `next.config` (never a CSP there); `comCsp` in `proxy.ts`; apps only add
  `PermissoesCsp` entries. Monitoring: never report bodies, cookies or form values.
- Details: [docs/guia/plataforma.md](docs/guia/plataforma.md). ADR 0004: [docs/adr-0004-subcaminhos.md](docs/adr-0004-subcaminhos.md).

## Floating assistant

`AppShell assistente={eu.assistenteNaPagina ? <ChatFlutuante app/> : undefined}` (not in the Assistente
app or Cartão). Pages publish `useContextoAssistente`: personal data `sensivel`, fillable fields
`editavel`, `aoAplicar` writes the draft and never submits; list pages publish each row with the table's
columns (formatted) and the sort order; Saúde never publishes fields. See
[docs/guia/assistente.md](docs/guia/assistente.md).
