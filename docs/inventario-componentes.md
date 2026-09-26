# Inventário de componentes de dados — v0.6.0 (2026-09-26)

Levantamento (só leitura) de como as aplicações constroem hoje os painéis e
as páginas de dados, e o componente de `@umporg/ui` que substitui cada
padrão. Serve de guia para a vaga de adoção. **Nenhuma aplicação importa
ainda cartões, indicadores, gráficos, tabelas ou formatadores do pacote.**
Todas usam Next 16 e `@umporg/ui` v0.5.1.

Siglas: BO = Backoffice, SX = Simplex, EV = Eventos, SA = Saúde, PO = Portal.

## 1. Resumo por padrão

| Padrão | Variações encontradas | Componente-alvo |
| --- | --- | --- |
| **Indicador / KPI** | 3 `StatCard` diferentes: BO (`tone`, `href`, `loading`, `error`, valor `text-3xl`), SX (`accent` com roxo cru, `alvoVisita`, sem `href` nem `loading`, valor `text-2xl`), EV (`accent` com classes de paleta crua `text-amber-500`/`text-emerald-600`, `href`, `description` obrigatória, `StatCardSkeleton`). Mosaicos ad hoc: BO `MiniStat` (kpis), botões de contagem em `formularios/*`, SX `IndicadorRow` (diagnóstico). **Nenhum tem variação nem tendência**: BO simula-as com o ícone `TrendingUp`/`TrendingDown` e texto. ~12 ficheiros. | `StatCard` (`label`, `value`, `format`, `unit`, `delta`, `trend`, `href`, `icon`, `accent`, `size="hero"`, `loading`, `error`) |
| **Grelha de indicadores** | `grid sm:grid-cols-2 lg:grid-cols-4` até `xl:grid-cols-6`. | `StatGroup` (auto-fit, encolhe com texto grande) |
| **Linha de estados sobre uma lista** | BO `ListSummary` (15 páginas): "48 associações · 45 ativas", com pontos de cor e itens que filtram (`aria-pressed`). | `StatusSummary variant="inline"` (ícone + palavras + contagem, `onSelect`/`href`, `selected`) |
| **Contagens por estado** | SX `LegendaEstados` + `BadgeEstado`; o "donut" de estados do BO `kpis` (`var(--success)`/`var(--destructive)`). | `StatusSummary variant="bar"` |
| **Variação isolada** | SX benchmarks: "▲ acima / ▼ abaixo da mediana" com `text-success`/`text-destructive`. | `Delta` (seta + sinal + palavras; `better="descer"` para dívidas e atrasos) |
| **Cartão / secção** | shadcn `Card`: SA (19 ficheiros), EV (4), BO (2). Marcação crua `rounded-xl m-surface` com cabeçalho `border-b px-5 py-4 text-sm font-semibold`: BO (~36 ficheiros), SX (~41). SX `SecaoCartao`, `<details className="m-surface">` recolhíveis (4). `ChartCard` locais no BO e no SX, com duas implementações. PO `Mosaico` (lançador). | `Card` + `CardHeader` (`title`, `description`, `actions`, `icon`, `divider`, `level`) + `CardContent` (`flush` para tabelas) + `CardFooter`; `Card href` para cartões clicáveis; `accent="app"` para identidade; `Section` para títulos de bloco sem superfície |
| **Lista de descrição** | SA balcão `<dl grid-cols-[auto_1fr]>`, EV `MetaRow` com ícone (6), SX glossários (4). Nenhuma no BO: usam `div`s. | `DescriptionList` (`layout="grid"` para fichas, `layout="rows"` para painéis de detalhe; `icon`, `wide`) |
| **Barra de progresso / medidor** | SX cobertura (`bg-emerald-500` cru). EV ocupação (`lib/taxas-evento.ts` devolve `bg-amber-500`/`bg-blue-500`/`bg-red-500`). EV `DistribuicaoBarChart` em barras HTML. BO `role="progressbar"` em passos (3). | `Meter` (`thresholds` → aviso/perigo com ícone + palavras; trilho do mesmo tom) |
| **Gráficos** | Recharts só no BO (v3.10.1: 13 barras, 8 circulares, 1 linhas) e no SX (v3.10.0: 16 linhas, 4 barras, 1 circular). EV usa SVG feito à mão com `role="img"`. **Três paletas em concorrência**: BO `chartColorAt()` com `var(--grafico-N)` e 12 tons Tailwind × 3 temas; SX `var(--chart-1..9)` redefinidos com hex; o pacote tinha `--chart-1..5`. Alturas de 180 a 320 px fixas (BO) ou `h-56`/`h-64` (SX). Estilo do tooltip copiado de ficheiro para ficheiro. Alternativa acessível só no BO `kpis` (`ChartSrTable`). `EmptyChart` e `ChartEmpty` duplicados. | `GraficoBarras`, `GraficoLinhas`, `GraficoArea`, `GraficoDonut` (de `@umporg/ui/graficos`), `ChartFrame` para gráficos próprios, `Sparkline` (SVG, sem Recharts), paleta `--serie-1..8` validada |
| **Tabela** | 3 cópias quase iguais de `data-table.tsx` (BO, SX, EV): Toolbar/Left/Right, `SortableTableHead`, `TableEmpty`, `DataTableCount`. Só o BO tem `stackOnMobile`; o EV tem `TableSkeleton`; o SX envolve tudo em `ListagemFinanceira`, orientada a colunas. SA usa shadcn `Table`; PO usa `<table>` crua com cartões no telemóvel. TanStack Table está declarado no SX e no EV mas não é usado; o BO proíbe-o. | `DataTable` (colunas por configuração, `cell` render prop, ordenação por `onSort` ou `sortHref`, cartões no telemóvel, estados a carregar / a atualizar / vazio / erro, `rowHref`) |
| **Barra de ferramentas / filtros** | BO `SearchBar` + `NativeSelect`; EV `SearchBar` + `Select` + multi-filtro em menu + visibilidade de colunas; SX `FiltroSelect`/`campos-filtro`; PO pesquisa + selects + "Limpar filtros". | `Toolbar` (`search`, `filters`, `actions`, `summary`, `chips`), `SearchField`, `FilterChips`, `ResultCount` |
| **Paginação** | BO `Pagination` (reticências + "N resultados · Página x de y", no cliente via nuqs); SX `Pagination` + linhas por página; EV no servidor (20/50/100); PO `Paginacao` (anterior/seguinte); BO `ListPaginator` local no painel. SA não tem. | `Pagination` (`hrefFor` para servidor, `onPageChange` para cliente, `pageSizeControl`, "A mostrar 21–40 de 312") |
| **Vazio** | `EmptyState` do pacote (PO, SA, BO×1); EV `EmptyState` local; BO `TableEmpty`/`DataListShell`/`EmptyChart`; SX `ListagemAcaoVazio`/`ChartEmpty`/`div`s tracejadas. | `EmptyState` (`variant="page"` ou `"inline"` dentro de cartões, tabelas e gráficos) |
| **A carregar** | BO `LoadingGuard` (23), `TableSkeleton`, `DataListShell`, pulso no `StatCard`; SX `LoadingGuard` (43) + `Spinner` + 6 variantes de esqueleto; EV `LoadingNote` + `Skeleton` + 3 esqueletos; SA/PO rodas `Loader2`. | `Skeleton`, `StatCard loading`, `DataTable loading` / `refreshing`, `ChartFrame loading` / `refreshing` |
| **Erro de carregamento** | BO `ErrorState` (com repetir); SX `ErroCarregamento`; EV `erro-carregamento.tsx`; resto `StatusCallout tone="danger"`. | `DataTable error` + `onRetry`, `StatCard error`; fora de dados, `StatusCallout` |
| **Formatação pt-PT** | Moeda: BO `formatCurrency`/`formatPrice` ("—" se vazio), SX `formatEuro` (33 ficheiros, "0,00 €" se vazio), EV `formatarEuro`, SA `eur` local. Datas: BO `formatDate`/`formatDateTime`, SX ~13 `dateFmt` locais, EV `lib/datas.ts` (Lisboa) + date-fns, SA date-fns. Percentagens: SX com 2 `formatPercent` e ~12 `pctFmt`/`racioFmt`; nos outros, `${n}%` e `Math.round(x*100)`. Inteiros: `toLocaleString("pt-PT")`; a maioria sem formato. Meses: BO `formatMes` à mão ("Jan 25"). | `formatarNumero`, `formatarMoeda`, `formatarPercentagem`, `formatarData` (8 estilos, Europe/Lisbon), `formatarValor`, `formatarEixo`, `contar`. **Decisão:** um valor em falta é sempre "—", nunca "0,00 €". |

