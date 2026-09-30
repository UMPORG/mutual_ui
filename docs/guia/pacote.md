# Using and maintaining the package

## In an app

```jsonc
// package.json — always a tag, never a branch
"@umporg/ui": "github:UMPORG/mutual_ui#vX.Y.Z"
```

```js
// next.config.mjs
transpilePackages: ["@umporg/ui"],
```

```css
/* app/globals.css — no own :root/.dark colour blocks */
@import "tailwindcss";
@import "@umporg/ui/css/index.css";
```

```tsx
// app/layout.tsx (server): identity + preferences before the first paint
<html lang="pt-PT" data-app="eventos" suppressHydrationWarning>
  <head><PreferenciasScript nonce={nonce} /></head>
```

Peers: `react` ≥ 19, `lucide-react`; optional `@base-ui/react` ≥ 1.6 < 2 and `recharts` ≥ 3.1 (only
for the sub-paths that need them). `css/index.css` imports every sheet; an app that imports single
sheets must also import `css/dicas.css` and `css/shell.css`.

## Entry points

| Import | What | Needs |
| --- | --- | --- |
| `@umporg/ui` | brand, `IconeApp`, shell G (`AppShell`, `NavApp`, `ProcuraApp`, `Separadores`, `LancadorApps`), `BotaoAssistente`, `useContextoAssistente`, position registry, `PageHeader`, `StatusCallout`, `Dica`, `SemAcesso`, `ServicoIndisponivel`, `AcessibilidadeMenu`, `PreferenciasScript`, `DemoPreencher`, cards, stats, `DataTable` + toolbar/pagination, `Button`, `FormField`, `Input`, `Textarea`, `NativeSelect`, `Stepper`, `Telefone`, `Campo*`, `ScrollShadow`, formatters | nothing (server-safe) |
| `/controlos` | `Select`, `Combobox`, `MultiSelect`, `DropdownMenu`, `ContextMenu`, `Tooltip`, `Popover`, `Dialog`, `ConfirmDialog`, `Sheet`, `Accordion`, `Collapsible`, `Tabs`, `useUrlParam`, `Switch`, `Checkbox`, `RadioGroup`, `RadioCards`, `SegmentedControl`, `Slider`, `NumberField`, `Toaster`, `toast`, `ScrollArea`, `Avatar` | `@base-ui/react` |
| `/datas` · `/calendario` | `Calendar`, `DatePicker`, `DateRangePicker` · pure Lisbon date maths (`hojeLisboa`, `interpretarData`, `grelhaDoMes`, `somarDias`…) | `@base-ui/react` · nothing |
| `/graficos` | `GraficoBarras`, `GraficoLinhas`, `GraficoArea`, `GraficoDonut`, `ChartFrame` | `recharts` |
| `/efeitos` | backdrops and celebrations ([superficies.md](superficies.md)) | nothing |
| `/conversa` · `/markdown` | assistant UI (`ChatLayout`, `MessageList`, `Composer`, `AttachButton`, `RascunhoTexto`…) · safe Markdown renderer (`analisarMarkdown`, `sanitizarUrl`, `markdownParaTexto`) | `@base-ui/react` · nothing |
| `/preencher` | `PreencherComDocumento`, `RevisaoPropostas`, `ProgressoLeitura`, `ListaDoQueFalta`, `RascunhoTexto`; `aplicarValores`, `valoresDoRascunho`, `pedirOQueFalta`, `pedirTexto` | `@base-ui/react` |
| `/assistente` | `ChatFlutuante` | `@base-ui/react` |
| `/formatar` · `/validar` | pt-PT formatters · identifier validators/normalisers | nothing |
| `/icones` | `GLIFOS_APPS`, `COR_MARCA_APP`, `BASE_ICONE`, `svgIconeApp` | nothing |
| `/sso` · `/apps` | `CAMINHOS`, `portalLoginUrl`, `safeReturnUrl`, `portalAfterLogoutUrl`, `urlAbsoluta`, `urlCartao` · `MUTUAL_APPS`, `APP_CARTAO`, `appsDisponiveis`, `nomeDaApp` | nothing |
| `/cerebro` | `pedirAoCerebro`, `CerebroIndisponivel`, `TEMPO_LIMITE_CEREBRO_MS`, `PAGINA_INDISPONIVEL` | nothing |
| `/seguranca` | `cabecalhosNext`, `comCsp`, `NONCE_CABECALHO` (plain JS + `.d.ts`) | nothing |
| `/monitor` · `/monitor/react` | `reportarErro`, `criarOnRequestError`, request ids · `MonitorCliente`, `ErroReportado`, `FronteiraErro` | nothing · React |
| `/preferencias` | preference helpers used by `PreferenciasScript` | nothing |

