# Data pages: formatters, cards, stats, charts, tables

Rules: one headline number → `StatCard`, not a one-bar chart; a few → `StatGroup`; the one number a
dashboard leads with → `StatCard size="hero"` (one per page). Filters in ONE `Toolbar` row above what
they scope, never inside a chart card; refetch keeps the frame (`refreshing`), no skeleton flash.
Chart palette and its validation: [identidade-visual.md](identidade-visual.md).

## Formatters (`@umporg/ui` or `/formatar`)

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

pt-PT, Europe/Lisbon. Missing values are «—» everywhere (never «0,00 €»). pt-PT groups thousands from
five digits: «1234» but «12 345». Pure helpers (`dados.ts`): `calcularVariacao`, `formatarVariacao`,
`descreverVariacao` (words for screen readers), `paginasVisiveis`, `intervaloPagina`, `agruparOutros`,
`atribuirCores`, `tabelaDoGrafico`, `descreverGrafico`. Identifiers (phone, NIF, IBAN):
[formularios.md](formularios.md#identifiers-phones-nif-código-postal-iban).

## Card, Section, DescriptionList (server-safe)

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
<DescriptionList columns={3} items={[{ term: "NIF", details: "501 234 569" }, { term: "Sede", details: morada, wide: true }]} />
<DescriptionList layout="rows" items={…} />             {/* term | value; stacks when narrow */}
```

`Card` is `m-surface`; padding lives in the parts so tables sit flush. `accent="app"` is identity (3px
line in the app colour), never status. Heading levels: `CardHeader level` (2 on a page, 3 inside a
`Section`).

## StatCard, StatGroup, Delta, Sparkline, Meter, StatusSummary (server-safe)

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
<Meter label="Congresso 2026" value={372} max={400} detail="372 de 400"
  thresholds={{ warning: 0.85, danger: 1 }} statusLabel="Quase esgotado" />
<StatusSummary label="Quotas por estado" totalLabel="Quotas emitidas" items={[
  { label: "Pagas", value: 515, tone: "success", href: "?estado=paga" },
  { label: "Em atraso", value: 36, tone: "warning", href: "?estado=atraso" },
]} />
<StatusSummary variant="inline" items={[{ label: "Regulares", value: 241, tone: "success", onSelect, selected }]} />
```

- `delta.value` is a fraction for `"percentagem"` (0.034 = +3,4%), points for `"pontos"`, units for
  `"numero"`/`"moeda"`. `better="descer"` for debts, delays, open requests. Colour = direction ×
  good/bad; the arrow and a screen-reader sentence always go with it.
- Values ≥ 100 000 are shortened («184,4 mil €», exact in the tooltip and for screen readers);
  `compact={false}` turns it off; the hero stays exact up to 10 million.
- `Sparkline values={…}`: grey history, brand dot on the current value; decorative unless `label`.
- `StatusSummary variant="inline"` = the line above a list (items can filter it); `variant="bar"` =
  dashboard proportion bar + legend. Use it instead of a pie of states.

## Charts (`@umporg/ui/graficos`, client, `recharts` optional peer)

```tsx
<GraficoBarras title="Quotas recebidas por mês" description="Euros recebidos em 2026."
  data={linhas} categoryKey="mes" categoryLabel="Mês"
  formatCategory={(m) => formatarData(`${m}-01`, "mesAnoCurto")}
  series={[{ key: "recebido", label: "Recebido" }]} format="moeda" />
<GraficoBarras … orientation="horizontal" highlight="Braga" />
<GraficoBarras … stacked series={[{ key: "pagas", label: "Pagas", color: "sucesso" }, …]} />
<GraficoLinhas … context={["media"]} domain={[0, 1]} format="percentagem" />
<GraficoArea … series={[{ key: "saldo", label: "Saldo" }]} format="moeda" />
<GraficoDonut title="Inscrições por origem" data={[{ label: "Associados", value: 812 }, …]} totalLabel="inscrições" />
```

- Every chart is a `ChartFrame`: card, title (`level`, default h3), description, legend for ≥ 2 series,
  «Ver dados» table, svg `title`/`desc` summary, keyboard focus (Tab, arrows move the tooltip), pt-PT
  axes, `loading`, `refreshing`, `empty`, no animation under Reduzir movimento. Heights scale with text.
- Form first: single value → `StatCard`; states → `StatusSummary`; close values → bars, not a donut.
  Never two y-axes. Counts get whole-number ticks (`format="contagem"`/`"inteiro"`, or automatic).
- Series use `--serie-1..8` in declared order; pin `color: 1..8` when a filter can remove series. More
  than 8 series throws — fold into «Outros» (`--serie-outros`) or split. Donut: ≤ 4 slices + «Outros».
  Status colours (`color: "sucesso" | "aviso" | "perigo" | "info"`) only when the series is a status.
- Own chart (map, heatmap, SVG): wrap it in `ChartFrame` with `legend` and `table`; use `var(--serie-N)`,
  `var(--grafico-grelha)`, `var(--grafico-eixo)`. No raw palette classes or hex.

## DataTable, Toolbar, SearchField, FilterChips, Pagination, Skeleton (server-safe)

The shell renders; the app keeps its data logic (URL state, server pagination…). Server pages use the
`…Href` props; client components use `onSort` / `onPageChange` / `onRemove`.

```tsx
const colunas: Column<Associacao>[] = [
  { id: "nome", header: "Associação", cell: (r) => r.nome, sortable: true }, // first = phone card title
  { id: "associados", header: "Associados", cell: (r) => formatarNumero(r.associados), numeric: true, sortable: true },
  { id: "estado", header: "Estado", cell: (r) => <StatusBadge tone={…}>{…}</StatusBadge> },
  { id: "atualizada", header: "Atualizada em", cell: (r) => formatarData(r.atualizada), hideOnMobile: true },
];
<DataTable caption="Associações" columns={colunas} rows={linhas} rowKey={(r) => r.id}
  rowHref={(r) => `/associacoes/${r.id}`} LinkComponent={Link}
  sort={{ id: "associados", direction: "desc" }} sortHref={(id) => `?ordem=${id}`}
  loading={aCarregar} refreshing={aAtualizar}
  error={erro && "Não foi possível carregar as associações."} onRetry={refetch}
  empty={<EmptyState variant="inline" icon={<Inbox />} title="Nenhuma associação encontrada">Experimente outro nome.</EmptyState>}
  toolbar={<Toolbar
    search={<SearchField placeholder="Nome, NIF ou distrito" defaultValue={q} />}
    filters={<>{/* selects, class m-field h-11 */}</>}
    actions={<>{/* Exportar */}</>}
    summary={<ResultCount count={126} total={312} singular="associação" plural="associações" />}
    chips={<FilterChips filters={[{ id: "estado", label: "Estado", value: "Em atraso", removeHref: "?…" }]} clearHref="?" />}
  />}
  footer={<Pagination page={2} pageCount={7} totalItems={126} pageSize={20} hrefFor={(p) => `?pagina=${p}`} />}
/>
```

- Phones (< 48rem): each row becomes a card (first column as title); `mobile="scroll"` keeps the table
  and scrolls it sideways. Put sorting in the toolbar if phones need it.
- `numeric` columns are right-aligned with tabular figures; `stickyEnd` keeps a row-actions column
  visible while scrolling sideways.
- The horizontal scroller is a focusable, named `role="group"`. Name each `Pagination` (`label`) when a
  page has two paginated lists.
- `Skeleton className="h-4 w-40"` for custom placeholders (stops under Reduzir movimento).

## GrelhaEditavel (client, `@umporg/ui`)

Editable grid for typing a value per row and column (e.g. grades and results per trainee; columns defined at
run time). **Controlled and without saving**: the page owns the values, shows «Guardar» in the `PageHeader`
and the «Alterações por guardar» count. Read-only data stays in `DataTable`.

```tsx
const colunas: ColunaGrelha[] = [
  { chave: "nota", rotulo: "Nota final", tipo: "numero", min: 0, max: 20, casas: 1, obrigatoria: true },
  { chave: "aprovado", rotulo: "Aprovado", tipo: "simNao" },
  { chave: "resultado", rotulo: "Resultado", tipo: "escolha", opcoes: [{ valor: "ap", rotulo: "Aprovado" }] },
  { chave: "conclusao", rotulo: "Data de conclusão", tipo: "data" },
  { chave: "obs", rotulo: "Observações", tipo: "texto" },
];
<GrelhaEditavel legenda="Notas dos formandos" rotuloNome="Formando" colunas={colunas}
  linhas={linhas /* { id, nome, valores: { nota: 15.5, … } } */}
  aoAlterar={(alteracoes, novosErros) => { /* apply, mark dirty, merge errors */ }}
  erros={erros /* { [chaveCelula(linhaId, chave)]: "mensagem" } */}
  alteradas={alteradas /* Set<chaveCelula> */}
  selecionadas={sel} aoSelecionar={(ids) => …} />   {/* selection column only with aoSelecionar */}
```

- Values: `numero` → number, `texto` → string, `data` → `"AAAA-MM-DD"`, `simNao` → boolean, `escolha` → option
  `valor`; empty = `null`. `aoAlterar(alteracoes, erros)`: the app applies `alteracoes`, deletes the errors of
  those cells and adds `erros` (unreadable typed or pasted text, with the text kept in `ErroCelula.texto`).
- Semantics: `role="grid"`, name column = `rowheader`, every cell named «Linha, Coluna: valor», one tab stop
  (roving), so Tab leaves the grid. Errors show as text with an icon below the value
  (`aria-describedby`); changed cells carry an icon and hidden text.
- Keys on a focused cell: arrows, Home/End (row), Ctrl+Home/End, PageUp/PageDown move; Enter or F2 or a click
  edits; typing a character starts a number/text edit; Delete clears. In edit: arrows move the caret, Enter
  commits and goes down (Shift+Enter up), Esc restores. Yes/no: two `aria-pressed` buttons; Enter on the cell
  focuses them, ←/→ switch, Enter picks and goes down; picking the pressed one clears it.
- Paste: tab/newline text (Excel, Sheets) pasted on a cell fills the block from there; `0,5`/`0.5`,
  `dd/mm/aaaa`, Sim/Não and option labels are read per column. Pure helpers (`analisarColagem`,
  `aplicarColagem`, `converterTexto`, `textoDaCelula`, `moverNaGrelha`) are exported and unit tested.
- The grid scrolls sideways inside its own box; the name column (and selection column) stay fixed. Columns are at
  least 6.5 rem wide, and a cell error wraps inside its cell (the row grows), so it is never clipped or widened.
- Row actions: `renderAcoes={(linha) => <Button …/>}` (+ `rotuloAcoes`, default «Ações») adds a last column with
  the app's own controls. Arrows/Home/End reach the cell («Linha, Ações»); Enter or F2 moves focus into the
  controls, where Tab moves between them, and Esc returns to the cell. Outside that the controls are out of the
  Tab order, so the grid stays one tab stop. Paste never reaches it. It is a plain last column (not sticky-right):
  with the name column fixed on the left, a second fixed column would leave a phone almost no room for the data;
  the column is reached by scrolling the grid or with End. Give each control a name with the row (e.g.
  «Ver ficha de Ana») and ≥ 44 px.
