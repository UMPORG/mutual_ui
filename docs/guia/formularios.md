# Forms and controls

## `FormField` around every control

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

- The field wires `id`, `aria-describedby` (error, hint, count), `aria-invalid`, `aria-required`; it
  never owns the value (react-hook-form, TanStack Form, server actions and plain forms all work).
- Mark the minority: `required` («*» + «obrigatório» for screen readers) or `optional`. The accessible
  name is label + mark with a space: `getByLabel("NIF (obrigatório)")`, `getByLabel("Observações
  (opcional)")`. Never write «(opcional)» into the label text.
- Invalid fields (`aria-invalid`) get a red border and a light `--destructive-soft` tint (Alto contraste:
  3px dark red border); the icon + message stay.
- `Checkbox`, `Switch`, `RadioGroup`: the visible label names the focusable control (`aria-labelledby`),
  also in server HTML, so `getByLabel`/`getByRole(…, { name })` work. `Switch` whose visible label is only
  the state takes `aria-labelledby` (field label first) or `aria-label`.

## Which control — and when not

| Need | Use | Not |
| --- | --- | --- |
| One of ≤ 6 visible options | `RadioGroup` (in a `Fieldset`) | `Select` (hides the options) |
| One of a few options that need a description or icon | `RadioCards` | — |
| One of ~7–15 fixed options | `Select` | — |
| Long plain list on phones, GET filter forms, no-JS pages | `NativeSelect` | `Select` / `Combobox` |
| Many options, or a remote search (associação, utente) | `Combobox` (`onSearch`, accents ignored, `onCreate` for «Criar «…»») | a `Select` with 200 items |
| Several values | `MultiSelect` (chips, `max`) | many checkboxes in a dropdown |
| A setting that applies at once | `Switch` | inside a form saved with a button → `Checkbox` |
| Views of the same content (Lista / Mapa) | `SegmentedControl` | form values |
| Sibling sections of one thing | `Tabs` (`line` under the page header, `pill` inside cards; `useUrlParam` keeps it in the address) | steps (→ `Stepper`), page navigation (→ links / `Separadores`) |
| Optional or secondary content, FAQ | `Accordion`, `Collapsible` | hiding required fields |
| Actions of a row, card or page | `DropdownMenu` (destructive last, after a separator) | navigation, form values |
| The same actions on right-click | `ContextMenu` — always also reachable another way | the only way to an action |
| Name of an icon-only button | `Tooltip` + the same `aria-label` | essential information |
| Small interactive panel tied to a button | `Popover` | long forms (→ `Dialog` / `Sheet`) |
| A task to finish or cancel | `Dialog` (`dismissible={false}` when it holds typed data) | messages (→ `StatusCallout`) |
| Confirming a destructive action | `ConfirmDialog` (focus starts on «Cancelar», double-click guard, `pending`, `error` stays inside) | a button that changes its label |
| Hard-to-undo actions (DNS zone, revoke all accesses) | `ConfirmDialog confirmText="…"` (typed confirmation) | — |
| Detail next to a list | `Sheet` (`side="right"`; `"bottom"` on phones) | a new page for three fields |
| Confirm what the person just did | `toast.success("Alterações guardadas.", { action: { label: "Anular", onClick } })` + one `<Toaster />` | errors, warnings, anything to read |
| A date | `DatePicker` (types «3/10/2026», «hoje»; Monday first; Europe/Lisbon; ISO values) | birth dates on phones → `native` |
| A period | `DateRangePicker` (quick ranges, two months on desktop) | two separate pickers |
| An exact number with limits | `NumberField` (pt-PT format, − / +) | `Slider` |
| An approximate value on a range | `Slider` (`onValueCommitted` to fetch) | exact amounts |
| Wizard steps | `Stepper` (collapses to «Passo 2 de 5» on phones) | tabs |
| A short wait inside a control | `Spinner`; lists and cards keep `Skeleton` | full-page spinners |

## Layout classes (`css/controlos.css`)

- **Fields side by side**: a grid with `m-campos-alinhados` + `m-campos-2|3|4` (fields per line from
  40rem, one per line below; a Tailwind `grid-cols-*` on the same element replaces the tracks). Each
  `FormField` (`m-campo`: `m-campo-rotulo`, `m-campo-ajuda`, control, `m-campo-mensagem`) takes four
  subgrid rows, so a wrapped label or hint, an error or a «26 de 254» count never misaligns the controls
  of a line. An element around a field shares the rows only when the field is its only child; a line's
  button (e.g. «Retirar») goes in `<div class="m-campos-acao">`.
- **Sub-sections**: `<fieldset class="m-subseccao">` + `<legend>` + `<p class="m-subseccao-ajuda">` — the
  heading inside a neutral card, never the legend cutting the border (`m-subseccao-simples`: no card).
  Buttons placed directly inside keep their width.
- **Action bar** at the end of a form or step: `<div class="m-barra-acoes"><div
  class="m-barra-acoes-corpo">…` — in the flow, no rule, no grey band, sticky at the bottom of the
  content layer and lifted only while stuck.

## Identifiers: phones, NIF, código postal, IBAN

Never format or validate them by hand in an app.

- **Store normalised**: phones E.164 (`+351222084177`), NIF/NIPC 9 digits, código postal `4000-123`,
  IBAN in capitals without spaces. Normalise where the value enters (form schema, API body).
- **Show** with `formatarTelefone` («222 084 177»; foreign «+44 207 946 0958»; `{ indicativo: true }`),
  `hrefTelefone` (`tel:` or `null`), `formatarNif`, `formatarCodigoPostal`, `formatarIban`; unreadable
  values shown as they came, empty «—». `<Telefone numero icone copiar semLigacao vazio />` for display
  (44px hit area); `BotaoCopiar` for any copy button.
- **Validate** (`@umporg/ui/validar`, pure): `normalizarTelefone|Nif|CodigoPostal|Iban` → value or
  `null`; `validarTelefone(v, { tipo: "movel" | "fixo", indicativo })`, `validarNif(v, { tipo:
  "singular" | "coletiva" })`, `validarNipc`, `validarCodigoPostal`, `validarIban(v, { pais: "PT" })` →
  `{ valido: true, valor }` or `{ valido: false, erro }` (pt-PT message for `FormField error`). zod 4:
  `z.string().transform(comZod(validarTelefone))` (`{ opcional: true }` turns "" into `null`). The
  Cérebro mirror (`src/lib/identificadores.ts`) carries the same messages — change both.
- **Type** with `CampoTelefone` (country list, +351 default, mask, pasting «+44…»/«00351…» switches the
  country, `semIndicativo`), `CampoNif`, `CampoCodigoPostal`, `CampoIban`, inside `FormField`.
  `value`/`onValueChange` carry the normalised value; `name` goes on a hidden input, so plain forms and
  `DemoPreencher` work. A full NIF/código postal field overtypes (`digitosAoEscrever`): a digit typed in
  the middle replaces the next one. TanStack Form: `value={field.state.value}
  onValueChange={field.handleChange} onBlur={field.handleBlur}`.
