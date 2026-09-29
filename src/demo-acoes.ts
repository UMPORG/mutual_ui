/**
 * Page ACTIONS of the DEMONSTRATION (v0.11.3) — the plain registry, no DOM, so
 * it is unit-tested. Everything demo-only lives in the floating «Demonstração»
 * widget (`DemoPreencher`): never a badge, banner or panel on the page. A page
 * with demo-only things to offer that are not forms (sample codes to read,
 * sample identifications at a counter, «repor dados»…) REGISTERS them and the
 * widget shows them as a section of its panel:
 *
 *   useAcoesDemo(demo ? { id: "amostras", titulo: "Códigos de exemplo", acoes } : null);
 *
 * Several groups may be registered at once (shown in registration order).
 */

export interface AcaoDemo {
  id: string;
  nome: string;
  descricao?: string | undefined;
  /** The action cannot run right now (e.g. a request is in progress). */
  desativada?: boolean | undefined;
  /** Runs after the panel closes. */
  executar: () => void | Promise<void>;
}

export interface GrupoAcoesDemo {
  id: string;
  titulo: string;
  descricao?: string | undefined;
  acoes: readonly AcaoDemo[];
}

let grupos: readonly GrupoAcoesDemo[] = [];
const ouvintes = new Set<() => void>();
const avisar = () => {
  for (const f of ouvintes) f();
};

/** Registers (or replaces, by `id`) a group of demo actions. Returns an unregister function. */
export function registarAcoesDemo(grupo: GrupoAcoesDemo): () => void {
  const i = grupos.findIndex((g) => g.id === grupo.id);
  grupos = i < 0 ? [...grupos, grupo] : grupos.map((g, j) => (j === i ? grupo : g));
  avisar();
  return () => {
    if (!grupos.includes(grupo)) return;
    grupos = grupos.filter((g) => g !== grupo);
    avisar();
  };
}

/** The registered groups (a stable array between changes). */
export function gruposAcoesDemo(): readonly GrupoAcoesDemo[] {
  return grupos;
}

export function ouvirAcoesDemo(fn: () => void): () => void {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}
