"use client";

/**
 * `@umporg/ui/preencher` — the assistant inside the forms:
 *
 * - `PreencherComDocumento`: «Preencher com um documento» — choose a file,
 *   the Cérebro reads it (text, spreadsheets, local OCR) and PROPOSES values;
 *   the person reviews each field (current → proposed, where it came from,
 *   confidence) and applies what they keep to the form's DRAFT. Never submits.
 * - `RevisaoPropostas`, `ProgressoLeitura`: the pieces, for other layouts.
 * - `ListaDoQueFalta`: «O que falta?» — what blocks submitting, by chapter,
 *   with a link to each field.
 * - `RascunhoTexto`: an editable text with «Copiar» and «Usar» (drafting).
 *
 * Needs @base-ui/react (dialog, checkboxes). The calls go to the same origin
 * (`/api/v1/assistente/*`, the Cérebro; no app proxy).
 */
import { useEffect, useId, useMemo, useRef, useState, type ElementType, type ReactNode } from "react";
import { ArrowRight, CircleCheck, FileText, FileUp, Info } from "lucide-react";
import { GlifoApp } from "./icone-app";
import { cx } from "./cx";
import { Button } from "./basicos";
import { StatusBadge, StatusCallout } from "./feedback";
import { Dialog } from "./sobreposicoes";
import { Checkbox } from "./escolhas";
import { CopyButton } from "./markdown";
import {
  API_ASSISTENTE,
  carregarDocumento,
  compararPropostas,
  ErroAssistente,
  escolhaInicial,
  esperarLeitura,
  EXTENSOES_DOCUMENTO,
  type Leitura,
  type LinhaRevisao,
  type OQueFalta,
  pedirLeitura,
  TEXTO_CONFIANCA,
  valoresEscolhidos,
  valorLegivel,
} from "./preencher-dados";

// ─── Progress ───────────────────────────────────────────────────────────────

export function ProgressoLeitura({ progresso, fase, nome }: { progresso: number; fase?: string | null | undefined; nome?: string | undefined }) {
  const p = Math.max(4, Math.min(100, Math.round(progresso)));
  return (
    <div className="flex flex-col gap-3" role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
          <FileText size={20} />
        </span>
        <div className="min-w-0 flex-1">
          {nome && <p className="truncate font-medium">{nome}</p>}
          <p className="text-[0.9375rem] text-muted-foreground">{fase || "A analisar o documento…"}</p>
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out motion-reduce:transition-none" style={{ width: `${p}%` }} />
      </div>
      <p className="text-sm text-muted-foreground">
        O documento é lido no servidor da MUTU@L. Os dados pessoais não são enviados ao modelo de IA.
      </p>
    </div>
  );
}

// ─── Review ─────────────────────────────────────────────────────────────────

const TOM_CONFIANCA = { alta: "success", media: "info", baixa: "warning" } as const;

function ValorCelula({ valor, vazio = "Vazio", riscado }: { valor: unknown; vazio?: string; riscado?: boolean }) {
  const t = valorLegivel(valor);
  if (!t) return <span className="text-muted-foreground italic">{vazio}</span>;
  return <span className={cx("break-words", riscado && "text-muted-foreground line-through decoration-muted-foreground/60")}>{t}</span>;
}

export interface RevisaoPropostasProps {
  linhas: LinhaRevisao[];
  escolhidos: ReadonlySet<string>;
  onChange: (escolhidos: Set<string>) => void;
  avisos?: string[] | undefined;
  /** Custom value rendering (e.g. «Concelho» → a name). */
  formatar?: ((caminho: string, valor: unknown) => ReactNode) | undefined;
}

