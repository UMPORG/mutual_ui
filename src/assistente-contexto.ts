/**
 * Page context for the floating assistant (v0.18) — pure, no React, no DOM,
 * tested in `tests/assistente.test.ts`.
 *
 * A page publishes what the person is looking at (`useContextoAssistente`):
 * the app, the page, the current section, the fields with their labels and
 * values. It is sent to the Cérebro with the next question ONLY when it
 * changed (hash), compact and capped; the Cérebro keeps it inside the
 * encrypted conversation and gives the model only the difference.
 *
 * Personal data does not need to be removed here — mark it (`sensivel`) and
 * the Cérebro sends the model only «preenchido». NIF, emails, phones and IBAN
 * in ordinary fields are masked by the Cérebro too.
 */

export type ValorContexto = string | number | boolean | null;

export interface CampoContexto {
  /** Dotted path in the form's draft ("identificacao.nif") — what a proposal writes. */
  caminho: string;
  /** The label the person sees («NIF da associação»). */
  rotulo: string;
  valor: ValorContexto;
  /** Personal data: the model only learns whether it is filled. */
  sensivel?: boolean | undefined;
  /** The assistant may propose a value for it (applied by the page, never submitted). */
  editavel?: boolean | undefined;
}

/** A field in the short form of `dados`: a value, or the value with its label and marks. */
export type EntradaDado =
  | ValorContexto
  | { valor: ValorContexto; rotulo?: string | undefined; sensivel?: boolean | undefined; editavel?: boolean | undefined };

export interface EntradaContexto {
  /** The app (`data-app` id). */
  app: string;
  /** The page as the person names it («Caracterização», «Balanço 2025»). */
  pagina: string;
  /** The current section («A. Identificação»). */
  seccao?: string | undefined;
  /** What is on the page: `{ caminho: valor | { valor, rotulo, sensivel, editavel } }`. */
  dados?: Readonly<Record<string, EntradaDado>> | undefined;
  /** The same as a list (keeps the order of the form). */
  campos?: readonly CampoContexto[] | undefined;
  /** «O que falta?» for this form. */
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

/** The route without record ids (never needed by the model). */
export function rotaSemIds(rota: string): string {
  return corta(
    rota
      .split(/[?#]/)[0]!
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/gi, "/:id")
      .replace(/\/\d{4,}(?=\/|$)/g, "/:id"),
    LIMITES_CONTEXTO.rota,
  );
}

/** The compact context (capped, trimmed, fields in order, without empty labels). */
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

/** FNV-1a (32 bits, hex) of the stable JSON — to know whether the context changed. */
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
  /** Another app, page or section: the whole context counts as new. */
  outraPagina: boolean;
  alterados: CampoContexto[];
  removidos: string[];
}

/** What changed from `antes` to `agora` (fields by path). */
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

/**
 * The context to send with a question: the full compact context when it
 * differs from the last one sent in this conversation, else `undefined`
 * (the Cérebro keeps using the last one).
 */
export function contextoAEnviar(
  atual: ContextoPagina | null,
  ultimoHashEnviado: string | undefined,
): { contexto: ContextoPagina | undefined; hash: string } {
  const hash = hashContexto(atual);
  return { contexto: atual && hash !== ultimoHashEnviado ? atual : undefined, hash };
}

/** The current values by path (for `compararPropostas`). */
export function valoresDoContexto(c: ContextoPagina | null): Record<string, unknown> {
  return Object.fromEntries((c?.campos ?? []).map((x) => [x.caminho, x.valor]));
}
