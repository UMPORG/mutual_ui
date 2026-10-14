/**
 * Page context for the floating assistant (pure, no React/DOM). Sent with the next question ONLY when it changed (hash), compact and capped; the Cérebro keeps it inside the encrypted conversation.
 * Mark personal data `sensivel` (the model then learns only «preenchido»); the Cérebro also masks NIF, emails, phones and IBAN in ordinary fields.
 */

export type ValorContexto = string | number | boolean | null;

export interface CampoContexto {
  /** Dotted path in the form's draft ("identificacao.nif") — what a proposal writes. */
  caminho: string;
  rotulo: string;
  valor: ValorContexto;
  /** Personal data: the model only learns whether it is filled. */
  sensivel?: boolean | undefined;
  /** The assistant may propose a value for it (applied by the page, never submitted). */
  editavel?: boolean | undefined;
}

export type EntradaDado =
  | ValorContexto
  | { valor: ValorContexto; rotulo?: string | undefined; sensivel?: boolean | undefined; editavel?: boolean | undefined };

export interface EntradaContexto {
  /** The app (`data-app` id). */
  app: string;
  pagina: string;
  seccao?: string | undefined;
  /** What is on the page: `{ caminho: valor | { valor, rotulo, sensivel, editavel } }`. */
  dados?: Readonly<Record<string, EntradaDado>> | undefined;
  /** The same as a list (keeps the order of the form). */
  campos?: readonly CampoContexto[] | undefined;
  formulario?: "caracterizacao" | "simplex" | undefined;
  /** «Preencher com um documento» target in the Cérebro ("caracterizacao.a"). */
  alvo?: string | undefined;
}

/** What goes to the Cérebro (`contextoPagina` of `POST /perguntar`). */
export interface ContextoPagina {
  app: string;
  rota: string;
  pagina: string;
  seccao?: string | undefined;
  formulario?: "caracterizacao" | "simplex" | undefined;
  alvo?: string | undefined;
  campos: CampoContexto[];
}

export const LIMITES_CONTEXTO = { campos: 80, caminho: 120, rotulo: 120, valor: 300, pagina: 120, rota: 300 } as const;

const corta = (s: string, n: number) => {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
};

const valorCompacto = (v: unknown): ValorContexto => {
  if (v === null || v === undefined) return null;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  return corta(String(v), LIMITES_CONTEXTO.valor);
};

const eObjetoDado = (v: EntradaDado): v is Exclude<EntradaDado, ValorContexto> =>
  v !== null && typeof v === "object";

export function rotaSemIds(rota: string): string {
  return corta(
    rota
      .split(/[?#]/)[0]!
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/gi, "/:id")
      .replace(/\/\d{4,}(?=\/|$)/g, "/:id"),
    LIMITES_CONTEXTO.rota,
  );
}

export function normalizarContexto(e: EntradaContexto, rota: string): ContextoPagina {
  const lista: CampoContexto[] = [...(e.campos ?? [])];
  for (const [caminho, d] of Object.entries(e.dados ?? {})) {
    if (lista.some((c) => c.caminho === caminho)) continue;
    lista.push(
      eObjetoDado(d)
        ? { caminho, rotulo: d.rotulo ?? caminho, valor: d.valor, sensivel: d.sensivel, editavel: d.editavel }
        : { caminho, rotulo: caminho, valor: d },
    );
  }
  const campos = lista.slice(0, LIMITES_CONTEXTO.campos).map((c) => {
    const out: CampoContexto = {
      caminho: corta(c.caminho, LIMITES_CONTEXTO.caminho),
      rotulo: corta(c.rotulo || c.caminho, LIMITES_CONTEXTO.rotulo),
      valor: valorCompacto(c.valor),
    };
    if (c.sensivel) out.sensivel = true;
    if (c.editavel) out.editavel = true;
    return out;
  });
  const out: ContextoPagina = {
    app: e.app,
    rota: rotaSemIds(rota),
    pagina: corta(e.pagina, LIMITES_CONTEXTO.pagina),
    campos,
  };
  if (e.seccao) out.seccao = corta(e.seccao, LIMITES_CONTEXTO.pagina);
  if (e.formulario) out.formulario = e.formulario;
  if (e.alvo) out.alvo = corta(e.alvo, 60);
  return out;
}

/** Stable JSON (sorted keys) — the same context always gives the same text. */
export function jsonEstavel(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null";
  if (Array.isArray(v)) return `[${v.map(jsonEstavel).join(",")}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o)
    .filter((k) => o[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${jsonEstavel(o[k])}`)
    .join(",")}}`;
}

export function hashContexto(c: ContextoPagina | null): string {
  if (!c) return "0";
  const s = jsonEstavel(c);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export interface DiferencaContexto {
  outraPagina: boolean;
  alterados: CampoContexto[];
  removidos: string[];
}

export function diferencaContexto(antes: ContextoPagina | null, agora: ContextoPagina): DiferencaContexto {
  if (!antes || antes.app !== agora.app || antes.rota !== agora.rota || antes.pagina !== agora.pagina || antes.seccao !== agora.seccao) {
    return { outraPagina: true, alterados: agora.campos, removidos: [] };
  }
  const velhos = new Map(antes.campos.map((c) => [c.caminho, jsonEstavel(c)]));
  const novos = new Set(agora.campos.map((c) => c.caminho));
  return {
    outraPagina: false,
    alterados: agora.campos.filter((c) => velhos.get(c.caminho) !== jsonEstavel(c)),
    removidos: antes.campos.filter((c) => !novos.has(c.caminho)).map((c) => c.caminho),
  };
}

/** The full compact context when it differs from the last one sent in this conversation, else `undefined` (the Cérebro reuses the last). */
export function contextoAEnviar(
  atual: ContextoPagina | null,
  ultimoHashEnviado: string | undefined,
): { contexto: ContextoPagina | undefined; hash: string } {
  const hash = hashContexto(atual);
  return { contexto: atual && hash !== ultimoHashEnviado ? atual : undefined, hash };
}

export function valoresDoContexto(c: ContextoPagina | null): Record<string, unknown> {
  return Object.fromEntries((c?.campos ?? []).map((x) => [x.caminho, x.valor]));
}
