"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Sparkles, Wand2, X } from "lucide-react";
import { cx } from "./cx";
import { escolherDoca, type DocaDemo, type Retangulo } from "./demo-doca";
import { SeccaoEntrarComo, usePersonasDemo } from "./demo-entrar";
import { gruposAcoesDemo, ouvirAcoesDemo, registarAcoesDemo, type AcaoDemo, type GrupoAcoesDemo } from "./demo-acoes";
import { useRegistoPosicoes } from "./assistente";
import { uniao, type Retangulo as RetanguloPosicao } from "./assistente-posicao";

/** Id of the widget in the position registry (the floating assistant yields to it). */
export const ID_POSICAO_DEMO = "demo";

const SEM_GRUPOS: readonly GrupoAcoesDemo[] = [];

/**
 * Registers a group of demo-only actions of the page (sample codes, sample
 * identifications, «repor dados»…) in the floating «Demonstração» widget while
 * the component is mounted. Pass `null` outside demo mode. The group is
 * re-registered when its identity changes (memoise it).
 */
export function useAcoesDemo(grupo: GrupoAcoesDemo | null): void {
  useEffect(() => (grupo ? registarAcoesDemo(grupo) : undefined), [grupo]);
}

/**
 * Demonstration mode: fill forms with example data.
 *
 * Only rendered when the app runs in demo mode (server env `DEMO_MODE=true`,
 * passed down as the `ativo` prop) — never in production data environments.
 *
 * How forms take part:
 *  - Mark the form: `<form data-demo-form="inscricao-evento">`.
 *  - Give the app a catalogue of scenarios per form id (`cenarios`): each
 *    scenario maps field `name`s to values (text, number, date, select value,
 *    checkbox `true/false`, radio value). Fields are filled through the native
 *    value setter + `input`/`change` events, so React-controlled inputs,
 *    react-hook-form and plain forms all react as if a person typed.
 *  - Widgets that are not native inputs (rich text, custom selects, money
 *    cells) register a filler with `registarPreenchedor(formId, fn)`.
 *
 * Where the controls appear:
 *  - Forms on the page: a small floating pill. It docks away from what the
 *    person needs (the focused element, a form's last actions, anything with
 *    `data-demo-evitar`): bottom-right, else bottom-left, else the middle of
 *    the right edge. An app with a bottom navigation bar lifts it with
 *    `--demo-fundo` (e.g. `:root { --demo-fundo: 4.5rem }` on phones). While
 *    active, `<html data-demo>` sets `--demo-reserva`
 *    (the room the pill needs) so layouts can keep their last actions clear
 *    of it (`m-demo-reserva`, or `pb-[calc(2rem+var(--demo-reserva))]`).
 *  - Forms inside an open dialog or sheet (`role="dialog"`/`"alertdialog"`,
 *    `<dialog open>`): a «Preencher (demonstração)» strip at the bottom of
 *    that dialog. It lives inside the dialog, so the modal's focus trap and
 *    the inertness of the page stay intact; the floating pill hides while a
 *    modal makes the page inert.
 *
 * «Entrar como…»: a login page that registers a demo sign-in
 * context (`useEntrarComoDemo({ destino, aoEntrar })` or
 * `registarEntrarComo`) gets an «Entrar como…» section at the top of the
 * panel — the demo personas of the Cérebro in use, one click signs in. When
 * the environment has no demo personas (404) the section is not shown.
 *
 * Scenarios are meant to show how each form reacts: valid data, a validation
 * error, an edge case (e.g. a full event, a negative amount).
 */

export type ValorDemo = string | number | boolean | null;

export interface CenarioDemo {
  id: string;
  /** Short label shown in the menu, e.g. "Dados válidos", "Com erros". */
  nome: string;
  descricao?: string | undefined;
  campos: Record<string, ValorDemo>;
  /** Submit the form after filling. */
  submeter?: boolean | undefined;
}

export type CatalogoDemo = Record<string, { titulo: string; cenarios: CenarioDemo[] }>;

type Preenchedor = (cenario: CenarioDemo, form: HTMLFormElement) => void | Promise<void>;
const preenchedores = new Map<string, Set<Preenchedor>>();