## 2. Por aplicação

### Backoffice (35 páginas, Recharts 3.10.1)

- `app/admin/painel/page.tsx` — 6 `StatCard` em `xl:grid-cols-6`, listas ordenadas com `ListPaginator` → `StatGroup` + `StatCard` (com `delta` face ao período anterior), listas em `Card` + `CardHeader divider` + `CardContent flush`, `Pagination`.
- `app/admin/kpis/page.tsx` — 4 `StatCard` com tendência simulada, `MiniStat`, `ChartCard` local, LineChart, BarChart vertical e horizontal, donut; `ChartSrTable`, `formatMes`, `CHART_TOOLTIP_STYLE` → `StatCard delta/trend`, `GraficoLinhas`, `GraficoBarras orientation="horizontal"`, `GraficoDonut` (ou `StatusSummary` quando as fatias são estados), `formatarData(v, "mesAnoCurto")`.
- `app/admin/formularios/*` (6 páginas) — BarChart/PieChart sem alternativa acessível, mosaicos de contagem clicáveis → `GraficoBarras` (a tabela "Ver dados" passa a existir), `StatusSummary variant="inline"` para os mosaicos que filtram.
- `components/admin-dashboard-cards.tsx`, `associacao-dashboard-cards.tsx` → `StatCard`.
- 17 páginas de lista (`DataTableToolbar`, `stackOnMobile`, `TableEmpty`, `DataTableCount`, `ListSummary`, `SearchBar`, `NativeSelect`, `Pagination`) → `DataTable` + `Toolbar` + `SearchField` + `ResultCount` + `StatusSummary variant="inline"` + `FilterChips` + `Pagination`. Mantêm `useDataList`/nuqs.
- `lib/chart-colors.ts` e os `--grafico-*` de `globals.css` → eliminar e usar `--serie-*`.
- `lib/format.ts` → reexportar os formatadores do pacote (mesmo comportamento "—").

