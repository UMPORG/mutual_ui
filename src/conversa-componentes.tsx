"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";
import {
  ArrowDown,
  BookOpen,
  Check,
  CircleAlert,
  Database,
  MessageSquarePlus,
  MoreHorizontal,
  PanelLeft,
  Pencil,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { cx } from "./cx";
import { Button } from "./basicos";
import { MutualFlag } from "./brand";
import { StatusBadge } from "./feedback";
import { formatarData } from "./formatar";
import { CopyButton, Markdown, type Citation } from "./markdown";
import { DropdownMenu } from "./menus";
import { ConfirmDialog, Sheet } from "./sobreposicoes";
import { ScrollArea } from "./diversos";
import {
  agruparConversas,
  numerarFontes,
  textoParaAnunciar,
  type ChatMessageData,
  type ChatSource,
  type ChatThread,
} from "./conversa-dados";

/**
 * Conversation components for the MUTU@L assistant (v0.7).
 *
 * The app owns the data (threads, messages, streaming, tools); these render
 * it with the MUTU@L look and the accessibility the pattern needs:
 *
 * - One polite announcement when a reply starts ("O assistente está a
 *   responder.") and one when it ends (the reply as plain text) — never
 *   token by token. Errors are announced once, assertively.
 * - Each message has a hidden heading ("Você disse", "Resposta do
 *   assistente") so screen-reader users can jump between messages.
 * - The list follows new text only while the person is at the bottom; if
 *   they scrolled up to read, it stays put and offers "Ir para o fim".
 * - Focus stays in the composer after sending and after "Parar".
 */

// ─── Announcer ────────────────────────────────────────────────────────────

function useAnunciador() {
  const [educado, setEducado] = useState("");
  const [urgente, setUrgente] = useState("");
  const anunciar = (texto: string, assertivo = false) => {
    const set = assertivo ? setUrgente : setEducado;
    set("");
    requestAnimationFrame(() => set(texto));
  };
  const regiao = (
    <>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {educado}
      </div>
      <div role="alert" aria-atomic="true" className="sr-only">
        {urgente}
      </div>
    </>
  );
  return { anunciar, regiao };
}

// ─── Sources ──────────────────────────────────────────────────────────────

/** Numbered chips to help-centre pages ("ajuda") and app records ("registo"). */
export function SourceList({ sources, LinkComponent = "a", className }: { sources: ChatSource[]; LinkComponent?: ElementType | undefined; className?: string | undefined }) {
  const L = LinkComponent;
  const lista = numerarFontes(sources).sort((a, b) => a.n - b.n);
  if (!lista.length) return null;
  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <p className="text-sm font-medium text-muted-foreground">Fontes</p>
      <ol className="flex flex-wrap gap-2">
        {lista.map((f) => {
          const Icone = f.kind === "ajuda" ? BookOpen : Database;
          return (
            <li key={f.id} className="min-w-0 max-w-full">
              <L
                href={f.href}
                title={f.excerpt}
                data-app={f.app}
                className="group inline-flex min-h-10 max-w-full items-center gap-2 rounded-full border border-border bg-card py-1 pr-3.5 pl-1 text-[0.9375rem] no-underline shadow-xs transition-colors hover:border-brand/50 hover:bg-brand-soft/60"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-sm font-semibold tabular-nums text-foreground group-hover:bg-card">{f.n}</span>
                <Icone aria-hidden size={16} className={cx("shrink-0", f.kind === "registo" && f.app ? "text-app-accent" : "text-muted-foreground")} />
                <span className="truncate text-foreground">{f.title}</span>
                <span className="sr-only">({f.kind === "ajuda" ? "página de ajuda" : "registo"})</span>
              </L>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ─── Feedback ─────────────────────────────────────────────────────────────

const MOTIVOS = ["Informação errada", "Não respondeu à pergunta", "Incompleta", "Difícil de perceber"];

/** "Útil / Não útil", with optional reasons after "Não útil". */
export function MessageFeedback({
  value,
  onChange,
  onComment,
}: {
  value?: "util" | "nao-util" | null | undefined;
  onChange: (value: "util" | "nao-util" | null) => void;
  /** Called with the chosen reasons and free text after "Não útil". */
  onComment?: ((reasons: string[], text: string) => void) | undefined;
}) {
  const [aberto, setAberto] = useState(false);
  const [motivos, setMotivos] = useState<string[]>([]);
  const [texto, setTexto] = useState("");
  const [enviado, setEnviado] = useState(false);
  const idTexto = useId();
  const botao = "grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-foreground/8 hover:text-foreground aria-pressed:text-brand aria-pressed:bg-brand-soft";
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-0.5" role="group" aria-label="Avaliar resposta">
        <button
          type="button"
          aria-pressed={value === "util"}
          aria-label="Útil"
          title="Útil"
          className={botao}
          onClick={() => {
            onChange(value === "util" ? null : "util");
            setAberto(false);
          }}
        >
          <ThumbsUp aria-hidden size={17} />
        </button>
        <button
          type="button"
          aria-pressed={value === "nao-util"}
          aria-label="Não útil"
          title="Não útil"
          className={botao}
          onClick={() => {
            const novo = value === "nao-util" ? null : "nao-util";
            onChange(novo);
            setAberto(novo === "nao-util" && !!onComment && !enviado);
          }}
        >
          <ThumbsDown aria-hidden size={17} />
        </button>
        <span role="status" className="ml-1.5 text-sm text-muted-foreground">
          {value && !aberto ? "Obrigado pela sua opinião." : ""}
        </span>
      </div>
      {aberto && onComment && (
        <form
          className="m-surface flex max-w-xl flex-col gap-3 rounded-xl p-4"
          onSubmit={(e) => {
            e.preventDefault();
            onComment(motivos, texto.trim());
            setEnviado(true);
            setAberto(false);
          }}
        >
          <fieldset className="flex flex-col gap-2 border-0 p-0">
            <legend className="mb-2 p-0 text-base font-medium">O que correu mal?</legend>
            <div className="flex flex-wrap gap-2">
              {MOTIVOS.map((m) => {
                const ativo = motivos.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={ativo}
                    onClick={() => setMotivos((x) => (ativo ? x.filter((y) => y !== m) : [...x, m]))}
                    className={cx(
                      "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-[0.9375rem]",
                      ativo ? "border-brand bg-brand-soft text-brand-soft-foreground" : "border-border hover:bg-foreground/5",
                    )}
                  >
                    {ativo && <Check aria-hidden size={15} />}
                    {m}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <label htmlFor={idTexto} className="text-[0.9375rem] font-medium">
            Quer acrescentar alguma coisa? <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <textarea id={idTexto} value={texto} onChange={(e) => setTexto(e.target.value)} rows={2} className="m-field min-h-16 w-full rounded-lg px-3 py-2 text-base outline-none" />
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={!motivos.length && !texto.trim()}>
              Enviar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── Thinking / working ───────────────────────────────────────────────────

export interface WorkStep {
  label: string;
  status: "done" | "active" | "pending";
}

/**
 * Shown while the reply has not started: "A pensar", or the steps the
 * assistant is taking ("A procurar na ajuda", "A consultar as suas quotas").
 * Not a live region — the list announces "O assistente está a responder." once.
 */
export function ThinkingIndicator({ label = "A pensar", steps }: { label?: string | undefined; steps?: WorkStep[] | undefined }) {
  return (
    <div className="flex flex-col gap-2 py-1">
      <p className="inline-flex items-center gap-2.5 text-[0.9375rem] font-medium text-muted-foreground">
        <span aria-hidden className="m-pensar">
          <span />
          <span />
          <span />
        </span>
        {label}
      </p>
      {steps && steps.length > 0 && (
        <ol className="flex flex-col gap-1.5 border-l-2 border-border pl-3.5">
          {steps.map((s, i) => (
            <li key={`${s.label}-${i}`} className={cx("flex items-center gap-2 text-[0.9375rem]", s.status === "pending" ? "text-muted-foreground/70" : s.status === "active" ? "text-foreground" : "text-muted-foreground")}>
              {s.status === "done" ? (
                <Check aria-hidden size={16} className="shrink-0 text-success" />
              ) : s.status === "active" ? (
                <span aria-hidden className="m-pensar-ponto shrink-0" />
              ) : (
                <span aria-hidden className="size-4 shrink-0 rounded-full border-2 border-border" />
              )}
              <span>{s.label}</span>
              <span className="sr-only">{s.status === "done" ? "(feito)" : s.status === "active" ? "(a decorrer)" : "(a seguir)"}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ─── Action card (tool call) ──────────────────────────────────────────────

export type ActionStatus = "proposta" | "a-aplicar" | "aplicada" | "cancelada" | "erro";

/**
 * A change the assistant proposes in the person's data ("Marcar a quota de
 * março como paga"). Nothing happens until the person presses "Aplicar";
 * the card stays in the conversation as a record of what was done.
 */
export function ActionCard({
  title,
  description,
  details,
  status,
  onApply,
  onCancel,
  applyLabel = "Aplicar",
  error,
  result,
  app,
}: {
  title: ReactNode;
  description?: ReactNode | undefined;
  /** What will change: [{ term: "Associado", details: "Maria Silva (n.º 1234)" }]. */
  details?: Array<{ term: ReactNode; details: ReactNode }> | undefined;
  status: ActionStatus;
  onApply?: (() => void) | undefined;
  onCancel?: (() => void) | undefined;
  applyLabel?: string | undefined;
  /** Error of the last attempt (status "erro"). */
  error?: ReactNode | undefined;
  /** After "aplicada": what happened, with a link to the record. */
  result?: ReactNode | undefined;
  /** App where the change happens (its accent marks the card). */
  app?: string | undefined;
}) {
  const estado: Record<ActionStatus, ReactNode> = {
    proposta: null,
    "a-aplicar": null,
    aplicada: <StatusBadge tone="success">Aplicada</StatusBadge>,
    cancelada: <StatusBadge tone="neutral">Cancelada</StatusBadge>,
    erro: <StatusBadge tone="danger">Não aplicada</StatusBadge>,
  };
  const ativa = status === "proposta" || status === "a-aplicar" || status === "erro";
  return (
    <div data-app={app} className={cx("m-surface relative max-w-2xl overflow-hidden rounded-xl", !ativa && "opacity-90")}>
      <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-app-accent" />
      <div className="flex flex-col gap-3 p-4 pl-5">
        <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
          <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-lg bg-app-accent-soft text-app-accent">
            <Zap size={18} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-sm font-medium text-muted-foreground">Ação proposta</p>
            <p className="text-base leading-snug font-semibold">{title}</p>
            {description && <p className="text-[0.9375rem] text-muted-foreground">{description}</p>}
          </div>
          {estado[status]}
        </div>
        {details && details.length > 0 && (
          <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 rounded-lg bg-muted/60 p-3 text-[0.9375rem] sm:grid-cols-[auto_1fr]">
            {details.map((d, i) => (
              <div key={i} className="contents">
                <dt className="text-muted-foreground">{d.term}</dt>
                <dd className="m-0 font-medium">{d.details}</dd>
              </div>
            ))}
          </dl>
        )}
        {status === "erro" && error && (
          <p role="alert" className="flex items-start gap-2 text-[0.9375rem] font-medium text-destructive">
            <CircleAlert aria-hidden size={18} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}
        {status === "aplicada" && result && <div className="text-[0.9375rem]">{result}</div>}
        {ativa && (onApply || onCancel) && (
          <div className="flex flex-wrap gap-2">
            {onApply && (
              <Button size="sm" onClick={onApply} pending={status === "a-aplicar"}>
                {status === "erro" ? "Tentar novamente" : applyLabel}
              </Button>
            )}
            {onCancel && (
              <Button size="sm" variant="outline" onClick={onCancel} disabled={status === "a-aplicar"}>
                Cancelar
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Suggestions ──────────────────────────────────────────────────────────

export function SuggestionChips({
  suggestions,
  onSelect,
  label = "Sugestões",
  className,
}: {
  suggestions: Array<string | { label: string; prompt?: string | undefined }>;
  onSelect: (prompt: string) => void;
  label?: string | undefined;
  className?: string | undefined;
}) {
  return (
    <div role="group" aria-label={label} className={cx("flex flex-wrap gap-2", className)}>
      {suggestions.map((s) => {
        const rotulo = typeof s === "string" ? s : s.label;
        const prompt = typeof s === "string" ? s : s.prompt ?? s.label;
        return (
          <button
            key={rotulo}
            type="button"
            onClick={() => onSelect(prompt)}
            className="inline-flex min-h-10 items-center rounded-full border border-border bg-card px-4 text-[0.9375rem] text-foreground shadow-xs transition-colors hover:border-brand/50 hover:bg-brand-soft/60"
          >
            {rotulo}
          </button>
        );
      })}
    </div>
  );
}

// ─── Message ──────────────────────────────────────────────────────────────

export interface ChatMessageProps {
  message: ChatMessageData;
  /** Next's `Link` for sources and relative links in replies. */
  LinkComponent?: ElementType | undefined;
  onRetry?: (() => void) | undefined;
  onRegenerate?: (() => void) | undefined;
  onFeedback?: ((value: "util" | "nao-util" | null) => void) | undefined;
  onFeedbackComment?: ((reasons: string[], text: string) => void) | undefined;
  /** Work in progress before the first words (see ThinkingIndicator). */
  thinking?: { label?: string | undefined; steps?: WorkStep[] | undefined } | undefined;
  /** Extra content under the reply (ActionCards). */
  children?: ReactNode | undefined;
}

function Hora({ d }: { d?: string | Date | undefined }) {
  if (!d) return null;
  const iso = typeof d === "string" ? d : d.toISOString();
  return (
    <time dateTime={iso} className="text-sm text-muted-foreground tabular-nums">
      {formatarData(d, "hora")}
    </time>
  );
}

export function ChatMessage({ message: m, LinkComponent = "a", onRetry, onRegenerate, onFeedback, onFeedbackComment, thinking, children }: ChatMessageProps) {
  const citacoes: Record<number, Citation> = {};
  for (const f of numerarFontes(m.sources ?? [])) citacoes[f.n] = { href: f.href, title: f.title };

  if (m.role === "system") {
    return (
      <div className="flex items-center gap-3 py-2 text-sm text-muted-foreground">
        <span aria-hidden className="h-px flex-1 bg-border" />
        <p className="max-w-[80%] text-center">{m.content}</p>
        <span aria-hidden className="h-px flex-1 bg-border" />
      </div>
    );
  }

  if (m.role === "user") {
    return (
      <article className="flex flex-col items-end gap-1">
        <h3 className="sr-only">Você disse</h3>
        <div className="m-balao-pessoa max-w-[min(38rem,88%)] rounded-2xl rounded-br-md px-4 py-2.5 text-base leading-relaxed break-words whitespace-pre-wrap">{m.content}</div>
        <Hora d={m.createdAt} />
      </article>
    );
  }

  if (m.role === "error") {
    return (
      <article className="flex gap-3">
        <h3 className="sr-only">Erro</h3>
        <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-destructive-soft text-destructive">
          <CircleAlert size={18} />
        </span>
        <div className="flex min-w-0 flex-col items-start gap-2 rounded-xl border border-destructive/30 bg-destructive-soft px-4 py-3 text-destructive-soft-foreground">
          <p className="text-base">{m.content || "Não foi possível obter uma resposta."}</p>
          {onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry}>
              <RotateCcw aria-hidden /> Tentar novamente
            </Button>
          )}
        </div>
      </article>
    );
  }

  const aEscrever = m.status === "streaming";
  const semTexto = !m.content.trim();
  return (
    <article className="flex gap-3" aria-busy={aEscrever || undefined}>
      <h3 className="sr-only">Resposta do assistente</h3>
      <span aria-hidden className="m-assistente-marca mt-0.5 grid size-8 shrink-0 place-items-center rounded-full">
        <MutualFlag height={14} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {aEscrever && semTexto ? (
          <ThinkingIndicator label={thinking?.label} steps={thinking?.steps} />
        ) : (
          <Markdown citations={citacoes} LinkComponent={LinkComponent} caret={aEscrever} className="text-base">
            {m.content}
          </Markdown>
        )}
        {m.status === "stopped" && <p className="text-sm text-muted-foreground italic">Resposta interrompida.</p>}
        {children}
        {!aEscrever && m.sources && m.sources.length > 0 && <SourceList sources={m.sources} LinkComponent={LinkComponent} />}
        {!aEscrever && !semTexto && (
          <div className="-ml-2 flex flex-wrap items-center gap-1">
            <CopyButton text={m.content} label="Copiar resposta" doneLabel="Resposta copiada" iconOnly />
            {onRegenerate && (
              <button type="button" onClick={onRegenerate} aria-label="Gerar outra resposta" title="Gerar outra resposta" className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-foreground/8 hover:text-foreground">
                <RotateCcw aria-hidden size={16} />
              </button>
            )}
            {onFeedback && <MessageFeedback value={m.feedback ?? null} onChange={onFeedback} onComment={onFeedbackComment} />}
            <span className="ml-auto">
              <Hora d={m.createdAt} />
            </span>
          </div>
        )}
      </div>
    </article>
  );
}

// ─── Message list ─────────────────────────────────────────────────────────

export interface MessageListProps {
  messages: ChatMessageData[];
  /** Custom rendering per message (default: `ChatMessage` with the props below). */
  renderMessage?: ((m: ChatMessageData) => ReactNode) | undefined;
  LinkComponent?: ElementType | undefined;
  onRetry?: ((m: ChatMessageData) => void) | undefined;
  onRegenerate?: ((m: ChatMessageData) => void) | undefined;
  onFeedback?: ((m: ChatMessageData, value: "util" | "nao-util" | null) => void) | undefined;
  onFeedbackComment?: ((m: ChatMessageData, reasons: string[], text: string) => void) | undefined;
  thinking?: { label?: string | undefined; steps?: WorkStep[] | undefined } | undefined;
  /** Shown when there are no messages (ChatEmptyState). */
  empty?: ReactNode | undefined;
  /** Only the last N messages render at first; "Mostrar mensagens anteriores" loads more. */
  initialCount?: number | undefined;
  /** Suggestions under the last reply. */
  footer?: ReactNode | undefined;
  className?: string | undefined;
}

export function MessageList({
  messages,
  renderMessage,
  LinkComponent,
  onRetry,
  onRegenerate,
  onFeedback,
  onFeedbackComment,
  thinking,
  empty,
  initialCount = 60,
  footer,
  className,
}: MessageListProps) {
  const rolo = useRef<HTMLDivElement>(null);
  const conteudo = useRef<HTMLDivElement>(null);
  const noFim = useRef(true);
  const [mostrarBotao, setMostrarBotao] = useState(false);
  const [limite, setLimite] = useState(initialCount);
  const { anunciar, regiao } = useAnunciador();
  const estados = useRef<Map<string, string | undefined> | null>(null);

  // Announcements: once when a reply starts, once when it ends.
  useEffect(() => {
    if (!estados.current) {
      estados.current = new Map(messages.map((m) => [m.id, m.status]));
      return;
    }
    for (const m of messages) {
      const antes = estados.current.get(m.id);
      const conhecida = estados.current.has(m.id);
      if (m.role === "assistant") {
        if (m.status === "streaming" && antes !== "streaming") anunciar("O assistente está a responder.");
        else if ((m.status === "done" || m.status === undefined) && (antes === "streaming" || !conhecida) && m.content.trim())
          anunciar(`Resposta do assistente: ${textoParaAnunciar(m.content)}`);
        else if (m.status === "stopped" && antes === "streaming") anunciar("Resposta interrompida.");
      } else if (m.role === "error" && !conhecida) anunciar(m.content || "Não foi possível obter uma resposta.", true);
      estados.current.set(m.id, m.status);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // Follow new content only while the person is at the bottom.
  const temMensagens = useRef(messages.length > 0);
  temMensagens.current = messages.length > 0;
  const irParaFim = (suave = false) => {
    const el = rolo.current;
    if (!el || !temMensagens.current) return;
    el.scrollTo({ top: el.scrollHeight, behavior: suave ? "smooth" : "auto" });
  };
  useLayoutEffect(() => {
    if (noFim.current) irParaFim();
    else setMostrarBotao(true);
  }, [messages]);
  useEffect(() => {
    const c = conteudo.current;
    if (!c) return;
    const ro = new ResizeObserver(() => {
      if (noFim.current) irParaFim();
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  const visiveis = messages.length > limite ? messages.slice(messages.length - limite) : messages;
  const escondidas = messages.length - visiveis.length;

  return (
    <div className={cx("relative flex min-h-0 flex-1 flex-col", className)}>
      {regiao}
      <div
        ref={rolo}
        onScroll={(e) => {
          const el = e.currentTarget;
          const perto = el.scrollHeight - el.scrollTop - el.clientHeight < 96;
          noFim.current = perto;
          if (perto) setMostrarBotao(false);
        }}
        className="m-scroll-y min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <div ref={conteudo} className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
          {messages.length === 0 && empty}
          {escondidas > 0 && (
            <div className="flex justify-center">
              <Button variant="outline" size="sm" onClick={() => setLimite((l) => l + initialCount)}>
                Mostrar mensagens anteriores ({escondidas})
              </Button>
            </div>
          )}
          {visiveis.length > 0 && (
            <ol className="flex flex-col gap-7" aria-label="Mensagens">
              {visiveis.map((m) => (
                <li key={m.id} className="m-mensagem">
                  {renderMessage ? (
                    renderMessage(m)
                  ) : (
                    <ChatMessage
                      message={m}
                      LinkComponent={LinkComponent}
                      thinking={thinking}
                      onRetry={onRetry && (() => onRetry(m))}
                      onRegenerate={onRegenerate && (() => onRegenerate(m))}
                      onFeedback={onFeedback && ((v) => onFeedback(m, v))}
                      onFeedbackComment={onFeedbackComment && ((r, t) => onFeedbackComment(m, r, t))}
                    />
                  )}
                </li>
              ))}
            </ol>
          )}
          {footer}
        </div>
      </div>
      {mostrarBotao && (
        <button
          type="button"
          onClick={() => {
            noFim.current = true;
            setMostrarBotao(false);
            irParaFim(true);
          }}
          className="m-float absolute bottom-3 left-1/2 inline-flex min-h-10 -translate-x-1/2 items-center gap-1.5 !rounded-full px-4 text-[0.9375rem] font-medium"
        >
          <ArrowDown aria-hidden size={16} /> Ir para o fim
        </button>
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────

export function ChatEmptyState({
  title = "Como posso ajudar?",
  description,
  prompts,
  onSelect,
  backdrop,
}: {
  title?: ReactNode | undefined;
  description?: ReactNode | undefined;
  /** Example questions, as cards. 2–4 is best. */
  prompts?: Array<{ title: string; prompt?: string | undefined; icon?: ReactNode | undefined; description?: string | undefined }> | undefined;
  onSelect?: ((prompt: string) => void) | undefined;
  /** Decorative effect behind the greeting (e.g. `<PontosFundo />`). */
  backdrop?: ReactNode | undefined;
}) {
  return (
    <div className="relative flex flex-col items-center gap-6 px-2 pt-[min(12vh,6rem)] pb-6 text-center">
      {backdrop && (
        <div aria-hidden className="pointer-events-none absolute inset-x-[-2rem] top-0 h-72 overflow-hidden">
          {backdrop}
        </div>
      )}
      <span aria-hidden className="m-assistente-marca relative grid size-14 place-items-center rounded-2xl">
        <MutualFlag height={24} />
      </span>
      <div className="relative flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-balance">{title}</h2>
        {description && <p className="max-w-lg text-base text-muted-foreground">{description}</p>}
      </div>
      {prompts && prompts.length > 0 && (
        <ul className="relative grid w-full max-w-2xl gap-3 text-left sm:grid-cols-2">
          {prompts.map((p) => (
            <li key={p.title}>
              <button
                type="button"
                onClick={() => onSelect?.(p.prompt ?? p.title)}
                className="m-surface m-surface-interactive flex h-full w-full items-start gap-3 rounded-xl p-4 text-left"
              >
                {p.icon && <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-soft-foreground [&_svg]:size-[1.125rem]">{p.icon}</span>}
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-base leading-snug font-medium">{p.title}</span>
                  {p.description && <span className="text-[0.9375rem] text-muted-foreground">{p.description}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Conversation title ───────────────────────────────────────────────────

/** The conversation's name with "Mudar o nome" (inline; Enter saves, Escape cancels). */
export function ConversationTitle({
  title,
  onRename,
  level = 1,
  className,
}: {
  title: string;
  onRename?: ((title: string) => void) | undefined;
  level?: 1 | 2 | undefined;
  className?: string | undefined;
}) {
  const [editar, setEditar] = useState(false);
  const [texto, setTexto] = useState(title);
  const botao = useRef<HTMLButtonElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const id = useId();
  const H = `h${level}` as const;
  useEffect(() => {
    if (editar) campo.current?.select();
  }, [editar]);
  const fechar = () => {
    setEditar(false);
    requestAnimationFrame(() => botao.current?.focus());
  };
  if (editar && onRename) {
    return (
      <form
        className={cx("flex min-w-0 flex-1 items-center gap-2", className)}
        onSubmit={(e) => {
          e.preventDefault();
          const t = texto.trim();
          if (t && t !== title) onRename(t);
          fechar();
        }}
      >
        <label htmlFor={id} className="sr-only">
          Nome da conversa
        </label>
        <input
          ref={campo}
          id={id}
          value={texto}
          maxLength={120}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              setTexto(title);
              fechar();
            }
          }}
          className="m-field h-10 min-w-0 flex-1 rounded-lg px-3 text-base font-semibold outline-none"
        />
        <Button type="submit" size="sm">
          Guardar
        </Button>
        <Button
          size="sm"
          variant="ghost"
          iconOnly
          aria-label="Cancelar"
          onClick={() => {
            setTexto(title);
            fechar();
          }}
        >
          <X aria-hidden />
        </Button>
      </form>
    );
  }
  return (
    <div className={cx("flex min-w-0 items-center gap-1", className)}>
      <H tabIndex={-1} className="truncate text-lg font-semibold tracking-tight outline-none" data-titulo-conversa>
        {title}
      </H>
      {onRename && (
        <button
          ref={botao}
          type="button"
          onClick={() => {
            setTexto(title);
            setEditar(true);
          }}
          aria-label="Mudar o nome da conversa"
          title="Mudar o nome"
          className="grid size-9 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-foreground/8 hover:text-foreground"
        >
          <Pencil aria-hidden size={16} />
        </button>
      )}
    </div>
  );
}

// ─── Thread list ──────────────────────────────────────────────────────────

export interface ThreadListProps<T extends ChatThread> {
  threads: T[];
  activeId?: string | null | undefined;
  /** Link to a thread (server navigation) … */
  hrefFor?: ((t: T) => string) | undefined;
  /** … or a callback (client state). */
  onSelect?: ((t: T) => void) | undefined;
  onNew?: (() => void) | undefined;
  onRename?: ((t: T, title: string) => void) | undefined;
  onDelete?: ((t: T) => void) | undefined;
  LinkComponent?: ElementType | undefined;
  loading?: boolean | undefined;
  className?: string | undefined;
}

export function ThreadList<T extends ChatThread>({ threads, activeId, hrefFor, onSelect, onNew, onRename, onDelete, LinkComponent = "a", loading, className }: ThreadListProps<T>) {
  const [aEliminar, setAEliminar] = useState<T | null>(null);
  const [aRenomear, setARenomear] = useState<string | null>(null);
  const grupos = agruparConversas(threads);
  const L = LinkComponent;
  return (
    <nav aria-label="Conversas" className={cx("flex min-h-0 flex-1 flex-col gap-3", className)}>
      {onNew && (
        <div className="px-3 pt-3">
          <Button variant="outline" className="w-full justify-start" onClick={onNew}>
            <MessageSquarePlus aria-hidden /> Nova conversa
          </Button>
        </div>
      )}
      <ScrollArea className="min-h-0 flex-1" label="Lista de conversas">
        <div className="flex flex-col gap-4 px-3 pb-4">
          {loading &&
            Array.from({ length: 5 }, (_, i) => <span key={i} aria-hidden className="m-skeleton h-9 w-full" style={{ width: `${90 - i * 9}%` }} />)}
          {!loading && threads.length === 0 && <p className="px-2 py-6 text-center text-[0.9375rem] text-muted-foreground">Ainda não há conversas.</p>}
          {grupos.map((g) => (
            <section key={g.rotulo} aria-label={g.rotulo} className="flex flex-col gap-0.5">
              <h2 className="px-2 pb-1 text-sm font-medium text-muted-foreground">{g.rotulo}</h2>
              <ul className="flex flex-col gap-0.5">
                {g.threads.map((t) => {
                  const ativa = t.id === activeId;
                  if (aRenomear === t.id && onRename)
                    return (
                      <li key={t.id}>
                        <RenomearLinha
                          titulo={t.title}
                          onGuardar={(novo) => {
                            onRename(t, novo);
                            setARenomear(null);
                          }}
                          onCancelar={() => setARenomear(null)}
                        />
                      </li>
                    );
                  const classe = cx(
                    "flex min-h-11 min-w-0 flex-1 items-center rounded-lg px-2.5 text-left text-[0.9375rem] no-underline",
                    ativa ? "bg-brand-soft font-semibold text-brand-soft-foreground" : "text-foreground hover:bg-foreground/6",
                  );
                  return (
                    <li key={t.id} className="group relative flex items-center">
                      {hrefFor ? (
                        <L href={hrefFor(t)} aria-current={ativa ? "page" : undefined} className={classe}>
                          <span className="truncate">{t.title}</span>
                        </L>
                      ) : (
                        <button type="button" aria-current={ativa ? "page" : undefined} onClick={() => onSelect?.(t)} className={classe}>
                          <span className="truncate">{t.title}</span>
                        </button>
                      )}
                      {(onRename || onDelete) && (
                        <DropdownMenu
                          align="end"
                          trigger={
                            <button
                              type="button"
                              aria-label={`Opções de «${t.title}»`}
                              className="absolute right-1 grid size-9 place-items-center rounded-md text-muted-foreground opacity-100 hover:bg-foreground/8 hover:text-foreground focus-visible:opacity-100 data-[popup-open]:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                            >
                              <MoreHorizontal aria-hidden size={18} />
                            </button>
                          }
                          items={[
                            ...(onRename ? [{ label: "Mudar o nome", icon: <Pencil aria-hidden size={18} />, onSelect: () => setARenomear(t.id) }] : []),
                            ...(onRename && onDelete ? [{ type: "separator" as const }] : []),
                            ...(onDelete ? [{ label: "Eliminar", icon: <Trash2 aria-hidden size={18} />, destructive: true, onSelect: () => setAEliminar(t) }] : []),
                          ]}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </ScrollArea>
      <ConfirmDialog
        open={!!aEliminar}
        title="Eliminar esta conversa?"
        description={aEliminar ? <>A conversa «{aEliminar.title}» deixa de aparecer na lista. Esta ação não pode ser anulada.</> : null}
        confirmLabel="Eliminar"
        onCancel={() => setAEliminar(null)}
        onConfirm={() => {
          if (aEliminar) onDelete?.(aEliminar);
          setAEliminar(null);
        }}
      />
    </nav>
  );
}

function RenomearLinha({ titulo, onGuardar, onCancelar }: { titulo: string; onGuardar: (t: string) => void; onCancelar: () => void }) {
  const [texto, setTexto] = useState(titulo);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.select(), []);
  return (
    <form
      className="flex items-center gap-1 py-0.5"
      onSubmit={(e) => {
        e.preventDefault();
        const t = texto.trim();
        if (t && t !== titulo) onGuardar(t);
        else onCancelar();
      }}
    >
      <input
        ref={ref}
        aria-label="Nome da conversa"
        value={texto}
        maxLength={120}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && (e.preventDefault(), onCancelar())}
        onBlur={(e) => {
          if (!e.currentTarget.form?.contains(e.relatedTarget as Node | null)) onCancelar();
        }}
        className="m-field h-10 min-w-0 flex-1 rounded-lg px-2.5 text-[0.9375rem] outline-none"
      />
      <Button type="submit" size="sm" iconOnly aria-label="Guardar nome">
        <Check aria-hidden />
      </Button>
    </form>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────

export function ChatLayout({
  threads,
  header,
  children,
  composer,
  threadsTitle = "Conversas",
  className,
}: {
  /** The ThreadList (sidebar on desktop, a sheet on phones and tablets). */
  threads?: ReactNode | undefined;
  /** Title and actions above the conversation (ConversationTitle, "Nova conversa"). */
  header?: ReactNode | undefined;
  /** The MessageList. */
  children: ReactNode;
  /** The Composer, fixed under the messages. */
  composer?: ReactNode | undefined;
  threadsTitle?: string | undefined;
  /** Give it a height (e.g. `h-dvh` or `h-[calc(100dvh-4rem)]`). */
  className?: string | undefined;
}) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className={cx("flex min-h-0 w-full overflow-hidden bg-background", className)}>
      {threads && <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-card/60 lg:flex">{threads}</aside>}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex min-h-14 shrink-0 items-center gap-2 border-b border-border px-3 sm:px-5">
          {threads && (
            <Sheet
              open={aberto}
              onOpenChange={setAberto}
              side="left"
              size="sm"
              title={threadsTitle}
              trigger={
                <Button variant="ghost" iconOnly aria-label={`Mostrar ${threadsTitle.toLocaleLowerCase("pt-PT")}`} className="lg:hidden">
                  <PanelLeft aria-hidden />
                </Button>
              }
            >
              <div className="-mx-5 -mb-5 flex h-[calc(100dvh-6rem)] flex-col sm:-mx-6" onClick={(e) => (e.target as HTMLElement).closest("a,[aria-current]") && setAberto(false)}>
                {threads}
              </div>
            </Sheet>
          )}
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2">{header}</div>
        </div>
        {children}
        {composer && <div className="shrink-0 px-3 pb-3 sm:px-6 sm:pb-5">{composer}</div>}
      </main>
    </div>
  );
}
