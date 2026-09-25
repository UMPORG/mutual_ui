"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  Accessibility,
  Check,
  Contrast,
  Monitor,
  Moon,
  RotateCcw,
  Sun,
  X,
} from "lucide-react";
import {
  aplicarPreferencias,
  cookiePreferencias,
  lerCookiePreferencias,
  PREFERENCIAS_PADRAO,
  type Preferencias,
  type TamanhoTexto,
  type Tema,
} from "./preferencias";
import { cx } from "./cx";

const TEMAS: { valor: Tema; nome: string; icone: ReactNode }[] = [
  { valor: "sistema", nome: "Automático", icone: <Monitor size={20} aria-hidden /> },
  { valor: "claro", nome: "Claro", icone: <Sun size={20} aria-hidden /> },
  { valor: "escuro", nome: "Escuro", icone: <Moon size={20} aria-hidden /> },
  { valor: "contraste", nome: "Alto contraste", icone: <Contrast size={20} aria-hidden /> },
];

const TEXTOS: { valor: TamanhoTexto; nome: string; amostra: string }[] = [
  { valor: "100", nome: "Normal", amostra: "text-[1rem]" },
  { valor: "112", nome: "Maior", amostra: "text-[1.125rem]" },
  { valor: "125", nome: "Grande", amostra: "text-[1.25rem]" },
  { valor: "150", nome: "Muito grande", amostra: "text-[1.5rem]" },
];

type Interruptor = keyof Pick<
  Preferencias,
  "letraLegivel" | "sublinharLigacoes" | "destacarFoco" | "reduzirMovimento" | "guiaLeitura"
>;

const INTERRUPTORES: { chave: Interruptor; nome: string; descricao: string }[] = [
  { chave: "letraLegivel", nome: "Letra de leitura fácil", descricao: "Uma letra com formas mais distintas entre si." },
  { chave: "sublinharLigacoes", nome: "Sublinhar ligações", descricao: "Todas as ligações ficam sublinhadas." },
  { chave: "destacarFoco", nome: "Destacar o foco", descricao: "Contorno forte no elemento selecionado com o teclado." },
  { chave: "reduzirMovimento", nome: "Reduzir movimento", descricao: "Desliga animações e transições." },
  { chave: "guiaLeitura", nome: "Guia de leitura", descricao: "Uma faixa que acompanha o cursor e escurece o resto." },
];

function lerAtual(): Preferencias {
  return lerCookiePreferencias(typeof document === "undefined" ? "" : document.cookie);
}

/**
 * "Acessibilidade" — the same menu in every MUTU@L app. The choices are kept
 * in a cookie shared by the whole ecosystem (`cookieDomain`, e.g.
 * `.mutualismo.pt`), so changing them in one app changes them everywhere.
 *
 * Needs `PreferenciasScript` in the root layout <head> (no flash on load).
 */
