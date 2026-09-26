import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Building2,
  CalendarDays,
  Download,
  FileText,
  Inbox,
  Landmark,
  MapPin,
  Plus,
  Receipt,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  DataTable,
  Delta,
  DescriptionList,
  EmptyState,
  FilterChips,
  formatarData,
  formatarMoeda,
  Meter,
  MutualWordmark,
  PageHeader,
  Pagination,
  ResultCount,
  SearchField,
  Section,
  Skeleton,
  Sparkline,
  StatCard,
  StatGroup,
  StatusBadge,
  StatusSummary,
  Toolbar,
  type Column,
} from "../src/index.ts";
import { ChartFrame, GraficoArea, GraficoBarras, GraficoDonut, GraficoLinhas } from "../src/graficos.tsx";

// ─── Demo data (fictional) ───────────────────────────────────────────────

const MESES = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"];
const mes = (v: unknown) => formatarData(`${String(v)}-15`, "mesAnoCurto").replace(/ \d{4}$/, "");

const quotasMes = MESES.map((m, i) => ({
  mes: m,
  recebido: [18250, 17420, 21980, 20310, 19870, 23140, 22410, 16980, 24560][i]!,
  previsto: [20000, 20000, 21000, 21000, 21000, 22000, 22000, 22000, 23000][i]!,
}));

const receitaDespesa = ["2022", "2023", "2024", "2025", "2026"].map((a, i) => ({
  ano: a,
  receita: [412000, 438500, 471200, 489900, 512300][i]!,
  despesa: [398700, 441200, 452800, 470100, 486400][i]!,
}));

const distritos = [
  { distrito: "Lisboa", n: 58 },
  { distrito: "Porto", n: 47 },
  { distrito: "Braga", n: 31 },
  { distrito: "Setúbal", n: 24 },
  { distrito: "Aveiro", n: 22 },
  { distrito: "Coimbra", n: 19 },
  { distrito: "Leiria", n: 15 },
  { distrito: "Faro", n: 12 },
];

const inscricoes = MESES.map((m, i) => ({
  mes: m,
  eventos: [120, 180, 240, 210, 320, 410, 280, 150, 390][i]!,
  formacoes: [80, 95, 130, 160, 150, 170, 140, 60, 210][i]!,
  webinars: [40, 60, 55, 90, 110, 95, 70, 30, 120][i]!,
  media: [90, 105, 130, 140, 160, 175, 150, 90, 190][i]!,
}));

const tesouraria = MESES.map((m, i) => ({ mes: m, saldo: [84200, 88100, 86900, 92300, 97800, 95400, 101200, 99800, 106500][i]! }));

const cobranca = MESES.map((m, i) => ({
  mes: m,
  pagas: [410, 432, 455, 470, 468, 490, 502, 488, 515][i]!,
  atraso: [62, 58, 51, 47, 52, 44, 39, 45, 36][i]!,
  isentas: [12, 12, 13, 13, 14, 14, 14, 15, 15][i]!,
}));

type Associacao = {
  id: string;
  nome: string;
  distrito: string;
  associados: number;
  quota: number;
  estado: "regular" | "atraso" | "pendente" | "suspensa";
  atualizada: string;
};

const ASSOCIACOES: Associacao[] = [
  { id: "a1", nome: "Associação Mutualista Aurora do Minho", distrito: "Braga", associados: 4820, quota: 12450.5, estado: "regular", atualizada: "2026-09-18" },
  { id: "a2", nome: "Montepio Operário de Setúbal", distrito: "Setúbal", associados: 2310, quota: 6120, estado: "atraso", atualizada: "2026-09-02" },
  { id: "a3", nome: "Associação de Socorros Mútuos Ribeira Nova", distrito: "Lisboa", associados: 12980, quota: 38740.25, estado: "regular", atualizada: "2026-09-21" },
  { id: "a4", nome: "Mutualidade Popular do Douro", distrito: "Porto", associados: 1760, quota: 4210, estado: "pendente", atualizada: "2026-08-29" },
  { id: "a5", nome: "Caixa de Previdência Serra da Estrela", distrito: "Guarda", associados: 890, quota: 2105.8, estado: "suspensa", atualizada: "2026-06-11" },
  { id: "a6", nome: "Associação Mutualista Farol do Sul", distrito: "Faro", associados: 3140, quota: 8890, estado: "regular", atualizada: "2026-09-19" },
];

