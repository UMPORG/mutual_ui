/**
 * Pure helpers of the conversation components: grouping threads by
 * date, the text announced to screen readers, the Enter-to-send rule.
 */

import { hojeLisboa, somarDias, type DataIso } from "./calendario";
import { markdownParaTexto } from "./markdown-ast";

export type ChatRole = "user" | "assistant" | "system" | "error";
export type ChatStatus = "streaming" | "done" | "stopped" | "error";

export interface ChatSource {
  id: string;
  /** Number used in the reply's "[1]" markers. */
  n?: number | undefined;
  title: string;
  /** Help-centre page or app record. */
  href: string;
  /** "ajuda": documentation; "registo": the person's own data in an app. */
  kind: "ajuda" | "registo";
  /** App of a record (its accent marks the chip): "simplex", "backoffice"… */
  app?: string | undefined;
  /** Short quote shown in the tooltip/detail. */
  excerpt?: string | undefined;
}

export interface ChatMessageData {
  id: string;
  role: ChatRole;
  /** Markdown for the assistant; plain text for the person. */
  content: string;
  createdAt?: string | Date | undefined;
  status?: ChatStatus | undefined;
  sources?: ChatSource[] | undefined;
  feedback?: "util" | "nao-util" | null | undefined;
}

export interface ChatThread {
  id: string;
  title: string;
  updatedAt: string | Date;
  /** A second, quieter line (where it was started — «Iniciada em Simplex · Balanço»). */
  subtitle?: string | undefined;
}

function diaLisboa(d: string | Date): DataIso {
  return hojeLisboa(typeof d === "string" ? new Date(d) : d);
}

/** Groups threads (newest first) into "Hoje", "Ontem", "Últimos 7 dias", "Últimos 30 dias", "Mais antigas". */
export function agruparConversas<T extends ChatThread>(threads: readonly T[], agora: Date = new Date()): Array<{ rotulo: string; threads: T[] }> {
  const hoje = hojeLisboa(agora);
  const ontem = somarDias(hoje, -1);
  const semana = somarDias(hoje, -7);
  const mes = somarDias(hoje, -30);
  const grupos = new Map<string, T[]>([
    ["Hoje", []],
    ["Ontem", []],
    ["Últimos 7 dias", []],
    ["Últimos 30 dias", []],
    ["Mais antigas", []],
  ]);
  const ordenadas = [...threads].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  for (const t of ordenadas) {
    const d = diaLisboa(t.updatedAt);
    const g = d >= hoje ? "Hoje" : d === ontem ? "Ontem" : d > semana ? "Últimos 7 dias" : d > mes ? "Últimos 30 dias" : "Mais antigas";
    grupos.get(g)!.push(t);
  }
  return [...grupos].filter(([, l]) => l.length).map(([rotulo, l]) => ({ rotulo, threads: l }));
}

/**
 * What a screen reader hears when a reply finishes: the reply as plain text,
 * cut at a sentence end near `max` characters, with a pointer to read the
 * rest in the conversation.
 */
export function textoParaAnunciar(markdown: string, max = 600): string {
  const t = markdownParaTexto(markdown).replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const corte = t.slice(0, max);
  const fimFrase = Math.max(corte.lastIndexOf(". "), corte.lastIndexOf("? "), corte.lastIndexOf("! "));
  const base = fimFrase > max * 0.5 ? corte.slice(0, fimFrase + 1) : `${corte.replace(/\s+\S*$/, "")}…`;
  return `${base} A resposta continua na conversa.`;
}

/** Enter sends; Shift+Enter, Enter while composing (IME) or with a modifier do not. */
export function teclaEnvia(e: { key: string; shiftKey?: boolean | undefined; altKey?: boolean | undefined; ctrlKey?: boolean | undefined; metaKey?: boolean | undefined; isComposing?: boolean | undefined; keyCode?: number | undefined }): boolean {
  if (e.key !== "Enter") return false;
  if (e.isComposing || e.keyCode === 229) return false;
  if (e.shiftKey || e.altKey) return false;
  return true;
}

/** Numbers sources in order of first appearance when they lack `n`. */
export function numerarFontes(fontes: readonly ChatSource[]): Array<ChatSource & { n: number }> {
  let proximo = 1;
  const usados = new Set(fontes.map((f) => f.n).filter((n): n is number => n !== undefined));
  return fontes.map((f) => {
    if (f.n !== undefined) return { ...f, n: f.n };
    while (usados.has(proximo)) proximo++;
    usados.add(proximo);
    return { ...f, n: proximo };
  });
}
