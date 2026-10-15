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

/** Tour targets: `[data-shell="navegacao|ajuda|acessibilidade|aplicacoes|conta|organizacao|sair|menu|assistente"]`. */

// Lucide icons (their props do not accept `undefined`, hence no `| undefined`).
export type IconeShell = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }>;

export interface ItemNavApp {
  /** Relative to the app's basePath (Next `Link`), like `caminhoAtual`. */
  href: string;
  rotulo: string;
  icone?: IconeShell | undefined;
  /** A count that needs action («Pedidos de adesão 3»). 0 hides it. */
  contador?: number | undefined;
  contadorRotulo?: string | undefined;
  /** Another MUTU@L app: plain <a> (full load), ↗ after the label. */
  externo?: boolean | undefined;
  /** Marks the current entry; with none marked, the longest matching `href` (`hrefAtualDoMenu`: only ONE entry is ever current). */
  ativo?: boolean | undefined;
  atributos?: Readonly<Record<`data-${string}`, string>> | undefined;
}

export interface GrupoNavApp {
  titulo?: string | undefined;
  itens: readonly ItemNavApp[];
}

export interface ContaShell {
  nome: string;
  perfil?: ReactNode | undefined;
  organizacao?: ReactNode | undefined;
  variasOrganizacoes?: boolean | undefined;
  onTerminarSessao: () => void;
  aTerminar?: boolean | undefined;
  extra?: ReactNode | undefined;
}

export const classeItemMenu = "m-menu-item";

export function classeItemNav(): string {
  return "m-nav-item";
}

type LinkProps = { href: string; className?: string | undefined; onClick?: (() => void) | undefined; children?: ReactNode | undefined } & Record<string, unknown>;

function Ligacao({ LinkComponent, externo, ...props }: LinkProps & { LinkComponent: ElementType; externo?: boolean | undefined }) {
  const L = externo ? "a" : LinkComponent;
  return <L {...props} />;
}

/**
 * Loading dot for a navigation entry: fades in (after a short delay, so quick navigations never flash) while
 * `pendente`. Apps feed it Next's `useLinkStatus` through `AppShell IndicadorLigacao`:
 * `function Pendente() { const { pending } = useLinkStatus(); return <PontoCarregamento pendente={pending} />; }`.
 */
export function PontoCarregamento({ pendente }: { pendente: boolean }) {
  return <span aria-hidden className="m-nav-pendente" data-pendente={pendente ? "true" : undefined} />;
}

/** `<html data-navegacao="recolhida">`: set by `PREFERENCIAS_SCRIPT` before first paint and kept in step by `AppShell`. */
function marcarNavegacaoRecolhida(recolhida: boolean) {
  if (recolhida) document.documentElement.dataset.navegacao = "recolhida";
  else delete document.documentElement.dataset.navegacao;
}

export function NavApp({
  grupos,
  caminhoAtual,
  LinkComponent = "a",
  onNavegar,
  rotulo = "Menu principal",
  antes,
  depois,
  IndicadorLigacao,
  className,
}: {
  grupos: readonly GrupoNavApp[];
  caminhoAtual: string;
  LinkComponent?: ElementType | undefined;
  onNavegar?: (() => void) | undefined;
  /** Rendered inside each in-app link (a `PontoCarregamento` fed by `useLinkStatus`): shows which entry is loading. */
  IndicadorLigacao?: ComponentType | undefined;
  rotulo?: string | undefined;
  antes?: ReactNode | undefined;
  depois?: ReactNode | undefined;
  className?: string | undefined;
}) {
  const baseId = useId();
  // Exactly one current entry: never infer a prefix («/admin») next to an entry the app marked.
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
                        {IndicadorLigacao && !item.externo && <IndicadorLigacao />}
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
 * Top-bar search: `onProcurar` navigates client-side (`(t) => router.push(...)`), never a full page load. `action` (`?q=`)
 * only serves a submit before the page is interactive. `rotulo` is its name and the default placeholder.
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
  onProcurar: (texto: string) => void;
  className?: string | undefined;
}) {
  const id = useId();
  return (
    <form
      role="search"
      action={action}
      method="get"
      className={cx("m-procura", className)}
      onSubmit={(e) => {
        e.preventDefault();
        const valor = new FormData(e.currentTarget).get(nome);
        onProcurar(typeof valor === "string" ? valor.trim() : "");
      }}
    >
      <Search aria-hidden />
      <label htmlFor={id} className="sr-only">
        {rotulo}
      </label>
      <input id={id} type="search" name={nome} defaultValue={valorInicial} placeholder={placeholder ?? rotulo} autoComplete="off" />
    </form>
  );
}

/** Sub-pages as tabs (links), never a second navigation level; for views without separate addresses use `/controlos` `Tabs`. */
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
  caminhoAtual: string;
  disponiveis?: readonly MutualAppId[] | undefined;
  conta?: ContaShell | undefined;
  /** Omit for a screen without navigation (Validador QR, Portal launcher). */
  navegacao?: readonly GrupoNavApp[] | undefined;
  procura?: ReactNode | undefined;
  antesDaNavegacao?: ReactNode | undefined;
  depoisDaNavegacao?: ReactNode | undefined;
  barraExtra?: ReactNode | undefined;
  inicioHref?: string | undefined;
  /** Default: the Portal's help centre for this app (`/ajuda/<app>`). */
  ajudaHref?: string | undefined;
  declaracaoHref?: string | undefined;
  /** `<ChatFlutuante …/>` from `@umporg/ui/assistente`; stays mounted across client navigation. Ignored in the Assistente app. */
  assistente?: ReactNode | undefined;
  /** `eu.lancamento`: hides switched-off apps, pages and assistant; the pages themselves are gated by the app (`paginaLigada` + `<EmBreve dentroDoShell />`). */
  lancamento?: Lancamento | null | undefined;
  LinkComponent?: ElementType | undefined;
  /** With `LinkComponent={Link}`: a component that calls `useLinkStatus` (from `next/link`) and renders `PontoCarregamento`; the entry being opened shows a loading dot. */
  IndicadorLigacao?: ComponentType | undefined;
  rotuloNavegacao?: string | undefined;
  idConteudo?: string | undefined;
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
  IndicadorLigacao,
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

  // The <head> script already hid a collapsed navigation before first paint; this only syncs the state.
  useEffect(() => {
    let r = false;
    try {
      r = localStorage.getItem(chave) === "1";
    } catch {
      /* private mode */
    }
    setRecolhida(r);
    marcarNavegacaoRecolhida(r);
  }, [chave]);

  // Every navigation: scroll to top, close the drawer, fade the page in (opacity only, off under Reduzir movimento).
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
    const nova = !recolhida;
    try {
      localStorage.setItem(chave, nova ? "1" : "0");
    } catch {
      /* private mode */
    }
    marcarNavegacaoRecolhida(nova);
    setRecolhida(nova);
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
              IndicadorLigacao={IndicadorLigacao}
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
                  IndicadorLigacao={IndicadorLigacao}
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