export function AcessibilidadeMenu({
  cookieDomain,
  tone = "default",
  compacto = false,
  declaracaoHref,
  className,
}: {
  cookieDomain?: string | null;
  tone?: "default" | "ink";
  /** Icon-only trigger (the name stays available to screen readers).
   *  "md" = icon only below the md breakpoint, label from md up. */
  compacto?: boolean | "md";
  /** Link to the app's accessibility statement. */
  declaracaoHref?: string;
  className?: string;
}) {
  const [prefs, setPrefs] = useState<Preferencias>(PREFERENCIAS_PADRAO);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tituloId = useId();

  // Sync from the cookie on mount and whenever the tab regains focus (the
  // person may have changed it in another app).
  useEffect(() => {
    const sync = () => {
      const p = lerAtual();
      setPrefs(p);
      aplicarPreferencias(p);
    };
    sync();
    window.addEventListener("focus", sync);
    // Other copies of this menu on the same page (sidebar, top bar, a
    // settings page) announce their changes; follow them.
    const onOutro = (e: Event) => {
      const p = (e as CustomEvent<Preferencias>).detail;
      if (p) setPrefs(p);
    };
    window.addEventListener("mutual:preferencias", onOutro);
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onScheme = () => aplicarPreferencias(lerAtual());
    mq.addEventListener("change", onScheme);
    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("mutual:preferencias", onOutro);
      mq.removeEventListener("change", onScheme);
    };
  }, []);

  const mudar = useCallback(
    (parcial: Partial<Preferencias>) => {
      setPrefs((atual) => {
        const nova = { ...atual, ...parcial };
        document.cookie = cookiePreferencias(nova, cookieDomain);
        aplicarPreferencias(nova);
        window.dispatchEvent(new CustomEvent("mutual:preferencias", { detail: nova }));
        return nova;
      });
    },
    [cookieDomain],
  );

  const alterado = JSON.stringify(prefs) !== JSON.stringify(PREFERENCIAS_PADRAO);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-haspopup="dialog"
        aria-label={compacto ? "Acessibilidade" : undefined}
        title={compacto === true ? "Acessibilidade" : undefined}
        className={cx(
          "inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-[0.9375rem] font-medium transition-[background-color,transform] active:scale-[0.97] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring",
          tone === "ink"
            ? "text-sidebar-foreground hover:bg-sidebar-accent"
            : "text-foreground hover:bg-accent",
          compacto === true && "min-w-11 justify-center px-0",
          compacto === "md" && "min-w-11 justify-center px-0 md:justify-start md:px-3",
          className,
        )}
      >
        {/* em-sized so it grows with "Tamanho do texto" */}
        <Accessibility aria-hidden className="size-[1.25em] shrink-0" />
        {!compacto && <span>Acessibilidade</span>}
        {compacto === "md" && <span className="hidden md:inline">Acessibilidade</span>}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={tituloId}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="mutual-a11y-dialog m-float fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-[min(26rem,100vw)] max-w-none overflow-y-auto rounded-none rounded-l-2xl p-0 text-base backdrop:bg-black/40 backdrop:backdrop-blur-[2px]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-popover/95 px-5 py-4 backdrop-blur">
          <h2 id={tituloId} className="flex items-center gap-2.5 text-xl font-bold tracking-tight">
            <Accessibility size={24} aria-hidden className="text-brand" />
            Acessibilidade
          </h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="inline-flex size-11 items-center justify-center rounded-lg hover:bg-accent"
            aria-label="Fechar"
          >
            <X size={22} aria-hidden />
          </button>
        </div>

        <div className="flex flex-col gap-7 px-5 py-5">
          <p className="text-[0.9375rem] text-muted-foreground">
            Ajuste a apresentação ao que lhe for mais confortável. As escolhas ficam guardadas neste
            navegador e aplicam-se em todas as aplicações MUTU@L.
          </p>

          <Grupo titulo="Tema">
            <div role="radiogroup" aria-label="Tema" className="grid grid-cols-2 gap-2">
              {TEMAS.map((t) => (
                <Opcao
                  key={t.valor}
                  ativo={prefs.tema === t.valor}
                  onClick={() => mudar({ tema: t.valor })}
                  icone={t.icone}
                >
                  {t.nome}
                </Opcao>
              ))}
            </div>
          </Grupo>

          <Grupo titulo="Tamanho do texto">
            <div role="radiogroup" aria-label="Tamanho do texto" className="grid grid-cols-2 gap-2">
              {TEXTOS.map((t) => (
                <Opcao
                  key={t.valor}
                  ativo={prefs.texto === t.valor}
                  onClick={() => mudar({ texto: t.valor })}
                  icone={<span aria-hidden className={cx("leading-none font-bold", t.amostra)}>A</span>}
                >
                  {t.nome}
                </Opcao>
              ))}
            </div>
          </Grupo>

          <Grupo titulo="Leitura">
            <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
              <LinhaInterruptor
                nome="Espaçamento amplo"
                descricao="Mais espaço entre letras, palavras e linhas."
                ativo={prefs.espaco === "amplo"}
                onChange={(v) => mudar({ espaco: v ? "amplo" : "normal" })}
              />
              {INTERRUPTORES.map((i) => (
                <LinhaInterruptor
                  key={i.chave}
                  nome={i.nome}
                  descricao={i.descricao}
                  ativo={prefs[i.chave]}
                  onChange={(v) => mudar({ [i.chave]: v } as Partial<Preferencias>)}
                />
              ))}
            </div>
          </Grupo>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
            <button
              type="button"
              disabled={!alterado}
              onClick={() => mudar(PREFERENCIAS_PADRAO)}
              className="m-btn m-btn-outline inline-flex min-h-11 items-center gap-2 rounded-lg px-4 disabled:opacity-50"
            >
              <RotateCcw size={18} aria-hidden />
              Repor predefinições
            </button>
            {declaracaoHref && (
              <a href={declaracaoHref} className="text-[0.9375rem] font-medium text-brand underline-offset-4 hover:underline">
                Declaração de acessibilidade
              </a>
            )}
          </div>
        </div>
      </dialog>

      <GuiaLeitura ativo={prefs.guiaLeitura} />
    </>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{titulo}</h3>
      {children}
    </section>
  );
}

