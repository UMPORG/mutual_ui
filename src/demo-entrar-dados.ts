/**
 * «Entrar como…» of the demo (pure logic). A login page only registers its context
 * (`registarEntrarComo({ destino, aoEntrar })`); the widget lists `GET /api/v1/demo/personas?destino=…`
 * and one click is `POST /api/v1/demo/entrar { id }` (server-side sign-in, no password in the browser).
 * Both routes exist only with `DEMO_MODE=true`.
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
  aoEntrar: (r: { persona: PersonaDemo; twoFactor: boolean }) => void;
  /** Prefix of the Cérebro on this origin (default `/api/v1`). */
  api?: string | undefined;
}

let atual: ContextoEntrarComo | null = null;
const ouvintes = new Set<() => void>();
const avisar = () => {
  for (const f of ouvintes) f();
};

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
