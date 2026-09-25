"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Sparkles, Wand2, X } from "lucide-react";
import { cx } from "./cx";

/**
 * Demonstration mode: a floating "Preencher com dados de exemplo" helper.
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
 * Scenarios are meant to show how each form reacts: valid data, a validation
 * error, an edge case (e.g. a full event, a negative amount).
 */

export type ValorDemo = string | number | boolean | null;

export interface CenarioDemo {
  id: string;
  /** Short label shown in the menu, e.g. "Dados válidos", "Com erros". */
  nome: string;
  descricao?: string;
  campos: Record<string, ValorDemo>;
  /** Submit the form after filling. */
  submeter?: boolean;
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

export function DemoPreencher({
  ativo,
  cenarios,
  className,
}: {
  ativo: boolean;
  cenarios: CatalogoDemo;
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [formsNaPagina, setFormsNaPagina] = useState<string[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const painelId = useId();
  const botaoRef = useRef<HTMLButtonElement>(null);

  const procurar = useCallback(() => {
    const ids = [...document.querySelectorAll<HTMLFormElement>("form[data-demo-form]")]
      .map((f) => f.dataset.demoForm ?? "")
      .filter((id, i, a) => id && a.indexOf(id) === i);
    setFormsNaPagina(ids);
  }, []);

  useEffect(() => {
    if (!ativo) return;
    procurar();
    const obs = new MutationObserver(procurar);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, [ativo, procurar]);

  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAberto(false);
        botaoRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aberto]);

  if (!ativo) return null;

  const aplicar = async (formId: string, cenario: CenarioDemo) => {
    const form = document.querySelector<HTMLFormElement>(`form[data-demo-form="${CSS.escape(formId)}"]`);
    if (!form) return;
    const n = await preencherFormulario(form, cenario);
    form.scrollIntoView({ behavior: "smooth", block: "center" });
    setAviso(`«${cenario.nome}» aplicado (${n} campos).`);
    setAberto(false);
    window.setTimeout(() => setAviso(null), 3500);
  };

  const disponiveis = formsNaPagina.filter((id) => cenarios[id]);

  return (
    <div className={cx("fixed bottom-5 left-5 z-[2147482000] flex flex-col items-start gap-2 print:hidden", className)}>
      {aberto && (
        <div
          id={painelId}
          role="dialog"
          aria-label="Demonstração"
          className="m-float w-[min(22rem,calc(100vw-2.5rem))] p-4 text-base"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 font-semibold">
                <Sparkles aria-hidden className="size-[1.1em] text-app-accent" />
                Demonstração
              </p>
              <p className="text-sm text-muted-foreground">Preencha os formulários desta página com dados de exemplo.</p>
            </div>
            <button
              type="button"
              onClick={() => setAberto(false)}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg hover:bg-accent"
              aria-label="Fechar"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
          {disponiveis.length === 0 ? (
            <p className="rounded-lg bg-muted px-3 py-3 text-[0.9375rem] text-muted-foreground">
              Não há formulários com dados de exemplo nesta página.
            </p>
          ) : (
            <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto">
              {disponiveis.map((id) => (
                <section key={id} className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                    {cenarios[id]!.titulo}
                  </h3>
                  {cenarios[id]!.cenarios.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => aplicar(id, c)}
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
      {aviso && (
        <p role="status" className="m-float px-3.5 py-2 text-[0.9375rem]">
          {aviso}
        </p>
      )}
      <button
        ref={botaoRef}
        type="button"
        aria-expanded={aberto}
        aria-controls={painelId}
        onClick={() => setAberto((v) => !v)}
        className="m-btn m-btn-primary inline-flex min-h-12 items-center gap-2 rounded-full px-5 shadow-lg focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Wand2 aria-hidden className="size-[1.2em]" />
        Demonstração
        {disponiveis.length > 0 && (
          <span className="rounded-full bg-white/25 px-2 text-sm">{disponiveis.length}</span>
        )}
      </button>
    </div>
  );
}
