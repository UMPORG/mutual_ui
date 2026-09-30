import { House, Plus, RotateCw, X } from "lucide-react";
import { AppShell, IconeApp, LancadorApps, ProcuraApp, nomeDaApp, type MutualAppId } from "../src/index.ts";

/**
 * The app icon family and the grid launcher. `?pagina=icones` shows
 * the family at every size, the top bar and a browser tab strip;
 * `?pagina=icones-shell&app=<id>` is the real frame (AppShell).
 */

const TODAS: MutualAppId[] = ["portal", "backoffice", "eventos", "simplex", "saude", "qr", "dns", "assistente", "protocolos", "monitor", "cartao"];
const LANCADOR: MutualAppId[] = ["portal", "backoffice", "eventos", "simplex", "saude", "dns", "assistente", "protocolos", "monitor", "qr"];
const TAMANHOS = [16, 20, 24, 32, 48];

const CURTO: Partial<Record<MutualAppId, string>> = { dns: "DNS", qr: "QR", monitor: "Monitorização", cartao: "Cartão" };

function Grelha() {
  return (
    <div className="m-surface overflow-x-auto p-4">
      <table className="border-separate border-spacing-x-1 border-spacing-y-3 text-center">
        <thead>
          <tr>
            <th className="w-14 text-left text-sm font-semibold text-muted-foreground">px</th>
            {TODAS.map((a) => (
              <th key={a} className="w-[5.5rem] text-[0.8125rem] font-semibold text-muted-foreground">
                {CURTO[a] ?? nomeDaApp(a)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TAMANHOS.map((t) => (
            <tr key={t}>
              <th className="text-left text-sm font-semibold text-muted-foreground">{t}</th>
              {TODAS.map((a) => (
                <td key={a} className="align-middle">
                  <IconeApp app={a} tamanho={t} titulo />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A browser tab strip (mock): the favicons at 16 px, in a light and a dark window. */
function Separadores({ escuro }: { escuro: boolean }) {
  const abas: MutualAppId[] = ["portal", "eventos", "simplex", "saude", "backoffice", "monitor", "assistente", "dns", "protocolos", "qr", "cartao"];
  const fundo = escuro ? "#202124" : "#dee1e6";
  const aba = escuro ? "#35363a" : "#ffffff";
  const texto = escuro ? "#e8eaed" : "#202124";
  return (
    <div className={escuro ? "dark" : undefined} style={{ background: fundo, color: texto, borderRadius: 12, padding: "8px 8px 0" }}>
      <div className="flex items-end gap-px overflow-hidden">
        {abas.map((a, i) => (
          <div
            key={a}
            className="flex h-9 min-w-0 flex-1 items-center gap-2 px-3 text-[0.8125rem]"
            style={{ background: i === 1 ? aba : "transparent", borderRadius: "10px 10px 0 0", maxWidth: 190 }}
          >
            <IconeApp app={a} tamanho={16} />
            <span className="truncate">{`${nomeDaApp(a)} — MUTU@L`}</span>
            <X aria-hidden size={14} className="ml-auto shrink-0 opacity-60" />
          </div>
        ))}
        <Plus aria-hidden size={16} className="m-2 shrink-0 opacity-70" />
      </div>
      <div className="flex items-center gap-3 px-3 py-2" style={{ background: aba, color: texto }}>
        <RotateCw aria-hidden size={14} className="opacity-60" />
        <span className="flex-1 truncate rounded-full px-4 py-1 text-[0.8125rem]" style={{ background: fundo }}>
          mutual.mutualismo.pt/eventos
        </span>
      </div>
    </div>
  );
}

function Seccao({ id, titulo, descricao, children }: { id: string; titulo: string; descricao?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} data-seccao={id} className="flex flex-col gap-3">
      <div>
        <h2 id={id} className="text-xl font-semibold">
          {titulo}
        </h2>
        {descricao ? <p className="text-muted-foreground">{descricao}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function PaginaIcones() {
  return (
    <>
      <Seccao
        id="s-principios"
        titulo="Princípios"
        descricao="Inspirados no método do Google Workspace e do Proton — nunca nos seus desenhos: todos os glifos são originais."
      >
        <ul className="m-surface list-disc space-y-1.5 py-4 pr-5 pl-9 text-[0.9375rem]">
          <li>Uma base comum a toda a família: a «folha» MUTU@L (quadrado com cantos alternados, 7 e 2,5 de 24), a assinatura que diz «isto é MUTU@L» antes do glifo.</li>
          <li>Um glifo próprio por app, com silhueta diferente (arco, frontão, calendário, gráfico circular, cruz, moldura, servidores, balão, anéis, pulso, cartão) — distingue-se sem cor.</li>
          <li>Grelha de 24, área viva 4,5–19,5 (62 %), traço 2, pontas redondas; formas ≥ 2,5 e intervalos ≥ 1,5 — legível a 16 px.</li>
          <li>A base na cor da app (a mesma nos temas claro e escuro), glifo branco (≥ 4,8:1).</li>
          <li>Tema escuro e cores forçadas são só CSS (css/icones.css); em cores forçadas o ícone fica monocromático (Canvas / CanvasText).</li>
          <li>
            Referências:{" "}
            <a className="underline" href="https://proton.me/blog/new-visual-universe">
              Proton — new visual universe
            </a>
            ,{" "}
            <a className="underline" href="https://9to5google.com/2026/05/26/google-workspace-icons-redesign/">
              9to5Google — redesenho dos ícones do Workspace (2026)
            </a>
            .
          </li>
        </ul>
      </Seccao>

      <Seccao id="s-grelha" titulo="Família" descricao="16, 20, 24, 32 e 48 px (sem ampliação).">
        <Grelha />
      </Seccao>

      <Seccao id="s-barra" titulo="Barra de topo" descricao="O mosaico da app e o botão de nove pontos (abra-o: setas, Enter, Esc).">
        <div className="overflow-hidden rounded-xl border border-border">
          <div data-app="eventos" className="m-app" style={{ height: "auto" }}>
            <header className="m-app-barra bg-moldura">
              <a href="#" className="m-app-identidade">
                <IconeApp app="eventos" tamanho={38} />
                <span className="m-app-nomes">
                  <small>MUTU@L</small> <strong>Eventos</strong>
                </span>
              </a>
              <span className="m-app-espaco" />
              <LancadorApps atual="eventos" disponiveis={LANCADOR} />
              <span className="m-avatar" aria-hidden>
                AM
              </span>
            </header>
          </div>
        </div>
      </Seccao>

      <Seccao id="s-separadores" titulo="Separadores do navegador" descricao="Os ícones como favicon (16 px), numa janela clara e numa escura.">
        <div className="flex flex-col gap-3">
          <Separadores escuro={false} />
          <Separadores escuro />
        </div>
      </Seccao>
    </>
  );
}

/** The real frame (AppShell): its tile and its launcher. */
export function PaginaIconesShell() {
  const app = (document.documentElement.dataset.app ?? "eventos") as Exclude<MutualAppId, "cartao">;
  const nome = nomeDaApp(app) ?? app;
  return (
    <AppShell
      app={app}
      caminhoAtual="/inicio"
      disponiveis={LANCADOR}
      conta={{
        nome: "Ana Martins",
        perfil: "Serviços centrais",
        organizacao: "União das Mutualidades Portuguesas",
        variasOrganizacoes: true,
        onTerminarSessao: () => undefined,
      }}
      navegacao={[{ itens: [{ href: "/inicio", rotulo: "Início", icone: House }] }]}
      procura={<ProcuraApp rotulo={`Procurar em ${nome}`} onProcurar={() => undefined} />}
      inicioHref="#"
    >
      <div className="m-pagina">
        <h1 className="text-pagina">Início</h1>
        <p className="mt-2 text-muted-foreground">Abra «Aplicações MUTU@L» na barra de topo: a grelha das aplicações a que esta conta tem acesso.</p>
      </div>
    </AppShell>
  );
}
