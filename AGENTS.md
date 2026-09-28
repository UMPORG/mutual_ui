# MUTU@L UI (`@umporg/ui`) — AGENTS.md

> Single source of truth for AI coding agents. `CLAUDE.md` imports this file.

The shared design system of the MUTU@L ecosystem: design tokens, brand
(logo, wordmark, app marks), shell pieces (app switcher, page header,
status callouts, empty states), data components (cards, stat tiles,
charts, tables, pt-PT formatting), form controls and overlays,
decorative effects, the assistant's conversation components (v0.7) and
the single-sign-on contract.

Public GitHub repo `UMPORG/mutual_ui`, consumed as a **git dependency** (no
npm publishing):

```jsonc
// package.json of an app
"@umporg/ui": "github:UMPORG/mutual_ui#v0.9.8"
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
5. **The desk shell is dark, tinted per app** (v0.8): the same depth as the
   "MUTU@L ink" (`--sidebar` `#12241a`, kept by the Portal and the Cartão),
   each app in its own hue, in both themes, with `MutualWordmark tone="ink"`
   at the top and `AppSwitcher` right under it. See "v0.8" below.

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
- Forms inside an open dialog or sheet (`role="dialog"`/`"alertdialog"`,
  `<dialog open>`) get a «Preencher (demonstração)» strip at the bottom of
  that dialog (v0.8.7) — nothing to add, just `data-demo-form` on the form.
  The floating pill hides while a modal is open.
- The floating pill docks away from the focused element and the forms' last
  actions. Give the page's scrolling area room for it so the last actions
  can scroll clear: `pb-[calc(2rem+var(--demo-reserva))]` (or the class
  `m-demo-reserva`). `--demo-reserva` is `0px` outside demo mode. Mark
  anything else it must never cover with `data-demo-evitar`. An app with a
  fixed bottom navigation bar lifts the pill with `--demo-fundo` (v0.8.8,
  e.g. `:root { --demo-fundo: 4.5rem }` on phones). No other app-specific
  demo padding or offsets.

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

## v0.7 — controlos, efeitos, conversa (additive, no breaking change)

Everything in v0.6 is unchanged. New sub-path entries so an app only
bundles what it imports:

| Import | What | Needs |
| --- | --- | --- |
| `@umporg/ui` | + `Button`, `buttonClasses`, `Badge`, `Tag`, `Kbd`, `Separator`, `Spinner`, `Breadcrumbs`, `Stepper`, `FormField`, `Fieldset`, `Input`, `Textarea`, `NativeSelect`, filtering helpers | nothing new (server-safe) |
| `@umporg/ui/controlos` | `Select`, `Combobox`, `MultiSelect`, `DropdownMenu`, `ContextMenu`, `Tooltip`, `TooltipProvider`, `Popover`, `Dialog`, `DialogClose`, `ConfirmDialog`, `Sheet`, `Accordion`, `Collapsible`, `Tabs`, `useUrlParam`, `Switch`, `Checkbox`, `RadioGroup`, `RadioCards`, `SegmentedControl`, `Slider`, `NumberField`, `Toaster`, `toast`, `ScrollArea`, `Avatar`, `AvatarGroup` | `@base-ui/react` ≥ 1.6 (optional peer; Backoffice, Simplex, Saúde and Eventos already have it; checked against 1.6 and 1.8) |
| `@umporg/ui/datas` | `Calendar`, `DatePicker`, `DateRangePicker` | `@base-ui/react` |
| `@umporg/ui/calendario` | pure date maths: `hojeLisboa`, `interpretarData`, `grelhaDoMes`, `somarDias`, `somarMeses`, `intervalosRapidos`… | nothing |
| `@umporg/ui/efeitos` | `ConstelacaoFundo`, `TopografiaFundo`, `MalhaFundo`, `PontosFundo`, `BrilhoDestaque` (class `m-brilho`), `Celebracao`, `MomentoSucesso` (+ `AsciiFundo`) | nothing |
| `@umporg/ui/conversa` | `ChatLayout`, `ThreadList`, `ConversationTitle`, `MessageList`, `ChatMessage`, `ThinkingIndicator`, `SourceList`, `ActionCard`, `SuggestionChips`, `ChatEmptyState`, `MessageFeedback`, `Composer`, `AttachmentChip`, `Markdown`, `CopyButton` | `@base-ui/react` |
| `@umporg/ui/markdown` | safe `Markdown` renderer + `analisarMarkdown`, `sanitizarUrl`, `markdownParaTexto` | nothing |

CSS comes with `css/index.css` as before (`controlos.css`, `efeitos.css`
and `conversa.css` are imported by it). Also in v0.7, from the Simplex
adoption: `Column.stickyEnd` keeps a row-actions column visible while a
table scrolls sideways; numeric values in phone cards never wrap; value
axes use whole-number ticks for counts (`format="contagem"` or
`"inteiro"`, or automatically when every value is an integer).

### Forms: `FormField` around every control

