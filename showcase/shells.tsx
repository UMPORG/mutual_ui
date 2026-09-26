import { Bell, Building2, ChevronDown, FileText, LayoutDashboard, Menu, Receipt, Settings, Users, Wallet } from "lucide-react";
import { MutualFlag, MutualWordmark, type MutualAppId } from "../src/index.ts";

/**
 * v0.8 — every app's shell side by side: the tinted sidebar, the mobile top
 * bar and the content canvas (accent rule + light band). `?vista=lado`
 * shows light, dark and high contrast next to each other (one iframe per
 * theme, so each is the real theme, not an imitation).
 */

type AppDemo = { id: string; nome: string; proposta?: boolean; pagina: string; descricao: string };

const APPS: AppDemo[] = [
  { id: "portal", nome: "Portal", pagina: "Aplicações", descricao: "As aplicações a que tem acesso." },
  { id: "backoffice", nome: "Backoffice", pagina: "Associações", descricao: "312 associações, 18 pedidos por validar." },
  { id: "eventos", nome: "Eventos", pagina: "Congresso 2026", descricao: "372 inscrições de 400 lugares." },
  { id: "simplex", nome: "Simplex", pagina: "Balanço de 2026", descricao: "Contas do 3.º trimestre por fechar." },
  { id: "saude", nome: "Saúde", pagina: "Balcão", descricao: "14 marcações para hoje." },
  { id: "dns", nome: "Servidores e DNS", pagina: "Endereços", descricao: "42 endereços em 3 servidores." },
  { id: "qr", nome: "Validador QR", pagina: "Leituras de hoje", descricao: "128 entradas validadas." },
  { id: "monitor", nome: "Monitor", proposta: true, pagina: "Estado dos serviços", descricao: "Todos os serviços a funcionar." },
  { id: "assistente", nome: "Assistente", proposta: true, pagina: "Conversas", descricao: "Pergunte o que precisa de saber." },
];

// The active entry is the app's own page, so no shell shows another app's
// menu (the Saúde shell used to highlight "Associações").
const nav = (app: AppDemo) => [
  { rotulo: "Painel", icon: LayoutDashboard },
  { rotulo: app.pagina, icon: Building2, ativo: true, contagem: 18 },
  { rotulo: "Pessoas", icon: Users },
  { rotulo: "Pagamentos", icon: Wallet },
  { rotulo: "Faturas", icon: Receipt },
  { rotulo: "Documentos", icon: FileText },
  { rotulo: "Avisos", icon: Bell },
  { rotulo: "Definições", icon: Settings },
];

function Marca({ app, tone = "ink" }: { app: AppDemo; tone?: "ink" | "default" }) {
  if (!app.proposta) return <MutualWordmark app={app.id as MutualAppId} tone={tone} size="sm" />;
  return (
    <span className="inline-flex items-center gap-2.5 leading-none">
      <MutualFlag height={20} />
      <span className="flex flex-col gap-1">
        <span className={"text-base font-bold tracking-tight " + (tone === "ink" ? "text-sidebar-foreground" : "text-foreground")}>MUTU@L</span>
        <span className={"text-[0.875rem] font-semibold tracking-wide " + (tone === "ink" ? "text-app-accent-on-ink" : "text-app-accent")}>{app.nome}</span>
      </span>
    </span>
  );
}

function Conteudo({ app }: { app: AppDemo }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">Início › {app.pagina}</p>
      <h3 className="text-xl font-bold tracking-tight">{app.pagina}</h3>
      <p className="text-[0.9375rem] text-muted-foreground">{app.descricao}</p>
      <div className="flex gap-2">
        <button className="m-btn m-btn-primary h-10 rounded-lg px-3 text-[0.9375rem]">Novo</button>
        <button className="m-btn m-btn-outline h-10 rounded-lg px-3 text-[0.9375rem]">Exportar</button>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="m-surface flex items-center justify-between gap-3 px-4 py-3">
          <span className="min-w-0 truncate text-[0.9375rem] font-medium">Registo de exemplo {i}</span>
          <a href="#" className="shrink-0 text-[0.9375rem] font-medium text-brand underline-offset-2 hover:underline">
            Abrir
          </a>
        </div>
      ))}
    </div>
  );
}

