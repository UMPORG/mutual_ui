import { Building2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, DataTable, formatarData, formatarMoeda, Section, StatusBadge, type Column } from "../src/index.ts";
import { ScrollArea, ScrollShadow, Tabs } from "../src/controlos.ts";
import { Markdown } from "../src/markdown.tsx";

/** v0.8 — scrollbars and edge shadows, vertical and horizontal. */

type Linha = { id: string; nome: string; nif: string; distrito: string; concelho: string; associados: number; quota: number; estado: string; atualizada: string; email: string };

const DISTRITOS = ["Braga", "Setúbal", "Lisboa", "Porto", "Guarda", "Faro", "Coimbra", "Aveiro", "Leiria", "Viseu", "Évora", "Beja"];
const LINHAS: Linha[] = DISTRITOS.map((d, i) => ({
  id: `l${i}`,
  nome: `Associação Mutualista de ${d}`,
  nif: `50${(1234567 + i * 7919).toString().slice(0, 7)}`,
  distrito: d,
  concelho: d,
  associados: 800 + i * 431,
  quota: 2100 + i * 1873.5,
  estado: i % 4 === 1 ? "Quotas em atraso" : "Regular",
  atualizada: `2026-09-${String(10 + i).padStart(2, "0")}`,
  email: `geral@mutualista-${d.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "")}.pt`,
}));

const COLUNAS: Column<Linha>[] = [
  { id: "nome", header: "Associação", cell: (r) => <span className="whitespace-nowrap">{r.nome}</span> },
  { id: "nif", header: "NIF", cell: (r) => r.nif, numeric: true },
  { id: "distrito", header: "Distrito", cell: (r) => r.distrito },
  { id: "concelho", header: "Concelho", cell: (r) => r.concelho },
  { id: "associados", header: "Associados", cell: (r) => r.associados.toLocaleString("pt-PT"), numeric: true },
  { id: "quota", header: "Quotas do ano", cell: (r) => formatarMoeda(r.quota), numeric: true },
  { id: "estado", header: "Estado", cell: (r) => <StatusBadge tone={r.estado === "Regular" ? "success" : "warning"}>{r.estado}</StatusBadge> },
  { id: "atualizada", header: "Atualizada em", cell: (r) => formatarData(r.atualizada) },
  { id: "email", header: "Email", cell: (r) => r.email },
];

const CODIGO = [
  "Exemplo de um bloco de código com uma linha comprida:",
  "",
  "```ts",
  "const quotas = await fetch(`/api/v1/associacoes/${id}/quotas?ano=2026&estado=em-atraso&ordem=-valor&pagina=1&por-pagina=50`).then((r) => r.json());",
  "```",
].join("\n");

const ITENS = Array.from({ length: 30 }, (_, i) => `Associação Mutualista n.º ${i + 1}`);

export function PaginaRolagem() {
  return (
    <div className="flex flex-col gap-12">
      <Section id="r-vertical" title="Rolagem vertical" description="A barra é fina; cresce e escurece sob o ponteiro. As sombras dizem que há mais conteúdo.">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader title="Lista nativa (m-scroll-y)" level={3} divider />
            <CardContent flush>
              <ul data-rolo="lista" tabIndex={0} aria-label="Lista nativa" className="m-scroll-y h-64 divide-y divide-border/70">
                {ITENS.map((t) => (
                  <li key={t} className="px-5 py-2.5 text-[0.9375rem]">
                    {t}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader title="ScrollArea (Base UI)" level={3} divider />
            <ScrollArea className="h-64" label="Lista em ScrollArea">
              <ul className="divide-y divide-border/70">
                {ITENS.map((t) => (
                  <li key={t} className="px-5 py-2.5 text-[0.9375rem]">
                    {t}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </Card>
          <div data-rolo="tinta" className="flex h-[21.5rem] flex-col gap-2 rounded-xl bg-sidebar p-3 text-sidebar-foreground">
            <p className="px-2 text-sm font-semibold text-sidebar-muted-foreground">Na barra lateral</p>
            <nav aria-label="Exemplo de navegação" className="min-h-0 flex-1 overflow-y-auto">
              <ul className="flex flex-col gap-0.5">
                {ITENS.slice(0, 20).map((t, i) => (
                  <li key={t}>
                    <span className={"flex min-h-10 items-center gap-2 rounded-lg px-2.5 text-[0.9375rem] " + (i === 2 ? "bg-sidebar-accent font-semibold" : "text-sidebar-muted-foreground")}>
                      <Building2 aria-hidden size={16} /> {t}
                    </span>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </Section>

      <Section id="r-horizontal" title="Rolagem horizontal" description="Tabelas largas, separadores, código e faixas: a mesma barra e sombras nas pontas.">
        <div className="flex flex-col gap-6">
          <div data-rolo="tabela">
            <DataTable caption="Associações (tabela larga)" showCaption columns={COLUNAS} rows={LINHAS} rowKey={(r) => r.id} mobile="scroll" />
          </div>
          <Card>
            <CardContent>
              <div data-rolo="separadores">
                <Tabs
                  label="Secções do evento"
                  tabs={["Resumo", "Inscrições", "Convites", "Presenças", "Pagamentos", "Faturas", "Certificados", "Alojamento", "Transportes", "Relatórios", "Definições", "Histórico"].map((t, i) => ({
                    value: t,
                    label: t,
                    count: i === 1 ? 372 : undefined,
                    content: <p className="pt-4 text-[0.9375rem] text-muted-foreground">Conteúdo de «{t}».</p>,
                  }))}
                />
              </div>
            </CardContent>
          </Card>
          <div data-rolo="codigo" className="max-w-3xl">
            <Markdown>{CODIGO}</Markdown>
          </div>
          <Card>
            <CardHeader title="ScrollShadow (qualquer faixa)" level={3} divider />
            <CardContent>
              <ScrollShadow label="Próximos eventos" data-rolo="faixa" className="flex gap-3 pb-2">
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} className="m-surface flex w-48 shrink-0 flex-col gap-1 px-4 py-3">
                    <span className="text-sm text-muted-foreground">{formatarData(`2026-10-${String(3 + i * 2).padStart(2, "0")}`, "diaMes")}</span>
                    <span className="font-semibold">Formação {i + 1}</span>
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <Users aria-hidden size={14} /> {20 + i * 3} inscritos
                    </span>
                  </div>
                ))}
              </ScrollShadow>
            </CardContent>
          </Card>
          <Card>
            <CardHeader title="ScrollArea horizontal" level={3} divider />
            <ScrollArea orientation="horizontal" label="Etapas" viewportClassName="pb-3">
              <div className="flex w-max gap-2 p-4">
                {Array.from({ length: 16 }, (_, i) => (
                  <span key={i} className="rounded-full border border-border px-3 py-1.5 text-sm whitespace-nowrap">
                    Etapa {i + 1}
                  </span>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </Section>
    </div>
  );
}