```tsx
<FormField label="NIF" required hint="Nove algarismos." error={errors.nif?.message}>
  <Input {...register("nif")} inputMode="numeric" />
</FormField>
<FormField label="Observações" optional count={{ value: obs.length, max: 500 }}>
  {(p) => <Textarea {...p} value={obs} onChange={…} />}          {/* render-prop form */}
</FormField>
<FormField label="Distrito" required><Select options={DISTRITOS} name="distrito" /></FormField>
<Fieldset legend="Forma de pagamento" error={…}><RadioGroup options={…} /></Fieldset>
```

The field wires `id`, `aria-describedby` (error, hint, count),
`aria-invalid` and `aria-required`; it never owns the value, so it works with
react-hook-form + zod, server actions and plain forms. Mark whichever is the
minority: `required` ("*" + "obrigatório" for screen readers) or `optional`.
The accessible name is the label plus the mark, with a space (v0.8.1):
`getByLabel("NIF (obrigatório)")`, `getByLabel("Observações (opcional)")`
and screen readers all get that text (the "*" is CSS generated content, so it
is not part of the name). Never write "(opcional)" into the label text — use
the prop.

### Which control — and when not

| Need | Use | Not |
| --- | --- | --- |
| One of ≤ 6 visible options | `RadioGroup` (in a `Fieldset`) | `Select` (hides the options) |
| One of a few options that need a description or icon | `RadioCards` | — |
| One of ~7–15 fixed options | `Select` | — |
| Long plain list on phones, GET filter forms, no-JS pages | `NativeSelect` (the OS picker) | `Select` / `Combobox` |
| Many options, or a remote search (associação, utente) | `Combobox` (`onSearch`, accents ignored, `onCreate` for "Criar «…»") | a `Select` with 200 items |
| Several values | `MultiSelect` (chips, `max`) | many checkboxes in a dropdown |
| A setting that applies at once | `Switch` | inside a form saved with a button → `Checkbox` |
| Views of the same content (Lista / Mapa) | `SegmentedControl` | form values |
| Sibling sections of one thing | `Tabs` (`line` under the page header, `pill` inside cards; `useUrlParam` keeps it in the address) | steps (→ `Stepper`), page navigation (→ links) |
| Optional or secondary content, FAQ | `Accordion` (the browser's search opens panels), `Collapsible` | hiding required fields |
| Actions of a row, card or page | `DropdownMenu` (destructive last, after a separator) | navigation, form values |
| The same actions on right-click | `ContextMenu` — always also reachable another way | the only way to an action |
| Name of an icon-only button | `Tooltip` + the same `aria-label` | essential information (touch has no hover) |
| Small interactive panel tied to a button | `Popover` | long forms (→ `Dialog` / `Sheet`) |
| A task to finish or cancel | `Dialog` (`dismissible={false}` when it holds typed data) | messages (→ `StatusCallout`) |
| Confirming a destructive action | `ConfirmDialog` (focus starts on "Cancelar", double-click guard, `pending`, `error` stays inside) | a button that changes its label |
| Hard-to-undo actions (DNS zone, revoke all accesses) | `ConfirmDialog confirmText="auroradominho.pt"` (typed confirmation) | — |
| Detail next to a list | `Sheet` (`side="right"`; `"bottom"` on phones) | a new page for three fields |
| Confirm what the person just did | `toast.success("Alterações guardadas.", { action: { label: "Anular", onClick } })` + one `<Toaster />` | errors, warnings, anything to read |
| A date | `DatePicker` (type "3/10/2026", "hoje" or pick; Monday first; Europe/Lisbon; ISO values) | birth dates on phones → `native` |
| A period | `DateRangePicker` (quick ranges, two months on desktop) | two separate pickers |
| An exact number with limits | `NumberField` (pt-PT format, − / +) | `Slider` |
| An approximate value on a range | `Slider` (`onValueCommitted` to fetch) | exact amounts |
| Where am I / way back | `Breadcrumbs` (phones: "‹ Parent" only) — `PageHeader` already has them | — |
| Wizard steps | `Stepper` (collapses to "Passo 2 de 5" on phones) | tabs |
| A short wait inside a control | `Spinner`; lists and cards keep `Skeleton` | full-page spinners |

### Efeitos: onde usar cada um

Each effect has its own look and its own place, so the apps do not all wear
the same backdrop. All of them are `aria-hidden`, pointer-transparent,
DPR-capped (1.5) and frame-capped, pause off screen and in hidden tabs,
stay still under "Reduzir movimento", disappear in "Alto contraste"
(forced colours and print too), and take `mascara` / `fadeTopo` so nothing
moves behind text. Put them first inside a `relative overflow-hidden`
container and give the content `relative`.

| Effect | Look | Use on | Never on |
| --- | --- | --- | --- |
| `AsciiFundo` (v0.2, unchanged) | the flag in ASCII | entry: Portal login and launcher header, QR first visit, `/sem-acesso` | anything else |
| `ConstelacaoFundo` | dotted map of Portugal (Açores and Madeira insets), associations twinkling, a light travelling between neighbours | pages about the network: Portal "a rede" band, public "Sobre", associations directory hero, UMP report covers | forms, tables, work screens |
| `TopografiaFundo` | contour lines in the app accent, slow drift | help centre (`/ajuda`) hero, public section covers, onboarding intros | dashboards, lists |
| `MalhaFundo` (`tons` marca / app / bandeira / calmo) | soft colour mesh with grain, pure CSS | public heroes with big type (Eventos home and event pages), campaign bands; `bandeira` for institutional days | work pages of desk apps |
| `PontosFundo` | a still dot grid that swells near the pointer | page-level empty states, "sem resultados", 404, the assistant's greeting (`ChatEmptyState backdrop`) | inline empty states in cards and tables |
| `BrilhoDestaque` / `.m-brilho` | a light running around a card's edge | ONE featured card per page: recommended plan, next event, a new feature | several cards, status, errors |
| `Celebracao` / `MomentoSucesso` | one burst of the flag's colours, ≈ 1.5 s, once | end of a task: "Documento submetido", "Inscrição confirmada", "Pagamento recebido" | ordinary saves (→ toast), page loads, repeats |

One backdrop per screen. Defaults per app, so they differ: Portal →
`AsciiFundo` (login) + `ConstelacaoFundo`; Eventos público → `MalhaFundo
tons="app"`; Ajuda → `TopografiaFundo`; assistente → `PontosFundo`;
Backoffice, Simplex, Saúde, DNS → no backdrops on work pages, only
`PontosFundo` on page-level empty states and `MomentoSucesso` at the end of
submissions.

### Conversa (assistente)

The app owns threads, messages, streaming and tools; the components render
`ChatMessageData` (`role` user / assistant / system / error, `content` in
Markdown, `status` streaming / done / stopped / error, `sources`,
`feedback`).

```tsx
<ChatLayout className="h-dvh"
  threads={<ThreadList threads={…} activeId={id} hrefFor={(t) => `/assistente/${t.id}`} LinkComponent={Link} onNew onRename onDelete />}
  header={<ConversationTitle title={titulo} onRename={…} />}
  composer={<Composer onSubmit={enviar} onStop={parar} streaming={aEscrever} maxLength={4000} />}>
  <MessageList messages={mensagens} LinkComponent={Link} thinking={{ steps }} onRetry onFeedback
    empty={<ChatEmptyState prompts={[…]} onSelect={enviar} backdrop={<PontosFundo />} />} />
</ChatLayout>
```

- Replies are Markdown rendered as React elements (never HTML): raw HTML
  shows as text, links are limited to http(s) / mailto / tel / relative,
  images become links (never loaded), code blocks have "Copiar", tables
  scroll in their own region, "[1]" markers link to `sources`. While
  streaming, unclosed markers are hidden and a caret follows the last word.
- Screen readers hear "O assistente está a responder." once, then the
  reply as plain text when it ends (cut near 600 characters, "A resposta
  continua na conversa."); errors once, assertively. Every message has a
  hidden heading ("Você disse", "Resposta do assistente").
- The list follows new text only while the person is at the bottom ("Ir
  para o fim" otherwise); long threads render the last 60 messages
  ("Mostrar mensagens anteriores") with `content-visibility`.
- Composer: Enter sends, Shift + Enter makes a new line (IME-safe), Esc
  stops, focus stays in the box; the counter shows from 80% of the limit.
- `ActionCard` proposes a change in the person's data; nothing happens
  until "Aplicar", and the card stays as the record (aplicada / cancelada /
  não aplicada).
- Sources: `kind: "ajuda"` (help-centre page) or `"registo"` (an app
  record; `app` gives its accent).

## v0.8 — app-tinted shells and custom scrollbars (additive, visual only)

No API change: bump the tag and the apps change look. Owner feedback:
switching apps "felt like I didn't even change app", and scrollbars should
be custom, vertical and horizontal.

### Tinted shell

- `[data-app]` now sets `--sidebar`, `--sidebar-accent`,
  `--sidebar-border`, `--sidebar-foreground`,
  `--sidebar-muted-foreground` per app (light and dark), and
  `--sidebar-primary` = `--app-accent-on-ink` (text on it =
  `--sidebar`). `--sidebar-ring` stays brand green. Everything that uses
  `bg-sidebar` / `bg-nav-background` (sidebar, mobile top bar) follows.
  Values, ratios and the rationale: `css/tokens.css` and
  [docs/identidade-visual.md](docs/identidade-visual.md) ("Tons das
  shells"); `tests/tokens.test.ts` fails if a pair drops below 7:1 (text)
  or 4.5:1 (muted, accent).

  | App | `--sidebar` light / dark | Hue |
  | --- | --- | --- |
  | Portal, Cartão | `#12241a` / `#0e1a13` | MUTU@L ink (unchanged) |
  | Backoffice | `#101e3b` / `#0c162b` | navy |
  | Eventos | `#221939` / `#191229` | aubergine |
  | Simplex | `#301909` / `#231307` | walnut |
  | Validador QR | `#00242f` / `#031a22` | petrol |
  | Saúde | `#341220` / `#260e17` | wine |
  | Servidores e DNS | `#18202c` / `#111720` | slate |
  | Monitorização (`monitor`, v0.9.0) | `#19230b` / `#121a08`, accent `#4d7c0f` / on ink `#bef264` | moss |
  | Assistente (`assistente`) | `#2d152e` / `#210f22`, accent `#a21caf` / on ink `#f0abfc` | plum |
  | Protocolos (`protocolos`) | `#33150f` / `#25100c`, accent `#b93a2e` / on ink `#fca99f` | brick |

- `.m-canvas` (the content area of every shell) gains a 3px top rule in
  the app accent (`--app-rule`, a border so scrolled content never covers
  it) and a very light band of the accent (`--app-canvas`) behind the page
  header that scrolls away with the content. Opt out on one element with
  `m-canvas-neutro` or `--app-rule-width: 0px`.
- Alto contraste: every sidebar is black, no band, no rule (the app name
  under the wordmark still says where you are). Forced colours: system
  colours.
- Never hard-code the ink (`#12241a`, `#0e1a13`, `#1d3528`…) in an app:
  use `bg-sidebar`, `bg-sidebar-accent`, `text-sidebar-*`,
  `text-app-accent-on-ink`. Nested `data-app` elements (Portal tiles) get
  their own tint.
- `bg-sidebar` outside a shell takes the tint too (e.g. the Eventos public
  "Como se inscrever" band is now aubergine with a violet button).

### Scrollbars (`css/rolagem.css`, imported by `css/index.css`)

- Global, nothing to add: thin rounded thumb (6px in a 12px lane, 8px and
  darker under the pointer), transparent track. Tokens `--scroll-thumb`,
  `--scroll-thumb-hover`, `--scroll-track` (+ `-ink` variants used
  automatically inside `.bg-sidebar`, `.bg-nav-background`, `.m-tinta`;
  menus, cards and `.m-canvas` inside them go back to the light set).
  Chrome/Edge/Safari via `::-webkit-scrollbar`, Firefox via
  `scrollbar-width: thin` + `scrollbar-color`.
- **Do not set `scrollbar-width` / `scrollbar-color` in an app** —
  Chrome then ignores the shared `::-webkit-scrollbar` look for that
  element (`no-scrollbar` utilities that hide a bar are fine).
- Alto contraste: 16px lane, solid black thumb (white on the sidebar).
  Forced colours: `CanvasText` on `Canvas`. Nothing animates.
- Horizontal (or vertical) scrollers with edge shadows: class
  `m-scroll-x` / `m-scroll-y` (CSS only, server-safe; the shadow is part
  of the scroller's background, so keep cells transparent) or
  `<ScrollShadow label="Próximos eventos">…</ScrollShadow>` (client; adds
  the shadows in Firefox too, becomes a named region and joins the Tab order
  only while it overflows) or `useScrollShadow(ref)` on your own element.
  Already applied to `DataTable`, `Tabs` (line), `Markdown` code and
  tables, the chart "Ver dados" table, `MessageList` and the
  `DateRangePicker` quick ranges. The v0.7 `ScrollArea` (Base UI) uses the
  same look.

```tsx
import { ScrollShadow } from "@umporg/ui";          // or "@umporg/ui/controlos"
<ScrollShadow label="Próximos eventos" className="flex gap-3 pb-2">{cartoes}</ScrollShadow>
<div className="m-scroll-x">{/* server component: CSS-only shadows */}</div>
```

## v0.8.1 — fixes (no API change)

- `FormField` / `Fieldset`: the name joins the mark with a space ("Nome
  (opcional)", not "Nome(opcional)"); the "*" is out of the name.
- `FilterChips`: the remove buttons keep their 36px look with a 44px hit
  area (a `::after` 4px outside the button); "Limpar filtros" too.
- Showcase: the header and the "app" badge follow `data-app` live; each shell
  highlights its own page. `node showcase/verificar.mjs` checks names, hit
  areas and the header (server running).

## v0.8.2 — fixes (no API change)

- `DataTable`: the horizontal scroller (`.m-tabela-rolo`) is a containing
  block (`position: relative`), so visually hidden caption/header text
  (`sr-only`, e.g. an "Ações" column) can no longer widen the whole page at
  150% text. Apps can drop their `.m-tabela-rolo { position: relative }`
  workaround.
- Invalid fields (`.m-field` / `.m-gatilho` with `aria-invalid`, i.e. every
  `FormField` with `error`): red border **and** a light `--destructive-soft`
  tint, so errors stand out in dense grids. Alto contraste: 3px dark red
  border on white. The icon + message stay (never colour alone).
- `Checkbox`, `Switch`, `RadioGroup`: the visible label now names the
  focusable control (`aria-labelledby`) in server-rendered HTML too, and a
  click on the label clicks the control. Before, `<label for>` pointed at
  Base UI's hidden input: no name before hydration, and `getByLabel` found
  the hidden input (server HTML) or two elements (after hydration). Tests can
  use `getByLabel("…")` / `getByRole("checkbox", { name })` directly.
- `Tag` and `MultiSelect` chips: the remove button keeps its 28px look with
  a 44px hit area (`::after`, 8px outside).
- Showcase: `/ssr` serves a server-rendered, hydrated fixture
  (`showcase/ssr.tsx`); `node showcase/verificar.mjs` also checks the Tag hit
  areas, the invalid tint in the three themes, DataTable page width at 150%
  and the control labels (server HTML and hydrated).

## v0.8.3 — app `assistente` (additive)

- `MUTUAL_APPS` gains **Assistente** (`id: "assistente"`, login, icon
  `MessagesSquare`), `CAMINHOS.assistente = "/assistente"` (ADR 0006,
  `UMPORG/mutual_assistente`, Next `basePath: "/assistente"`). Access comes
  from `apps.assistente` of `/acessos/eu` (profiles `assistente.utilizador`,
  `assistente.gestor`). The plum tint slot is no longer "reserved".
- A `Record<MutualAppId, …>` in an app now needs an `assistente` entry.

## v0.8.4 — `exactOptionalPropertyTypes`-ready types, `Switch` names (additive)

- Every optional prop/option of every exported type is declared
  `name?: T | undefined`, so apps can turn on `exactOptionalPropertyTypes`
  and pass maybes straight through (`buttonClasses({ iconOnly })` with
  `iconOnly: boolean | undefined`, `<Switch checked={maybe} />`). The
  package itself now compiles WITH the flag (`tsconfig.json`) and without
  it (`tsconfig.solto.json`); `pnpm typecheck` runs both.
- `tests/tipos-exatos.tsx` is a generic type test: for each function or
  component of each entry point, every parameter with all its optional
  keys set to `undefined` must be accepted — a new prop written as
  `name?: T` fails `pnpm typecheck` and the error names the export. Write
  new optional props as `name?: T | undefined`.
- Props passed on to Recharts / Base UI whose own types reject `undefined`
  go through the internal `opcional(chave, valor)` spread (`src/opcional.ts`).
- `Switch` takes `aria-labelledby` (read before the visible label: a field
  label «Proteção» + visible state «Ligada» → «Proteção Ligada») or
  `aria-label` (replaces the name; keep the visible words in it). Use it
  when the visible label is only the state.

## Scripts

```bash
pnpm install
pnpm typecheck   # with exactOptionalPropertyTypes (+ tests/tipos-exatos.tsx) and without it
pnpm test        # node --test: SSO, preferences, formatters, chart/table helpers,
                 # dates, combobox filtering, Markdown safety, conversation helpers,
                 # app shell tint contrast (tokens.test.ts)
pnpm embed-logo  # regenerate src/logo-data.ts from assets/mutual-flag-96.webp

# Visual review of every data component, state and theme (not published):
cd showcase && pnpm install --ignore-workspace && pnpm build && bun serve.ts
# -> http://localhost:5199/?tema=claro|escuro|contraste&texto=150&app=simplex
node shots.mjs <outDir> --secoes   # Playwright screenshots (server running)
node shots-v07.mjs <outDir> [filtro] # v0.7: ?pagina=controlos|efeitos|conversa + open states
node shots-v08.mjs <outDir> [filtro] # v0.8: ?pagina=shells (&vista=lado) | rolagem, hover, forced colours
```

The showcase resolves React, Recharts and Base UI from the package's own
devDependencies (one React copy); it only installs Tailwind.

## v0.8.5 — app `protocolos` (additive)

- `MUTUAL_APPS` gains **Protocolos** (`id: "protocolos"`, login, icon
  `Handshake`), `CAMINHOS.protocolos = "/protocolos"` (ADR 0008,
  `UMPORG/mutual_protocolos`, Next `basePath: "/protocolos"`, port 3012).
  Access comes from `apps.protocolos` of `/acessos/eu` (profiles
  `protocolos.gestor|consulta` for the UMP and associações,
  `protocolos.gestor|balcao` for partner companies — organisation type
  `parceiro`).
- `[data-app="protocolos"]`: coral accent `#b93a2e` (6.0:1 on white), on ink
  `#fca99f`; brick sidebar `#33150f` / dark `#25100c` (contrast checked in
  `tests/tokens.test.ts`).
- The Backoffice description no longer lists protocols (they moved to the new app).
- A `Record<MutualAppId, …>` in an app now needs a `protocolos` entry.

## v0.8.6 — Cartão Digital on its own host (additive)

- Owner decision (2026-09-27, ADR 0004 exception): the **Cartão Digital** —
  the associados' own app, not for UMP or association teams — is the only app
  outside `MUTUAL_URL`: `https://id.mutualismo.pt` in production, served at the
  root (no `basePath`), with its own host-only session. It is NOT in
  `CAMINHOS` nor in `MUTUAL_APPS` (launcher/switcher list staff apps).
- `CARTAO_URL_PRODUCAO` + `urlCartao(base?, caminho?)` (`@umporg/ui/sso`):
  absolute links into the Cartão; each deployment passes its own Cartão
  origin (e.g. the Portal's «É associado? Abra o Cartão Digital»; locally
  `http://127.0.0.1:3002` — a different host from `localhost`, so cookies do
  not mix with the gateway's).
- `APP_CARTAO` (name, description, audience) and `nomeDaApp(id)` for any app
  id; `MutualWordmark app="cartao"` now shows «Cartão Digital».
- `SemAcesso` accepts `app="cartao"` with `motivo="sem-associado"` (a team
  account with no associado record), `portalHref` (absolute Portal address
  for an app on another host) and `acoes` (extra buttons, e.g. «Sou
  associado»).

## v0.8.7 — `DemoPreencher` in dialogs, never over the last actions (no API change)

- Found in Protocolos: the floating «Demonstração» button could not be used
  while a modal dialog/sheet was open (Base UI marks the rest of the page
  `aria-hidden` and the backdrop takes the clicks), and it covered the
  bottom-right corner of long forms (e2e had to submit with Enter).
- Forms inside an open dialog/sheet now get a «Preencher (demonstração)»
  strip appended **inside** that dialog (portal into the popup, CSS `order`
  keeps it last): it is in the modal's focus trap, the page stays inert, and
  the scenarios are buttons (Tab, Enter/Space). The status line
  («… aplicado (n campos).») is a `role="status"` in the strip. The floating
  pill hides while a modal makes the page inert (`aria-hidden`/`inert` on
  its root, or a native `dialog:modal`) and comes back when it closes.
- The floating control is a 48px pill (icon + number of forms; name
  «Demonstração (n formulários)»), portalled to `<body>`. It docks
  bottom-right, else bottom-left, else the middle of the right edge,
  choosing the first spot that covers neither the focused element, nor the
  forms' last actions (every submit button and its sibling buttons), nor
  `[data-demo-evitar]` (pure logic in `src/demo-doca.ts`, unit-tested). The
  panel and the notice open above the pill without moving it.
- `<html data-demo>` while active: `--demo-reserva: 5rem` (0px otherwise) and
  `scroll-padding-bottom`, so pages can reserve room at the end
  (`m-demo-reserva` or `pb-[calc(…+var(--demo-reserva))]`). Apps drop their
  own demo offsets (e.g. Backoffice `body:has(.demo-backoffice)` rules).
- Keyboard: opening the panel focuses the first scenario, Escape closes and
  returns focus to the pill, a press outside closes it. After a page
  scenario the form scrolls into view without animation under Reduzir
  movimento; the pill has no motion beyond a fade.
- Showcase `?pagina=demo` (long form, decision dialog, sheet);
  `node showcase/verificar.mjs` checks the strip, focus trap, the pill never
  overlapping «Cancelar»/«Guardar» (desktop and phone) and reduced motion.

## v0.8.8 — `--demo-fundo` (additive)

- Found in the Cartão: its phones have a fixed bottom navigation bar, and the
  old `className="max-md:bottom-[5.5rem]"` on `DemoPreencher` no longer wins
  over the v0.8.7 pill position. Set `--demo-fundo` instead (on `:root`, or
  as `[--demo-fundo:…]` in the `className`): the pill's corner docks sit that
  much higher, and the component measures the pill's real distance from the
  bottom edge, so docking away from the last actions stays correct.
- `node showcase/verificar.mjs` checks it (a 72px fixed bar: pill at 88px,
  still in a corner). The focus-trap check now asserts that Tab never lands
  on a page control (Base UI's guards may hold focus for an instant).

## v0.8.9 — identificadores: telefones, NIF, código postal, IBAN (additive)

Owner: phone numbers "and such things" are shown formatted everywhere and
typed through shared, on-brand fields. Never format or validate them by
hand in an app (the NIF check existed five times).

- **Storage is normalised**: phones in E.164 (`+351222084177`), NIF/NIPC 9
  digits, código postal `4000-123`, IBAN in capitals without spaces.
  Normalise where the value enters (form schema, API body), show it with the
  formatters.
- **Formatters** (`@umporg/ui` / `@umporg/ui/formatar`): `formatarTelefone`
  («222 084 177»; foreign «+44 207 946 0958»; `{ indicativo: true }` →
  «+351 912 345 678»), `hrefTelefone` (`tel:+351…`, raw E.164, `null` when
  it is not a number), `formatarNif` («501 234 560»), `formatarCodigoPostal`,
  `formatarIban` (groups of four). Unreadable values are shown as they came,
  empty is «—».
- **Validators/normalisers** (`@umporg/ui/validar`, pure, no deps):
  `normalizarTelefone|Nif|CodigoPostal|Iban` → normalised or `null`;
  `validarTelefone(v, { tipo: "movel" | "fixo", indicativo })`,
  `validarNif(v, { tipo: "singular" | "coletiva" })`, `validarNipc`,
  `validarCodigoPostal`, `validarIban(v, { pais: "PT" })` →
  `{ valido: true, valor }` or `{ valido: false, erro }` (pt-PT message for
  `FormField error`). Portuguese phones: 2x fixed, 30, 70–76, 8x, mobiles
  91/92/93/96. zod 4: `z.string().transform(comZod(validarTelefone))`
  (`{ opcional: true }` turns "" into `null`); Effect Schema: filter on
  `validarX(v).valido` and decode with `normalizarX`.
- **`Telefone`** (server-safe): `<Telefone numero={t} icone copiar />` —
  formatted, `tel:` link with the E.164 number (44px hit area without
  growing the line), optional 44px «Copiar número», `semLigacao` inside rows
  that are links, `vazio` for the empty text.
- **Fields** (client, inside `FormField`, which wires id/ARIA/error):
  `CampoTelefone` (country list, +351 by default, mask while typing,
  pasting «+44 …»/«00351…» switches the country, `semIndicativo`),
  `CampoNif`, `CampoCodigoPostal`, `CampoIban`. `value`/`onValueChange` carry
  the **normalised** value (incomplete phones as `+351912` so the validator
  can say what is missing); `name` goes on a hidden input with that value, so
  plain forms, server actions and `DemoPreencher` work. TanStack Form:
  `value={field.state.value} onValueChange={field.handleChange}
  onBlur={field.handleBlur}`. Light, dark and Alto contraste through
  `m-field`; invalid tint via `aria-invalid`.
- `BotaoCopiar` (44px copy button with a spoken confirmation) is exported too.
- Showcase `?pagina=identificadores`; `node showcase/verificar.mjs` checks the
  mask, the country switch, the hidden E.164 value and the `tel:` hit area.
  Unit tests: `tests/identificadores.test.ts`.

## v0.9.0 — app `monitor` and `@umporg/ui/monitor` (additive)

ADR 0007: the MUTU@L has its own monitoring (the Cérebro module `monitor`
and the app `UMPORG/mutual_monitor` at `/monitor`, port 3009, for the UMP
IT team). Every app reports its errors to the Cérebro and passes the request
id along.

- `MUTUAL_APPS` gains **Monitorização** (`id: "monitor"`, login, icon
  `Activity`), `CAMINHOS.monitor = "/monitor"`. Access comes from
  `apps.monitor` of `/acessos/eu` (profiles `monitor.informatica`,
  `monitor.consulta`, UMP only). The moss tint slot is no longer "reserved".
  A `Record<MutualAppId, …>` in an app now needs a `monitor` entry.
- **`@umporg/ui/monitor`** (no React; browser, Node and edge):
  - `reportarErro(erro, { app, lado?, versao?, endpoint?, chave?, url?, pedidoId?, contexto? })`
    → `POST /api/v1/monitor/erros`. Never throws, 3 s timeout. Browser: same
    origin, with or without a session, deduped (same error at most once a
    minute, 20 per page), browser noise ignored (ResizeObserver, "Script
    error.", extensions, aborts, Next redirects). Server: needs the service
    Machine Key `monitor` (`chave` → `X-Machine-Key`; env `MONITOR_CHAVE`,
    server-only) — without it nothing is sent.
  - `criarOnRequestError({ app, cerebroUrl, chave, versao })` → the
    `onRequestError` export of `instrumentation.ts` (path, method, request
    id, Next's `digest` and route context).
  - `instalarReporteGlobal(opcoes)` (`error` + `unhandledrejection`),
    `serializarErro`, `CABECALHO_PEDIDO` (`x-pedido-id`), `pedidoIdDe(headers)`,
    `cabecalhosComPedido(id)`, `novoPedidoId()`: server code that calls the
    Cérebro forwards the incoming `x-pedido-id` so the Monitorização links the
    page, the API call, the logs and the error.
- **`@umporg/ui/monitor/react`** (client): `<MonitorCliente app versao />`
  once in the root layout; `<ErroReportado error reset app inicio? />` as the
  body of `error.tsx` / `global-error.tsx` (plain pt-PT, «Tentar de novo»,
  the error reference = `digest`); `useReportarErro(error, opcoes)`;
  `<FronteiraErro app alternativa?>` for a part of a page that may fail on
  its own.
- Never report bodies, cookies or form values; the Cérebro redacts again and
  keeps only the normalised path of `url`.

```ts
// instrumentation.ts
import { criarOnRequestError } from "@umporg/ui/monitor";
export const onRequestError = criarOnRequestError({
  app: "eventos", cerebroUrl: process.env.CEREBRO_URL, chave: process.env.MONITOR_CHAVE,
});
```

## v0.9.1 — one desk shell: `ShellMarca`, `ShellConta`, `.m-pagina`, `appsDisponiveis` (additive)

Final UI sweep (owner, 2026-09-28): every desk app must show the same app
switcher with every app the account can open, the same account block and
the same page gutters. Found: each app kept its own list of app ids (Eventos,
Simplex, Saúde and DNS did not list Assistente, Protocolos or Monitorização),
four sidebar widths/footers, and three content paddings.

- **`appsDisponiveis(eu.apps)`** (`@umporg/ui` / `@umporg/ui/apps`): the
  `disponiveis` of the switcher — Portal + every `MUTUAL_APPS` id whose
  `apps.<id>` is not null, in the ecosystem order. Apps delete their own
  `APPS_MUTUAL` lists; a new app shows up everywhere with a tag bump.
- **`AppSwitcher`** lists the current app too («Está aqui», `aria-current`),
  so the list is identical in every app; it scrolls inside the viewport.
- **Desk shell pieces** (`src/shell.tsx`, client):
  - `ShellBarraLateral` — the `<aside>`: `w-64` (`SHELL_LARGURA`),
    `bg-sidebar`, `px-3 py-4`, `gap-4`, scrolls on its own.
  - `ShellMarca app disponiveis inicioHref LinkComponent onNavegar` —
    wordmark with the app name (link home) + «Aplicações».
  - `classeItemShell(ativo, nivel?)` — the one nav item: 48px (v0.9.4), 15px medium
    text, 20px icon; current = `bg-sidebar-accent`, semibold, a 3px bar and
    the icon in `--app-accent-on-ink`. `ShellGrupo titulo` for a titled group.
  - `ShellConta app nome perfil organizacao variasOrganizacoes
    onTerminarSessao aTerminar? ajudaHref? comAcessibilidade? extra?` —
    who is signed in, then Acessibilidade, Ajuda (`/ajuda/<app>`), «Mudar de
    organização» (Portal `/organizacao?next=`), the app's `extra` links, and
    «Terminar sessão». Same order and look in every app.
- **`.m-pagina`** (css/superficies.css): the content column of a desk
  shell — 16px gutters on phones, 24px from 40rem, 32px from 64rem; 24px /
  32px on top; bottom room for the demo pill; `max-width: 80rem`, centred.
  `m-pagina-larga` has no maximum. Pages start with `PageHeader` (28px
  title, 24px below it).
- **Alto contraste**: nested `[data-app]` (Portal tiles, app marks) and
  `[data-role]` badges now also turn black on white (they kept 5–6.7:1
  colours before; AAA needs 7:1).

## v0.9.2 — focus ring on the dark shell (no API change)

- On `.bg-sidebar`, `.bg-nav-background` and `.m-tinta` the focus ring
  (`--ring`) is `--sidebar-ring` (light green, ≥ 8:1 on every tint; white in
  Alto contraste); popovers, cards and the canvas inside them go back to
  `--ring-conteudo` (the content ring). Before, brand green on the dark
  sidebar was < 3:1 unless the app set its own `.superficie-tinta` rule —
  apps delete that rule now.

## v0.9.3 — `ShellConta`: statement link and tour hooks (additive)

- `ShellConta declaracaoHref` — passed to the Acessibilidade panel (the
  app's accessibility statement, e.g. Eventos).
- Stable tour targets on the account block: `[data-shell="conta"]` (who is
  signed in), `"acessibilidade"`, `"ajuda"`, `"organizacao"`, `"sair"`.

## v0.9.4 — shell items are 48px (no API change)

- `classeItemShell` (navigation, and the Ajuda / «Mudar de organização» /
  «Terminar sessão» items of `ShellConta`) is 48px high: navigation is a
  primary flow (Eventos holds 48px for its menu in e2e).

## v0.9.5 — `ShellConta` without native tooltips (no API change)

- The name in the account block wraps instead of truncating with a `title`
  (native tooltips do not exist on touch screens; Simplex tests forbid them).
- The Acessibilidade trigger in the block is 48px like the other items.

## v0.9.6 — `text-pagina`, sidebar items never shrink (no API change)

- `--text-pagina` (1.75rem, line-height 1.25) → the `text-pagina` utility:
  the page title of every app (`PageHeader`, `SemAcesso`). Apps with their
  own header component use it instead of a hand-written size.
- `ShellBarraLateral` children never shrink (`*:shrink-0`): a long menu
  scrolls the bar instead of squashing the filter field or the brand.

## v0.9.7 — the switcher lists exactly what the Portal shows; table and pagination names

- `appsDisponiveis` adds the Validador QR only with Eventos, and `AppSwitcher`
  lists only `disponiveis` (+ the current app): the same set, in the same
  order, as the Portal launcher (owner rule: each account sees only what it
  can use). Before, the QR showed for everyone.
- `DataTable`: the horizontal scroller is keyboard-reachable
  (`tabIndex=0`, `role="region"`, named by a text caption).
- `Pagination label` — name each landmark when a page has two paginated
  lists.

## v0.9.8 — the DataTable scroller is a named group (no API change)

- v0.9.7 made it a `region` named by the caption; a page section with the
  same name then gave two landmarks with one name (axe landmark-unique, DNS
  Definições). It is now `role="group"` (focusable, named, not a landmark).