/** Desktop shell: tinted sidebar + canvas (as in the apps' dashboard-shell). */
function ShellSecretaria({ app }: { app: AppDemo }) {
  return (
    <div data-app={app.id} className="flex h-[22rem] min-w-0 overflow-hidden rounded-xl border border-border bg-sidebar shadow-sm">
      <aside aria-label={`Barra lateral — ${app.nome}`} className="flex w-52 shrink-0 flex-col gap-3 bg-sidebar py-3 text-sidebar-foreground">
        <div className="px-3">
          <Marca app={app} />
        </div>
        <div className="mx-3 flex h-9 items-center justify-between rounded-lg border border-sidebar-border px-2.5 text-sm font-medium text-sidebar-foreground">
          Aplicações <ChevronDown aria-hidden size={14} className="opacity-70" />
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto px-2" aria-label="Navegação">
          <ul className="flex flex-col gap-0.5">
            {nav(app).map(({ rotulo, icon: Icon, ativo, contagem }) => (
              <li key={rotulo}>
                <span
                  className={
                    "relative flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 text-[0.9375rem] " +
                    (ativo
                      ? "bg-sidebar-accent font-semibold text-sidebar-foreground before:absolute before:inset-y-1.5 before:left-0 before:w-1 before:rounded-full before:bg-app-accent-on-ink"
                      : "text-sidebar-muted-foreground")
                  }
                >
                  <Icon aria-hidden size={16} />
                  {rotulo}
                  {contagem ? (
                    <span className="ml-auto rounded-full bg-sidebar-primary px-1.5 text-xs font-semibold text-sidebar-primary-foreground tabular-nums">
                      {contagem}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mx-2 flex items-center gap-2 rounded-lg bg-sidebar-accent px-2.5 py-2">
          <span className="grid size-8 place-items-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">MS</span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold">Maria Silva</span>
            <span className="truncate text-xs text-sidebar-muted-foreground">Serviços da UMP</span>
          </span>
        </div>
      </aside>
      <main className="m-canvas min-w-0 flex-1 overflow-y-auto rounded-tl-xl p-4">
        <Conteudo app={app} />
      </main>
    </div>
  );
}

/** Phone shell: the top bar wears the same tint. */
function ShellTelemovel({ app }: { app: AppDemo }) {
  return (
    <div data-app={app.id} className="flex h-[22rem] w-[15.5rem] shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-sidebar shadow-sm">
      <div className="flex min-h-12 items-center gap-2 bg-sidebar px-2 text-sidebar-foreground">
        <span className="grid size-10 place-items-center rounded-lg">
          <Menu aria-hidden size={20} />
        </span>
        <MutualFlag height={18} />
        <span className="ml-auto truncate pr-2 text-sm font-semibold text-app-accent-on-ink">{app.nome}</span>
      </div>
      <main className="m-canvas min-h-0 flex-1 overflow-y-auto p-3">
        <Conteudo app={app} />
      </main>
    </div>
  );
}

export function PaginaShells() {
  const q = new URLSearchParams(location.search);
  if (q.get("vista") === "lado") {
    const base = new URLSearchParams(q);
    base.delete("vista");
    base.set("so", "1");
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        {[
          ["claro", "Claro"],
          ["escuro", "Escuro"],
          ["contraste", "Alto contraste"],
        ].map(([t, rotulo]) => {
          const p = new URLSearchParams(base);
          p.set("tema", t!);
          return (
            <section key={t} aria-label={rotulo} className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold">{rotulo}</h2>
              <iframe title={`Shells — ${rotulo}`} src={`?${p}`} className="h-[190rem] w-full rounded-xl border border-border bg-background" />
            </section>
          );
        })}
      </div>
    );
  }
  const compacto = q.get("so") === "1";
  return (
    <div className="flex flex-col gap-6">
      {!compacto && (
        <p className="max-w-prose text-base text-muted-foreground">
          Cada aplicação tem a sua barra lateral, com a mesma profundidade e a mesma estrutura; muda apenas o tom. O conteúdo tem uma linha fina
          e uma faixa muito leve na cor da aplicação. <a className="font-medium text-brand underline" href={`?${new URLSearchParams({ ...Object.fromEntries(q), vista: "lado" })}`}>Ver os três temas lado a lado</a>.
        </p>
      )}
      {APPS.map((app) => (
        <section key={app.id} aria-labelledby={`shell-${app.id}`} className="flex flex-col gap-2">
          <h2 id={`shell-${app.id}`} className="text-base font-semibold">
            {app.nome}
            {app.proposta && <span className="ml-2 text-sm font-normal text-muted-foreground">(proposta, ainda sem aplicação)</span>}
          </h2>
          <div className="flex gap-4">
            <div className={compacto ? "min-w-0 flex-1" : "min-w-0 flex-1 max-md:hidden"}>
              <ShellSecretaria app={app} />
            </div>
            {!compacto && <ShellTelemovel app={app} />}
          </div>
        </section>
      ))}
    </div>
  );
}