### Simplex (68 páginas, Recharts 3.10.0)

- `components/admin/dashboard-stats.tsx`, `components/associacao/dashboard-stats.tsx` — `StatCard` (acento roxo cru), PieChart com percentagens, BarChart empilhado, BarChart vertical, LineChart 0–100%, `ChartCard`/`ChartEmpty` locais, barra de cobertura `bg-emerald-500` → `StatCard`, `GraficoDonut`, `GraficoBarras stacked` (cores de estado `sucesso`/`aviso`), `GraficoLinhas domain={[0, 1]} format="percentagem"`, `Meter` para a cobertura.
- `*-historico-chart.tsx` (6) — LineChart multi-série com `CLASSE_TEXTO_GRAFICO` → `GraficoLinhas`; a série de referência vai para `context`.
- `components/diagnostico/diagnostico-relatorio.tsx` — `IndicadorRow`, linhas e barras agrupadas → `StatCard` + `DescriptionList`, `GraficoBarras`, `GraficoLinhas`.
- `*-benchmark.tsx` — posição face à mediana → `Delta` (`format="numero"` ou `"pontos"`).
- `ListagemFinanceira` (11 listagens) → `DataTable`, com as colunas de `lib/listagem.ts` mapeadas para `Column` (`euro` → `numeric` + `formatarMoeda`, `percentagem` → `formatarPercentagem`, `data` → `formatarData`); ordenação e paginação no cliente mantêm-se.
- `SecaoCartao` e `<details className="m-surface">` → `Card` + `CardHeader`, ou `Section`.
- `lib/estado-cores.ts` (`ACENTO_*` com laranja, roxo e ardósia crus) → tons de estado e `accent="app"`.
- `lib/formato-euro.ts` e os ~25 `pctFmt`/`dateFmt` locais → formatadores do pacote. **Atenção:** "0,00 €" passa a "—" quando o valor falta.

### Eventos (21 páginas, sem Recharts)