function Opcao({
  ativo,
  onClick,
  icone,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  icone: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={ativo}
      onClick={onClick}
      className={cx(
        "relative flex min-h-14 items-center gap-3 rounded-xl border px-3.5 text-left font-medium transition-all",
        ativo
          ? "border-brand bg-brand-soft text-brand-soft-foreground shadow-[inset_0_0_0_1px_var(--brand)]"
          : "border-border bg-card hover:border-foreground/30",
      )}
    >
      <span className="flex size-7 items-center justify-center">{icone}</span>
      <span className="flex-1">{children}</span>
      {ativo && <Check size={18} aria-hidden className="text-brand" />}
    </button>
  );
}

function LinhaInterruptor({
  nome,
  descricao,
  ativo,
  onChange,
}: {
  nome: string;
  descricao: string;
  ativo: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center gap-4 px-4 py-3.5">
      <div className="flex min-w-0 flex-1 flex-col">
        <label htmlFor={id} className="cursor-pointer font-medium">
          {nome}
        </label>
        <span className="text-[0.875rem] text-muted-foreground">{descricao}</span>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={ativo}
        onClick={() => onChange(!ativo)}
        className={cx(
          "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-2 transition-colors",
          ativo ? "border-brand bg-brand" : "border-input bg-muted",
        )}
      >
        <span
          aria-hidden
          className={cx(
            "inline-block size-6 rounded-full bg-white shadow-sm transition-transform",
            ativo ? "translate-x-6" : "translate-x-0.5",
          )}
        />
        <span className="sr-only">{ativo ? "Ligado" : "Desligado"}</span>
      </button>
    </div>
  );
}

// Only the first mounted menu draws the reading guide.
let guiaDono: symbol | null = null;

function GuiaLeitura({ ativo }: { ativo: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [dono, setDono] = useState(false);
  useEffect(() => {
    const eu = Symbol("guia");
    if (guiaDono === null) {
      guiaDono = eu;
      setDono(true);
    }
    return () => {
      if (guiaDono === eu) guiaDono = null;
    };
  }, []);
  useEffect(() => {
    if (!ativo || !dono) return;
    const mover = (e: PointerEvent) => {
      if (ref.current) ref.current.style.top = `${e.clientY}px`;
    };
    window.addEventListener("pointermove", mover, { passive: true });
    return () => window.removeEventListener("pointermove", mover);
  }, [ativo, dono]);
  if (!dono) return null;
  return <div ref={ref} aria-hidden className="mutual-guia-leitura" style={{ top: "50%" }} />;
}

/** Inline <head> script that applies the saved choices before first paint. */
export { PREFERENCIAS_SCRIPT } from "./preferencias";
