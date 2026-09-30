import {
  BarChart3,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  GraduationCap,
  Handshake,
  House,
  Inbox,
  Plus,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import {
  AppShell,
  PageHeader,
  ProcuraApp,
  Separadores,
  StatusBadge,
  nomeDaApp,
  type GrupoNavApp,
  type MutualAppId,
} from "../src/index.ts";

/**
 * Shell G in a real page: `?pagina=shells&app=<id>` is the full
 * AppShell of that app (top bar, tinted frame, navigation, one content
 * layer); `?pagina=shells&vista=todas` shows every app side by side (one
 * iframe each, in the chosen theme) to check that no two apps look alike.
 */

const TODAS: MutualAppId[] = ["portal", "backoffice", "eventos", "simplex", "saude", "qr", "dns", "assistente", "protocolos", "monitor"];

const NAV_BACKOFFICE: GrupoNavApp[] = [
  { itens: [{ href: "/inicio", rotulo: "Início", icone: House }] },
  {
    titulo: "Rede mutualista",
    itens: [
      { href: "/associacoes", rotulo: "Associações", icone: Building2 },
      { href: "/associados", rotulo: "Associados", icone: Users },
      { href: "/pedidos", rotulo: "Pedidos de adesão", icone: Inbox, contador: 3, contadorRotulo: "3 pedidos por decidir" },
    ],
  },
  {
    titulo: "Acompanhamento",
    itens: [
      { href: "/caracterizacao", rotulo: "Caracterização", icone: ClipboardList },
      { href: "/licencas", rotulo: "Licenças", icone: ShieldCheck },
      { href: "/indicadores", rotulo: "Indicadores", icone: BarChart3 },
    ],
  },
  {
    titulo: "Serviços",
    itens: [
      { href: "/pagamentos", rotulo: "Pagamentos online", icone: Wallet },
      { href: "/protocolos", rotulo: "Protocolos", icone: Handshake, externo: true },
    ],
  },
];

const NAV_SIMPLES: GrupoNavApp[] = [
  {
    itens: [
      { href: "/inicio", rotulo: "Início", icone: House },
      { href: "/caracterizacao", rotulo: "Eventos", icone: CalendarDays },
      { href: "/formacoes", rotulo: "Formações", icone: GraduationCap },
      { href: "/relatorios", rotulo: "Relatórios", icone: BarChart3 },
      { href: "/definicoes", rotulo: "Definições", icone: Settings },
    ],
  },
];

const LINHAS: [string, string, string, "info" | "neutral"][] = [
  ["Caracterização 2026", "1 set – 31 out 2026", "52 de 87", "info"],
  ["Caracterização 2025", "1 set – 31 out 2025", "84 de 86", "neutral"],
  ["Caracterização 2024", "2 set – 15 nov 2024", "79 de 85", "neutral"],
  ["Caracterização 2023", "1 set – 31 out 2023", "80 de 84", "neutral"],
];

function Conteudo({ nome }: { nome: string }) {
  return (
    <div className="m-pagina">
      <PageHeader
        breadcrumbs={[{ label: "Acompanhamento" }]}
        title="Caracterização"
        description={`Questionário anual às associações — exemplo da moldura de ${nome}.`}
        actions={
          /* The page's own action is the primary button of its header
             (never in the navigation); on phones it wraps under the title. */
          <a href="#nova" className="m-btn m-btn-primary inline-flex min-h-11 items-center gap-2 rounded-lg px-4">
            <Plus aria-hidden size={20} /> Nova campanha
          </a>
        }
        separadores={
          <Separadores
            rotulo="Secções da caracterização"
            itens={[
              { href: "/campanhas", rotulo: "Campanhas", ativo: true },
              { href: "/respostas", rotulo: "Respostas" },
              { href: "/estatisticas", rotulo: "Estatísticas nacionais" },
              { href: "/documentos", rotulo: "Documentos públicos" },
              { href: "/regioes", rotulo: "Regiões" },
            ]}
          />
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {["Ano: 2026", "Estado", "Região"].map((c) => (
          <button key={c} type="button" className="m-btn m-btn-outline inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3.5">
            {c} <ChevronDown aria-hidden size={16} />
          </button>
        ))}
        <button type="button" className="m-btn m-btn-outline ml-auto inline-flex min-h-11 items-center rounded-lg px-4">
          Exportar respostas
        </button>
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {[
          ["Associações convidadas", "87"],
          ["Respostas submetidas", "52"],
          ["Ainda por responder", "35"],
        ].map(([r, v]) => (
          <div key={r} className="m-surface px-5 py-4">
            <p className="text-sm text-muted-foreground">{r}</p>
            <p className="text-2xl font-bold">{v}</p>
          </div>
        ))}
      </div>
      <div className="m-surface overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-sm text-muted-foreground">
            <tr>
              {["Campanha", "Período", "Respostas", "Estado"].map((c) => (
                <th key={c} className="border-b border-border px-5 py-3 font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LINHAS.map(([n, p, r, e]) => (
              <tr key={n} className="border-b border-border last:border-0">
                <td className="px-5 py-3.5">
                  <a href="#" className="font-semibold underline decoration-border underline-offset-4">
                    {n}
                  </a>
                </td>
                <td className="px-5 py-3.5">{p}</td>
                <td className="px-5 py-3.5">{r}</td>
                <td className="px-5 py-3.5">
                  <StatusBadge tone={e}>{e === "info" ? "A decorrer" : "Fechada"}</StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PaginaShells() {
  const q = new URLSearchParams(location.search);
  if (q.get("vista") === "todas") {
    const tema = q.get("tema") ?? "claro";
    return (
      <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
        {TODAS.map((a) => (
          <iframe
            key={a}
            title={`Moldura — ${a}`}
            src={`?pagina=shells&app=${a}&tema=${tema}&movimento=reduzido`}
            className="h-[32rem] w-full rounded-xl border border-border bg-background"
          />
        ))}
      </div>
    );
  }
  const app = (document.documentElement.dataset.app ?? "backoffice") as Exclude<MutualAppId, "cartao">;
  const nome = nomeDaApp(app) ?? app;
  const semNav = app === "qr" || app === "portal";
  return (
    <AppShell
      app={app}
      caminhoAtual="/caracterizacao"
      disponiveis={TODAS}
      conta={
        app === "qr"
          ? undefined
          : {
              nome: "Ana Martins",
              perfil: "Serviços centrais",
              organizacao: "União das Mutualidades Portuguesas",
              variasOrganizacoes: true,
              onTerminarSessao: () => alert("Terminar sessão"),
            }
      }
      navegacao={semNav ? undefined : app === "backoffice" ? NAV_BACKOFFICE : NAV_SIMPLES}
      procura={app === "qr" ? undefined : <ProcuraApp rotulo={`Procurar em ${nome}`} onProcurar={() => undefined} />}
      inicioHref="#"
    >
      <Conteudo nome={nome} />
    </AppShell>
  );
}