/** Custom filler for widgets that are not native inputs. Returns an unregister function. */
export function registarPreenchedor(formId: string, fn: Preenchedor): () => void {
  const set = preenchedores.get(formId) ?? new Set();
  set.add(fn);
  preenchedores.set(formId, set);
  return () => set.delete(fn);
}

function definirValorNativo(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, valor: string) {
  const proto =
    el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : el instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  setter?.call(el, valor);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

/** Fills a form with a scenario. Exported for tests and custom triggers. */
export async function preencherFormulario(form: HTMLFormElement, cenario: CenarioDemo): Promise<number> {
  let preenchidos = 0;
  for (const [nome, valor] of Object.entries(cenario.campos)) {
    const campos = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      `[name="${CSS.escape(nome)}"]`,
    );
    for (const el of campos) {
      if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
        const deveMarcar = el.type === "radio" ? el.value === String(valor) : Boolean(valor);
        if (el.checked !== deveMarcar) {
          el.click(); // lets frameworks see a real toggle
        }
      } else {
        definirValorNativo(el, valor === null ? "" : String(valor));
      }
      preenchidos++;
    }
  }
  const formId = form.dataset.demoForm ?? "";
  for (const fn of preenchedores.get(formId) ?? []) await fn(cenario, form);
  if (cenario.submeter) {
    // Let the framework commit the new state before submitting (a React
    // submit handler would otherwise read the values from before the fill).
    await new Promise<void>((r) => requestAnimationFrame(() => setTimeout(r, 0)));
    form.requestSubmit();
  }
  return preenchidos;
}

// ─── Reading the page ──────────────────────────────────────────────────────

/** Layers whose forms get the in-dialog strip instead of the floating pill. */
const SELETOR_CAMADA = '[role="dialog"], [role="alertdialog"], dialog[open]';
const MARCA_RAIZ = "data-demo-preencher";
const AVISO_MS = 3500;

interface Camada {
  host: HTMLElement;
  forms: string[];
}
interface Leitura {
  pagina: string[];
  camadas: Camada[];
  bloqueado: boolean;
}

function camadaDe(form: HTMLFormElement): HTMLElement | null {
  const host = form.closest<HTMLElement>(SELETOR_CAMADA);
  return host && !host.closest(`[${MARCA_RAIZ}]`) ? host : null;
}

function temModalNativo(): boolean {
  try {
    return document.querySelector("dialog:modal") !== null;
  } catch {
    return false;
  }
}

function lerPagina(cenarios: CatalogoDemo, raiz: HTMLElement | null): Leitura {
  const pagina: string[] = [];
  const porHost = new Map<HTMLElement, string[]>();
  for (const form of document.querySelectorAll<HTMLFormElement>("form[data-demo-form]")) {
    const id = form.dataset.demoForm ?? "";
    if (!id || !cenarios[id] || raiz?.contains(form)) continue;
    const host = camadaDe(form);
    if (host) {
      if (host.hidden) continue;
      const lista = porHost.get(host) ?? [];
      if (!lista.includes(id)) lista.push(id);
      porHost.set(host, lista);
    } else if (!pagina.includes(id)) {
      pagina.push(id);
    }
  }
  // A modal marks everything outside it `aria-hidden`/`inert` (Base UI,
  // Radix) or puts itself in the top layer (<dialog>.showModal()): the pill
  // could not be reached, so it hides.
  const bloqueado = (raiz?.closest('[aria-hidden="true"], [inert]') ?? null) !== null || temModalNativo();
  return { pagina, camadas: [...porHost].map(([host, forms]) => ({ host, forms })), bloqueado };
}

function mesmaLeitura(a: Leitura, b: Leitura): boolean {
  return (
    a.bloqueado === b.bloqueado &&
    a.pagina.join("\n") === b.pagina.join("\n") &&
    a.camadas.length === b.camadas.length &&
    a.camadas.every((c, i) => c.host === b.camadas[i]!.host && c.forms.join("\n") === b.camadas[i]!.forms.join("\n"))
  );
}

function movimentoReduzido(): boolean {
  return (
    document.documentElement.dataset.movimento === "reduzido" ||
    (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches)
  );
}

const SELETOR_ACOES = ':is(button, a[href], input[type="submit"], input[type="button"], input[type="reset"])';

