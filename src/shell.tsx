"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ComponentType,
  type ElementType,
  type ReactNode,
  type SVGProps,
} from "react";
import { ArrowLeftRight, ExternalLink, HelpCircle, LogOut, Menu, Search, X } from "lucide-react";
import { AcessibilidadeMenu } from "./acessibilidade";
import { BotaoAssistente } from "./assistente";
import { LancadorApps, posicionarPopover } from "./app-switcher";
import { appLigada, assistenteLigado, filtrarNavPorLancamento, nomeDaApp, nomeDaPlataforma, type AppNoEndereco, type Lancamento, type MutualAppId } from "./apps";
import { ContextoLancamento } from "./lancamento-contexto";
import { IconeApp } from "./icone-app";
import { CAMINHOS } from "./sso";
import { ajudaDaApp, hrefAtualDoMenu, iniciais } from "./shell-nav";
import { cx } from "./cx";

export { hrefAtivo, hrefAtualDoMenu, iniciais } from "./shell-nav";

/**
 * Shell G — the frame of every MUTU@L desk app (Google Workspace structure +
 * Fluent layering). One component, same
 * anatomy everywhere; only the navigation and the search are the app's:
 *
 *   <AppShell
 *     app="backoffice" caminhoAtual={usePathname()} LinkComponent={Link}
 *     disponiveis={appsDisponiveis(eu.apps, eu.lancamento)} lancamento={eu.lancamento}
 *     conta={{ nome, perfil, organizacao, variasOrganizacoes, onTerminarSessao }}
 *     navegacao={[{ itens: [{ href: "/admin", rotulo: "Início", icone: House }] },
 *                 { titulo: "Rede mutualista", itens: [...] }]}
 *     procura={<ProcuraApp rotulo="Procurar no Backoffice" action="/backoffice/admin/procurar" />}
 *   >
 *     <div className="m-pagina">…</div>
 *   </AppShell>
 *
 * Top bar: ☰, the app's tile + the platform name (`nomeDaPlataforma`) + its name (link to the app's home),
 * the search (centre), Ajuda and Acessibilidade WITH text, the app launcher
 * (waffle) and the account (avatar → name, profile, organisation, «Mudar de
 * organização», «Terminar sessão»). Left: ONLY navigation, ≤ 8
 * destinations in 2–3 short groups; the current page is a pill. A page's
 * own action («Nova campanha», «Criar evento») is the primary button of its
 * `PageHeader actions`, on that page only. Sub-pages
 * are tabs on the page (`Separadores`), never a second navigation level.
 * The content is ONE neutral layer (`<main id="conteudo-principal">`, the
 * scroller; back to the top on every navigation). Below 64rem the
 * navigation is a drawer (native <dialog>). Tour targets:
 * `[data-shell="navegacao|ajuda|acessibilidade|aplicacoes|conta|organizacao|
 * sair|menu|assistente"]`.
 */

// Lucide icons (their props do not accept `undefined`, hence no `| undefined`).
export type IconeShell = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }>;

export interface ItemNavApp {
  /** Relative to the app's basePath (Next `Link`), like `caminhoAtual`. */
  href: string;
  rotulo: string;
  icone?: IconeShell | undefined;
  /** A count that needs action («Pedidos de adesão 3»). 0 hides it. */
  contador?: number | undefined;
  /** Spoken meaning of the count; default «<n> por tratar». */
  contadorRotulo?: string | undefined;
  /** Opens another MUTU@L app (an ↗ after the label; plain <a>, full load). */
  externo?: boolean | undefined;
  /** Marks the current entry; with none marked, the longest matching `href` (`hrefAtualDoMenu`: only ONE entry is ever current). */
  ativo?: boolean | undefined;
  /** Tour/test hooks (`{ "data-tour": "associacoes" }`). */
  atributos?: Readonly<Record<`data-${string}`, string>> | undefined;
}

export interface GrupoNavApp {
  /** Small section title («Rede mutualista»); the first group usually has none. */
  titulo?: string | undefined;
  itens: readonly ItemNavApp[];
}