const ESTADO: Record<Associacao["estado"], { tone: "success" | "warning" | "info" | "danger"; label: string }> = {
  regular: { tone: "success", label: "Regular" },
  atraso: { tone: "warning", label: "Quotas em atraso" },
  pendente: { tone: "info", label: "Por validar" },
  suspensa: { tone: "danger", label: "Suspensa" },
};

// ─── Page ────────────────────────────────────────────────────────────────

function Tema() {
  const q = new URLSearchParams(location.search);
  const atual = q.get("tema") ?? "claro";
  const link = (t: string, rotulo: string) => {
    const n = new URLSearchParams(q);
    n.set("tema", t);
    return (
      <a
        key={t}
        href={`?${n}`}
        aria-current={atual === t ? "true" : undefined}
        className={
          "inline-flex h-10 items-center rounded-lg px-3 text-[0.9375rem] font-medium " +
          (atual === t ? "bg-sidebar-accent text-sidebar-foreground" : "text-sidebar-muted-foreground hover:text-sidebar-foreground")
        }
      >
        {rotulo}
      </a>
    );
  };
  return <nav className="flex flex-wrap gap-1">{[link("claro", "Claro"), link("escuro", "Escuro"), link("contraste", "Alto contraste")]}</nav>;
}

function Tabela() {
  const [sort, setSort] = useState<{ id: string; direction: "asc" | "desc" }>({ id: "associados", direction: "desc" });
  const [pagina, setPagina] = useState(2);
  const [filtros, setFiltros] = useState([
    { id: "estado", label: "Estado", value: "Todas exceto suspensas" },
    { id: "distrito", label: "Distrito", value: "Norte e Centro" },
  ]);
  const linhas = useMemo(() => {
    const s = [...ASSOCIACOES];
    s.sort((a, b) => {
      const k = sort.id as keyof Associacao;
      const r = a[k] < b[k] ? -1 : a[k] > b[k] ? 1 : 0;
      return sort.direction === "asc" ? r : -r;
    });
    return s;
  }, [sort]);
  const colunas: Column<Associacao>[] = [
    { id: "nome", header: "Associação", cell: (r) => r.nome, sortable: true },
    { id: "distrito", header: "Distrito", cell: (r) => r.distrito, sortable: true },
    { id: "associados", header: "Associados", cell: (r) => r.associados.toLocaleString("pt-PT"), numeric: true, sortable: true },
    { id: "quota", header: "Quotas do ano", cell: (r) => formatarMoeda(r.quota), numeric: true, sortable: true },
    {
      id: "estado",
      header: "Estado",
      cell: (r) => <StatusBadge tone={ESTADO[r.estado].tone}>{ESTADO[r.estado].label}</StatusBadge>,
    },
    { id: "atualizada", header: "Atualizada em", cell: (r) => formatarData(r.atualizada), hideOnMobile: true, sortable: true },
  ];
  const ordenar = (id: string) =>
    setSort((s) => (s.id === id ? { id, direction: s.direction === "asc" ? "desc" : "asc" } : { id, direction: "asc" }));
  return (
    <DataTable
      caption="Associações"
      columns={colunas}
      rows={linhas}
      rowKey={(r) => r.id}
      rowHref={(r) => `#${r.id}`}
      sort={sort}
      onSort={ordenar}
      toolbar={
        <Toolbar
          search={<SearchField placeholder="Nome, NIF ou distrito" />}
          filters={
            <>
              <select aria-label="Estado" className="m-field h-11 rounded-lg px-3 text-base">
                <option>Todos os estados</option>
                <option>Regular</option>
                <option>Quotas em atraso</option>
              </select>
              <select aria-label="Distrito" className="m-field h-11 rounded-lg px-3 text-base">
                <option>Todos os distritos</option>
              </select>
            </>
          }
          actions={
            <>
              <button className="m-btn m-btn-outline inline-flex h-11 items-center gap-2 rounded-lg px-4">
                <Download aria-hidden size={18} /> Exportar
              </button>
              <button className="m-btn m-btn-primary inline-flex h-11 items-center gap-2 rounded-lg px-4">
                <Plus aria-hidden size={18} /> Nova associação
              </button>
            </>
          }
          summary={<ResultCount count={126} total={312} singular="associação" plural="associações" />}
          chips={
            <FilterChips
              filters={filtros.map((f) => ({ ...f, onRemove: () => setFiltros((x) => x.filter((y) => y.id !== f.id)) }))}
              onClear={() => setFiltros([])}
            />
          }
        />
      }
      footer={<Pagination page={pagina} pageCount={7} totalItems={126} pageSize={20} onPageChange={setPagina} />}
    />
  );
}