/**
 * What the pill must not cover: the focused element, the forms' last actions, `data-demo-evitar`.
 * While a bottom sheet marked `data-demo-folha` is open (the floating assistant at phone width),
 * nothing: the page behind it is hidden anyway and the sheet stacks above the pill docked at the
 * bottom — a pill mid-edge would sit on the sheet or leave it too short.
 */
function obstaculos(raiz: HTMLElement | null): Retangulo[] {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const folha = document.querySelector("[data-demo-folha]");
  if (folha && folha.getBoundingClientRect().height > 0) return [];
  const out: Retangulo[] = [];
  const vistos = new Set<Element>();
  const juntar = (el: Element, grandeOk = false) => {
    if (vistos.has(el) || raiz?.contains(el)) return;
    vistos.add(el);
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0 || r.bottom <= 0 || r.top >= vh || r.right <= 0 || r.left >= vw) return;
    // A focused container (main after a skip link, a whole editor) is not a target.
    if (!grandeOk && r.width * r.height > (vw * vh) / 3) return;
    out.push({ x: r.left, y: r.top, w: r.width, h: r.height });
  };
  const ativo = document.activeElement;
  if (ativo && ativo !== document.body && ativo !== document.documentElement) juntar(ativo);
  const submissoes = document.querySelectorAll('button[type="submit"], input[type="submit"], form button:not([type]), button[form]');
  for (const s of submissoes) {
    juntar(s);
    // The whole actions row: «Cancelar» sits next to «Guardar».
    const linha = s.parentElement;
    if (linha) for (const irmao of linha.querySelectorAll(`:scope > ${SELETOR_ACOES}`)) juntar(irmao);
  }
  for (const e of document.querySelectorAll("[data-demo-evitar]")) juntar(e, true);
  return out;
}

// ─── The component ────────────────────────────────────────────────────────

export function DemoPreencher({
  ativo,
  cenarios,
  className,
}: {
  ativo: boolean;
  cenarios: CatalogoDemo;
  className?: string | undefined;
}) {
  const [montado, setMontado] = useState(false);
  const [leitura, setLeitura] = useState<Leitura>({ pagina: [], camadas: [], bloqueado: false });
  const raizRef = useRef<HTMLDivElement>(null);
  const cenariosRef = useRef(cenarios);
  cenariosRef.current = cenarios;

  useEffect(() => setMontado(true), []);

  const procurar = useCallback(() => {
    const nova = lerPagina(cenariosRef.current, raizRef.current);
    setLeitura((atual) => (mesmaLeitura(atual, nova) ? atual : nova));
  }, []);

  useEffect(() => {
    if (!ativo || !montado) return;
    const html = document.documentElement;
    html.setAttribute("data-demo", "");
    procurar();
    let quadro = 0;
    const agendar = () => {
      if (quadro) return;
      quadro = requestAnimationFrame(() => {
        quadro = 0;
        procurar();
      });
    };
    const obs = new MutationObserver(agendar);
    obs.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-hidden", "inert", "open", "hidden", "data-demo-form", "role"],
    });
    return () => {
      obs.disconnect();
      cancelAnimationFrame(quadro);
      html.removeAttribute("data-demo");
    };
  }, [ativo, montado, procurar]);

  if (!ativo || !montado) return null;

  return (
    <>
      {createPortal(
        <Flutuante
          raizRef={raizRef}
          forms={leitura.pagina}
          escondido={leitura.bloqueado}
          cenarios={cenarios}
          className={className}
        />,
        document.body,
      )}
      {leitura.camadas.map((c) => (
        <NaCamada key={chaveDe(c.host)} host={c.host} forms={c.forms} cenarios={cenarios} />
      ))}
    </>
  );
}

const chaves = new WeakMap<HTMLElement, string>();
let proximaChave = 0;
function chaveDe(el: HTMLElement): string {
  let k = chaves.get(el);
  if (!k) {
    k = `camada-${++proximaChave}`;
    chaves.set(el, k);
  }
  return k;
}

// ─── Floating pill (forms on the page) ─────────────────────────────────────

