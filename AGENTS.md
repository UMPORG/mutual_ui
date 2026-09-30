# MUTU@L UI (`@umporg/ui`) — AGENTS.md

> Rules and "where is what" for AI coding agents (`CLAUDE.md` imports this
> file). Examples, rationale and the per-version notes (v0.2 → v0.16.2) are in
> [docs/guia-detalhado.md](docs/guia-detalhado.md); colour decisions in
> [docs/identidade-visual.md](docs/identidade-visual.md); the v0.6 adoption
> survey in [docs/inventario-componentes.md](docs/inventario-componentes.md);
> one origin with sub-paths in [docs/adr-0004-subcaminhos.md](docs/adr-0004-subcaminhos.md).

The shared design system and helpers of every MUTU@L app. **Public repo**
`UMPORG/mutual_ui`: never commit secrets, credentials or internal hostnames.

## Consuming it (no npm publishing)

```jsonc
"@umporg/ui": "github:UMPORG/mutual_ui#v0.16.2"   // app package.json — always a tag, never a branch
```

- Next apps: `transpilePackages: ["@umporg/ui"]`; `app/globals.css`:
  `@import "tailwindcss"; @import "@umporg/ui/css/index.css";` (the tokens
  replace the app's own `:root`/`.dark` colour blocks).
- Root layout: `<html lang="pt-PT" data-app="<id>" suppressHydrationWarning>`.
- **Release:** bump `version` in `package.json`, commit, `git tag vX.Y.Z`,
  push the tag; then each app bumps its `#vX.Y.Z` ref and regenerates its
  lockfile. Current: **v0.16.2**.
- Peers: `react`/`react-dom` ≥ 19, `lucide-react`; optional `@base-ui/react`
  ≥ 1.6 < 2 (controls, dates, conversation) and `recharts` ≥ 3.1 (charts).

### Entry points (`package.json` → `exports`)

| Import | What | Needs |
| --- | --- | --- |
| `@umporg/ui` | brand, app icons (`IconeApp`), shell G (`AppShell`, `NavApp`, `ProcuraApp`, `Separadores`, `LancadorApps` grid launcher), `PageHeader`, `StatusCallout`, `Dica`, `SemAcesso`, `ServicoIndisponivel`, `AcessibilidadeMenu`, `PreferenciasScript`, `DemoPreencher`, cards, stats, `DataTable` + toolbar/pagination, basic form controls, `Telefone`/`Campo*`, formatters | nothing |
| `/controlos` | `Select`, `Combobox`, `MultiSelect`, menus, `Tooltip`, `Popover`, `Dialog`, `ConfirmDialog`, `Sheet`, `Tabs`, `Switch`, `Checkbox`, `RadioGroup`, `NumberField`, `toast`… | `@base-ui/react` |
| `/datas` · `/calendario` | `Calendar`, `DatePicker`, `DateRangePicker` · pure Lisbon date maths | `@base-ui/react` · nothing |
| `/graficos` | `GraficoBarras`, `GraficoLinhas`, `GraficoArea`, `GraficoDonut`, `ChartFrame` | `recharts` |
| `/efeitos` | backdrops and celebrations (below) | nothing |
| `/conversa` · `/markdown` | assistant UI (`ChatLayout`, `MessageList`, `Composer`, …) · safe Markdown renderer | `@base-ui/react` · nothing |
| `/formatar` · `/validar` | pt-PT formatters · identifier validators/normalisers | nothing |
| `/icones` | `GLIFOS_APPS`, `COR_MARCA_APP`, `svgIconeApp` (favicons: `pnpm icones` → `assets/icones/<app>/`) | nothing |
| `/sso` · `/apps` | `CAMINHOS`, `portalLoginUrl`, `safeReturnUrl`, `urlAbsoluta`, `urlCartao` · `MUTUAL_APPS`, `appsDisponiveis`, `nomeDaApp` | nothing |
| `/cerebro` | `pedirAoCerebro`, `CerebroIndisponivel`, `TEMPO_LIMITE_CEREBRO_MS`, `PAGINA_INDISPONIVEL` | nothing |
| `/seguranca` | `cabecalhosNext`, `comCsp`, `NONCE_CABECALHO` (plain JS + `.d.ts`) | nothing |
| `/monitor` · `/monitor/react` | `reportarErro`, `criarOnRequestError`, request ids · `MonitorCliente`, `ErroReportado`, `FronteiraErro` | nothing · React |

## Repository map

`src/` one file per area (`src/index.ts` = main entry) · `css/` (`tokens.css`
holds every colour; `index.css` imports all sheets) · `tests/` (`node --test`;
`tokens.test.ts` contrast, `tipos-exatos.tsx` type test) · `showcase/` visual
review page (not published) · `assets/` flag images and `assets/icones/<app>/`
(generated favicons and home-screen icons, `pnpm icones`).

## Commands

```bash
pnpm install
pnpm typecheck   # with exactOptionalPropertyTypes (tsconfig.json) and without (tsconfig.solto.json)
pnpm test        # node --test (CI sets TZ=Europe/Lisbon)
pnpm embed-logo  # src/logo-data.ts from assets/mutual-flag-96.webp
cd showcase && pnpm install --ignore-workspace && pnpm build && bun serve.ts
#   → http://localhost:5199/?tema=claro|escuro|contraste&texto=150&app=simplex&pagina=…
node showcase/verificar.mjs          # Playwright checks, server running
node showcase/shots*.mjs <outDir>    # screenshots
```

CI (`.github/workflows/ci.yml`, GitHub-hosted, push to `main`, PRs, `v*`
tags): frozen install, typecheck, tests, `pnpm audit`, showcase build.
Changes only to `**/*.md`, `docs/**` or `LICENSE` do not run CI.

## Coding rules for this package

- Write every optional prop/option as `name?: T | undefined`
  (`tests/tipos-exatos.tsx` fails `pnpm typecheck` otherwise). Props passed to
  Recharts/Base UI that reject `undefined` go through `opcional()`
  (`src/opcional.ts`).
- `src/seguranca.js` and `src/seguranca.d.ts` stay in step (apps'
  `next.config.mjs` import it with plain Node; tests exercise the JS).
- The main entry never imports Recharts or Base UI; new heavy deps go behind
  a sub-path and an optional peer.
- Adding an app: `MUTUAL_APPS` (`src/apps.ts`), `CAMINHOS` (`src/sso.ts`),
  its `[data-app]` `--app-accent` (light + dark), `--app-accent-soft` and
  `--app-marca` in `css/tokens.css`, an original glyph in `GLIFOS_APPS` and
  its colour in `COR_MARCA_APP` (`src/icones.ts`), then `pnpm icones`.
  `tests/tokens.test.ts` measures the tinted frame in both themes (text ≥ 7:1,
  muted ≥ 4.5:1, current icon and focus ≥ 3:1, white glyph ≥ 4.5:1) and keeps
  every app ≥ 30° of OKLCH hue from the others. Apps with a
  `Record<MutualAppId, …>` then need the new id.
- Every visible string is pt-PT production copy (below). Every new component
  gets a showcase state and, where it is logic, a unit test.
- Git: `main` only; commit messages `feat:`/`fix:`/`docs:` in Portuguese,
  ending with `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.
  Never force-push, never skip hooks.

## Visual identity v2 — one brand

1. **One brand:** neutrals, `--brand` `#1f6f36` as `--primary` (buttons,
   links, focus), Geist, radius, shadows, status colours — the same everywhere.
