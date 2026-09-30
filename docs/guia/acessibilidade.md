# Accessibility, preferences, copy, tips, tours

## Floor (every app)

- WCAG AA; Alto contraste reaches 7:1. Base text 16px, secondary ≥ 14px; targets ≥ 44px (48px in primary
  flows and shell items). A small-looking control keeps a 44px hit area with an `::after` (chips, tags).
- Everything works in Claro, Escuro, Alto contraste, at 150% text, with Espaçamento amplo and at 390px
  wide: no clipped text, no overlap, no horizontal page scroll. Never hard-code light-only colours.
- Status never by colour alone. Errors of the person's own action and results are persistent
  `StatusCallout`s; toasts only confirm. Destructive actions: `ConfirmDialog`, verb «Eliminar», undo where
  reversible.
- No single-key global shortcuts (WCAG 2.1.4). No native `title` tooltips (touch has none).
- Landmarks never nest: components that live inside the shell's `<main>` render `<div>`/labelled
  `<section>`, not `<main>`/`<aside>`.

## Preferences (`AcessibilidadeMenu`, `PreferenciasScript`)

- One Acessibilidade menu, in the shell top bar (`tone="moldura"`), the public header, or `compacto` on
  small bars: theme Automático / Claro / Escuro / Alto contraste, text size, Espaçamento amplo, Reduzir
  movimento. Link `declaracaoHref` to the app's accessibility statement. No `next-themes`, local theme
  toggles or theme pages.
- The choices follow the person across apps because every app shares one origin.
- `<PreferenciasScript />` is a plain inline `<script>` in the `<head>` of the **server** root layout,
  with `suppressHydrationWarning` on `<html>` and the CSP nonce. Never `next/script` (`beforeInteractive`
  runs too late: the default theme flashes). A development-only React notice about the inline script is
  harmless.

## Production copy (pt-PT, all of Portugal)

The apps are used by the UMP and associações across the country; text is for them.

- Say what the person gets or must do, never how the system works. Banned: «ecossistema», «SSO»,
  «sessão partilhada», «Cérebro», «API», «token», «proxy», «cookie» (except the cookie notice),
  «sistema de design», internal app codes, English words («scans» → «leituras»).
- Short formal pt-PT, imperatives («Indique», «Escolha», «Guarde»), one idea per sentence, no
  exclamation marks, no emoji, no abbreviations in navigation.
- Headlines name the place («Portal MUTU@L», «Eventos e formações»); sub-lines optional and ≤ 1 line.
- Never raw enums or ISO dates: words and `dd/MM/yyyy` or «sábado, 3 de outubro de 2026».
- Help text explains a field only when its meaning is not obvious.
- Examples: «Use o email e a palavra-passe da sua conta MUTU@L.» → «Indique o seu email e
  palavra-passe.»; «Acesso reservado às equipas… peça-a aos serviços da UMP.» → «Ainda não tem conta?
  Contacte o super administrador da sua organização.»

## Tips (`Dica`)

- Tips about a screen or a field only through `<Dica id="<app>.dica.<nome>" titulo …>`: one calm line
  (info icon + title, `role="note"`); the explanation and «Saber mais» (`saberMais`, `LinkComponent`)
  open on demand (`aria-expanded`); a 48px «Fechar a dica» icon button remembered on the device
  (`localStorage`, never throws; `dicaDispensada`/`dispensarDica`/`reporDica`). `rotuloReabrir` leaves a
  quiet way back; `avisoAoFechar` is read by screen readers; `dispensavel={false}` = on-demand field help
  (renders on the server).
- Never a full-width «Percebi», never between a card and its primary action (put it after). No entrance
  animation; not printed.
- Colours `--dica`, `--dica-foreground`, `--dica-texto`, `--dica-borda`, `--dica-icone`, `--dica-ligacao`
  (title/body/link ≥ 7:1, icon ≥ 4.5:1, border ≥ 3:1; `tests/dicas.test.ts`). An app with its own palette
  (Cartão) redefines those six names and re-measures them. Classes `m-nota*` in `css/dicas.css`
  (`.m-dica` is the sidebar tooltip).

## Tours

Never start a tour automatically. Offer it with a quiet «Ver como funciona» button (page header or help
page). No idle hints, no first-visit pop-ups, no badges nagging to take a tour. Stable targets:
`[data-shell=…]` ([shell.md](shell.md)). Long help belongs in the Portal help centre (`/ajuda/<app>`).
