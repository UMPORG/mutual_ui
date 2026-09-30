# Surfaces, motion, scrollbars, effects

Colours and measured contrast: [identidade-visual.md](identidade-visual.md). Values: `css/tokens.css`.

## Surface classes

- Buttons: map the app's variants onto `m-btn m-btn-primary|destructive|outline|secondary|ghost` (or use
  `Button`/`buttonClasses()`). Disabled = flat neutral with muted text (≥ 7.4:1); pending (`aria-busy`)
  keeps its colour; Alto contraste: dashed edge.
- Panels `m-surface` (clickable: + `m-surface-interactive`); popovers, menus, dialogs `m-float`; inputs
  `m-field`; full-page screens without the shell (`SemAcesso`, public pages) `m-canvas` (neutral).
- Frame of the shell `bg-moldura` (+ `-hover`, `-selecao`), content layer `bg-camada`, app tile
  `bg-app-marca`. The ink tokens (`bg-sidebar`, `text-sidebar-*`, `text-app-accent-on-ink`) remain for
  tooltips and the Cartão; never hard-code an ink hex in an app.
- Page title `text-pagina` (1.75rem, line-height 1.25) for apps with their own header component.
- On `.bg-sidebar`, `.bg-nav-background`, `.m-tinta` the focus ring is `--sidebar-ring`; content inside
  them goes back to `--ring-conteudo`.
- High contrast flattens all surfaces.

## Motion

- Tokens: `--movimento-rapido` (120 ms), `--movimento-medio` (180 ms), `--movimento-lento` (240 ms),
  `--curva-entrada` (decelerate), `--curva-saida` (accelerate, exits), `--curva-padrao`, `--curva-mola`
  (soft spring for things settling in place). All become 0 under Reduzir movimento
  (`html[data-movimento="reduzido"]`) and `prefers-reduced-motion`.
- Only opacity and transform (and colours) move, never layout; exits are faster than entries; never a
  hand-written duration in an app.
- Shell G uses them for the launcher and account menu (fade + scale from their corner, staggered with
  `.m-menu-escalonado` + `--i`), the phone drawer, the current pill, the tab underline, press states
  (0.96–0.98), the content fade on navigation and the Acessibilidade panel. Base UI layers (`.m-pop`,
  `.m-dialog`, `.m-sheet`, `.m-backdrop`, `.m-painel`) and the Dica body use them too.
- `tests/shell.test.ts` checks tokens present, 0 under reduced motion, no layout property animated and
  no hand-written durations in `css/shell.css`.

## Scrollbars (`css/rolagem.css`, global)

- Thin rounded thumb (6px in a 12px lane, 8px and darker on hover), transparent track; ink variants apply
  automatically inside `.bg-sidebar`, `.bg-nav-background`, `.m-tinta`. Alto contraste: 16px lane, solid
  thumb; forced colours: system colours.
- **Never set `scrollbar-width`/`scrollbar-color` in an app** — Chrome then drops the shared look
  (`no-scrollbar` utilities that hide a bar are fine).
- Edge shadows on scrollers: `m-scroll-x`/`m-scroll-y` (CSS, server-safe; keep cells transparent) or
  `<ScrollShadow label="…">` (client; Firefox too, named region, in the Tab order only while it
  overflows) or `useScrollShadow(ref)`. Already in `DataTable`, `Tabs` (line), Markdown code/tables, the
  chart data table, `MessageList`, `DateRangePicker` quick ranges and `ScrollArea`.

## Effects (`@umporg/ui/efeitos`)

All are `aria-hidden`, pointer-transparent, DPR- and frame-capped, pause off screen and in hidden tabs,
stay still under Reduzir movimento and disappear in Alto contraste, forced colours and print. Take
`mascara`/`fadeTopo` so nothing moves behind text. Put them first inside a `relative overflow-hidden`
container and give the content `relative`. **One backdrop per screen; never behind work screens, tables
or forms.**

| Effect | Use on | Never on |
| --- | --- | --- |
| `AsciiFundo` (main entry) | entry only: Portal login and launcher header, QR first visit, `/sem-acesso` | anything else |
| `ConstelacaoFundo` | pages about the network (Portal «a rede», public «Sobre», associations directory) | forms, tables, work screens |
| `TopografiaFundo` | help centre hero, public section covers, onboarding intros | dashboards, lists |
| `MalhaFundo` (`tons` marca / app / bandeira / calmo) | public heroes with big type (Eventos), campaign bands | desk app work pages |
| `PontosFundo` | page-level empty states, 404, assistant greeting (`ChatEmptyState backdrop`) | inline empty states |
| `BrilhoDestaque` / `.m-brilho` | ONE featured card per page | several cards, status, errors |
| `Celebracao` / `MomentoSucesso` | once, at the end of a task («Inscrição confirmada») | ordinary saves (→ toast), page loads |

Desk apps (Backoffice, Simplex, Saúde, DNS, …): no backdrops on work pages; only `PontosFundo` on
page-level empty states and `MomentoSucesso` after submissions.