function Flutuante({
  raizRef,
  forms,
  escondido,
  cenarios,
  className,
}: {
  raizRef: React.RefObject<HTMLDivElement | null>;
  forms: string[];
  escondido: boolean;
  cenarios: CatalogoDemo;
  className?: string | undefined;
}) {
  const [aberto, setAberto] = useState(false);
  const [aviso, setAviso] = useState("");
  const [doca, setDoca] = useState<DocaDemo>("fim");
  const painelId = useId();
  const botaoRef = useRef<HTMLButtonElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);
  const abertoRef = useRef(aberto);
  abertoRef.current = aberto;
  const fundoRef = useRef<number | null>(null);
  const entrarComo = usePersonasDemo(!escondido);
  const grupos = useSyncExternalStore(ouvirAcoesDemo, gruposAcoesDemo, () => SEM_GRUPOS);
  const contagem = forms.length + (entrarComo ? 1 : 0) + grupos.length;

  // Dock away from the focused element and the forms' last actions.
  useEffect(() => {
    if (escondido) return;
    let quadro = 0;
    const calcular = () => {
      quadro = 0;
      if (abertoRef.current) return;
      const b = botaoRef.current?.getBoundingClientRect();
      const pilula = { w: b?.width || 48, h: b?.height || 48 };
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margem = vw < 640 ? 16 : 20;
      // The real distance from the bottom edge in a corner (the safe area, an app's
      // `--demo-fundo` above a bottom navigation bar), measured where the pill is now.
      if (b && b.height > 0 && raizRef.current?.dataset.doca !== "meio") fundoRef.current = Math.max(margem, vh - b.bottom);
      const nova = escolherDoca(pilula, { w: vw, h: vh }, obstaculos(raizRef.current), {
        fundo: fundoRef.current ?? margem,
        margem,
      });
      setDoca(nova);
    };
    const agendar = () => {
      if (!quadro) quadro = requestAnimationFrame(calcular);
    };
    calcular();
    window.addEventListener("scroll", agendar, { capture: true, passive: true });
    window.addEventListener("resize", agendar);
    document.addEventListener("focusin", agendar);
    document.addEventListener("focusout", agendar);
    const obs = new MutationObserver(agendar);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener("scroll", agendar, { capture: true });
      window.removeEventListener("resize", agendar);
      document.removeEventListener("focusin", agendar);
      document.removeEventListener("focusout", agendar);
      obs.disconnect();
    };
  }, [escondido, raizRef]);

  // The whole footprint (pill + open panel + notice) in the position registry:
  // the floating assistant stacks above it and never covers it. The
  // widget never moves for the chat.
  const registo = useRegistoPosicoes();
  useLayoutEffect(() => {
    const raiz = raizRef.current;
    if (escondido || !raiz) {
      registo.publicar(ID_POSICAO_DEMO, null);
      return;
    }
    let quadro = 0;
    const medir = () => {
      quadro = 0;
      const els = [botaoRef.current, painelRef.current, aviso ? raiz.querySelector(".m-demo-aviso") : null];
      const rs: RetanguloPosicao[] = els.flatMap((el) => {
        if (!el) return [];
        const r = el.getBoundingClientRect();
        return [{ x: r.left, y: r.top, w: r.width, h: r.height }];
      });
      registo.publicar(ID_POSICAO_DEMO, uniao(rs));
    };
    const agendar = () => {
      if (!quadro) quadro = requestAnimationFrame(medir);
    };
    medir();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(agendar);
    ro?.observe(raiz);
    if (painelRef.current) ro?.observe(painelRef.current);
    window.addEventListener("resize", agendar);
    // The dock may move with an opacity/transform transition: measure once more after it.
    raiz.addEventListener("transitionend", agendar);
    return () => {
      cancelAnimationFrame(quadro);
      ro?.disconnect();
      window.removeEventListener("resize", agendar);
      raiz.removeEventListener("transitionend", agendar);
    };
  }, [escondido, aberto, aviso, doca, registo, raizRef]);
  useEffect(() => () => registo.publicar(ID_POSICAO_DEMO, null), [registo]);

  // A modal opened over the page: close the panel.
  useEffect(() => {
    if (escondido) setAberto(false);
  }, [escondido]);

  // Open: focus the first scenario; a press outside closes the panel.
  useEffect(() => {
    if (!aberto) return;
    const painel = painelRef.current;
    (painel?.querySelector<HTMLElement>("[data-cenario]") ?? painel?.querySelector<HTMLElement>("button"))?.focus();
    const fora = (e: PointerEvent) => {
      if (!raizRef.current?.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("pointerdown", fora);
    return () => document.removeEventListener("pointerdown", fora);
  }, [aberto, raizRef]);

  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(() => setAviso(""), AVISO_MS);
    return () => window.clearTimeout(t);
  }, [aviso]);

  const fechar = () => {
    setAberto(false);
    botaoRef.current?.focus();
  };

  const aplicar = async (formId: string, cenario: CenarioDemo) => {
    const form = [...document.querySelectorAll<HTMLFormElement>(`form[data-demo-form="${CSS.escape(formId)}"]`)].find(
      (f) => !camadaDe(f),
    );
    if (!form) return;
    fechar();
    const n = await preencherFormulario(form, cenario);
    form.scrollIntoView({ behavior: movimentoReduzido() ? "auto" : "smooth", block: "center" });
    setAviso(`«${cenario.nome}» aplicado (${n} ${n === 1 ? "campo" : "campos"}).`);
  };

  const executar = async (acao: AcaoDemo) => {
    fechar();
    await acao.executar();
  };

  // The panel opens above the pill; from the middle of the edge it opens at the corner.
  const docaVisivel: DocaDemo = aberto && doca === "meio" ? "fim" : doca;

  return (
    <div
      ref={raizRef}
      {...{ [MARCA_RAIZ]: "" }}
      data-doca={docaVisivel}
      hidden={escondido}
      className={cx("m-demo print:hidden", className)}
      onKeyDown={(e) => {
        if (e.key === "Escape" && aberto) {
          e.stopPropagation();
          fechar();
        }
      }}
    >
      {aberto && (
        <div
          ref={painelRef}
          id={painelId}
          role="dialog"
          aria-label="Demonstração"
          className="m-demo-painel m-float w-[min(22rem,calc(100vw-2rem))] p-4 text-base"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 font-semibold">
                <Sparkles aria-hidden className="size-[1.1em] text-app-accent" />
                Demonstração
              </p>
              <p className="text-sm text-muted-foreground">
                {entrarComo
                  ? "Entre como uma pessoa de exemplo ou preencha os formulários com dados de exemplo."
                  : grupos.length > 0 && forms.length === 0
                    ? "Experimente esta página com exemplos."
                    : "Preencha os formulários desta página com dados de exemplo."}
              </p>
            </div>
            <button
              type="button"
              onClick={fechar}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-accent"
              aria-label="Fechar"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
          {contagem === 0 ? (
            <p className="rounded-lg bg-muted px-3 py-3 text-[0.9375rem] text-muted-foreground">
              Não há exemplos para esta página.
            </p>
          ) : (
            <div className="flex max-h-[min(60vh,calc(100dvh-12rem))] flex-col gap-4 overflow-y-auto">
              {entrarComo && <SeccaoEntrarComo contexto={entrarComo.contexto} personas={entrarComo.personas} />}
              {grupos.map((g) => (
                <section key={g.id} className="flex flex-col gap-2" data-demo-acoes={g.id}>
                  <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{g.titulo}</h3>
                  {g.descricao && <p className="text-[0.9375rem] text-muted-foreground">{g.descricao}</p>}
                  {g.acoes.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      data-cenario=""
                      disabled={a.desativada}
                      onClick={() => void executar(a)}
                      className="m-btn m-btn-outline flex min-h-12 w-full shrink-0 flex-col items-start rounded-lg px-3.5 py-2 text-left whitespace-normal disabled:opacity-60"
                    >
                      <span className="font-semibold">{a.nome}</span>
                      {a.descricao && <span className="text-sm font-normal text-muted-foreground">{a.descricao}</span>}
                    </button>
                  ))}
                </section>
              ))}
              {forms.map((id) => (
                <section key={id} className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                    {cenarios[id]!.titulo}
                  </h3>
                  {cenarios[id]!.cenarios.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      data-cenario=""
                      onClick={() => void aplicar(id, c)}
                      className="m-btn m-btn-outline flex min-h-12 w-full shrink-0 flex-col items-start rounded-lg px-3.5 py-2 text-left whitespace-normal"
                    >
                      <span className="font-semibold">{c.nome}</span>
                      {c.descricao && <span className="text-sm font-normal text-muted-foreground">{c.descricao}</span>}
                    </button>
                  ))}
                </section>
              ))}
            </div>
          )}
        </div>
      )}
      <p role="status" className={aviso ? "m-demo-aviso m-float px-3.5 py-2 text-[0.9375rem]" : "sr-only"}>
        {aviso}
      </p>
      <button
        ref={botaoRef}
        type="button"
        aria-expanded={aberto}
        aria-controls={aberto ? painelId : undefined}
        title="Demonstração"
        onClick={() => setAberto((v) => !v)}
        className="m-demo-pilula m-btn m-btn-primary relative inline-flex size-12 items-center justify-center rounded-full p-0 shadow-lg focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Wand2 aria-hidden className="size-[1.25em]" />
        <span className="sr-only">
          Demonstração
          {contagem > 0 &&
            ` (${[
              entrarComo ? "Entrar como…" : "",
              grupos.length > 0 ? grupos.map((g) => g.titulo).join(", ") : "",
              forms.length > 0 ? `${forms.length} ${forms.length === 1 ? "formulário" : "formulários"}` : "",
            ]
              .filter(Boolean)
              .join(", ")})`}
        </span>
        {contagem > 0 && (
          <span
            aria-hidden
            className="absolute -top-1 -right-1 grid min-w-6 place-items-center rounded-full border-2 border-background bg-foreground px-1 text-xs leading-5 font-semibold text-background"
          >
            {contagem}
          </span>
        )}
      </button>
    </div>
  );
}