2. **App colour** (`--app-accent`, from `data-app`) goes ONLY on: the 9%
   tint of the shell frame (`--moldura*`), the app tile (`--app-marca`, white
   glyph), the icon of the current page in its pill, the current tab's
   underline and the Portal tile. Never on buttons, links, focus, badges or
   status — those are neutral, brand green or the status colours.

   Light / dark (v0.13 re-spaced, ≥ 33° apart): `portal`,`cartao` brand
   `#1f6f36`/`#7cc97a` · `backoffice` `#1d4ed8`/`#93b4fb` · `eventos`
   `#7a1fc4`/`#d4a5f9` · `simplex` `#9c6100`/`#f2bf5e` · `qr`
   `#0e7490`/`#7fd3e6` · `saude` `#b8166e`/`#f59ecb` · `dns` `#475569`/`#cbd5e1`
   · `monitor` `#6b7500`/`#d9dc6a` · `assistente` `#0b7a72`/`#72dfcf` ·
   `protocolos` `#b93a2e`/`#fca99f`. All values: `css/tokens.css`.

3. **Role colours** (`data-role`, only on the user's role badge): admin
   `#881337`, associação `#0f766e`, eventos `#3730a3`, saúde `#9d174d`.
4. **Status is semantic:** `success`, `warning`, `info`, `destructive` (+
   `-soft`/`-soft-foreground`); always icon + words. No raw palette classes
   (`bg-green-100`…) and no hex in apps. The frame is `bg-moldura` (+
   `-hover`, `-selecao`, `-procura`), the content layer `bg-camada`.
5. **Surfaces:** Button variants → `m-btn m-btn-primary|destructive|outline|secondary|ghost`;
   panels `m-surface` (+ `m-surface-interactive`); popovers/menus/dialogs
   `m-float`; inputs `m-field`; full-page screens without the shell
   (`SemAcesso`, public pages) `m-canvas` (neutral; content greys are never
   tinted). Page title:
   `text-pagina`. High contrast flattens all of it.
6. **Motion** (v0.14): durations and curves only from the tokens
   `--movimento-rapido|medio|lento` and `--curva-entrada|saida|padrao`
   (`css/tokens.css`); only opacity and transform (and colours) move, never
   layout; exits are faster than entries. Reduzir movimento and the OS
   setting make them 0 (instant). Never set `ms` by hand in an app.
7. **Scrollbars** are global (`css/rolagem.css`). Never set
   `scrollbar-width`/`scrollbar-color` in an app. Edge shadows: `m-scroll-x`/
   `m-scroll-y` (CSS) or `<ScrollShadow label>` (client).

## One family, shells per audience

**Shell G** (v0.13, owner 2026-09-29: Google Workspace structure + Fluent
layering) — one `AppShell` for every desk app, the same anatomy everywhere:
top bar (tile + «MUTU@L» + app name, search, Ajuda, Acessibilidade, launcher,
account) → navigation (grouped destinations ONLY) → ONE content layer;
page = `PageHeader` (+ `separadores`, + the page's own action) + content.

| App | Audience | Shell |
| --- | --- | --- |
| Portal | UMP and association teams | Gateway: light header, login, launcher of the apps the account can use |
| Backoffice, Servidores e DNS | UMP services / IT, association leaders | Desk shell, tables first |
| Simplex | Treasurers, accountants, boards | Desk shell; forms and financial maps, sticky action bar |
| Saúde | Reception, health professionals, managers | Desk shell + unit selector; Balcão is the reception home; tablet-friendly |
| Eventos (gestão) / (público) | Organisers / associates and public | Desk shell with an event workspace / public site with one call to action per page |
| Validador QR | Staff at the door | Full-screen tool, big result states, no navigation |
| Cartão Digital | Associados | Own host (`CARTAO_URL_PRODUCAO`), not in `CAMINHOS`/`MUTUAL_APPS` |

**`AppShell` = the whole frame, no local variants** (`src/shell.tsx`,
`css/shell.css`): `app`, `caminhoAtual` (`usePathname()`), `LinkComponent`,
`disponiveis` (launcher), `conta` (`{ nome, perfil, organizacao,
variasOrganizacoes, onTerminarSessao, aTerminar, extra }` → avatar menu),
`navegacao` (`GrupoNavApp[]`: `{ titulo?, itens: { href, rotulo, icone,
contador?, externo?, ativo? }[] }`; current = longest matching href,
`hrefAtualDoMenu`: exactly ONE current entry — once an app marks one `ativo`, nothing is inferred), `procura`
(`<ProcuraApp rotulo action|onProcurar/>`), `antesDaNavegacao`/
`depoisDaNavegacao` (e.g. a unit selector), `barraExtra`, `ajudaHref`,
`declaracaoHref`. It renders `<main id="conteudo-principal">` (the scroller,
back to the top on every navigation); wrap pages in `.m-pagina`
(`m-pagina-larga` without max width). Below 64rem: drawer.
Tour targets `[data-shell="menu|navegacao|ajuda|acessibilidade|aplicacoes|
conta|organizacao|sair"]`. The search (`ProcuraApp`) is never tinted: the
neutral input surface (`--procura-fundo`: white / the dark input surface)
with a border ≥ 3:1 on the bar (`--procura-borda`), black/white in Alto
contraste. Screens without
navigation (Validador QR, Portal launcher) omit `navegacao`; public screens
omit `conta`/`disponiveis`.

**App icons and launcher (v0.15):** every app is shown by its `IconeApp`
(top bar, launcher, Portal tiles, lists of apps, favicon, home screen) —
never a Lucide icon on a coloured square. The launcher (`LancadorApps`,
inside `AppShell`) is a Google Workspace-style grid of the apps the account
can use; the Cartão Digital is never in it (only its favicon/PWA icons use
its `IconeApp`). Favicons: copy `assets/icones/<app>/` (see the guide).

**Navigation rules (every app):** ≤ 8 destinations in 2–3 short groups with
small titles; **no actions in the navigation** (v0.16, owner 2026-09-30:
no «+ Nova campanha» / «+ Criar evento» button there) — a page's own action
(«Nova campanha», «Criar evento», «Nova conversa») is the brand-green primary
button in `PageHeader actions`, next to the title, on the pages where it
applies only (it wraps under the title on phones); sub-pages are **tabs on the page**
(`<Separadores rotulo itens caminhoAtual LinkComponent/>`, in
`PageHeader separadores`), never a second menu level; links to another
MUTU@L app are `externo` (↗). `disponiveis = appsDisponiveis(eu.apps)` from
`GET /api/v1/acessos/eu` — the same set and order as the Portal launcher.
Show the **profile name** and organisation, never a login role.

## SSO, one origin, Cérebro, security, monitoring

- **One origin** (ADR 0004): `MUTUAL_URL` (production
  `https://mutual.mutualismo.pt`), fixed paths in `CAMINHOS` (Portal `/`,
  `/backoffice`, `/eventos`, `/simplex`, `/saude`, `/qr`, `/dns`,
  `/assistente`, `/protocolos`, `/monitor`, `/ajuda`, Cérebro `/api`). Next
  apps set `basePath`; browsers call `/api/v1` same-origin; server code uses
  `CEREBRO_URL_INTERNO` or `${MUTUAL_URL}/api`. Cookies are host-only;
  `localStorage` keys are prefixed `<app>.`.
- **Login** is the Portal's: `portalLoginUrl(caminhoDoPedido(request.url), "sem-sessao")`;
  `safeReturnUrl` accepts same-origin paths only; logout →
  `portalAfterLogoutUrl()`; out-of-band links → `urlAbsoluta(MUTUAL_URL, caminho)`.
  No access → `<SemAcesso …>` (same page everywhere).
- **Cérebro calls:** `pedirAoCerebro(url, { tempoLimiteMs, falharEm5xx })`;
  timeouts `TEMPO_LIMITE_CEREBRO_MS` = proxy 5 s, servidor 10 s, browser 15 s.
  Network error, timeout or 5xx throw `CerebroIndisponivel`; 4xx are returned
  (401 = no session, never "unavailable"). `proxy.ts` **rewrites** to
  `PAGINA_INDISPONIVEL` (`/indisponivel`) with **503** and
  `CABECALHOS_INDISPONIVEL` (`Retry-After: 120`) and renders
  `ServicoIndisponivel` — never redirect to the Portal login (loop), no Portal
  link on it.
- **Security headers** (`@umporg/ui/seguranca`): `cabecalhosNext({ producao,
  funcionalidades?, enquadrar? })` in `next.config` `headers()` (never a CSP
  there); `comCsp(request.headers, { dev, permissoes })` in `proxy.ts` on every
  page request (nonce CSP, `'strict-dynamic'`, `frame-ancestors 'none'`): pass
  the request headers on, set `Content-Security-Policy` on the response; the
  root layout passes `NONCE_CABECALHO` (`x-nonce`) to `<PreferenciasScript nonce>`.
  Apps only add `PermissoesCsp` entries, never loosen the base.
- **Monitoring**: `instrumentation.ts` exports
  `onRequestError = criarOnRequestError({ app, cerebroUrl, chave: MONITOR_CHAVE })`;
  `<MonitorCliente app versao />` in the root layout; `<ErroReportado>` as the
  body of `error.tsx`/`global-error.tsx`. `reportarErro` posts to
  `/api/v1/monitor/erros`, never throws, 3 s timeout; server-side it needs the
  `monitor` Machine Key. Forward `x-pedido-id` (`cabecalhosComPedido`) on
  Cérebro calls. Never report bodies, cookies or form values.

## Accessibility floor (every app)

- WCAG AA; Alto contraste reaches 7:1. Base text 16px, secondary
  ≥ 14px; targets ≥ 44px (48px in primary flows and shell items).
- One **Acessibilidade** menu (`AcessibilidadeMenu`, also in `ShellConta`):
  tema Automático / Claro / Escuro / Alto contraste, text size, Espaçamento
  amplo, Reduzir movimento. No `next-themes`, no local theme toggles, no
  single-key shortcuts (WCAG 2.1.4).
- `<PreferenciasScript />` is a plain inline script in the **server** root
  layout's `<head>` (never `next/script`), so no theme flash.
- Everything works in all themes, at 150% text, with Espaçamento amplo and at
  390px wide (no clipping, no horizontal page scroll).
- Status never by colour alone; errors of the person's own action and results
  are persistent `StatusCallout`s, toasts only confirm. Destructive actions:
  `ConfirmDialog`, verb «Eliminar», undo where reversible.
- **Dicas** (tips about a screen or a field, v0.12): only `<Dica id="<app>.dica.<nome>" titulo …>`
  — one calm line (info icon + title), the explanation and «Saber mais»
  (`saberMais`, `LinkComponent`) open on demand, a small «Fechar a dica» icon
  button remembered on the device (`rotuloReabrir` leaves a quiet way back;
  `dispensavel={false}` for field help). Never a full-width «Percebi», never
  between a card and its primary action — put it after the action. Colours:
  `--dica*` tokens (body ≥ 7:1, border ≥ 3:1, `tests/dicas.test.ts`); apps with
  their own palette redefine those six names and re-measure them. Classes
  `m-nota*` (`css/dicas.css`; apps importing single sheets import it too).
- Forms: `FormField` around every control (wires id, `aria-describedby`,
  `aria-invalid`, `aria-required`); mark `required` or `optional` via props,
  never "(opcional)" in the label text. No native `title` tooltips.
  Fields side by side go in a grid with `m-campos-alinhados m-campos-2|3|4`
  (v0.15.1): each field takes four subgrid rows (label, hint, control,
  message), so wrapped hints or a «26 de 254» count never misalign the
  controls of a line; a line's button (e.g. «Retirar») in `m-campos-acao`.
- Sub-sections of a form (v0.16): `<fieldset class="m-subseccao">` +
  `<legend>` + `<p class="m-subseccao-ajuda">` — heading inside a neutral
  card, never the classic box with the legend cutting the border
  (`m-subseccao-simples`: no card). The actions at the end of a form or a
  step: `<div class="m-barra-acoes"><div class="m-barra-acoes-corpo">…` —
  in the flow, no rule and no grey band; lifted only while stuck.

## Production copy (pt-PT, all of Portugal)

- Say what the person gets or must do, never how the system works. Banned in
  UI text: «ecossistema», «SSO», «sessão partilhada», «Cérebro», «API»,
  «token», «proxy», «cookie» (except the cookie notice), «sistema de design»,
  internal app codes, English words.
- Short, formal pt-PT, imperatives («Indique», «Escolha», «Guarde»), no
  exclamation marks, no emoji, no abbreviations in navigation.
- Never show raw enums or ISO dates. Tours are opt-in only («Ver como
  funciona»); nothing starts automatically.

## Data pages

- Never format by hand: `formatarNumero/Moeda/Percentagem/Data/Valor/Eixo`,
  `contar` (pt-PT, Europe/Lisbon); missing values are «—». Identifiers:
  store normalised (phones E.164, NIF 9 digits, `4000-123`, IBAN without
  spaces), show with `formatarTelefone/Nif/CodigoPostal/Iban`, validate with
  `@umporg/ui/validar` (`comZod` for zod), type through `CampoTelefone`,
  `CampoNif`, `CampoCodigoPostal`, `CampoIban`; `<Telefone>` for display.
- One number → `StatCard` (one `size="hero"` per page); several →
  `StatGroup`; states → `StatusSummary` (not a pie). Filters in one `Toolbar`
  row above what they scope; refetch keeps the frame (`refreshing`).
- Charts: series use `--serie-1..8` (`--serie-outros` for context), status
  colours only when the series is a status; never two y-axes; ≤ 8 series;
  own charts go in `ChartFrame`. Tables: `DataTable` (phone cards, `numeric`,
  `stickyEnd`, `rowHref`); `EmptyState variant="inline"` inside cards/tables.
- Control choice: table «Which control — and when not» in the detailed guide.

## Efeitos: onde usar cada um

All effects are `aria-hidden`, pause off screen, stop under Reduzir
movimento, vanish in Alto contraste; use `mascara`/`fadeTopo` so nothing moves
behind text. **One backdrop per screen; never behind work screens, tables or
forms.**

| Effect | Use on |
| --- | --- |
| `AsciiFundo` | entry only: Portal login/launcher header, QR first visit, `/sem-acesso` |
| `ConstelacaoFundo` | pages about the network (Portal «a rede», public «Sobre», associations directory) |
| `TopografiaFundo` | help centre hero, public section covers, onboarding intros |
| `MalhaFundo` (`tons`) | public heroes with big type (Eventos), campaign bands |
| `PontosFundo` | page-level empty states, 404, assistant greeting |
| `BrilhoDestaque` / `.m-brilho` | ONE featured card per page |
| `Celebracao` / `MomentoSucesso` | once, at the end of a task (not ordinary saves) |

Desk apps (Backoffice, Simplex, Saúde, DNS): no backdrops on work pages; only
`PontosFundo` on page-level empty states and `MomentoSucesso` after submissions.

## Demo mode (`DEMO_MODE=true`, server env, never in production)

**Everything demo-only lives in the floating «Demonstração» widget** (owner
rule, 2026-09-29): if the widget is visible, the app is in demonstration mode —
no «Demonstração»/«Modo de demonstração» badges, pills, chips, banners, notices
(«dados fictícios», «ambiente de demonstração»…) or demo-only panels/buttons on
the pages. Demo-only things that are not forms (sample codes, sample
identifications, «repor dados»…) register as widget actions with
`useAcoesDemo({ id, titulo, acoes: [{ id, nome, descricao?, desativada?, executar }] })`
(or `registarAcoesDemo`; memoise the group, pass `null` outside demo). Real
states that are not the demo (e.g. DNS «Modo simulado» from `DNS_MODO`) are not
covered by this rule.

Each app renders `<DemoPreencher ativo cenarios={…} />` once in the root
layout. Forms carry `data-demo-form="<id>"` and named fields; scenarios live
in the app's `lib/demo/cenarios.ts` («Dados válidos» + at least one error case,
realistic fictitious Portuguese data, never real people); custom widgets use
`registarPreenchedor`. Forms in dialogs get an inline «Preencher
(demonstração)» strip automatically. Reserve room with `m-demo-reserva` or
`pb-[calc(2rem+var(--demo-reserva))]`, mark no-go areas `data-demo-evitar`,
lift the pill over a fixed bottom bar with `--demo-fundo`. No other
app-specific demo offsets. Logins: never hard-code demo accounts and never put a
sign-in panel on the login page — the Portal and Cartão logins only register
`useEntrarComoDemo({ destino, aoEntrar })` (or `registarEntrarComo`) and the floating
«Demonstração» widget shows «Entrar como…» (personas from the Cérebro, one click;
nothing when the list is a 404).