export interface ContaShell {
  nome: string;
  /** The person's profile in this app («Tesoureiro», «Informática»…). */
  perfil?: ReactNode | undefined;
  /** The active organisation. */
  organizacao?: ReactNode | undefined;
  /** Shows «Mudar de organização» (the Portal's organisation page). */
  variasOrganizacoes?: boolean | undefined;
  onTerminarSessao: () => void;
  /** Sign-out in progress: «A terminar…», disabled. */
  aTerminar?: boolean | undefined;
  /** App-specific entries of the account menu, styled with `classeItemMenu`. */
  extra?: ReactNode | undefined;
}

/** Class of an entry in the account menu (the `extra` of `ContaShell`). */
export const classeItemMenu = "m-menu-item";

/** Class of a navigation entry, for apps that render their own item (e.g. a button). */
export function classeItemNav(): string {
  return "m-nav-item";
}

type LinkProps = { href: string; className?: string | undefined; onClick?: (() => void) | undefined; children?: ReactNode | undefined } & Record<string, unknown>;

function Ligacao({ LinkComponent, externo, ...props }: LinkProps & { LinkComponent: ElementType; externo?: boolean | undefined }) {
  const L = externo ? "a" : LinkComponent;
  return <L {...props} />;
}

/**
 * The navigation: only destinations, in groups (no actions).
 * `aria-current="page"` on the current entry (pill, bold, icon in the app's
 * colour).
 */
