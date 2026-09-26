# MUTU@L UI (`@umporg/ui`) — AGENTS.md

> Single source of truth for AI coding agents. `CLAUDE.md` imports this file.

The shared design system of the MUTU@L ecosystem: design tokens, brand
(logo, wordmark, app marks), shell pieces (app switcher, page header,
status callouts, empty states), data components (cards, stat tiles,
charts, tables, pt-PT formatting) and the single-sign-on contract.

Public GitHub repo `UMPORG/mutual_ui`, consumed as a **git dependency** (no
npm publishing):

```jsonc
// package.json of an app
"@umporg/ui": "github:UMPORG/mutual_ui#v0.6.0"
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
   | Servidores e DNS | `#475569` (slate) | `#cbd5e1` |

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
| Servidores e DNS | UMP IT team | Desk shell; addresses and servers, tables first. |
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
`/simplex`, `/saude`, `/qr`, `/dns`, Cérebro `/api`, help centre `/ajuda`. No
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

## v0.6 — dados: cartões, indicadores, gráficos, tabelas, formatação

Inventory of what the apps do today and which component replaces what:
[docs/inventario-componentes.md](docs/inventario-componentes.md). Visual
review page: `showcase/` (see Scripts). Rules for every data page:

- One headline number → `StatCard`, not a one-bar chart. A few numbers →
  `StatGroup` of `StatCard`s. The one number a dashboard leads with →
  `StatCard size="hero"` (one per page).
- Filters sit in ONE row above everything they scope (`Toolbar`), never
  inside a chart card. Refetch keeps the frame (`refreshing`), no skeleton
  flash.
- Never format by hand: `formatarNumero/Moeda/Percentagem/Data` (pt-PT,
  Europe/Lisbon). Missing values are "—" everywhere (never "0,00 €").
- Status is icon + words: `StatusBadge`, `StatusSummary`, `Delta`, `Meter`
  thresholds. Chart series never wear status colours unless the series *is*
  a status (pass `color: "sucesso" | "aviso" | "perigo" | "info"`).
- No raw palette classes and no hex in charts: series use `--serie-1..8`
  (validated palette in `css/dados.css`), grey context/"Outros" uses
  `--serie-outros`. `--chart-1..5` now alias `--serie-1..5`.

### Formatação (`@umporg/ui` or `@umporg/ui/formatar`)

```ts
formatarNumero(12345.6)                 // "12 345,6"   (compacto: "12,3 mil")
formatarMoeda(1234.5)                   // "1234,50 €"  (moeda: "USD", casas, compacto, sinal)
formatarPercentagem(0.125)              // "12,5%"      ({ escala: "cem" } for 12.5)
formatarData("2026-10-03")              // "03/10/2026"
formatarData(d, "longa")                // "sábado, 3 de outubro de 2026"
// estilos: curta | longa | media | diaMes ("3 out.") | mesAno | mesAnoCurto ("out. 2026") | dataHora | hora
formatarValor(v, "moeda" | "percentagem" | "inteiro" | "numero" | fn, compacto?)
formatarEixo(v, formato)                // axis ticks: "26 mil €", "6500 €"
contar(3, "associação", "associações")  // "3 associações"
```

pt-PT (CLDR) groups thousands from five digits: "1234" but "12 345". Pure
helpers in `dados.ts`: `calcularVariacao(atual, anterior)`,
`formatarVariacao`, `descreverVariacao` (words for screen readers),
`paginasVisiveis`, `intervaloPagina`, `agruparOutros`, `atribuirCores`,
`tabelaDoGrafico`, `descreverGrafico`.

### Card, Section, DescriptionList (server-safe)

Use `Card` for every panel (it is `m-surface`); padding lives in the parts
so tables can sit flush. `Section` titles a block of the page (no surface).

```tsx
<Section id="s-quotas" title="Quotas" description="Ano de 2026." actions={<Button …/>}>
  <Card accent="app">
    <CardHeader title="Últimos pagamentos" description="…" icon={<Receipt />} actions={…} divider />
    <CardContent flush>{/* table or list, edge to edge */}</CardContent>
    <CardFooter>Atualizado às 14:30 <a href="…">Ver todos</a></CardFooter>
  </Card>
</Section>

<Card href="/licencas" LinkComponent={Link}>…</Card>   {/* whole card is one link */}
<Card variant="muted">…</Card>                         {/* quiet panel, no shadow */}

<DescriptionList columns={3} items={[
  { term: "NIF", details: "501 234 569" },
  { term: "Distrito", details: "Braga", icon: <MapPin /> },
  { term: "Sede", details: morada, wide: true },
]} />
<DescriptionList layout="rows" items={…} />             {/* term | value; stacks when narrow */}
```

