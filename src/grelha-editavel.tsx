"use client";

import { useEffect, useId, useRef, useState, type ClipboardEvent, type KeyboardEvent, type ReactNode } from "react";
import { AlertCircle, Check, Pencil } from "lucide-react";
import { cx } from "./cx";
import {
  aplicarColagem,
  analisarColagem,
  chaveCelula,
  converterTexto,
  moverNaGrelha,
  textoDaCelula,
  type AlteracaoCelula,
  type ColunaGrelha,
  type ErroCelula,
  type LinhaGrelha,
  type PosicaoGrelha,
} from "./grelha-editavel-logica";

export * from "./grelha-editavel-logica";

export interface GrelhaEditavelProps {
  /** Accessible name of the grid (visually hidden caption). */
  legenda: string;
  colunas: readonly ColunaGrelha[];
  linhas: readonly LinhaGrelha[];
  /** Valid changes (typed, toggled or pasted) and the texts that could not be read. The app applies the changes, merges `erros` into its own and clears the errors of the cells that changed. */
  aoAlterar: (alteracoes: AlteracaoCelula[], erros: ErroCelula[]) => void;
  /** Error text per cell, keyed by `chaveCelula(linhaId, chave)`; shown next to the cell. */
  erros?: Readonly<Record<string, string>> | undefined;
  /** Cells changed and not saved yet, keyed by `chaveCelula`; marked with an icon and hidden text. */
  alteradas?: ReadonlySet<string> | undefined;
  /** Selected row ids. The selection column shows only when `aoSelecionar` is given. */
  selecionadas?: ReadonlySet<string> | undefined;
  aoSelecionar?: ((ids: string[]) => void) | undefined;
  /** Header of the fixed first column (default «Nome»). */
  rotuloNome?: string | undefined;
  /** Shown when there are no rows. */
  vazio?: ReactNode | undefined;
  /** Adds a last column with the app's own controls for each row (buttons, menus). Arrows reach the cell, Enter moves focus into the controls, Esc returns to the cell; the controls stay out of the Tab order until then. Not part of paste. */
  renderAcoes?: ((linha: LinhaGrelha) => ReactNode) | undefined;
  /** Header and accessible name of the actions column (default «Ações»). */
  rotuloAcoes?: string | undefined;
  className?: string | undefined;
}

interface Edicao {
  linha: number;
  coluna: number;
  rascunho: string;
}

const LARGURA: Record<ColunaGrelha["tipo"], string> = {
  numero: "7.5rem",
  data: "10.5rem",
  simNao: "11rem",
  escolha: "12rem",
  texto: "14rem",
};

const FOCO = "focus-visible:[outline:3px_solid_var(--ring)] focus-visible:[outline-offset:-3px]";
const TECLAS_NAVEGACAO = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"]);