export function NavApp({
  grupos,
  caminhoAtual,
  LinkComponent = "a",
  onNavegar,
  rotulo = "Menu principal",
  antes,
  depois,
  className,
}: {
  grupos: readonly GrupoNavApp[];
  caminhoAtual: string;
  LinkComponent?: ElementType | undefined;
  onNavegar?: (() => void) | undefined;
  rotulo?: string | undefined;
  /** Above the destinations (e.g. Saúde's unit selector). */
  antes?: ReactNode | undefined;
  /** Below them. */
  depois?: ReactNode | undefined;
  className?: string | undefined;
}) {
  const baseId = useId();
  // Exactly one current entry: `hrefAtualDoMenu` never infers a prefix
  // («/admin») next to an entry the app marked itself.
  const atual = hrefAtualDoMenu(grupos.flatMap((g) => g.itens), caminhoAtual);
  return (
    <div className={cx("flex flex-col", className)}>
      {antes}
      <nav aria-label={rotulo} data-shell="navegacao" className="m-nav">
        {grupos.map((g, gi) => {
          const tituloId = `${baseId}-g${gi}`;
          return (
            <div key={g.titulo ?? gi} className="m-nav-grupo">
              {g.titulo && (
                <p id={tituloId} className="m-nav-grupo-titulo">
                  {g.titulo}
                </p>
              )}
              <ul aria-labelledby={g.titulo ? tituloId : undefined}>
                {g.itens.map((item) => {
                  const ativo = !item.externo && item.ativo !== false && item.href === atual;
                  const Icone = item.icone;
                  return (
                    <li key={item.href}>
                      <Ligacao
                        LinkComponent={LinkComponent}
                        externo={item.externo}
                        href={item.href}
                        aria-current={ativo ? "page" : undefined}
                        className="m-nav-item"
                        onClick={onNavegar}
                        {...item.atributos}
                      >
                        {Icone && <Icone aria-hidden />}
                        <span className="m-nav-texto">{item.rotulo}</span>
                        {item.contador ? (
                          <span className="m-nav-contador">
                            <span aria-hidden>{item.contador}</span>
                            <span className="sr-only">{item.contadorRotulo ?? `${item.contador} por tratar`}</span>
                          </span>
                        ) : null}
                        {item.externo && (
                          <span className="m-nav-externo">
                            <ExternalLink aria-hidden />
                            <span className="sr-only">(abre a aplicação)</span>
                          </span>
                        )}
                      </Ligacao>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
      {depois}
    </div>
  );
}

/** The account: the initials → a menu with who is signed in and «Terminar sessão». */
export function MenuConta({ app, conta }: { app: AppNoEndereco; conta: ContaShell }) {
  const id = useId().replace(/:/g, "");
  const popId = `mutual-conta-${id}`;
  const botaoRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button
        ref={botaoRef}
        type="button"
        popoverTarget={popId}
        aria-label={`Conta: ${conta.nome}`}
        data-shell="conta"
        className="m-barra-botao"
      >
        <span aria-hidden className="m-avatar">
          {iniciais(conta.nome)}
        </span>
      </button>
      <div
        id={popId}
        popover="auto"
        aria-label="A sua conta"
        className="m-float m-menu-barra"
        onToggle={(e) => {
          if (e.newState === "open") posicionarPopover(e.currentTarget, botaoRef.current);
        }}
      >
        <div className="m-menu-escalonado">
          <ContaResumo conta={conta} />
        </div>
        <div className="m-menu-escalonado" style={{ "--i": 1 } as CSSProperties}>
          <ContaAcoes app={app} conta={conta} />
        </div>
      </div>
    </>
  );
}

function ContaResumo({ conta, compacto = false }: { conta: ContaShell; compacto?: boolean }) {
  return (
    <div className={cx("flex items-center gap-3", compacto ? "px-3 py-2" : "px-3 pt-3 pb-3")}>
      <span aria-hidden className={cx("m-avatar", !compacto && "m-avatar-grande")}>
        {iniciais(conta.nome)}
      </span>
      <div className="flex min-w-0 flex-col">
        {/* Wraps instead of truncating: no native tooltip (touch screens have none). */}
        <p className="font-semibold break-words">{conta.nome}</p>
        {conta.perfil && <p className="text-sm text-muted-foreground">{conta.perfil}</p>}
        {conta.organizacao && <p className="text-sm text-muted-foreground">{conta.organizacao}</p>}
      </div>
    </div>
  );
}

function ContaAcoes({ app, conta }: { app: AppNoEndereco; conta: ContaShell }) {
  const base = CAMINHOS[app] === "/" ? "" : CAMINHOS[app];
  const organizacaoHref = `/organizacao?next=${encodeURIComponent(`${base}/`)}`;
  return (
    <div className="flex flex-col gap-0.5 border-t border-border pt-1">
      {conta.variasOrganizacoes && (
        // Same origin (ADR 0004): the organisation page is the Portal's.
        <a href={organizacaoHref} data-shell="organizacao" className="m-menu-item">
          <ArrowLeftRight aria-hidden />
          <span>Mudar de entidade</span>
        </a>
      )}
      {conta.extra}
      <button
        type="button"
        data-shell="sair"
        onClick={conta.onTerminarSessao}
        disabled={conta.aTerminar}
        className="m-menu-item"
      >
        <LogOut aria-hidden />
        <span>{conta.aTerminar ? "A terminar…" : "Terminar sessão"}</span>
      </button>
    </div>
  );
}

/**
 * The search pill of the top bar. A GET form to `action` (the app's search
 * page, `?q=`) or `onProcurar` for client-side search. Its name is `rotulo`
 * («Procurar no Backoffice»), also the placeholder unless one is given.
 */
export function ProcuraApp({
  rotulo,
  placeholder,
  action,
  nome = "q",
  valorInicial,
  onProcurar,
  className,
}: {
  rotulo: string;
  placeholder?: string | undefined;
  action?: string | undefined;
  nome?: string | undefined;
  valorInicial?: string | undefined;
  onProcurar?: ((texto: string) => void) | undefined;
  className?: string | undefined;
}) {
  const id = useId();
  return (
    <form
      role="search"
      action={action}
      method="get"
      className={cx("m-procura", className)}
      onSubmit={
        onProcurar
          ? (e) => {
              e.preventDefault();
              const valor = new FormData(e.currentTarget).get(nome);
              onProcurar(typeof valor === "string" ? valor.trim() : "");
            }
          : undefined
      }
    >
      <Search aria-hidden />
      <label htmlFor={id} className="sr-only">
        {rotulo}
      </label>
      <input id={id} type="search" name={nome} defaultValue={valorInicial} placeholder={placeholder ?? rotulo} autoComplete="off" />
    </form>
  );
}

/**
 * Sub-pages of one page as tabs (links, `aria-current="page"`), under the
 * page title, never a second navigation level. Use
 * `/controlos` `Tabs` instead for views that are not separate addresses.
 */
export function Separadores({
  itens,
  caminhoAtual,
  rotulo,
  LinkComponent = "a",
  className,
}: {
  itens: readonly { href: string; rotulo: string; ativo?: boolean | undefined; contador?: number | undefined }[];
  /** With it, the current tab is the longest matching href (like the navigation). */
  caminhoAtual?: string | undefined;
  /** Name of the tab list («Secções da caracterização»). */
  rotulo: string;
  LinkComponent?: ElementType | undefined;
  className?: string | undefined;
}) {
  const L = LinkComponent;
  const atual = caminhoAtual === undefined ? itens.find((i) => i.ativo === true)?.href ?? null : hrefAtualDoMenu(itens, caminhoAtual);
  return (
    <nav aria-label={rotulo} className={cx("m-separadores m-scroll-x", className)}>
      <ul>
        {itens.map((i) => {
          const ativo = i.ativo !== false && i.href === atual;
          return (
            <li key={i.href}>
              <L href={i.href} aria-current={ativo ? "page" : undefined} className="m-separador">
                {i.rotulo}
                {i.contador ? (
                  <span className="rounded-full bg-secondary px-2 text-sm font-semibold text-secondary-foreground">{i.contador}</span>
                ) : null}
              </L>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export interface AppShellProps {
  app: AppNoEndereco;
  /** The current path relative to the basePath (`usePathname()`). */
  caminhoAtual: string;
  /** `appsDisponiveis(eu.apps)` — shows the launcher. Omit on public screens. */
  disponiveis?: readonly MutualAppId[] | undefined;
  /** Who is signed in — shows the account menu. Omit on public screens. */
  conta?: ContaShell | undefined;
  /** The destinations (≤ 8, in 2–3 groups). Omit for a screen without navigation (Validador QR, Portal launcher). */
  navegacao?: readonly GrupoNavApp[] | undefined;
  /** `<ProcuraApp …/>` when the app has a search. */
  procura?: ReactNode | undefined;
  /** Above / below the destinations (Saúde's unit selector…). */
  antesDaNavegacao?: ReactNode | undefined;
  depoisDaNavegacao?: ReactNode | undefined;
  /** Extra controls in the top bar, before Ajuda (e.g. notifications). */
  barraExtra?: ReactNode | undefined;
  /** The app's home, relative to its basePath. */
  inicioHref?: string | undefined;
  /** Default: the Portal's help centre for this app (`/ajuda/<app>`). */
  ajudaHref?: string | undefined;
  /** The app's accessibility statement, linked from the Acessibilidade panel. */
  declaracaoHref?: string | undefined;
  /**
   * The floating assistant: `<ChatFlutuante …/>` from
   * `@umporg/ui/assistente`, only when the person has the capability
   * «assistente na página» (`eu.assistenteNaPagina`). Adds «Assistente» to the
   * top bar and keeps the chat mounted across client navigation. Ignored in
   * the Assistente app itself.
   */
  assistente?: ReactNode | undefined;
  /**
   * `eu.lancamento` (launch switches). Leaves switched-off apps out of the
   * launcher, switched-off pages out of the navigation, and hides the
   * assistant (chat, «Assistente», fill-from-document, drafts) on the pages
   * where it is off. Pages themselves are gated by the app (`paginaLigada` +
   * `<EmBreve dentroDoShell />`).
   */
  lancamento?: Lancamento | null | undefined;
  LinkComponent?: ElementType | undefined;
  /** Name of the navigation landmark. */
  rotuloNavegacao?: string | undefined;
  /** Id of the <main> (skip link target). */
  idConteudo?: string | undefined;
  /** Extra classes on the content layer. */
  classeConteudo?: string | undefined;
  children: ReactNode;
}

export function AppShell({
  app,
  caminhoAtual,
  disponiveis,
  conta,
  navegacao,
  procura,
  antesDaNavegacao,
  depoisDaNavegacao,
  barraExtra,
  inicioHref = "/",
  ajudaHref,
  declaracaoHref,
  assistente,
  lancamento,
  LinkComponent = "a",
  rotuloNavegacao = "Menu principal",
  idConteudo = "conteudo-principal",
  classeConteudo,
  children,
}: AppShellProps) {
  const nome = nomeDaApp(app) ?? "";
  const ajuda = ajudaHref ?? ajudaDaApp(app, CAMINHOS.ajuda);
  const lanc = lancamento ?? null;
  const assistenteAqui = assistenteLigado(lanc, app, caminhoAtual);
  const nav = navegacao && lanc ? filtrarNavPorLancamento(navegacao, lanc, app) : navegacao;
  const apps = disponiveis && lanc ? disponiveis.filter((a) => appLigada(lanc, a) && (a !== "qr" || appLigada(lanc, "eventos"))) : disponiveis;
  const temNav = nav !== undefined && nav.length > 0;
  const estadoLancamento = useMemo(
    () => ({ lancamento: lanc, app, caminho: caminhoAtual, assistente: assistenteAqui }),
    [lanc, app, caminhoAtual, assistenteAqui],
  );
  const comAssistente = assistente !== undefined && assistente !== null && assistente !== false && app !== "assistente" && assistenteAqui;
  const gavetaRef = useRef<HTMLDialogElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const [gavetaAberta, setGavetaAberta] = useState(false);
  // Mounted on the first open and kept, so the drawer can slide out.
  const [gavetaMontada, setGavetaMontada] = useState(false);
  const primeiraRota = useRef(true);
  const [recolhida, setRecolhida] = useState(false);
  const [procuraAberta, setProcuraAberta] = useState(false);
  const chave = `${app}.navegacao-recolhida`;
  const Link = LinkComponent;

  // The desktop ☰ hides the navigation; remembered on this device.
  useEffect(() => {
    try {
      setRecolhida(localStorage.getItem(chave) === "1");
    } catch {
      /* private mode */
    }
  }, [chave]);

  // Every navigation: back to the top of the content, drawer closed, and the
  // page fades in slightly (opacity only: no layout shift; nothing under
  // Reduzir movimento or the OS setting; input is never delayed).
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
    gavetaRef.current?.close();
    if (primeiraRota.current) {
      primeiraRota.current = false;
      return;
    }
    const reduzido =
      document.documentElement.dataset.movimento === "reduzido" ||
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pagina = mainRef.current?.firstElementChild;
    if (!reduzido && pagina && "animate" in pagina) {
      pagina.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 180, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" });
    }
  }, [caminhoAtual]);

  function alternarRecolhida() {
    setRecolhida((r) => {
      try {
        localStorage.setItem(chave, r ? "0" : "1");
      } catch {
        /* private mode */
      }
      return !r;
    });
  }

  const fecharGaveta = () => gavetaRef.current?.close();

  const identidade = (onClick?: () => void) => (
    <Link href={inicioHref} onClick={onClick} className="m-app-identidade">
      <IconeApp app={app} tamanho={38} />
      <span className="m-app-nomes">
        {/* The space keeps «UMP Backoffice» (configured name + app) as the link's name. */}
        <small>{nomeDaPlataforma(lanc)}</small> <strong>{nome}</strong>
      </span>
    </Link>
  );

  return (
    <ContextoLancamento.Provider value={estadoLancamento}>
    <div data-shell-app={app} className={cx("m-app", temNav && "m-app-com-nav")}>
      <a
        href={`#${idConteudo}`}
        className="sr-only rounded-md bg-background px-4 py-2 font-medium text-foreground shadow focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-60"
      >
        Saltar para o conteúdo
      </a>

      <header className="m-app-barra">
        {temNav && (
          <>
            <button
              type="button"
              className="m-barra-botao lg:!hidden"
              aria-label="Abrir menu"
              aria-haspopup="dialog"
              aria-expanded={gavetaAberta}
              data-shell="menu"
              onClick={() => {
                setGavetaMontada(true);
                setGavetaAberta(true);
                gavetaRef.current?.showModal();
              }}
            >
              <Menu aria-hidden />
            </button>
            <button
              type="button"
              className="m-barra-botao max-lg:!hidden"
              aria-label={recolhida ? "Mostrar o menu" : "Esconder o menu"}
              aria-expanded={!recolhida}
              aria-controls={`${idConteudo}-nav`}
              onClick={alternarRecolhida}
            >
              <Menu aria-hidden />
            </button>
          </>
        )}
        {identidade()}
        {procura ? <div className="m-app-procura-centro max-lg:!hidden">{procura}</div> : null}
        <span className="m-app-espaco" />
        {procura ? (
          <button
            type="button"
            className="m-barra-botao lg:!hidden"
            aria-label="Procurar"
            aria-expanded={procuraAberta}
            onClick={() => setProcuraAberta((a) => !a)}
          >
            <Search aria-hidden />
          </button>
        ) : null}
        {barraExtra}
        {comAssistente && <BotaoAssistente />}
        {/* With a navigation, phones find Ajuda and Acessibilidade in the drawer;
            without one (Validador QR, Portal) they stay in the bar, icon only. */}
        <a
          href={ajuda}
          data-shell="ajuda"
          className={cx("m-barra-util", temNav ? "max-md:!hidden" : "max-md:!w-11 max-md:!justify-center max-md:!px-0")}
        >
          <HelpCircle aria-hidden />
          <span className={temNav ? undefined : "max-md:sr-only"}>Ajuda</span>
        </a>
        <span data-shell="acessibilidade" className={cx("contents", temNav && "max-md:[&>button]:!hidden")}>
          <AcessibilidadeMenu tone="moldura" compacto={temNav ? false : "md"} declaracaoHref={declaracaoHref} className="m-barra-util" />
        </span>
        {apps && <LancadorApps atual={app} disponiveis={apps} />}
        {conta && <MenuConta app={app} conta={conta} />}
      </header>
      {procura && procuraAberta ? <div className="m-app-procura-telefone lg:hidden">{procura}</div> : null}

      <div className="m-app-corpo">
        {temNav && (
          <aside id={`${idConteudo}-nav`} aria-label={rotuloNavegacao} className="m-app-nav" data-recolhida={recolhida ? "true" : undefined}>
            <NavApp
              grupos={nav}
              caminhoAtual={caminhoAtual}
              LinkComponent={LinkComponent}
              rotulo={rotuloNavegacao}
              antes={antesDaNavegacao}
              depois={depoisDaNavegacao}
            />
          </aside>
        )}
        <main ref={mainRef} id={idConteudo} tabIndex={-1} className={cx("m-camada", classeConteudo)}>
          {children}
        </main>
      </div>

      {temNav && (
        <dialog
          ref={gavetaRef}
          className="m-gaveta"
          aria-label={rotuloNavegacao}
          onClose={() => setGavetaAberta(false)}
          onClick={(e) => {
            if (e.target === gavetaRef.current) fecharGaveta();
          }}
        >
          {gavetaMontada && (
            <>
              <div className="m-gaveta-topo">
                {identidade(fecharGaveta)}
                <span className="m-app-espaco" />
                <button type="button" className="m-barra-botao" aria-label="Fechar menu" onClick={fecharGaveta}>
                  <X aria-hidden />
                </button>
              </div>
              <div className="m-gaveta-corpo">
                <NavApp
                  grupos={nav}
                  caminhoAtual={caminhoAtual}
                  LinkComponent={LinkComponent}
                  onNavegar={fecharGaveta}
                  rotulo={rotuloNavegacao}
                  antes={antesDaNavegacao}
                  depois={depoisDaNavegacao}
                />
                <div className="m-gaveta-rodape">
                  <div className="m-gaveta-utilidades">
                    <a href={ajuda} className="m-barra-util">
                      <HelpCircle aria-hidden />
                      <span>Ajuda</span>
                    </a>
                    <AcessibilidadeMenu tone="moldura" declaracaoHref={declaracaoHref} className="m-barra-util" />
                  </div>
                  {conta && (
                    <>
                      <ContaResumo conta={conta} compacto />
                      <ContaAcoes app={app} conta={conta} />
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </dialog>
      )}
      {comAssistente && assistente}
    </div>
    </ContextoLancamento.Provider>
  );
}
