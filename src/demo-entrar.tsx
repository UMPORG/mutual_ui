"use client";

import { useEffect, useId, useMemo, useState, useSyncExternalStore } from "react";
import { Loader2, LogIn, Search } from "lucide-react";
import {
  agruparPersonas,
  contextoEntrarComo,
  eListaDePersonas,
  ouvirEntrarComo,
  registarEntrarComo,
  type ContextoEntrarComo,
  type PersonaDemo,
} from "./demo-entrar-dados";

/**
 * «Entrar como…» inside the floating «Demonstração» widget (v0.11.2). Not
 * exported: pages register a context (`registarEntrarComo` /
 * `useEntrarComoDemo`) and `DemoPreencher` shows this section in its panel.
 */

/** Registers the page's demo sign-in context while the component is mounted. */
export function useEntrarComoDemo(contexto: ContextoEntrarComo | null): void {
  const destino = contexto?.destino;
  const api = contexto?.api;
  const aoEntrar = contexto?.aoEntrar;
  useEffect(() => {
    if (!destino || !aoEntrar) return;
    return registarEntrarComo({ destino, aoEntrar, api });
  }, [destino, aoEntrar, api]);
}

/** The registered context and its personas (null until loaded; null when unavailable). */
export function usePersonasDemo(ativo: boolean): { contexto: ContextoEntrarComo; personas: PersonaDemo[] } | null {
  const contexto = useSyncExternalStore(ouvirEntrarComo, contextoEntrarComo, () => null);
  const [carregado, setCarregado] = useState<{ chave: string; personas: PersonaDemo[] } | null>(null);
  const api = contexto?.api ?? "/api/v1";
  const chave = contexto ? `${api}|${contexto.destino}` : "";

  useEffect(() => {
    if (!ativo || !chave || !contexto) return;
    const ctrl = new AbortController();
    fetch(`${api}/demo/personas?destino=${contexto.destino}`, { credentials: "same-origin", signal: ctrl.signal, cache: "no-store" })
      .then(async (r) => {
        const corpo: unknown = r.ok ? await r.json() : null;
        setCarregado({ chave, personas: eListaDePersonas(corpo) ? corpo.data.personas : [] });
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setCarregado({ chave, personas: [] });
      });
    return () => ctrl.abort();
    // `contexto` changes identity with `aoEntrar`; the list only depends on the key.
  }, [ativo, chave, api]);

  if (!contexto || !carregado || carregado.chave !== chave || carregado.personas.length === 0) return null;
  return { contexto, personas: carregado.personas };
}

export function SeccaoEntrarComo({
  contexto,
  personas,
  gruposAbertos = 2,
}: {
  contexto: ContextoEntrarComo;
  personas: PersonaDemo[];
  gruposAbertos?: number | undefined;
}) {
  const [aEntrar, setAEntrar] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("");
  const idTitulo = useId();
  const idFiltro = useId();
  const api = contexto.api ?? "/api/v1";
  const grupos = useMemo(() => agruparPersonas(personas, filtro), [personas, filtro]);

  async function entrar(p: PersonaDemo) {
    setAEntrar(p.id);
    setErro(null);
    try {
      const r = await fetch(`${api}/demo/entrar`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id }),
      });
      const corpo = (await r.json().catch(() => null)) as { success?: boolean; error?: string; data?: { twoFactor?: boolean } } | null;
      if (!r.ok || !corpo?.success) {
        setErro(corpo?.error ?? "Não foi possível entrar com esta pessoa. Tente outra.");
        setAEntrar(null);
        return;
      }
      contexto.aoEntrar({ persona: p, twoFactor: Boolean(corpo.data?.twoFactor) });
    } catch {
      setErro("Sem ligação ao serviço. Tente novamente.");
      setAEntrar(null);
    }
  }

  return (
    <section aria-labelledby={idTitulo} className="flex flex-col gap-2" data-demo-entrar="">
      <h3 id={idTitulo} className="flex items-center gap-1.5 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        <LogIn aria-hidden className="size-4 text-app-accent" />
        Entrar como…
      </h3>
      <p className="text-[0.9375rem] text-muted-foreground">Escolha uma pessoa: entra logo, sem palavra-passe.</p>
      {personas.length > 10 && (
        <div className="relative">
          <label htmlFor={idFiltro} className="sr-only">
            Procurar pessoa, função ou organização
          </label>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id={idFiltro}
            type="search"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Procurar pessoa, função ou organização"
            className="m-field h-11 w-full rounded-lg pr-3 pl-9 text-base text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      )}
      {erro && (
        <p role="alert" className="rounded-lg bg-destructive-soft px-3 py-2 text-[0.9375rem] text-destructive-soft-foreground">
          {erro}
        </p>
      )}
      <div className="flex flex-col gap-2">
        {grupos.length === 0 && <p className="text-[0.9375rem] text-muted-foreground">Ninguém corresponde à pesquisa.</p>}
        {grupos.map(([grupo, pessoas], i) => (
          <details key={grupo} open={filtro.trim() !== "" || i < gruposAbertos} className="group rounded-lg border border-border">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-2 font-semibold hover:bg-foreground/[0.04] [&::-webkit-details-marker]:hidden">
              <span>{grupo}</span>
              <span className="shrink-0 text-sm font-normal whitespace-nowrap text-muted-foreground">
                {pessoas.length} <span aria-hidden className="inline-block transition-transform group-open:rotate-90">›</span>
              </span>
            </summary>
            <ul className="flex flex-col gap-1 px-1.5 pb-1.5">
              {pessoas.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    data-cenario=""
                    data-persona={p.id}
                    onClick={() => void entrar(p)}
                    disabled={aEntrar !== null}
                    aria-busy={aEntrar === p.id || undefined}
                    className="flex min-h-12 w-full items-center gap-3 rounded-md px-2.5 py-2 text-left hover:bg-foreground/[0.05] disabled:cursor-wait"
                  >
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="font-medium text-foreground">{p.nome}</span>
                      <span className="text-sm text-muted-foreground">{p.funcao}</span>
                    </span>
                    {aEntrar === p.id ? (
                      <span className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
                        <Loader2 aria-hidden className="m-spinner size-4" /> A entrar…
                      </span>
                    ) : (
                      <span className="shrink-0 text-sm font-semibold text-brand">Entrar</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </section>
  );
}
