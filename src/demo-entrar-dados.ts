/**
 * «Entrar como…» of the DEMONSTRATION — the plain logic, no DOM, so
 * it is unit-tested. The UI is a section of the floating «Demonstração»
 * widget (`DemoPreencher`); a login page only REGISTERS its sign-in context:
 *
 *   useEffect(() => registarEntrarComo({ destino: "portal", aoEntrar }), [aoEntrar]);
 *
 * The widget then lists the personas of the Cérebro in use
 * (`GET /api/v1/demo/personas?destino=…`) and one click is
 * `POST /api/v1/demo/entrar { id }` (the Cérebro signs in on the server and
 * sets the normal session cookies; no password reaches the browser). Both
 * routes only exist with `DEMO_MODE=true`: anywhere else the list is a 404 and
 * the widget shows no «Entrar como…».
 */

export interface PersonaDemo {
  id: string;
  destino: "portal" | "cartao";
  grupo: string;
  funcao: string;
  nome: string;
  email: string;
}

export interface ContextoEntrarComo {
  destino: "portal" | "cartao";
  /** Called after the session cookies are set (navigate from here). */
  aoEntrar: (r: { persona: PersonaDemo; twoFactor: boolean }) => void;
  /** Prefix of the Cérebro proxy on this host (default: same origin, `/api/v1`). */
  api?: string | undefined;
}

let atual: ContextoEntrarComo | null = null;
const ouvintes = new Set<() => void>();
const avisar = () => {
  for (const f of ouvintes) f();
};

/** Registers the page's demo sign-in context for the widget. Returns an unregister function. */
export function registarEntrarComo(contexto: ContextoEntrarComo): () => void {
  atual = contexto;
  avisar();
  return () => {
    if (atual === contexto) {
      atual = null;
      avisar();
    }
  };
}

/** The registered context (null when the page has no demo sign-in). */
export function contextoEntrarComo(): ContextoEntrarComo | null {
  return atual;
}

export function ouvirEntrarComo(fn: () => void): () => void {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}

export function eListaDePersonas(x: unknown): x is { success: true; data: { personas: PersonaDemo[] } } {
  if (typeof x !== "object" || x === null) return false;
  const o = x as { success?: unknown; data?: { personas?: unknown } };
  return o.success === true && Array.isArray(o.data?.personas);
}

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/** Personas grouped by `grupo` (order of first appearance), filtered by name, role, group or email. */
export function agruparPersonas(personas: readonly PersonaDemo[], filtro = ""): [string, PersonaDemo[]][] {
  const f = normalizar(filtro.trim());
  const mapa = new Map<string, PersonaDemo[]>();
  for (const p of personas) {
    if (f && !normalizar(`${p.nome} ${p.funcao} ${p.grupo} ${p.email}`).includes(f)) continue;
    const lista = mapa.get(p.grupo) ?? [];
    lista.push(p);
    mapa.set(p.grupo, lista);
  }
  return [...mapa.entries()];
}