// ─── Strip inside an open dialog or sheet ──────────────────────────────────

function NaCamada({ host, forms, cenarios }: { host: HTMLElement; forms: string[]; cenarios: CatalogoDemo }) {
  const [alvo, setAlvo] = useState<HTMLElement | null>(null);
  const [aviso, setAviso] = useState("");
  const tituloId = useId();

  // A container appended to the dialog itself: inside its focus trap and
  // outside what the modal makes inert. `order` keeps it last in a flex column.
  useLayoutEffect(() => {
    const div = document.createElement("div");
    div.setAttribute("data-demo-camada", "");
    div.className = "m-demo-camada print:hidden";
    host.append(div);
    setAlvo(div);
    return () => div.remove();
  }, [host]);

  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(() => setAviso(""), AVISO_MS);
    return () => window.clearTimeout(t);
  }, [aviso]);

  if (!alvo) return null;

  const aplicar = async (formId: string, cenario: CenarioDemo) => {
    const form = host.querySelector<HTMLFormElement>(`form[data-demo-form="${CSS.escape(formId)}"]`);
    if (!form) return;
    const n = await preencherFormulario(form, cenario);
    setAviso(`«${cenario.nome}» aplicado (${n} ${n === 1 ? "campo" : "campos"}).`);
  };

  return createPortal(
    <div role="group" aria-labelledby={tituloId} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3 sm:px-6">
      <p id={tituloId} className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <Wand2 aria-hidden className="size-4 text-app-accent" />
        Preencher (demonstração)
      </p>
      <div className="flex flex-wrap gap-2">
        {forms.flatMap((id) =>
          cenarios[id]!.cenarios.map((c) => (
            <button
              key={`${id}:${c.id}`}
              type="button"
              data-cenario=""
              title={c.descricao}
              onClick={() => void aplicar(id, c)}
              className="m-btn m-btn-outline inline-flex min-h-11 items-center rounded-full px-3.5 text-[0.9375rem] whitespace-normal"
            >
              {forms.length > 1 ? `${cenarios[id]!.titulo}: ${c.nome}` : c.nome}
              {c.descricao && <span className="sr-only">{` — ${c.descricao}`}</span>}
            </button>
          )),
        )}
      </div>
      <p role="status" className={aviso ? "basis-full text-sm text-muted-foreground" : "sr-only"}>
        {aviso}
      </p>
    </div>,
    alvo,
  );
}