function Estado({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{titulo}</p>
      {children}
    </div>
  );
}

function App() {
  const colunasMini: Column<Associacao>[] = [
    { id: "nome", header: "Associação", cell: (r) => r.nome },
    { id: "associados", header: "Associados", cell: (r) => r.associados, numeric: true },
  ];
  return (
    <div className="min-h-dvh m-canvas">
      <header className="bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-[84rem] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <MutualWordmark app="backoffice" tone="ink" />
          <Tema />
        </div>
      </header>
      <main className="mx-auto flex max-w-[84rem] flex-col gap-12 px-4 py-8 sm:px-8">
        <PageHeader
          breadcrumbs={[{ label: "Início", href: "#" }, { label: "Painel" }]}
          title="Painel da UMP"
          description="Situação das associações e das quotas em setembro de 2026."
          actions={
            <>
              <button className="m-btn m-btn-outline inline-flex h-11 items-center gap-2 rounded-lg px-4">
                <CalendarDays aria-hidden size={18} /> Últimos 12 meses
              </button>
              <button className="m-btn m-btn-primary inline-flex h-11 items-center gap-2 rounded-lg px-4">
                <FileText aria-hidden size={18} /> Relatório
              </button>
            </>
          }
          className="mb-0"
        />

        <Section id="s-ind" title="Indicadores" description="Valores do ano até hoje, comparados com o mesmo período de 2025.">
          <StatGroup>
            <StatCard
              label="Associações ativas"
              value={312}
              icon={<Building2 />}
              delta={{ value: 0.034, label: "face a 2025" }}
              trend={[286, 289, 291, 294, 296, 299, 301, 305, 308, 312]}
              href="#"
            />
            <StatCard
              label="Quotas recebidas"
              value={184350.5}
              format="moeda"
              icon={<Receipt />}
              delta={{ value: -0.021, label: "face a 2025" }}
              trend={[16200, 17900, 17100, 18800, 19400, 18100, 20300, 19800, 18400]}
            />
            <StatCard
              label="Taxa de cobrança"
              value={0.912}
              format="percentagem"
              icon={<Landmark />}
              delta={{ value: 2.1, format: "pontos", label: "face a 2025" }}
              description="Das quotas emitidas este ano"
            />
            <StatCard
              label="Pedidos por validar"
              value={18}
              unit="pedidos"
              icon={<Inbox />}
              delta={{ value: 5, format: "numero", better: "descer", label: "desde segunda-feira" }}
              href="#"
              accent
            />
          </StatGroup>
        </Section>

        <Section id="s-est" title="Estados dos indicadores" level={2}>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <Estado titulo="Número principal">
              <StatCard
                size="hero"
                label="Associados abrangidos"
                value={1_248_930}
                unit="pessoas"
                delta={{ value: 0.012, label: "face a 2025" }}
                description="Em 312 associações de todo o país"
              />
            </Estado>
            <Estado titulo="A carregar">
              <StatCard label="Quotas em atraso" value={null} loading />
            </Estado>
            <Estado titulo="Erro e sem alteração">
              <div className="flex flex-col gap-4">
                <StatCard label="Receita de eventos" value={null} error="Indisponível de momento" />
                <StatCard label="Protocolos em vigor" value={46} delta={{ value: 0, format: "numero", label: "face ao mês anterior" }} />
              </div>
            </Estado>
          </div>
        </Section>

        <Section id="s-car" title="Cartões e listas de dados">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card accent="app" className="lg:col-span-2">
              <CardHeader
                title="Associação Mutualista Aurora do Minho"
                description="Instituição particular de solidariedade social desde 1932."
                icon={<Building2 />}
                actions={
                  <>
                    <StatusBadge tone="success">Regular</StatusBadge>
                    <button className="m-btn m-btn-outline inline-flex h-10 items-center rounded-lg px-3 text-[0.9375rem]">Editar</button>
                  </>
                }
                divider
              />
              <CardContent>
                <DescriptionList
                  columns={3}
                  items={[
                    { term: "NIF", details: "501 234 569" },
                    { term: "Distrito", details: "Braga", icon: <MapPin /> },
                    { term: "Associados", details: "4820", icon: <Users /> },
                    { term: "Quota anual", details: formatarMoeda(12450.5) },
                    { term: "Última atualização", details: formatarData("2026-09-18", "longa") },
                    { term: "Presidente da direção", details: "Maria Helena Carvalho" },
                    { term: "Sede", details: "Rua do Souto, 118, 4700-329 Braga", wide: true },
                  ]}
                />
              </CardContent>
              <CardFooter>
                <span>Dados validados pela UMP em 18/09/2026.</span>
                <a href="#" className="font-medium text-primary underline-offset-4 hover:underline">
                  Ver histórico
                </a>
              </CardFooter>
            </Card>
            <div className="flex flex-col gap-4">
              <Card href="#" as="article">
                <CardHeader title="Licenças a renovar" description="7 licenças terminam nos próximos 30 dias." icon={<FileText />} level={3} />
                <CardContent className="pt-2">
                  <Sparkline values={[3, 4, 2, 5, 6, 4, 7]} label="Licenças a terminar por semana: de 3 para 7" />
                </CardContent>
              </Card>
              <Card variant="muted">
                <CardHeader title="Contactos" level={3} />
                <CardContent>
                  <DescriptionList
                    layout="rows"
                    items={[
                      { term: "Telefone", details: "253 000 118" },
                      { term: "Email", details: "geral@aurora-minho.pt" },
                    ]}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </Section>

        <Section id="s-met" title="Proporções e estados">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader title="Ocupação dos eventos" description="Inscrições face aos lugares disponíveis." level={3} />
              <CardContent className="flex flex-col gap-5">
                <Meter label="Congresso Nacional 2026" value={372} max={400} detail="372 de 400" thresholds={{ warning: 0.85, danger: 1 }} statusLabel="Quase esgotado" />
                <Meter label="Formação em gestão financeira" value={18} max={40} detail="18 de 40" />
                <Meter label="Encontro regional do Norte" value={120} max={120} detail="120 de 120" thresholds={{ warning: 0.85, danger: 1 }} statusLabel="Esgotado" />
                <Meter label="Cobertura da caracterização" value={0.64} tone="accent" size="sm" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader title="Quotas por estado" description="Ano de 2026." level={3} />
              <CardContent>
                <StatusSummary
                  label="Quotas por estado"
                  totalLabel="Quotas emitidas"
                  items={[
                    { label: "Pagas", value: 515, tone: "success", href: "#" },
                    { label: "Em atraso", value: 36, tone: "warning", href: "#" },
                    { label: "Por validar", value: 22, tone: "info", href: "#" },
                    { label: "Anuladas", value: 9, tone: "danger", href: "#" },
                    { label: "Isentas", value: 15, tone: "neutral", href: "#" },
                  ]}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader title="Resumo sobre uma lista" description="Linha de estados que também filtra." level={3} />
              <CardContent>
                <StatusSummary
                  variant="inline"
                  label="Associações por estado"
                  items={[
                    { label: "Regulares", value: 241, tone: "success", onSelect: () => {}, selected: true },
                    { label: "Com atraso", value: 48, tone: "warning", onSelect: () => {} },
                    { label: "Suspensas", value: 23, tone: "danger", onSelect: () => {} },
                  ]}
                />
                <div className="mt-5 flex flex-col gap-2">
                  <p className="text-[0.9375rem] text-muted-foreground">Variação isolada</p>
                  <Delta value={-0.052} better="descer" label="de dívida face a agosto" />
                  <Delta value={0.18} label="de inscrições face a 2025" />
                </div>
              </CardContent>
            </Card>
          </div>
        </Section>

        <Section id="s-graf" title="Gráficos" description="Paleta MUTU@L validada para daltonismo, modo escuro e alto contraste.">
          <div className="grid gap-4 lg:grid-cols-2">
            <GraficoBarras
              title="Quotas recebidas por mês"
              description="Euros recebidos em 2026."
              data={quotasMes}
              categoryKey="mes"
              categoryLabel="Mês"
              formatCategory={mes}
              series={[{ key: "recebido", label: "Recebido" }]}
              format="moeda"
            />
            <GraficoBarras
              title="Receita e despesa"
              description="Contas consolidadas das associações, por ano."
              data={receitaDespesa}
              categoryKey="ano"
              categoryLabel="Ano"
              series={[
                { key: "receita", label: "Receita" },
                { key: "despesa", label: "Despesa" },
              ]}
              format="moeda"
            />
            <GraficoLinhas
              title="Inscrições por tipo"
              description="Pessoas inscritas por mês, com a média dos últimos três anos."
              data={inscricoes}
              categoryKey="mes"
              categoryLabel="Mês"
              formatCategory={mes}
              series={[
                { key: "eventos", label: "Eventos" },
                { key: "formacoes", label: "Formações" },
                { key: "webinars", label: "Sessões online" },
                { key: "media", label: "Média 2023–2025" },
              ]}
              context={["media"]}
            />
            <GraficoBarras
              title="Associações por distrito"
              description="Os oito distritos com mais associações."
              data={distritos}
              categoryKey="distrito"
              categoryLabel="Distrito"
              series={[{ key: "n", label: "Associações" }]}
              orientation="horizontal"
              highlight="Braga"
            />
            <GraficoArea
              title="Saldo de tesouraria"
              description="Saldo no fim de cada mês."
              data={tesouraria}
              categoryKey="mes"
              categoryLabel="Mês"
              formatCategory={mes}
              series={[{ key: "saldo", label: "Saldo" }]}
              format="moeda"
            />
            <GraficoBarras
              title="Quotas emitidas por estado"
              description="Número de quotas por mês."
              data={cobranca}
              categoryKey="mes"
              categoryLabel="Mês"
              formatCategory={mes}
              stacked
              series={[
                { key: "pagas", label: "Pagas", color: "sucesso" },
                { key: "atraso", label: "Em atraso", color: "aviso" },
                { key: "isentas", label: "Isentas", color: "outros" },
              ]}
            />
            <GraficoDonut
              title="Inscrições por origem"
              description="Setembro de 2026."
              totalLabel="inscrições"
              data={[
                { label: "Associados", value: 812 },
                { label: "Dirigentes", value: 214 },
                { label: "Público em geral", value: 173 },
                { label: "Convidados", value: 96 },
                { label: "Imprensa", value: 21 },
                { label: "Oradores", value: 18 },
              ]}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <ChartFrame title="A carregar" loading height={200}>
                {null}
              </ChartFrame>
              <GraficoBarras
                title="Sem dados"
                data={[]}
                categoryKey="x"
                series={[{ key: "y", label: "Valor" }]}
                height={200}
              />
            </div>
          </div>
        </Section>

        <Section id="s-tab" title="Tabela de dados" description="Pesquisa, filtros, ordenação, paginação e cartões no telemóvel.">
          <Tabela />
        </Section>

        <Section id="s-tabest" title="Estados da tabela">
          <div className="grid gap-4 lg:grid-cols-3">
            <Estado titulo="A carregar">
              <DataTable caption="Associações" columns={colunasMini} rows={[]} rowKey={(r) => r.id} loading skeletonRows={3} />
            </Estado>
            <Estado titulo="Sem resultados">
              <DataTable
                caption="Associações"
                columns={colunasMini}
                rows={[]}
                rowKey={(r) => r.id}
                empty={
                  <EmptyState variant="inline" icon={<Inbox />} title="Nenhuma associação encontrada" action={<button className="m-btn m-btn-outline h-11 rounded-lg px-4">Limpar filtros</button>}>
                    Experimente outro nome ou distrito.
                  </EmptyState>
                }
              />
            </Estado>
            <Estado titulo="Erro">
              <DataTable
                caption="Associações"
                columns={colunasMini}
                rows={[]}
                rowKey={(r) => r.id}
                error="Não foi possível carregar as associações."
                onRetry={() => {}}
              />
            </Estado>
          </div>
        </Section>

        <Section id="s-vaz" title="Vazio e marcadores de carregamento">
          <div className="grid gap-4 lg:grid-cols-2">
            <EmptyState icon={<Receipt />} title="Ainda não há pagamentos" action={<button className="m-btn m-btn-primary h-11 rounded-lg px-4">Registar pagamento</button>}>
              Os pagamentos de quotas aparecem aqui quando forem registados.
            </EmptyState>
            <Card>
              <CardHeader title="Últimos movimentos" level={3} />
              <CardContent className="flex flex-col gap-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          </div>
        </Section>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
