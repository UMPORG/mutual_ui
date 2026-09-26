"use client";

import { useEffect, useMemo, useRef, useState, type ElementType, type ReactNode } from "react";
import { Check, Copy, ExternalLink, ImageIcon } from "lucide-react";
import { cx } from "./cx";
import { analisarMarkdown, estabilizarParcial, type Block, type Inline } from "./markdown-ast";

export { analisarMarkdown, analisarInline, estabilizarParcial, markdownParaTexto, sanitizarUrl, type Block, type Inline } from "./markdown-ast";

/**
 * Safe Markdown for assistant replies and help text (v0.7). The text is
 * parsed into a tree and rendered as React elements — never as HTML — so a
 * reply cannot inject markup or scripts. Links are limited to http(s),
 * mailto, tel and relative paths; images are shown as links, never loaded.
 *
 * Code blocks have "Copiar"; tables scroll sideways in their own region;
 * "[1]" markers become links to the reply's sources when `citations` is
 * given.
 */

export interface Citation {
  /** Where the source opens: a help-centre page or an app record. */
  href: string;
  title: string;
}

export interface MarkdownProps {
  children: string;
  /** Number → source, for "[1]" markers. */
  citations?: Record<number, Citation> | undefined;
  /** Next's `Link` for relative links. */
  LinkComponent?: ElementType;
  /** Level of "#" headings (default 3: replies sit under the page's h1/h2). */
  headingLevel?: 2 | 3 | 4;
  /** A blinking caret after the last word (streaming). */
  caret?: boolean;
  className?: string;
}

interface Ctx {
  citations?: Record<number, Citation> | undefined;
  Link: ElementType;
  nivel: number;
}

// ─── Copy button ──────────────────────────────────────────────────────────

/** "Copiar" → "Copiado" for 2 s. The label change is announced (it is the button's name). */
export function CopyButton({
  text,
  label = "Copiar",
  doneLabel = "Copiado",
  className,
  iconOnly,
}: {
  text: string | (() => string);
  label?: string;
  doneLabel?: string;
  className?: string;
  iconOnly?: boolean;
}) {
  const [feito, setFeito] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(t.current), []);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(typeof text === "function" ? text() : text);
          setFeito(true);
          clearTimeout(t.current);
          t.current = setTimeout(() => setFeito(false), 2000);
        } catch {
          /* clipboard blocked: nothing to do */
        }
      }}
      aria-label={iconOnly ? (feito ? doneLabel : label) : undefined}
      className={cx(
        "inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-muted-foreground hover:bg-foreground/8 hover:text-foreground",
        iconOnly && "w-9 justify-center px-0",
        className,
      )}
    >
      {feito ? <Check aria-hidden size={16} className="text-success" /> : <Copy aria-hidden size={16} />}
      {!iconOnly && <span aria-live="polite">{feito ? doneLabel : label}</span>}
    </button>
  );
}

// ─── Rendering ────────────────────────────────────────────────────────────