export function RevisaoPropostas({ linhas, escolhidos, onChange, avisos, formatar }: RevisaoPropostasProps) {
  const uteis = linhas.filter((l) => l.diferenca !== "igual");
  const iguais = linhas.length - uteis.length;
  const todos = uteis.length > 0 && uteis.every((l) => escolhidos.has(l.caminho));
  const alguns = uteis.some((l) => escolhidos.has(l.caminho));
  const alternar = (caminho: string, sim: boolean) => {
    const n = new Set(escolhidos);
    if (sim) n.add(caminho);
    else n.delete(caminho);
    onChange(n);
  };
  const mostrar = (l: LinhaRevisao, v: unknown) => (formatar ? formatar(l.caminho, v) : undefined) ?? <ValorCelula valor={v} />;
  return (
    <div className="flex flex-col gap-4">
      {avisos && avisos.length > 0 && (
        <StatusCallout tone="warning">
          <ul className="flex list-none flex-col gap-1 p-0">
            {avisos.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </StatusCallout>
      )}
      {uteis.length === 0 ? (
        <StatusCallout tone="info" title={linhas.length === 0 ? "Nenhum valor encontrado" : "Nada de novo"}>
          {linhas.length === 0
            ? "Não encontrámos neste documento valores para este formulário."
            : "O formulário já tem os valores que o documento traz."}
        </StatusCallout>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Checkbox
              label={`Selecionar todos (${uteis.length})`}
              checked={todos}
              indeterminate={alguns && !todos}
              onCheckedChange={(sim) => onChange(sim ? new Set(uteis.map((l) => l.caminho)) : new Set())}
            />
            {iguais > 0 && <p className="text-sm text-muted-foreground">{iguais === 1 ? "1 campo já tem o mesmo valor." : `${iguais} campos já têm o mesmo valor.`}</p>}
          </div>
          <ul className="flex list-none flex-col gap-2 p-0" aria-label="Valores propostos">
            {uteis.map((l) => {
              const marcado = escolhidos.has(l.caminho);
              return (
                <li key={l.caminho} className={cx("m-surface rounded-xl border p-3 transition-colors", marcado ? "border-brand/50" : "border-border")}>
                  <div className="flex items-start gap-3">
                    <div className="pt-0.5">
                      <Checkbox aria-label={`Usar o valor proposto para ${l.rotulo}`} checked={marcado} onCheckedChange={(sim) => alternar(l.caminho, sim)} />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="font-semibold">{l.rotulo}</p>
                        {l.diferenca === "substitui" && <StatusBadge tone="warning">Substitui o valor atual</StatusBadge>}
                        <StatusBadge tone={TOM_CONFIANCA[l.confianca]}>{TEXTO_CONFIANCA[l.confianca]}</StatusBadge>
                      </div>
                      <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-0.5 text-[0.9375rem]">
                        <span className="text-muted-foreground">Atual</span>
                        <span>{l.diferenca === "novo" ? <ValorCelula valor={null} /> : <span className="text-muted-foreground">{mostrar(l, l.atual)}</span>}</span>
                        <span className="text-muted-foreground">Proposto</span>
                        <span className="font-medium">{mostrar(l, l.valor)}</span>
                      </div>
                      <details className="group text-sm text-muted-foreground">
                        <summary className="w-fit cursor-pointer rounded underline-offset-2 hover:underline">
                          De onde veio: {l.origem}
                          {l.metodo === "modelo" && " (proposto pelo modelo de IA)"}
                        </summary>
                        <blockquote className="mt-1 border-l-2 border-border pl-3 break-words whitespace-pre-wrap">{l.excerto}</blockquote>
                      </details>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

// ─── The whole flow in a dialog ─────────────────────────────────────────────

type Passo =
  | { tipo: "escolher"; erro?: string | undefined }
  | { tipo: "a-ler"; nome: string; progresso: number; fase: string | null }
  | { tipo: "rever"; leitura: Leitura }
  | { tipo: "aplicado"; n: number };

export interface PreencherComDocumentoProps {
  /** The form in the Cérebro ("caracterizacao.a", "simplex.balanco", "eventos.evento"). */
  alvo: string;
  /** What the dialog says it fills ("A. Identificação"). */
  nomeFormulario: string;
  /** The form's current values by path (to show current → proposed). */
  valoresAtuais: Readonly<Record<string, unknown>>;
  /** Applies the kept values to the DRAFT (never submits). */
  aoAplicar: (valores: Record<string, string | number>) => void;
  formatar?: RevisaoPropostasProps["formatar"];
  /** Button label (default «Preencher com um documento»). */
  label?: string | undefined;
  disabled?: boolean | undefined;
  /** Cérebro base (default `/api/v1/assistente`). */
  api?: string | undefined;
  /** For tests and the demo. */
  fetcher?: ((input: string, init?: RequestInit) => Promise<Response>) | undefined;
  buttonVariant?: "outline" | "secondary" | "ghost" | undefined;
  className?: string | undefined;
}

export function PreencherComDocumento({
  alvo,
  nomeFormulario,
  valoresAtuais,
  aoAplicar,
  formatar,
  label = "Preencher com um documento",
  disabled,
  api = API_ASSISTENTE,
  fetcher,
  buttonVariant = "outline",
  className,
}: PreencherComDocumentoProps) {
  const [aberto, setAberto] = useState(false);
  const [passo, setPasso] = useState<Passo>({ tipo: "escolher" });
  const [escolhidos, setEscolhidos] = useState<Set<string>>(new Set());
  const [arrastar, setArrastar] = useState(false);
  const cancelar = useRef<AbortController | null>(null);
  const inputId = useId();
  const f = fetcher ?? ((i: string, init?: RequestInit) => fetch(i, init));

  const linhas = useMemo(
    () => (passo.tipo === "rever" && passo.leitura.resultado ? compararPropostas(passo.leitura.resultado.propostas, valoresAtuais) : []),
    [passo, valoresAtuais],
  );

  useEffect(() => () => cancelar.current?.abort(), []);

  const ler = async (ficheiro: File) => {
    cancelar.current?.abort();
    const ctrl = new AbortController();
    cancelar.current = ctrl;
    setPasso({ tipo: "a-ler", nome: ficheiro.name, progresso: 4, fase: "A enviar o documento…" });
    try {
      const doc = await carregarDocumento(f, ficheiro, api);
      const { id } = await pedirLeitura(f, doc.id, alvo, api);
      const l = await esperarLeitura(
        f,
        id,
        (x) => {
          if (!ctrl.signal.aborted) setPasso({ tipo: "a-ler", nome: ficheiro.name, progresso: x.progresso, fase: x.fase });
        },
        { api, sinal: ctrl.signal },
      );
      if (ctrl.signal.aborted) return;
      if (l.estado === "erro" || !l.resultado) {
        setPasso({ tipo: "escolher", erro: l.erro ?? "Não foi possível analisar o documento." });
        return;
      }
      const revisao = compararPropostas(l.resultado.propostas, valoresAtuais);
      setEscolhidos(escolhaInicial(revisao));
      setPasso({ tipo: "rever", leitura: l });
    } catch (e) {
      if (ctrl.signal.aborted) return;
      setPasso({ tipo: "escolher", erro: e instanceof ErroAssistente ? e.message : "Não foi possível enviar o documento. Verifique a ligação e tente novamente." });
    }
  };

  const fechar = (sim: boolean) => {
    setAberto(sim);
    if (!sim) {
      cancelar.current?.abort();
      setPasso({ tipo: "escolher" });
    }
  };

  const aplicar = () => {
    const valores = valoresEscolhidos(linhas, escolhidos);
    aoAplicar(valores);
    setPasso({ tipo: "aplicado", n: Object.keys(valores).length });
  };

  const nEscolhidos = linhas.filter((l) => escolhidos.has(l.caminho) && l.diferenca !== "igual").length;

  const rodape =
    passo.tipo === "rever" ? (
      <>
        <Button variant="outline" onClick={() => setPasso({ tipo: "escolher" })}>
          Outro documento
        </Button>
        <Button onClick={aplicar} disabled={nEscolhidos === 0}>
          {nEscolhidos === 1 ? "Aplicar 1 valor ao rascunho" : `Aplicar ${nEscolhidos} valores ao rascunho`}
        </Button>
      </>
    ) : passo.tipo === "aplicado" ? (
      <Button onClick={() => fechar(false)}>Voltar ao formulário</Button>
    ) : passo.tipo === "a-ler" ? (
      <Button variant="outline" onClick={() => { cancelar.current?.abort(); setPasso({ tipo: "escolher" }); }}>
        Cancelar
      </Button>
    ) : undefined;

  return (
    <>
      <Button variant={buttonVariant} onClick={() => setAberto(true)} disabled={disabled} className={className}>
        <GlifoApp app="assistente" /> {label}
      </Button>
      <Dialog
        open={aberto}
        onOpenChange={fechar}
        size="lg"
        title="Preencher com um documento"
        description={`${nomeFormulario}. O assistente propõe valores; escolhe o que aplica ao rascunho. Nada é submetido.`}
        footer={rodape}
        dismissible={passo.tipo !== "a-ler"}
      >
        {passo.tipo === "escolher" && (
          <div className="flex flex-col gap-4">
            {passo.erro && <StatusCallout tone="danger" role="alert">{passo.erro}</StatusCallout>}
            <label
              htmlFor={inputId}
              onDragOver={(e) => {
                e.preventDefault();
                setArrastar(true);
              }}
              onDragLeave={() => setArrastar(false)}
              onDrop={(e) => {
                e.preventDefault();
                setArrastar(false);
                const fch = e.dataTransfer.files[0];
                if (fch) void ler(fch);
              }}
              className={cx(
                "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
                arrastar ? "border-brand bg-brand-soft/60" : "border-border hover:border-brand/60 hover:bg-muted/50",
              )}
            >
              <FileUp aria-hidden size={28} className="text-brand" />
              <span className="font-semibold">Escolha um ficheiro ou arraste-o para aqui</span>
              <span className="text-[0.9375rem] text-muted-foreground">PDF, Word, Excel, CSV ou imagem (também digitalizados).</span>
              <input
                id={inputId}
                type="file"
                accept={EXTENSOES_DOCUMENTO}
                className="sr-only"
                onChange={(e) => {
                  const fch = e.target.files?.[0];
                  e.target.value = "";
                  if (fch) void ler(fch);
                }}
              />
            </label>
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info aria-hidden size={16} className="mt-0.5 shrink-0" />
              Os números com formato (NIF, IBAN, datas, montantes, telefones) são lidos sem IA. Só o texto livre passa pelo modelo, com os dados pessoais mascarados. O documento é apagado automaticamente.
            </p>
          </div>
        )}
        {passo.tipo === "a-ler" && <ProgressoLeitura progresso={passo.progresso} fase={passo.fase} nome={passo.nome} />}
        {passo.tipo === "rever" && (
          <RevisaoPropostas linhas={linhas} escolhidos={escolhidos} onChange={setEscolhidos} avisos={passo.leitura.resultado?.avisos} formatar={formatar} />
        )}
        {passo.tipo === "aplicado" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center" role="status">
            <CircleCheck aria-hidden size={32} className="text-success" />
            <p className="text-lg font-semibold">{passo.n === 1 ? "1 valor aplicado ao rascunho" : `${passo.n} valores aplicados ao rascunho`}</p>
            <p className="max-w-md text-muted-foreground">Reveja o formulário e guarde quando estiver pronto. Nada foi submetido.</p>
          </div>
        )}
      </Dialog>
    </>
  );
}

// ─── «O que falta?» ─────────────────────────────────────────────────────────

export function ListaDoQueFalta({ dados, LinkComponent = "a", onIr }: { dados: OQueFalta; LinkComponent?: ElementType | undefined; onIr?: ((ligacao: string) => void) | undefined }) {
  if (dados.semAcesso) return <StatusCallout tone="warning">{dados.semAcesso}</StatusCallout>;
  if (dados.mensagem) return <StatusCallout tone={dados.submetida ? "success" : "info"}>{dados.mensagem}</StatusCallout>;
  const grupos = dados.porCapitulo ?? [];
  const impedimentos = dados.impedimentos ?? [];
  if (grupos.length === 0 && impedimentos.length === 0 && (dados.porSubmeter?.length ?? 0) === 0) {
    return (
      <StatusCallout tone="success" title="Não falta nada">
        {dados.formulario === "caracterizacao" ? "Pode submeter a caracterização." : "Não há documentos por submeter."}
      </StatusCallout>
    );
  }
  const Link = LinkComponent;
  const item = (ligacao: string, children: ReactNode, key: string) => (
    <li key={key} className="flex items-start gap-2">
      <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-warning" />
      <Link
        href={ligacao}
        onClick={onIr ? (e: { preventDefault: () => void }) => { e.preventDefault(); onIr(ligacao); } : undefined}
        className="group inline-flex flex-1 items-start justify-between gap-2 rounded-md py-0.5 hover:text-brand"
      >
        <span>{children}</span>
        <ArrowRight aria-hidden size={16} className="mt-1 shrink-0 opacity-60 group-hover:opacity-100" />
      </Link>
    </li>
  );
  return (
    <div className="flex flex-col gap-4">
      {grupos.map((g) => (
        <section key={g.capitulo} className="flex flex-col gap-1.5">
          <h3 className="text-base font-semibold">
            {g.capitulo} <span className="font-normal text-muted-foreground">({g.itens.length})</span>
          </h3>
          <ul className="flex list-none flex-col gap-1 p-0 text-[0.9375rem]">{g.itens.map((i, n) => item(i.ligacao, i.mensagem, `${i.campo}-${n}`))}</ul>
        </section>
      ))}
      {dados.porSubmeter && dados.porSubmeter.length > 0 && (
        <section className="flex flex-col gap-1.5">
          <h3 className="text-base font-semibold">Por submeter ({dados.porSubmeter.length})</h3>
          <ul className="flex list-inside list-disc flex-col gap-1 p-0 text-[0.9375rem]">
            {dados.porSubmeter.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </section>
      )}
      {impedimentos.length > 0 && (
        <section className="flex flex-col gap-1.5">
          <h3 className="text-base font-semibold">O que impede a submissão</h3>
          <ul className="flex list-none flex-col gap-1 p-0 text-[0.9375rem]">{impedimentos.map((i, n) => item(i.ligacao, <><strong>{i.documento}:</strong> {i.mensagem}</>, `imp-${n}`))}</ul>
        </section>
      )}
      {dados.nota && <p className="text-sm text-muted-foreground">{dados.nota}</p>}
    </div>
  );
}

// ─── Drafted text ───────────────────────────────────────────────────────────

const NOME_RASCUNHO: Record<string, string> = {
  email: "Email",
  convite: "Convite",
  "descricao-evento": "Descrição do evento",
  "resumo-ata": "Resumo da ata",
  texto: "Texto",
};

/**
 * A text the assistant drafted, editable in place, with «Copiar» and «Usar»
 * (the app decides what «Usar» does: fill a field, open a draft…).
 */
export function RascunhoTexto({
  tipo,
  titulo,
  texto,
  onUsar,
  usarLabel = "Usar",
  className,
}: {
  tipo: string;
  titulo: string;
  texto: string;
  onUsar?: ((texto: string, titulo: string) => void) | undefined;
  usarLabel?: string | undefined;
  className?: string | undefined;
}) {
  const [valor, setValor] = useState(texto);
  const [tituloAtual, setTitulo] = useState(titulo);
  const id = useId();
  useEffect(() => setValor(texto), [texto]);
  useEffect(() => setTitulo(titulo), [titulo]);
  return (
    <section aria-labelledby={`${id}-t`} className={cx("m-surface flex max-w-2xl flex-col gap-3 rounded-xl border border-border p-4", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <span aria-hidden className="grid size-8 place-items-center rounded-lg bg-brand-soft text-brand">
          <GlifoApp app="assistente" tamanho={16} />
        </span>
        <p id={`${id}-t`} className="text-sm font-medium text-muted-foreground">
          Rascunho · {NOME_RASCUNHO[tipo] ?? "Texto"}
        </p>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">{tipo === "email" || tipo === "convite" ? "Assunto" : "Título"}</span>
        <input value={tituloAtual} onChange={(e) => setTitulo(e.target.value)} className="m-input h-11 rounded-lg border border-input bg-background px-3 text-base" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">Texto (pode editar)</span>
        <textarea
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          rows={Math.min(14, Math.max(5, valor.split("\n").length + 1))}
          className="m-input rounded-lg border border-input bg-background px-3 py-2 text-base leading-relaxed"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <CopyButton text={() => (tituloAtual ? `${tituloAtual}\n\n${valor}` : valor)} label="Copiar" doneLabel="Copiado" />
        {onUsar && (
          <Button size="sm" onClick={() => onUsar(valor, tituloAtual)}>
            {usarLabel}
          </Button>
        )}
      </div>
    </section>
  );
}

export {
  aplicarValores,
  compararPropostas,
  escolhaInicial,
  escreverCaminho,
  lerCaminho,
  pedirOQueFalta,
  pedirTexto,
  valoresDoRascunho,
  valoresEscolhidos,
  valorLegivel,
  EXTENSOES_DOCUMENTO,
  API_ASSISTENTE,
  ErroAssistente,
  type LinhaRevisao,
  type Leitura,
  type OQueFalta,
  type PropostaCampo,
} from "./preencher-dados";