`accent="app"` is identity (a 3px line in the app colour), never status.
Heading levels: `CardHeader level` (2 on a page, 3 inside a `Section`).

### StatCard, StatGroup, Delta, Sparkline, Meter, StatusSummary (server-safe)

```tsx
<StatGroup>
  <StatCard label="Associações ativas" value={312} icon={<Building2 />}
    delta={{ value: 0.034, label: "face a 2025" }} trend={serie12Meses} href="/associacoes" LinkComponent={Link} />
  <StatCard label="Quotas recebidas" value={184350.5} format="moeda"
    delta={{ value: calcularVariacao(atual, anterior) ?? 0, label: "face ao mês anterior" }} />
  <StatCard label="Taxa de cobrança" value={0.912} format="percentagem"
    delta={{ value: 2.1, format: "pontos", label: "face a 2025" }} />
  <StatCard label="Pedidos por validar" value={18} unit="pedidos"
    delta={{ value: 5, format: "numero", better: "descer", label: "desde segunda-feira" }} />
</StatGroup>
<StatCard label="…" value={null} loading />
<StatCard label="…" value={null} error="Indisponível de momento" />
```

- `delta.value` is a fraction for `"percentagem"` (0.034 = +3,4%), points
  for `"pontos"`, units for `"numero"`/`"moeda"`. `better="descer"` for
  debts, delays, open requests. Colour = direction × good/bad; the arrow and
  a screen-reader sentence ("Subiu 3,4% face a 2025.") always go with it.
- Values ≥ 100 000 are shortened ("184,4 mil €", exact value in the
  tooltip and for screen readers); `compact={false}` turns it off. The hero
  stays exact up to 10 million.
- `Sparkline values={…}` alone (tables, cards): grey history, brand dot on
  the current value; decorative unless `label` is given.

```tsx
<Meter label="Congresso 2026" value={372} max={400} detail="372 de 400"
  thresholds={{ warning: 0.85, danger: 1 }} statusLabel="Quase esgotado" />
<StatusSummary label="Quotas por estado" totalLabel="Quotas emitidas" items={[
  { label: "Pagas", value: 515, tone: "success", href: "?estado=paga" },
  { label: "Em atraso", value: 36, tone: "warning", href: "?estado=atraso" },
]} />
<StatusSummary variant="inline" items={[{ label: "Regulares", value: 241, tone: "success", onSelect, selected }]} />
```

`StatusSummary variant="inline"` replaces the Backoffice `ListSummary` line
above lists (items can filter the list). `variant="bar"` is the dashboard
version (proportion bar + legend with counts and %). Use it instead of a pie
of estados.

### Gráficos (`@umporg/ui/graficos`, client, needs `recharts` ≥ 3.1)

`recharts` is an **optional peer dependency**: only apps that import
`@umporg/ui/graficos` need it (Backoffice and Simplex already have it). The
main entry never imports Recharts.

```tsx
"use client";
import { GraficoBarras, GraficoLinhas, GraficoArea, GraficoDonut, ChartFrame } from "@umporg/ui/graficos";

<GraficoBarras title="Quotas recebidas por mês" description="Euros recebidos em 2026."
  data={linhas} categoryKey="mes" categoryLabel="Mês"
  formatCategory={(m) => formatarData(`${m}-01`, "mesAnoCurto")}
  series={[{ key: "recebido", label: "Recebido" }]} format="moeda" />
<GraficoBarras … orientation="horizontal" highlight="Braga" />   {/* ranking, emphasis */}
<GraficoBarras … stacked series={[{ key: "pagas", label: "Pagas", color: "sucesso" }, …]} />
<GraficoLinhas … context={["media"]} domain={[0, 1]} format="percentagem" />
<GraficoArea … series={[{ key: "saldo", label: "Saldo" }]} format="moeda" />
<GraficoDonut title="Inscrições por origem" data={[{ label: "Associados", value: 812 }, …]} totalLabel="inscrições" />
```