function Inlines({ c, ctx }: { c: Inline[]; ctx: Ctx }): ReactNode {
  return c.map((x, i) => {
    switch (x.t) {
      case "text":
        return x.v;
      case "br":
        return <br key={i} />;
      case "strong":
        return (
          <strong key={i}>
            <Inlines c={x.c} ctx={ctx} />
          </strong>
        );
      case "em":
        return (
          <em key={i}>
            <Inlines c={x.c} ctx={ctx} />
          </em>
        );
      case "del":
        return (
          <del key={i}>
            <Inlines c={x.c} ctx={ctx} />
          </del>
        );
      case "code":
        return <code key={i}>{x.v}</code>;
      case "cite": {
        const fonte = ctx.citations?.[x.n];
        if (!fonte) return <sup key={i} className="m-md-cit-sem">[{x.n}]</sup>;
        const L = ctx.Link;
        return (
          <sup key={i}>
            <L href={fonte.href} className="m-md-cit" aria-label={`Fonte ${x.n}: ${fonte.title}`}>
              {x.n}
            </L>
          </sup>
        );
      }
      case "img":
        if (!x.href) return <span key={i}>{x.alt}</span>;
        return (
          <a key={i} href={x.href} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-baseline gap-1">
            <ImageIcon aria-hidden size={14} className="self-center" />
            {x.alt || "Imagem"}
            <span className="sr-only"> (imagem, abre noutro separador)</span>
          </a>
        );
      case "link": {
        if (!x.href)
          return (
            <span key={i}>
              <Inlines c={x.c} ctx={ctx} />
            </span>
          );
        if (x.externo || /^(mailto|tel):/i.test(x.href)) {
          const externo = x.externo;
          return (
            <a key={i} href={x.href} {...(externo ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}>
              <Inlines c={x.c} ctx={ctx} />
              {externo && (
                <>
                  <ExternalLink aria-hidden size={13} className="m-md-ext" />
                  <span className="sr-only"> (abre noutro separador)</span>
                </>
              )}
            </a>
          );
        }
        const L = ctx.Link;
        return (
          <L key={i} href={x.href}>
            <Inlines c={x.c} ctx={ctx} />
          </L>
        );
      }
    }
  });
}

const CARET = <span aria-hidden className="m-caret" />;

function Blocos({ b, ctx, caret }: { b: Block[]; ctx: Ctx; caret?: boolean }): ReactNode {
  return b.map((x, i) => {
    const ultimo = caret && i === b.length - 1;
    const fim = ultimo ? CARET : null;
    switch (x.t) {
      case "p":
        return (
          <p key={i}>
            <Inlines c={x.c} ctx={ctx} />
            {fim}
          </p>
        );
      case "h": {
        const H = `h${Math.min(6, ctx.nivel + x.n - 1)}` as ElementType;
        return (
          <H key={i}>
            <Inlines c={x.c} ctx={ctx} />
            {fim}
          </H>
        );
      }
      case "hr":
        return <hr key={i} />;
      case "quote":
        return (
          <blockquote key={i}>
            <Blocos b={x.c} ctx={ctx} caret={ultimo} />
          </blockquote>
        );
      case "code":
        return <BlocoCodigo key={i} lang={x.lang} codigo={x.v} caret={ultimo} />;
      case "list": {
        const L = x.ordered ? "ol" : "ul";
        return (
          <L key={i} start={x.ordered && x.start !== 1 ? x.start : undefined} className={cx(x.items.some((it) => it.checked !== null) && "m-md-tarefas")}>
            {x.items.map((it, k) => {
              const ultimoItem = ultimo && k === x.items.length - 1;
              const unico = x.tight && it.c.length === 1 && it.c[0]!.t === "p";
              return (
                <li key={k}>
                  {it.checked !== null && (
                    <span aria-hidden className={cx("m-md-caixa", it.checked && "m-md-caixa-feita")}>
                      {it.checked && <Check size={12} strokeWidth={3} />}
                    </span>
                  )}
                  {it.checked !== null && <span className="sr-only">{it.checked ? "Feito: " : "Por fazer: "}</span>}
                  {unico ? (
                    <>
                      <Inlines c={(it.c[0] as Extract<Block, { t: "p" }>).c} ctx={ctx} />
                      {ultimoItem ? CARET : null}
                    </>
                  ) : (
                    <Blocos b={it.c} ctx={ctx} caret={ultimoItem} />
                  )}
                </li>
              );
            })}
          </L>
        );
      }
      case "table":
        return (
          <div key={i} className="m-md-tabela" role="region" aria-label="Tabela" tabIndex={0}>
            <table>
              <thead>
                <tr>
                  {x.head.map((c, k) => (
                    <th key={k} scope="col" style={{ textAlign: x.align[k] ?? undefined }}>
                      <Inlines c={c} ctx={ctx} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {x.rows.map((r, k) => (
                  <tr key={k}>
                    {r.map((c, j) => (
                      <td key={j} style={{ textAlign: x.align[j] ?? undefined }}>
                        <Inlines c={c} ctx={ctx} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {fim}
          </div>
        );
    }
  });
}

const NOMES_LINGUAGEM: Record<string, string> = {
  ts: "TypeScript",
  tsx: "TypeScript",
  js: "JavaScript",
  json: "JSON",
  sql: "SQL",
  sh: "Terminal",
  bash: "Terminal",
  csv: "CSV",
  html: "HTML",
  css: "CSS",
  py: "Python",
  txt: "Texto",
};

function BlocoCodigo({ lang, codigo, caret }: { lang: string; codigo: string; caret?: boolean }) {
  return (
    <div className="m-md-codigo">
      <div className="m-md-codigo-barra">
        <span>{NOMES_LINGUAGEM[lang.toLowerCase()] ?? (lang || "Código")}</span>
        <CopyButton text={codigo} label="Copiar código" doneLabel="Código copiado" />
      </div>
      <pre tabIndex={0}>
        <code>{codigo}</code>
        {caret ? CARET : null}
      </pre>
    </div>
  );
}

export function Markdown({ children, citations, LinkComponent = "a", headingLevel = 3, caret, className }: MarkdownProps) {
  const blocos = useMemo(() => analisarMarkdown(caret ? estabilizarParcial(children) : children), [children, caret]);
  const ctx: Ctx = { citations, Link: LinkComponent, nivel: headingLevel };
  return (
    <div className={cx("m-md", className)}>
      <Blocos b={blocos} ctx={ctx} caret={caret} />
      {caret && blocos.length === 0 && CARET}
    </div>
  );
}
