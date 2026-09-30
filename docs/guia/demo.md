# Demo mode (`DEMO_MODE=true`, server env, never in production)

The demo environment presents MUTU@L to UMP leadership and associações. Demo = the `main` branch with
`DEMO_MODE=true`; demo-only code is inert without it.

## Everything demo-only lives in the «Demonstração» widget

If the widget is visible, the app is in demo mode — nothing else says so. No «Demonstração» / «Modo de
demonstração» badges, pills, chips, banners, notices («dados fictícios», «ambiente de demonstração»…)
or demo-only panels and buttons on the pages. Real states that are not the demo (e.g. DNS «Modo
simulado» from `DNS_MODO`) are not covered by this rule.

- **Page actions** that are not forms (sample codes, sample identifications, «repor dados»…):
  `useAcoesDemo({ id, titulo, descricao?, acoes: [{ id, nome, descricao?, desativada?, executar }] })`
  (or `registarAcoesDemo(grupo)`, which returns the unregister function). Memoise the group; pass `null`
  outside demo mode. The widget lists it between «Entrar como…» and the forms and closes the panel before
  `executar` runs.
- **Sign-in**: never hard-code demo accounts or put a sign-in panel on a login page. The Portal and
  Cartão logins register `useEntrarComoDemo({ destino: "portal" | "cartao", aoEntrar, api? })` (or
  `registarEntrarComo`); the widget shows «Entrar como…» at the top, loading `GET
  /api/v1/demo/personas?destino=…` and signing in with `POST /api/v1/demo/entrar` (no section on a
  404/empty list). Persona buttons carry `data-persona="<id>"` for e2e.

## Form scenarios (`DemoPreencher`)

- Render `<DemoPreencher ativo cenarios={…} />` once in the root layout.
- Every form has `data-demo-form="<id>"` and a `name` on each field. Non-native widgets (rich text, money
  cells, comboboxes) register with `registarPreenchedor(formId, fn)`; the `Campo*` identifier fields
  already carry a hidden named input.
- Scenarios live in the app's `lib/demo/cenarios.ts`: per form «Dados válidos» and at least one case that
  shows the form's reaction to a problem (validation error, full event, negative amount…). Realistic
  fictitious Portuguese data (NIF with valid check digit, IBAN PT50) — never real people. The Cérebro demo
  seed provides the matching data.
- Forms inside an open dialog or sheet get a «Preencher (demonstração)» strip inside that dialog
  automatically (in its focus trap); the floating pill hides while a modal is open.

## Placement

- The pill (48px, «Demonstração (n formulários)») docks bottom-right, else bottom-left, else mid-right —
  the first spot that covers neither the focused element, nor the forms' last actions, nor
  `[data-demo-evitar]` (`src/demo-doca.ts`).
- While active, `<html data-demo>` sets `--demo-reserva: 5rem` (0px otherwise) and
  `scroll-padding-bottom`. Give the page's scrolling area room with `m-demo-reserva` or
  `pb-[calc(2rem+var(--demo-reserva))]` (`.m-pagina` already does).
- An app with a fixed bottom navigation bar lifts the pill with `--demo-fundo` (e.g. `:root {
  --demo-fundo: 4.5rem }` on phones). No other app-specific demo padding or offsets.
- Keyboard: opening the panel focuses the first scenario; Escape closes and returns focus to the pill.
- Showcase `?pagina=demo`; `node showcase/verificar.mjs` checks the strip, focus trap, docking and
  reduced motion.
