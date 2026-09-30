import { House, Plus, RotateCw, X } from "lucide-react";
import { AppShell, IconeApp, LancadorGrelha, ProcuraApp, nomeDaApp, type DirecaoIcone, type MutualAppId } from "../src/index.ts";

/**
 * PRÉ-VISUALIZAÇÃO (ramo icones-preview) — família de ícones das apps e
 * lançador em grelha. `?pagina=icones&direcao=a|b` mostra a família em todos
 * os tamanhos, a barra de topo e um separador de navegador;
 * `?pagina=icones-shell&app=<id>&direcao=a|b` é a moldura real (AppShell) com
 * o novo mosaico e o novo lançador.
 */

const TODAS: MutualAppId[] = ["portal", "backoffice", "eventos", "simplex", "saude", "qr", "dns", "assistente", "protocolos", "monitor", "cartao"];
const LANCADOR: MutualAppId[] = ["portal", "backoffice", "eventos", "simplex", "saude", "dns", "assistente", "protocolos", "monitor", "qr"];
const TAMANHOS = [16, 20, 24, 32, 48];

function direcaoDaPagina(): DirecaoIcone {
  return new URLSearchParams(location.search).get("direcao") === "b" ? "b" : "a";
}

const CURTO: Partial<Record<MutualAppId, string>> = { dns: "DNS", qr: "QR", monitor: "Monitorização", cartao: "Cartão" };

function Grelha({ direcao }: { direcao: DirecaoIcone }) {
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
                  <IconeApp app={a} direcao={direcao} tamanho={t} titulo />
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
function Separadores({ direcao, escuro }: { direcao: DirecaoIcone; escuro: boolean }) {
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
            <IconeApp app={a} direcao={direcao} tamanho={16} />
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
  const direcao = direcaoDaPagina();
  const q = new URLSearchParams(location.search);
  const ligacao = (d: DirecaoIcone, rotulo: string) => {
    const n = new URLSearchParams(q);
    n.set("direcao", d);
    return (
      <a key={d} href={`?${n}`} aria-current={direcao === d ? "true" : undefined} className={"m-btn inline-flex min-h-11 items-center rounded-lg px-4 " + (direcao === d ? "m-btn-primary" : "m-btn-outline")}>
        {rotulo}
      </a>
    );
  };
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {ligacao("a", "Direção A — cor de cada app")}
        {ligacao("b", "Direção B — paleta da marca")}
      </div>

      <Seccao
        id="s-principios"
        titulo="Princípios"
        descricao="Inspirados no método do Google Workspace e do Proton — nunca nos seus desenhos: todos os glifos são originais."
      >
        <ul className="m-surface list-disc space-y-1.5 py-4 pr-5 pl-9 text-[0.9375rem]">
          <li>Uma base comum a toda a família: a «folha» MUTU@L (quadrado com cantos alternados, 7 e 2,5 de 24), a assinatura que diz «isto é MUTU@L» antes do glifo.</li>
          <li>Um glifo próprio por app, com silhueta diferente (arco, frontão, calendário, gráfico circular, cruz, moldura, servidores, balão, anéis, pulso, cartão) — distingue-se sem cor.</li>
          <li>Grelha de 24, área viva 4,5–19,5 (62 %), traço 2, pontas redondas; formas ≥ 2,5 e intervalos ≥ 1,5 — legível a 16 px.</li>
          <li>Direção A (à Proton por app): a base na cor da app, glifo branco. Direção B (à Google 2020): base neutra, glifo em verde e vermelho da bandeira.</li>
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

      <Seccao id="s-grelha" titulo={`Família — direção ${direcao.toUpperCase()}`} descricao="16, 20, 24, 32 e 48 px (sem ampliação).">
        <Grelha direcao={direcao} />
      </Seccao>

      <Seccao id="s-barra" titulo="Barra de topo" descricao="O mosaico da app e o botão de nove pontos (abra-o: setas, Enter, Esc).">
        <div className="overflow-hidden rounded-xl border border-border">
          <div data-app="eventos" className="m-app" style={{ height: "auto" }}>
            <header className="m-app-barra bg-moldura">
              <a href="#" className="m-app-identidade">
                <IconeApp app="eventos" direcao={direcao} tamanho={38} />
                <span className="m-app-nomes">
                  <small>MUTU@L</small> <strong>Eventos</strong>
                </span>
              </a>
              <span className="m-app-espaco" />
              <LancadorGrelha atual="eventos" disponiveis={LANCADOR} direcao={direcao} />
              <span className="m-avatar" aria-hidden>
                AM
              </span>
            </header>
          </div>
        </div>
      </Seccao>

      <Seccao id="s-separadores" titulo="Separadores do navegador" descricao="Os ícones como favicon (16 px), numa janela clara e numa escura.">
        <div className="flex flex-col gap-3">
          <Separadores direcao={direcao} escuro={false} />
          <Separadores direcao={direcao} escuro />
        </div>
      </Seccao>
    </>
  );
}

/** The real frame (AppShell) with the new tile and the grid launcher. */
export function PaginaIconesShell() {
  const direcao = direcaoDaPagina();
  const app = (document.documentElement.dataset.app ?? "eventos") as Exclude<MutualAppId, "cartao">;
  const nome = nomeDaApp(app) ?? app;
  return (
    <AppShell
      app={app}
      caminhoAtual="/inicio"
      disponiveis={LANCADOR}
      marcaApp={<IconeApp app={app} direcao={direcao} tamanho={38} />}
      lancador={<LancadorGrelha atual={app} disponiveis={LANCADOR} direcao={direcao} />}
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
        <p className="mt-2 text-muted-foreground">Pré-visualização do lançador em grelha e do novo mosaico da app (direção {direcao.toUpperCase()}).</p>
      </div>
    </AppShell>
  );
}