- `components/contadores.tsx`, `evento-metricas.tsx`, `relatorio/report-view.tsx`, `formacoes-pagina.tsx`, `participantes-separador.tsx` — `StatCard` com paleta crua → `StatCard` (receita com `format="moeda"`, ocupação com `format="percentagem"`).
- `components/relatorio/report-charts.tsx` — `ParticipacaoPieChart`, `DistribuicaoBarChart`, `CheckinsLineChart` em SVG → `GraficoDonut`, `GraficoBarras orientation="horizontal"`, `GraficoArea` (é preciso acrescentar `recharts` às dependências) ou, se não quiserem o Recharts, `ChartFrame` + o SVG atual com as cores `--serie-*`.
- `lib/taxas-evento.ts` (barra de ocupação com cores cruas) → `Meter thresholds={{ warning: 0.85, danger: 1 }}`.
- `components/participantes-table.tsx` (1197 linhas; servidor, filtros, colunas) → `DataTable` + `Toolbar` + `FilterChips` + `Pagination hrefFor`/`onPageChange`. A lógica de dados fica igual.
- `MetaRow` → `DescriptionList` com `icon`.
- `components/ui/empty-state.tsx`, `ui/status-callout.tsx` locais → os do pacote.
- `lib/format.ts` `formatarEuro`, `lib/datas.ts` → `formatarMoeda`, `formatarData` (manter só as funções de agenda que não existem no pacote).

### Saúde (18 páginas)

- `app/(app)/rede/page.tsx` — grelha de `Card` com listas `divide-y` e `Badge` → `Card` + `CardHeader` + `CardContent flush`, `StatusBadge`.
- `app/(app)/balcao/page.tsx` — `<dl>` "Dados do associado" → `DescriptionList layout="rows"`.
- `agenda`, `utentes`, `unidades`, `protocolos` → `Card`/`CardHeader`; resultados de pesquisa → `DataTable` com `SearchField`.
- Tabelas shadcn (`auditoria`, `acessos-emergencia`, `reconciliacao`, `relatorio-conservacao`) → `DataTable` (ganham cartões no telemóvel e `Pagination`).
- date-fns `format(…, "dd/MM/yyyy HH:mm")` → `formatarData(v, "dataHora")`; `eur` local → `formatarMoeda`.

### Portal (15 páginas)

- `components/lancador.tsx` `Mosaico` → `Card href` com `accent="app"` e `data-app` por mosaico, ou mantê-lo (já está em `m-surface`) e trocar apenas o rodapé por `CardFooter`.
- `components/acessos/pessoas.tsx` (tabela crua com cartões no telemóvel, `Paginacao` local, pesquisa, selects, "Limpar filtros") → `DataTable` + `Toolbar` + `FilterChips` + `Pagination hrefFor`. `convites.tsx` e `perfis.tsx` seguem o mesmo padrão.
- Faixa de estado dos serviços → `StatusSummary variant="inline"`.

## 3. Paleta dos gráficos (decisão)

Uma só paleta categórica, **"MUTU@L"**, em `css/dados.css`. O verde da marca
vem primeiro, seguido de uma ordem fixa de tons: verde, azul, magenta, amarelo,
água, laranja, violeta e vermelho. Foi validada com o verificador do método
dataviz (ΔE OKLab ×100, simulação Machado 2009):

| Modo | Superfície | CVD adjacente (pior par) | Visão normal (pior par) | Contraste |
| --- | --- | --- | --- | --- |
| Claro | `#ffffff` | 9,1 | 19,6 | 3 tons abaixo de 3:1: há sempre "Ver dados" e legenda |
| Escuro | `#1d231f` | 8,4 | 19,3 | todos ≥ 3:1 |
| Alto contraste | `#ffffff` | 10,6 | 16,6 | todos ≥ 5:1 |

Os quatro primeiros tons passam o teste de todos os pares nos dois modos
(13,0 no claro, 9,4 no escuro). Por isso o `GraficoDonut` mostra no máximo 4
fatias mais "Outros". Nunca há um 9.º tom: o resto agrupa-se em "Outros". A
cor segue a entidade: para fixar um tom usa-se `color`. Os estados usam as
suas próprias cores (`sucesso`, `aviso`, `perigo`, `info`), nunca um tom da
série.
