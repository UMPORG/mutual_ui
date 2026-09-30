# MUTU@L UI (`@umporg/ui`) — AGENTS.md

Rules and "where is what" for AI agents (`CLAUDE.md` imports this). Full text
with props and examples: [docs/guia-detalhado.md § Full rule reference](docs/guia-detalhado.md#full-rule-reference-moved-from-agentsmd)
(plus version notes); colours: [docs/identidade-visual.md](docs/identidade-visual.md);
component survey: [docs/inventario-componentes.md](docs/inventario-componentes.md);
one origin: [docs/adr-0004-subcaminhos.md](docs/adr-0004-subcaminhos.md).

Shared design system and helpers of every MUTU@L app. **Public repo**
`UMPORG/mutual_ui`: never commit secrets, credentials or internal hostnames.

## Consuming and releasing

- Apps: `"@umporg/ui": "github:UMPORG/mutual_ui#vX.Y.Z"` — always a tag, never
  a branch. Next: `transpilePackages: ["@umporg/ui"]`; `globals.css`
  `@import "tailwindcss"; @import "@umporg/ui/css/index.css";` (no own colour
  blocks); `<html lang="pt-PT" data-app="<id>" suppressHydrationWarning>`.
- Release: bump `package.json` `version`, commit, `git tag vX.Y.Z`, push the
  tag; apps bump the ref and regenerate the lockfile.
- Peers: `react` ≥ 19, `lucide-react`; optional `@base-ui/react` ≥ 1.6 < 2,
  `recharts` ≥ 3.1.

Entry points (`package.json` `exports`): `@umporg/ui` (brand, `IconeApp`,
`AppShell`/`NavApp`/`ProcuraApp`/`Separadores`/`LancadorApps`,
`BotaoAssistente`, `useContextoAssistente`, `PageHeader`, `StatusCallout`,
`Dica`, `SemAcesso`, `ServicoIndisponivel`, `AcessibilidadeMenu`,
`PreferenciasScript`, `DemoPreencher`, cards, stats, `DataTable`, basic
controls, `Campo*`, formatters — no heavy deps) · `/controlos` `/datas`
`/conversa` `/preencher` `/assistente` (need `@base-ui/react`) · `/graficos`
(`recharts`) · `/calendario` `/efeitos` `/markdown` `/formatar` `/validar`
`/icones` `/sso` `/apps` `/cerebro` `/seguranca` `/monitor` `/monitor/react`.

## Repo map and commands

`src/` one file per area (`index.ts` main entry) · `css/` (`tokens.css` =
every colour) · `tests/` (`node --test`; `tokens.test.ts` contrast,
`tipos-exatos.tsx` type test) · `showcase/` review page (unpublished) ·
`assets/icones/<app>/` generated favicons.

```bash
pnpm install
pnpm typecheck   # exactOptionalPropertyTypes on (tsconfig.json) and off (tsconfig.solto.json)
pnpm test        # CI sets TZ=Europe/Lisbon
pnpm icones      # favicons · pnpm embed-logo → src/logo-data.ts
cd showcase && pnpm install --ignore-workspace && pnpm build && bun serve.ts  # :5199
```

CI (push to `main`, PRs, `v*` tags): frozen install, typecheck, tests,
`pnpm audit`, showcase build. Changes only to `**/*.md`, `docs/**`, `LICENSE`
skip CI. Pre-push: typecheck + test.

## Coding rules (this package)

- Optional props: `name?: T | undefined` (typecheck fails otherwise); props to
  Recharts/Base UI that reject `undefined` go through `opcional()`.
- `src/seguranca.js` and `.d.ts` stay in step.
- Main entry never imports Recharts/Base UI; heavy deps behind a sub-path +
  optional peer.
- New app: `MUTUAL_APPS` (`src/apps.ts`), `CAMINHOS` (`src/sso.ts`),
  `--app-accent` (light+dark), `--app-accent-soft`, `--app-marca` in
  `tokens.css`, glyph in `GLIFOS_APPS` + `COR_MARCA_APP` (`src/icones.ts`),
  `pnpm icones`; `tokens.test.ts` checks contrast and ≥ 30° OKLCH hue apart.
- Every visible string is pt-PT production copy; every new component gets a
  showcase state and, if logic, a unit test.
- Git: `main` only; messages `feat:`/`fix:`/`docs:` in Portuguese, ending with
  `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.
  Never force-push, never skip hooks.

## Visual identity — one brand

- Brand green `--brand` `#1f6f36` = `--primary` (buttons, links, focus);
  neutrals, Geist, radius, shadows, status colours identical everywhere.
- App colour (`--app-accent` via `data-app`) ONLY on the frame tint
  (`--moldura*`), app tile, current page icon, current tab underline, Portal
  tile. Never on buttons, links, focus, badges or status. Role colours
  (`data-role`) only on the role badge.
- Status = `success|warning|info|destructive` (+ `-soft`), always icon + words.
  No raw palette classes or hex in apps. Frame `bg-moldura*`, content `bg-camada`.
- Surfaces: `m-btn m-btn-*`, `m-surface`, `m-float`, `m-field`, `m-canvas`
  (full-page screens), title `text-pagina`.
- Motion only from `--movimento-*`/`--curva-*` tokens; opacity/transform only;
  never hand-set `ms`. Scrollbars are global — never style them in an app
  (`m-scroll-x|y`, `<ScrollShadow>`).

## Shell and navigation

- One `AppShell` (`src/shell.tsx`) for every desk app, no local variants: top
  bar (tile, app name, search, Ajuda, Acessibilidade, launcher, account) →
  grouped navigation → one content layer; pages in `.m-pagina`, `PageHeader`
  (+ `separadores`, + the page's action). Exactly one current nav entry.
- ≤ 8 destinations in 2–3 groups; **no actions in the navigation** (the
  page's action is the primary button in `PageHeader actions`); sub-pages are
  `Separadores` tabs, never a second menu level; other apps are `externo`.
- `disponiveis = appsDisponiveis(eu.apps)`; show profile name + organisation,
  never a login role. Apps shown by `IconeApp`, never a Lucide icon on a
  square; Cartão Digital never in the launcher.
- Search (`ProcuraApp`) is never tinted.

## SSO, one origin, Cérebro, security, monitoring

- One origin `MUTUAL_URL`, paths in `CAMINHOS`; Next apps set `basePath`;
  browsers call `/api/v1` same-origin; server uses `CEREBRO_URL_INTERNO` or
  `${MUTUAL_URL}/api`. Cookies host-only; `localStorage` keys `<app>.`
  (except shared `assistente.flutuante.*`, never message contents).
- Login is the Portal's (`portalLoginUrl`, `safeReturnUrl` same-origin only,
  `portalAfterLogoutUrl`); no access → `<SemAcesso>`.
- `pedirAoCerebro` with `TEMPO_LIMITE_CEREBRO_MS`; network/timeout/5xx throw
  `CerebroIndisponivel`, 4xx returned (401 = no session). `proxy.ts` rewrites
  to `/indisponivel` with 503 + `Retry-After` — never redirect to login (loop).
- Headers: `cabecalhosNext` in `next.config` (never a CSP there); `comCsp` in
  `proxy.ts` (nonce, `strict-dynamic`); nonce to `<PreferenciasScript nonce>`.
  Apps only add `PermissoesCsp` entries, never loosen the base.
- Monitoring: `criarOnRequestError`, `<MonitorCliente>`, `<ErroReportado>`;
  forward `x-pedido-id`. Never report bodies, cookies or form values.

## Accessibility, copy, data

- WCAG AA (Alto contraste 7:1); text 16px (secondary ≥ 14px); targets ≥ 44px
  (48px primary/shell). Works in all themes, 150% text, Espaçamento amplo, 390px.
- One `AcessibilidadeMenu`; no `next-themes`, local toggles or single-key
  shortcuts. `<PreferenciasScript />` inline in the server layout `<head>`.
- Errors/results: persistent `StatusCallout`; toasts only confirm. Destructive:
  `ConfirmDialog`, «Eliminar». Tips only via `<Dica>`. `FormField` around every
  control; `required`/`optional` via props; no native `title`. Side-by-side
  fields `m-campos-alinhados m-campos-N`; sub-sections `m-subseccao`; form
  actions `m-barra-acoes`.
- Copy: short formal pt-PT imperatives, no «ecossistema/SSO/Cérebro/API/token/
  proxy», no English, no exclamation marks, no emoji, no raw enums or ISO
  dates. Tours opt-in only.
- Data: always the `formatar*` helpers (missing = «—»); store identifiers
  normalised, validate with `/validar`, type via `Campo*`. `StatCard` (one
  hero), `StatGroup`, `StatusSummary`; filters in one `Toolbar`; charts use
  `--serie-1..8`, ≤ 8 series, no two y-axes; tables `DataTable`.
- Effects (`/efeitos`): one backdrop per screen, never behind work screens,
  tables or forms; desk apps only `PontosFundo` on empty states and
  `MomentoSucesso` after submissions (table: guide).

## Floating assistant

- `AppShell assistente={eu.assistenteNaPagina ? <ChatFlutuante app/> : undefined}`;
  not in the Assistente app or Cartão Digital. Reply links are plain `<a>` from
  the MUTU@L root (no `LinkComponent`/basePath).
- `useContextoAssistente({ app, pagina, seccao, dados, … })`: personal data
  `sensivel`, fillable fields `editavel`; `aoAplicar` writes the draft, never
  submits. Saúde never publishes fields. **List pages** publish each row with
  the same columns the table shows (formatted dates, status labels, not
  enums) and the sort order, so «qual foi a última…?» can be answered;
  people's emails/phones/names/NIF out or `sensivel`.
- Floating widgets publish their footprint via `useRegistoPosicoes()`. Pure
  logic in `src/assistente-*.ts`, tested in `tests/assistente.test.ts`.

## Demo mode (`DEMO_MODE=true`, never in production)

Everything demo-only lives in the floating «Demonstração» widget: no demo
badges, banners, notices or demo-only buttons on pages (register them with
`useAcoesDemo`). One `<DemoPreencher ativo cenarios>` in the root layout;
forms `data-demo-form="<id>"`; scenarios in `lib/demo/cenarios.ts` (valid +
≥ 1 error case, fictitious data, never real people). Never hard-code demo
accounts or a sign-in panel — logins register `useEntrarComoDemo`.
