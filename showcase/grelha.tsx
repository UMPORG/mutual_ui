import { useState } from "react";
import { Eye } from "lucide-react";
import {
  chaveCelula,
  GrelhaEditavel,
  type AlteracaoCelula,
  type ColunaGrelha,
  type ErroCelula,
  type LinhaGrelha,
} from "../src/index.ts";

const COLUNAS: ColunaGrelha[] = [
  { chave: "nota", rotulo: "Nota", tipo: "numero", min: 0, max: 10, casas: 1, obrigatoria: true, largura: "5rem" },
  { chave: "aprovado", rotulo: "Aprovado", tipo: "simNao", obrigatoria: true },
  {
    chave: "resultado",
    rotulo: "Resultado",
    tipo: "escolha",
    opcoes: [
      { valor: "aprovado", rotulo: "Aprovado" },
      { valor: "reprovado", rotulo: "Reprovado" },
      { valor: "ausente", rotulo: "Ausente" },
    ],
  },
  { chave: "conclusao", rotulo: "Data de conclusão", tipo: "data" },
  { chave: "obs", rotulo: "Observações", tipo: "texto" },
  { chave: "turma", rotulo: "Turma", tipo: "texto", apenasLeitura: true },
];

const NOMES = ["Ana Ferreira", "Bruno Carvalho Nogueira da Silva", "Catarina Lopes", "Diogo Martins", "Eva Rocha"];

function inicial(): LinhaGrelha[] {
  return NOMES.map((nome, i) => ({
    id: `f${i + 1}`,
    nome,
    valores: { nota: i === 0 ? 8.5 : null, aprovado: i === 0 ? true : null, turma: "Turma A" },
  }));
}

/** Controlled use: the page keeps rows, dirty cells and errors; saving is the page's own button. */
export function PaginaGrelha({ vazia = false }: { vazia?: boolean }) {
  const [linhas, setLinhas] = useState<LinhaGrelha[]>(vazia ? [] : inicial());
  const [erros, setErros] = useState<Record<string, string>>(
    vazia ? {} : { [chaveCelula("f3", "nota")]: "A nota tem de estar entre 0 e 10" },
  );
  const [alteradas, setAlteradas] = useState<Set<string>>(new Set());
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());

  function aoAlterar(alteracoes: AlteracaoCelula[], novos: ErroCelula[]) {
    const e = { ...erros };
    const a = new Set(alteradas);
    for (const x of alteracoes) {
      const k = chaveCelula(x.linhaId, x.chave);
      delete e[k];
      a.add(k);
    }
    for (const x of novos) e[chaveCelula(x.linhaId, x.chave)] = x.mensagem;
    setErros(e);
    setAlteradas(a);
    setLinhas((ls) =>
      ls.map((l) => {
        const meus = alteracoes.filter((x) => x.linhaId === l.id);
        return meus.length ? { ...l, valores: { ...l.valores, ...Object.fromEntries(meus.map((x) => [x.chave, x.valor])) } } : l;
      }),
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <p className="text-[0.9375rem] text-muted-foreground">
        Alterações por guardar: {alteradas.size}. Selecionadas: {selecionadas.size}.
      </p>
      <GrelhaEditavel
        legenda="Notas e resultados dos formandos"
        rotuloNome="Formando"
        colunas={COLUNAS}
        linhas={linhas}
        aoAlterar={aoAlterar}
        erros={erros}
        alteradas={alteradas}
        selecionadas={selecionadas}
        aoSelecionar={(ids) => setSelecionadas(new Set(ids))}
        vazio="Ainda não há formandos inscritos."
        rotuloAcoes="Ações"
        renderAcoes={(l) => (
          <button type="button" className="m-btn m-btn-outline inline-flex h-11 items-center gap-2 rounded-lg px-3" aria-label={`Ver ficha de ${l.nome}`}>
            <Eye aria-hidden size={18} /> Ficha
          </button>
        )}
      />
    </div>
  );
}
