"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Loader2, LogIn, Search } from "lucide-react";
import { cx } from "./cx";

/**
 * «Entrar como…» of the DEMONSTRATION (v0.11): one click signs in as a demo
 * persona, no password to remember. For the Portal login and the Cartão's.
 *
 * The list comes from the Cérebro of the environment in use —
 * `GET /api/v1/demo/personas?destino=…` — and signing in is
 * `POST /api/v1/demo/entrar { id }`: the Cérebro signs in with the persona's
 * password on the server (it never reaches the browser) and sets the normal
 * session cookies. Both routes only exist with `DEMO_MODE=true` on a demo
 * database; anywhere else the list request is a 404 and this component
 * renders NOTHING, so it is safe to mount unconditionally, but apps still
 * only mount it in demo mode.
 */

export interface PersonaDemo {
  id: string;
  destino: "portal" | "cartao";
  grupo: string;
  funcao: string;
  nome: string;
  email: string;
}

export interface EntrarComoDemoProps {
  destino: "portal" | "cartao";
  /** Called after the session cookies are set (navigate from here). */
  aoEntrar: (r: { persona: PersonaDemo; twoFactor: boolean }) => void;
  /** Prefix of the Cérebro proxy on this host (default: same origin, `/api/v1`). */
  api?: string | undefined;
  /** Groups open at first (default: the first two). */
  gruposAbertos?: number | undefined;
  className?: string | undefined;
}

type Estado =
  | { fase: "a-carregar" }
  | { fase: "indisponivel" }
  | { fase: "pronto"; personas: PersonaDemo[] };

function eListaDePersonas(x: unknown): x is { success: true; data: { personas: PersonaDemo[] } } {
  if (typeof x !== "object" || x === null) return false;
  const o = x as { success?: unknown; data?: { personas?: unknown } };
  return o.success === true && Array.isArray(o.data?.personas);
}

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export function EntrarComoDemo({ destino, aoEntrar, api = "/api/v1", gruposAbertos = 2, className }: EntrarComoDemoProps) {
  const [estado, setEstado] = useState<Estado>({ fase: "a-carregar" });
  const [aEntrar, setAEntrar] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("");
  const idTitulo = useId();
  const idFiltro = useId();

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`${api}/demo/personas?destino=${destino}`, { credentials: "same-origin", signal: ctrl.signal, cache: "no-store" })
      .then(async (r) => {
        const corpo: unknown = r.ok ? await r.json() : null;
        setEstado(eListaDePersonas(corpo) && corpo.data.personas.length > 0 ? { fase: "pronto", personas: corpo.data.personas } : { fase: "indisponivel" });
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setEstado({ fase: "indisponivel" });
      });
    return () => ctrl.abort();
  }, [api, destino]);

  const grupos = useMemo(() => {
    if (estado.fase !== "pronto") return [];
    const f = normalizar(filtro.trim());
    const mapa = new Map<string, PersonaDemo[]>();
    for (const p of estado.personas) {
      if (f && !normalizar(`${p.nome} ${p.funcao} ${p.grupo} ${p.email}`).includes(f)) continue;
      const lista = mapa.get(p.grupo) ?? [];
      lista.push(p);
      mapa.set(p.grupo, lista);
    }
    return [...mapa.entries()];
  }, [estado, filtro]);

  if (estado.fase !== "pronto") return null;

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
      aoEntrar({ persona: p, twoFactor: Boolean(corpo.data?.twoFactor) });
    } catch {
      setErro("Sem ligação ao serviço. Tente novamente.");
      setAEntrar(null);
    }
  }

  const total = estado.personas.length;
  return (
    <section aria-labelledby={idTitulo} className={cx("m-surface flex flex-col gap-3 p-4 sm:p-5", className)} data-demo-evitar>
      <div className="flex flex-col gap-1">
        <h2 id={idTitulo} className="flex items-center gap-2 text-lg font-semibold">
          <LogIn aria-hidden className="size-5 text-brand" />
          Entrar como…
          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand-soft-foreground">demonstração</span>
        </h2>
        <p className="text-[0.9375rem] text-muted-foreground">Escolha uma pessoa: entra logo, sem palavra-passe.</p>
      </div>
      {total > 10 && (
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
                    onClick={() => entrar(p)}
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