- Every chart is a `ChartFrame`: card, title (`level`, default h3),
  description, a legend for ≥ 2 series, a "Ver dados" toggle that shows the
  data as a table, an svg `title`/`desc` summary generated from the data,
  keyboard focus (Tab, then arrow keys move the tooltip), pt-PT axes,
  `loading`, `refreshing`, an `empty` state, and no animation under Reduzir
  movimento. Heights are px at 100% text and scale with the text size.
- Form first: a single value → `StatCard`; part-to-whole of estados →
  `StatusSummary`; close values → bars, not a donut. Never two y-axes.
- Colour follows the entity: series take their declared position; pin
  `color: 1..8` when a filter can remove series so survivors keep their
  colour. More than 8 series throws — fold into "Outros" or split the chart.
  Donut: ≤ 4 slices + "Outros" (automatic).
- Own chart (map, heatmap, SVG): wrap it in `ChartFrame` with `legend` and
  `table`, and use `var(--serie-N)`, `var(--grafico-grelha)`,
  `var(--grafico-eixo)`.

### DataTable, Toolbar, SearchField, FilterChips, Pagination, Skeleton (server-safe shell)

The shell renders; the app keeps its data logic (URL state, nuqs, server
pagination, TanStack if it wants). Server pages use the `…Href` props;
client components use `onSort` / `onPageChange` / `onRemove`.

```tsx
const colunas: Column<Associacao>[] = [
  { id: "nome", header: "Associação", cell: (r) => r.nome, sortable: true }, // first = phone card title
  { id: "associados", header: "Associados", cell: (r) => formatarNumero(r.associados), numeric: true, sortable: true },
  { id: "quota", header: "Quotas do ano", cell: (r) => formatarMoeda(r.quota), numeric: true },
  { id: "estado", header: "Estado", cell: (r) => <StatusBadge tone={…}>{…}</StatusBadge> },
  { id: "atualizada", header: "Atualizada em", cell: (r) => formatarData(r.atualizada), hideOnMobile: true },
];

<DataTable caption="Associações" columns={colunas} rows={linhas} rowKey={(r) => r.id}
  rowHref={(r) => `/associacoes/${r.id}`} LinkComponent={Link}
  sort={{ id: "associados", direction: "desc" }} sortHref={(id) => `?ordem=${id}`}
  loading={aCarregar} refreshing={aAtualizar}
  error={erro && "Não foi possível carregar as associações."} onRetry={refetch}
  empty={<EmptyState variant="inline" icon={<Inbox />} title="Nenhuma associação encontrada">Experimente outro nome.</EmptyState>}
  toolbar={
    <Toolbar
      search={<SearchField placeholder="Nome, NIF ou distrito" defaultValue={q} />}
      filters={<>{/* the app's selects, class m-field h-11 */}</>}
      actions={<>{/* Exportar, Nova associação */}</>}
      summary={<ResultCount count={126} total={312} singular="associação" plural="associações" />}
      chips={<FilterChips filters={[{ id: "estado", label: "Estado", value: "Em atraso", removeHref: "?…" }]} clearHref="?" />}
    />
  }
  footer={<Pagination page={2} pageCount={7} totalItems={126} pageSize={20} hrefFor={(p) => `?pagina=${p}`} />}
/>
```

- Phones (< 48rem): each row becomes a card (primary column as title, the
  others as term/value). `mobile="scroll"` keeps the table and scrolls it
  sideways inside its card. Put sorting in the toolbar if phones need it.
- `numeric` columns are right-aligned with tabular figures.
- `EmptyState variant="inline"` inside cards, tables and charts; the
  default `variant="page"` for a whole empty page.
- `Skeleton className="h-4 w-40"` for custom placeholders (`m-skeleton`,
  stops with Reduzir movimento, dashed outline in Alto contraste).

## Scripts

```bash
pnpm install
pnpm typecheck
pnpm test        # node --test: SSO, preferences, formatters, chart/table helpers
pnpm embed-logo  # regenerate src/logo-data.ts from assets/mutual-flag-96.webp

# Visual review of every data component, state and theme (not published):
cd showcase && pnpm install --ignore-workspace && pnpm build && bun serve.ts
# -> http://localhost:5199/?tema=claro|escuro|contraste&texto=150&app=simplex
node shots.mjs <outDir> --secoes   # Playwright screenshots (server running)
```

The showcase resolves React and Recharts from the package's own
devDependencies (one React copy); it only installs Tailwind.