/** Editable grid for typing values per row and column (grades, results). Controlled, with no saving: the app owns the values, shows «Guardar» and the pending changes. See docs/guia/dados.md. */
export function GrelhaEditavel({
  legenda,
  colunas,
  linhas,
  aoAlterar,
  erros,
  alteradas,
  selecionadas,
  aoSelecionar,
  rotuloNome = "Nome",
  vazio,
  renderAcoes,
  rotuloAcoes = "Ações",
  className,
}: GrelhaEditavelProps) {
  const base = useId();
  const tabela = useRef<HTMLTableElement>(null);
  const desvio = aoSelecionar ? 1 : 0;
  const temAcoes = !!renderAcoes;
  const nColunas = desvio + colunas.length + (temAcoes ? 1 : 0);
  const colAcoes = desvio + colunas.length;
  const [acoesAbertas, setAcoesAbertas] = useState<number | null>(null);
  const [ativa, setAtiva] = useState<PosicaoGrelha>({ linha: 0, coluna: desvio });
  const [edicao, setEdicaoEstado] = useState<Edicao | null>(null);
  const edicaoRef = useRef<Edicao | null>(null);
  const focarPendente = useRef(false);
  const [mensagem, setMensagem] = useState("");

  const posicao: PosicaoGrelha = {
    linha: Math.min(ativa.linha, Math.max(linhas.length - 1, 0)),
    coluna: Math.min(Math.max(ativa.coluna, 0), Math.max(nColunas - 1, 0)),
  };

  const setEdicao = (e: Edicao | null) => {
    edicaoRef.current = e;
    setEdicaoEstado(e);
  };
  /** Keeps the roving tab stop on the cell the user focused or clicked. */
  const ativar = (linha: number, coluna: number) => {
    if (posicao.linha !== linha || posicao.coluna !== coluna) setAtiva({ linha, coluna });
  };
  const colunaDe = (c: number): ColunaGrelha | undefined => colunas[c - desvio];

  const focar = (linha: number, coluna: number) => {
    focarPendente.current = true;
    setAtiva({ linha, coluna });
  };

  useEffect(() => {
    if (!focarPendente.current || edicao) return;
    focarPendente.current = false;
    tabela.current?.querySelector<HTMLElement>(`td[data-l="${posicao.linha}"][data-c="${posicao.coluna}"]`)?.focus();
  }, [ativa, edicao, posicao.linha, posicao.coluna]);

  // Controls of the actions column stay out of the Tab order (one stop for the grid) until Enter opens that row's cell.
  useEffect(() => {
    tabela.current?.querySelectorAll<HTMLElement>("td[data-acoes]").forEach((td) => {
      const aberta = Number(td.dataset.l) === acoesAbertas;
      td.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [data-grelha-tab]').forEach((el) => {
        if (aberta) {
          if (el.dataset.grelhaTab) {
            el.removeAttribute("tabindex");
            delete el.dataset.grelhaTab;
          }
        } else if (el.getAttribute("tabindex") !== "-1") {
          el.dataset.grelhaTab = "1";
          el.setAttribute("tabindex", "-1");
        }
      });
    });
  });

  /** Reads `texto` into the cell; returns false (and reports the error) when it is not valid. */
  const confirmar = (l: number, c: number, texto: string): boolean => {
    const col = colunaDe(c);
    const linha = linhas[l];
    if (!col || !linha) return true;
    const r = converterTexto(col, texto);
    if (!r.ok) {
      aoAlterar([], [{ linhaId: linha.id, chave: col.chave, mensagem: r.mensagem, texto }]);
      return false;
    }
    const igual = (linha.valores[col.chave] ?? null) === r.valor;
    if (!igual || erros?.[chaveCelula(linha.id, col.chave)]) {
      aoAlterar([{ linhaId: linha.id, chave: col.chave, valor: r.valor }], []);
    }
    return true;
  };

  const abrirEdicao = (l: number, c: number, rascunho?: string) => {
    const col = colunaDe(c);
    const linha = linhas[l];
    if (!col || !linha || col.apenasLeitura) return;
    setAtiva({ linha: l, coluna: c });
    if (col.tipo === "simNao") {
      const td = tabela.current?.querySelector<HTMLElement>(`td[data-l="${l}"][data-c="${c}"]`);
      (td?.querySelector<HTMLElement>('button[aria-pressed="true"]') ?? td?.querySelector<HTMLElement>("button"))?.focus();
      return;
    }
    setEdicao({ linha: l, coluna: c, rascunho: rascunho ?? textoDaCelula(col, linha.valores[col.chave]) });
  };

  const descer = (l: number, c: number, passo: number) => focar(Math.min(Math.max(l + passo, 0), linhas.length - 1), c);

  const alternarLinha = (id: string) => {
    if (!aoSelecionar) return;
    const s = new Set(selecionadas ?? []);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    aoSelecionar(linhas.filter((x) => s.has(x.id)).map((x) => x.id));
  };
  const todasSelecionadas = linhas.length > 0 && linhas.every((x) => selecionadas?.has(x.id));
  const algumaSelecionada = linhas.some((x) => selecionadas?.has(x.id));

  function aoTeclar(e: KeyboardEvent<HTMLTableElement>) {
    const alvo = e.target as HTMLElement;
    const td = alvo.closest<HTMLElement>("td[data-l]");
    if (!td) return;
    const l = Number(td.dataset.l);
    const c = Number(td.dataset.c);
    const col = colunaDe(c);
    const ctrl = e.ctrlKey || e.metaKey;

    // Actions column: Enter goes into the controls, Esc comes back; the controls handle their own keys.
    if (td.dataset.acoes) {
      if (alvo !== td) {
        if (e.key === "Escape") {
          e.preventDefault();
          setAcoesAbertas(null);
          focar(l, c);
        }
        return;
      }
      if (TECLAS_NAVEGACAO.has(e.key)) {
        e.preventDefault();
        const p = moverNaGrelha({ linha: l, coluna: c }, e.key, linhas.length, nColunas, ctrl);
        focar(p.linha, p.coluna);
      } else if (e.key === "Enter" || e.key === "F2") {
        const primeiro = td.querySelector<HTMLElement>('button, a[href], input, select, textarea, [tabindex], [data-grelha-tab]');
        if (primeiro) {
          e.preventDefault();
          setAcoesAbertas(l);
          primeiro.focus();
        }
      }
      return;
    }

    // Edit mode: text/date input or choice select.
    if (alvo.dataset.edicao) {
      if (e.key === "Escape") {
        e.preventDefault();
        setEdicao(null);
        focar(l, c);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const texto = edicaoRef.current?.rascunho ?? (alvo as HTMLInputElement).value;
        if (!confirmar(l, c, texto)) return;
        setEdicao(null);
        descer(l, c, e.shiftKey ? -1 : 1);
      }
      return;
    }

    // Yes/no buttons.
    if (alvo.dataset.simnao) {
      const botoes = Array.from(td.querySelectorAll<HTMLElement>("button"));
      const i = botoes.indexOf(alvo);
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        botoes[Math.min(Math.max(i + (e.key === "ArrowRight" ? 1 : -1), 0), botoes.length - 1)]?.focus();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (confirmar(l, c, alvo.dataset.simnao === "sim" ? "Sim" : "Não")) descer(l, c, e.shiftKey ? -1 : 1);
      } else if (e.key === "Escape") {
        e.preventDefault();
        focar(l, c);
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "PageUp" || e.key === "PageDown") {
        e.preventDefault();
        const p = moverNaGrelha({ linha: l, coluna: c }, e.key, linhas.length, nColunas, ctrl);
        focar(p.linha, p.coluna);
      }
      return;
    }

    if (alvo !== td) return;

    // Navigation mode.
    if (TECLAS_NAVEGACAO.has(e.key)) {
      e.preventDefault();
      const p = moverNaGrelha({ linha: l, coluna: c }, e.key, linhas.length, nColunas, ctrl);
      focar(p.linha, p.coluna);
      return;
    }
    if (!col) {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        const linha = linhas[l];
        if (linha) alternarLinha(linha.id);
      }
      return;
    }
    if (col.apenasLeitura) return;
    if (e.key === "Enter" || e.key === "F2") {
      e.preventDefault();
      abrirEdicao(l, c);
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      confirmar(l, c, "");
    } else if (e.key.length === 1 && !ctrl && !e.altKey && (col.tipo === "numero" || col.tipo === "texto")) {
      e.preventDefault();
      abrirEdicao(l, c, e.key);
    }
  }

  function aoColar(e: ClipboardEvent<HTMLTableElement>) {
    const texto = e.clipboardData.getData("text/plain");
    const emEdicao = !!edicaoRef.current;
    if (emEdicao && !/[\t\n]/.test(texto.replace(/\r?\n$/, ""))) return; // one value into the open field: the browser does it
    const td = (e.target as HTMLElement).closest<HTMLElement>("td[data-l]");
    if (td?.dataset.acoes || (!td && posicao.coluna === colAcoes && temAcoes)) return;
    const l = td ? Number(td.dataset.l) : posicao.linha;
    const c = td ? Number(td.dataset.c) : posicao.coluna;
    const col = colunaDe(c) ? c - desvio : 0;
    e.preventDefault();
    if (texto.trim() === "") return;
    setEdicao(null);
    const r = aplicarColagem(colunas, linhas, { linha: l, coluna: col }, analisarColagem(texto));
    aoAlterar(r.alteracoes, r.erros);
    const partes = [`${r.total} ${r.total === 1 ? "valor lido" : "valores lidos"}`, `${r.alteracoes.length} alterados`];
    if (r.erros.length > 0) partes.push(`${r.erros.length} com erro`);
    if (r.ignoradas > 0) partes.push(`${r.ignoradas} fora da tabela`);
    setMensagem(`Colar: ${partes.join(", ")}.`);
  }

  const cabecalho = "border-b border-border bg-muted py-2 text-left text-[0.9375rem] font-semibold text-foreground";
  const celula = "relative border-b border-border py-1.5 align-top text-[0.9375rem]";
  const pegajosoSel = "sticky left-0 z-[2] w-12 min-w-12 px-0 text-center";
  const px = "px-3";
  const pegajosoNome = cx("sticky z-[2] border-r border-border w-28 min-w-28 max-w-[10rem] break-words sm:w-48 sm:max-w-[14rem]", desvio ? "left-12" : "left-0");

  return (
    <div className={cx("m-surface relative min-w-0 max-w-full overflow-x-auto rounded-lg", className)}>
      <table ref={tabela} role="grid" onKeyDown={aoTeclar} onPaste={aoColar} className="w-max min-w-full border-separate border-spacing-0">
        <caption className="sr-only">{legenda}</caption>
        <thead>
          <tr>
            {desvio === 1 && (
              <th scope="col" className={cx(cabecalho, pegajosoSel, "!bg-muted")}>
                <label className="grid size-11 cursor-pointer place-items-center">
                  <input
                    type="checkbox"
                    aria-label="Selecionar todas as linhas"
                    className="size-5 accent-[var(--primary)]"
                    checked={todasSelecionadas}
                    ref={(el) => {
                      if (el) el.indeterminate = !todasSelecionadas && algumaSelecionada;
                    }}
                    onChange={() => aoSelecionar?.(todasSelecionadas ? [] : linhas.map((x) => x.id))}
                  />
                </label>
              </th>
            )}
            <th scope="col" className={cx(cabecalho, px, pegajosoNome, "!bg-muted")}>
              {rotuloNome}
            </th>
            {colunas.map((col) => (
              <th key={col.chave} scope="col" className={cx(cabecalho, px)} style={{ minWidth: `max(6.5rem, ${col.largura ?? LARGURA[col.tipo]})` }}>
                {col.rotulo}
                {col.obrigatoria && (
                  <>
                    <span aria-hidden> *</span>
                    <span className="sr-only"> (obrigatório)</span>
                  </>
                )}
                {col.apenasLeitura && <span className="sr-only"> (só de leitura)</span>}
              </th>
            ))}
            {temAcoes && (
              <th scope="col" className={cx(cabecalho, px)}>
                {rotuloAcoes}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {linhas.length === 0 && (
            <tr>
              <td colSpan={nColunas + 1} className="px-3 py-6 text-center text-[0.9375rem] text-muted-foreground">
                {vazio ?? "Sem linhas para mostrar."}
              </td>
            </tr>
          )}
          {linhas.map((linha, l) => {
            const selecionada = !!selecionadas?.has(linha.id);
            const fundo = selecionada ? "bg-accent" : "bg-card";
            return (
              <tr key={linha.id} aria-selected={aoSelecionar ? selecionada : undefined} className={fundo}>
                {desvio === 1 && (
                  <td
                    role="gridcell"
                    data-l={l}
                    data-c={0}
                    tabIndex={posicao.linha === l && posicao.coluna === 0 ? 0 : -1}
                    aria-label={`Selecionar ${linha.nome}`}
                    aria-selected={selecionada}
                    onFocus={(e) => e.target === e.currentTarget && ativar(l, 0)}
                    onClick={() => ativar(l, 0)}
                    className={cx(celula, pegajosoSel, fundo, FOCO)}
                  >
                    <label className="mx-auto grid size-11 cursor-pointer place-items-center">
                      <input
                        type="checkbox"
                        tabIndex={-1}
                        aria-hidden
                        className="size-5 accent-[var(--primary)]"
                        checked={selecionada}
                        onChange={() => alternarLinha(linha.id)}
                      />
                    </label>
                  </td>
                )}
                <th scope="row" className={cx(celula, px, pegajosoNome, fundo, "text-left font-medium")}>
                  <span className="flex min-h-11 items-center">{linha.nome}</span>
                </th>
                {colunas.map((col, j) => {
                  const c = j + desvio;
                  const chave = chaveCelula(linha.id, col.chave);
                  const valor = linha.valores[col.chave] ?? null;
                  const texto = textoDaCelula(col, valor);
                  const erro = erros?.[chave];
                  const suja = alteradas?.has(chave) ?? false;
                  const editando = edicao?.linha === l && edicao.coluna === c;
                  const nome = `${linha.nome}, ${col.rotulo}`;
                  const erroId = `${base}-e-${l}-${j}`;
                  return (
                    <td
                      key={col.chave}
                      role="gridcell"
                      data-l={l}
                      data-c={c}
                      tabIndex={posicao.linha === l && posicao.coluna === c ? 0 : -1}
                      aria-label={`${nome}: ${texto === "" ? "vazio" : texto}`}
                      aria-readonly={col.apenasLeitura ? true : undefined}
                      aria-required={col.obrigatoria ? true : undefined}
                      aria-invalid={erro ? true : undefined}
                      aria-describedby={erro ? erroId : undefined}
                      onFocus={(e) => e.target === e.currentTarget && ativar(l, c)}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest("input,select,button")) return;
                        if (col.tipo === "simNao" || col.apenasLeitura) setAtiva({ linha: l, coluna: c });
                        else abrirEdicao(l, c);
                      }}
                      className={cx(celula, px, FOCO, col.apenasLeitura && "bg-muted/50 text-muted-foreground")}
                    >
                      {suja && (
                        <>
                          <Pencil aria-hidden size={12} className="absolute top-1 right-1 text-muted-foreground" />
                          <span className="sr-only">Alterado, por guardar. </span>
                        </>
                      )}
                      {col.tipo === "simNao" ? (
                        <div className="flex gap-2">
                          {([true, false] as const).map((v) => {
                            const premido = valor === v;
                            return (
                              <button
                                key={String(v)}
                                type="button"
                                tabIndex={-1}
                                data-simnao={v ? "sim" : "nao"}
                                aria-pressed={premido}
                                aria-label={`${nome}: ${v ? "Sim" : "Não"}`}
                                disabled={col.apenasLeitura}
                                onClick={() => {
                                  setAtiva({ linha: l, coluna: c });
                                  confirmar(l, c, premido ? "" : v ? "Sim" : "Não");
                                }}
                                className={cx(
                                  "inline-flex h-11 min-w-11 items-center justify-center gap-1 rounded-lg border px-3 text-base font-medium",
                                  premido ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground",
                                  FOCO,
                                )}
                              >
                                {premido && <Check aria-hidden size={16} />}
                                {v ? "Sim" : "Não"}
                              </button>
                            );
                          })}
                        </div>
                      ) : editando && col.tipo === "escolha" ? (
                        <select
                          ref={focarAoMontar}
                          data-edicao="1"
                          aria-label={nome}
                          value={edicao.rascunho}
                          onChange={(e) => {
                            const rascunho = e.target.value;
                            setEdicao({ linha: l, coluna: c, rascunho });
                            confirmar(l, c, rascunho);
                          }}
                          onBlur={() => setEdicao(null)}
                          className="m-field h-11 w-full rounded-lg px-2 text-base"
                        >
                          <option value="">—</option>
                          {col.opcoes?.map((o) => (
                            <option key={o.valor} value={o.valor}>
                              {o.rotulo}
                            </option>
                          ))}
                        </select>
                      ) : editando ? (
                        <input
                          ref={focarAoMontar}
                          data-edicao="1"
                          type={col.tipo === "data" ? "date" : "text"}
                          inputMode={col.tipo === "numero" ? "decimal" : undefined}
                          autoComplete="off"
                          aria-label={nome}
                          aria-invalid={erro ? true : undefined}
                          aria-describedby={erro ? erroId : undefined}
                          value={col.tipo === "data" ? isoDe(edicao.rascunho) : edicao.rascunho}
                          onChange={(e) => setEdicao({ linha: l, coluna: c, rascunho: e.target.value })}
                          onBlur={() => {
                            const atual = edicaoRef.current;
                            if (!atual || atual.linha !== l || atual.coluna !== c) return;
                            confirmar(l, c, atual.rascunho);
                            setEdicao(null);
                          }}
                          className="m-field h-11 w-full min-w-0 rounded-lg px-2 text-base"
                        />
                      ) : (
                        <span className="flex min-h-11 items-center break-words">
                          {texto === "" ? <span className="text-muted-foreground">—</span> : texto}
                        </span>
                      )}
                      {erro && (
                        <p id={erroId} className="mt-1 flex w-0 min-w-full items-start gap-1 break-words text-[0.875rem] font-medium text-destructive">
                          <AlertCircle aria-hidden size={14} className="mt-0.5 shrink-0" />
                          <span>{erro}</span>
                        </p>
                      )}
                    </td>
                  );
                })}
                {renderAcoes && (
                  <td
                    role="gridcell"
                    data-l={l}
                    data-c={colAcoes}
                    data-acoes="1"
                    tabIndex={posicao.linha === l && posicao.coluna === colAcoes ? 0 : -1}
                    aria-label={`${linha.nome}, ${rotuloAcoes}`}
                    onFocus={(e) => e.target === e.currentTarget && ativar(l, colAcoes)}
                    onBlur={(e) => {
                      if (acoesAbertas === l && !e.currentTarget.contains(e.relatedTarget as Node | null)) setAcoesAbertas(null);
                    }}
                    onClick={() => ativar(l, colAcoes)}
                    className={cx(celula, px, FOCO)}
                  >
                    <div className="flex min-h-11 flex-wrap items-center gap-2">{renderAcoes(linha)}</div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p role="status" className="sr-only">
        {mensagem}
      </p>
    </div>
  );
}

/** Focus (caret at the end) when an editor mounts; stable so typing never re-focuses. */
function focarAoMontar(el: HTMLInputElement | HTMLSelectElement | null) {
  if (!el) return;
  el.focus();
  if (el instanceof HTMLInputElement && el.type === "text") {
    const n = el.value.length;
    el.setSelectionRange(n, n);
  }
}

/** The draft of a date edit is shown as ISO in `<input type="date">`; "" when it is not a full date yet. */
function isoDe(rascunho: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(rascunho);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return /^\d{4}-\d{2}-\d{2}$/.test(rascunho) ? rascunho : "";
}
