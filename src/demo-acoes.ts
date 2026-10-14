/**
 * Registry of demo-only page actions (no DOM, unit-tested), shown by the «Demonstração» widget:
 * `useAcoesDemo(demo ? { id: "amostras", titulo: "...", acoes } : null)`. Several groups may coexist.
 */

export interface AcaoDemo {
  id: string;
  nome: string;
  descricao?: string | undefined;
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

export function gruposAcoesDemo(): readonly GrupoAcoesDemo[] {
  return grupos;
}

export function ouvirAcoesDemo(fn: () => void): () => void {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}
