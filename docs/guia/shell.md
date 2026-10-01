# Shell G and navigation

Owner decision (shell G): Google Workspace structure + Fluent layering. One `AppShell` for every desk
app (`src/shell.tsx`, `css/shell.css`), no local variants.

## Shells per audience

| App | Audience | Shell |
| --- | --- | --- |
| Portal | UMP and association teams | Gateway: login, launcher of the apps the account can use |
| Backoffice, Servidores e DNS, Monitorização, Protocolos | UMP services / IT, association leaders | Desk shell, tables first |
| Simplex | Treasurers, accountants, boards | Desk shell; forms and financial maps, sticky action bar |
| Saúde | Reception, health professionals, managers | Desk shell + unit selector; Balcão is the reception home; tablet-friendly |
| Eventos (gestão) / (público) | Organisers / associates and public | Desk shell with an event workspace / public site, one call to action per page |
| Validador QR | Staff at the door | Full-screen tool, big result states, no navigation |
| Cartão Digital | Associados | Own host and design (`urlCartao`), not in `CAMINHOS`/`MUTUAL_APPS` |

## `AppShell`

Top bar (☰, tile + «MUTU@L» + app name, search, Ajuda and Acessibilidade with text, launcher, avatar) →
navigation (grouped destinations only) → one neutral content layer (`--camada`, 8px corners). Below
64rem: top bar + drawer (Ajuda, Acessibilidade and the account at its end).

Props: `app`, `caminhoAtual` (`usePathname()`), `LinkComponent`, `disponiveis`, `conta` (`{ nome,
perfil, organizacao, variasOrganizacoes, onTerminarSessao, aTerminar, extra }` → avatar menu with
«Mudar de organização» and «Terminar sessão»), `navegacao` (`GrupoNavApp[]`: `{ titulo?, itens: { href,
rotulo, icone, contador?, externo?, ativo? }[] }`), `procura` (`<ProcuraApp rotulo action|onProcurar/>`),
`antesDaNavegacao`/`depoisDaNavegacao` (e.g. a unit selector), `barraExtra`, `inicioHref`, `ajudaHref`,
`declaracaoHref` (accessibility statement), `assistente` (see [assistente.md](assistente.md)).

- Renders `<main id="conteudo-principal">` (the scroller, back to the top on every navigation). Wrap
  pages in `.m-pagina` (16px gutters on phones, 24px from 40rem, 32px from 64rem; bottom room for the demo
  pill; max 80rem, centred) or `m-pagina-larga` (no maximum).
- Screens without navigation (Validador QR, Portal launcher) omit `navegacao`; public screens omit
  `conta`/`disponiveis`.
- Tour targets: `[data-shell="menu|navegacao|ajuda|acessibilidade|aplicacoes|conta|organizacao|sair|assistente"]`.
- Exported pieces for special cases: `NavApp`, `MenuConta`, `hrefAtivo`, `hrefAtualDoMenu`, `iniciais`,
  `classeItemMenu`, `classeItemNav`, `posicionarPopover`.

## Navigation rules

- ≤ 8 destinations in 2–3 short groups with small titles; no abbreviations.
- **No actions in the navigation.** A page's own action («Nova campanha», «Criar evento», «Nova
  conversa») is the brand-green primary button (`buttonClasses()` / `m-btn m-btn-primary`) in
  `PageHeader actions`, only on the pages where it applies; it wraps under the title on phones.
- Exactly ONE current entry (`hrefAtualDoMenu`): the longest matching href, or the entry the app marks
  `ativo: true` (then nothing is inferred). Current = 20% pill (24% dark), bold, icon in the app colour;
  hover = 14%, normal weight.
- Sub-pages are tabs on the page: `<Separadores rotulo itens caminhoAtual LinkComponent/>` in
  `PageHeader separadores` — never a second menu level.
- Links to another MUTU@L app are `externo` (↗).

## Search (`ProcuraApp`)

`.m-procura` is the neutral input surface (`--procura-fundo`: white light, `#1c1c1c` dark — the form
fields' surface) with a 1px `--procura-borda` (≥ 3:1 on every tinted bar and its hover), muted
placeholder and icon, darker border on hover, ring on focus. Alto contraste: white, 2px black border.
Never tinted with the app colour.

## Launcher and app icons

- `disponiveis = appsDisponiveis(eu.apps)` from `GET /api/v1/acessos/eu`: Portal + every app whose
  `apps.<id>` is not null (Validador QR only with Eventos) — the same set and order as the Portal launcher.
  Show the profile name (`apps.<app>.nome`) and organisation, never a login role.
- `LancadorApps` (inside `AppShell`): round nine-dot button (tooltip «Aplicações MUTU@L»), grid of 3
  columns of icon + name, only `disponiveis` (Portal first, Cartão never), current app with a tick +
  «(está aqui)». Keyboard: focus on the current app, arrows, Home/End, Enter, Esc back to the button.
- `IconeApp({ app, tamanho?, titulo? })`: the «folha» base in `--app-marca` with a white glyph — used in
  the top bar, launcher, Portal tiles, lists of apps, favicons. Never a Lucide icon on a coloured square.
  Favicons: [pacote.md](pacote.md#favicons-and-home-screen-icons).
- `GlifoApp({ app, tamanho?, titulo? })`: the same glyph WITHOUT the base, in `currentColor` (follows
  light, dark, Alto contraste and forced colours). For buttons and titles that name an app — the top-bar
  «Assistente», the chat title, the assistant actions («Preencher a partir de um documento», drafts).
  The Assistente mark is the spark (two four-pointed stars), never Lucide `Sparkles` or a speech bubble.

## Page parts

- `PageHeader` (`title`, `description`, `actions`, `breadcrumbs`, `eyebrow`, `separadores`,
  `LinkComponent`): 28px title (`text-pagina`), 24px below it.
- `SemAcesso` (`app`, `motivo`, `utilizador`, `organizacao`, `variasOrganizacoes`, `acaoSair`,
  `portalHref`, `acoes`): the one «no access» page. The Cartão uses `app="cartao"` with
  `motivo="sem-associado"` and an absolute `portalHref`.
- `ServicoIndisponivel({ app, tentarHref })`: the one «Serviço temporariamente indisponível» page, no
  Portal link ([plataforma.md](plataforma.md)).
- `EmptyState` (`variant="page"` default, `"inline"` inside cards, tables, charts), `StatusCallout`,
  `Breadcrumbs` (phones: «‹ Parent» only).

## Migrating a screen into the shell

Replace any sidebar, mobile bar and canvas with one `AppShell`; move sub-pages into `Separadores`; drop app
CSS that targets `bg-sidebar`/`m-canvas` inside the shell; point tour steps at `[data-shell=…]` or the
page's button. Showcase: `?pagina=shells&app=<id>` (full frame), `&vista=todas` (all apps).