A `Record<MutualAppId, …>` in an app needs an entry for every app id.

## Release

Bump `package.json` `version`, commit, `git tag vX.Y.Z`, push the tag; each app bumps its `#vX.Y.Z`
ref and regenerates its lockfile (`pnpm install --ignore-workspace`). No tag for docs-only changes.

## New app checklist

`MUTUAL_APPS` (`src/apps.ts`), `CAMINHOS` (`src/sso.ts`), `--app-accent` (light + dark),
`--app-accent-soft`, `--app-marca` in `css/tokens.css`, glyph in `GLIFOS_APPS` + `COR_MARCA_APP`
(`src/icones.ts`), then `pnpm icones`. `tests/tokens.test.ts` checks the contrast pairs and that app hues
stay ≥ 30° apart in OKLCH.

## Favicons and home-screen icons

`pnpm icones` (`scripts/gerar-icones.mjs`) writes `assets/icones/<app>/`: `icon.svg`, `favicon.ico`
(16/32/48), `icone-16.png`, `icone-32.png`, `apple-icon.png` (180, full-bleed), `icone-192.png`/`-512.png`
(purpose any), `icone-mascaravel-192.png`/`-512.png` (maskable). Apps copy `icon.svg`, `favicon.ico` and
`apple-icon.png` into `app/`, the PNGs into `public/icones/`, and list 192/512 (any + maskable) in
`app/manifest.ts` with their basePath. `pnpm embed-logo` regenerates `src/logo-data.ts` from
`assets/mutual-flag-96.webp`.

## Tests and typecheck

- `pnpm typecheck` compiles with `exactOptionalPropertyTypes` (`tsconfig.json`, includes
  `tests/tipos-exatos.tsx`) and without it (`tsconfig.solto.json`). `tipos-exatos.tsx` passes every
  optional key as `undefined` to every export: a prop written `name?: T` fails and the error names the
  export. Props forwarded to Recharts/Base UI go through `opcional(chave, valor)` (`src/opcional.ts`).
- `pnpm test`: SSO, preferences, formatters, identifiers, chart/table helpers, dates, filtering,
  Markdown safety, conversation and assistant logic, demo docking, contrast of every token pair
  (`tokens.test.ts`, `dicas.test.ts`), shell wiring and motion (`shell.test.ts`).

## Showcase (visual review, not published)

```bash
cd showcase && pnpm install --ignore-workspace && pnpm build && bun serve.ts
# → http://localhost:5199/?tema=claro|escuro|contraste&texto=150&app=simplex&pagina=…
node showcase/verificar.mjs          # Playwright checks (server running)
node showcase/shots*.mjs <outDir>    # screenshots
```

Pages (`?pagina=`): `dados` (default), `controlos`, `efeitos`, `conversa`, `shells` (`&app=<id>`,
`&vista=todas`), `rolagem`, `demo`, `identificadores`, `icones`, `icones-shell`; `/ssr`
serves a server-rendered, hydrated fixture. The showcase resolves React, Recharts and Base UI from the
package's own devDependencies (one React copy); it installs only Tailwind.

## CI

`.github/workflows/ci.yml` (GitHub-hosted; push to `main`, PRs, `v*` tags): frozen install,
typecheck, tests, `pnpm audit`, showcase build, with `TZ=Europe/Lisbon`. Changes only to `**/*.md`,
`docs/**` or `LICENSE` do not run it.
