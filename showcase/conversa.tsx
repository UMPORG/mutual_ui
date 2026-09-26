import { useEffect, useRef, useState } from "react";
import { BookOpen, CalendarDays, MessageSquarePlus, Receipt, Users } from "lucide-react";
import { Button, Section } from "../src/index.ts";
import {
  ActionCard,
  AttachmentChip,
  ChatEmptyState,
  ChatLayout,
  ChatMessage,
  Composer,
  ConversationTitle,
  MessageList,
  SuggestionChips,
  ThreadList,
  type ActionStatus,
  type ChatMessageData,
  type ChatThread,
} from "../src/conversa.ts";
import { PontosFundo } from "../src/efeitos.ts";
import { Paperclip } from "lucide-react";

const agora = Date.now();
const h = (horas: number) => new Date(agora - horas * 3600_000).toISOString();

const CONVERSAS: ChatThread[] = [
  { id: "t1", title: "Quotas em atraso de março", updatedAt: h(0.2) },
  { id: "t2", title: "Como emitir a segunda via de um recibo", updatedAt: h(3) },
  { id: "t3", title: "Inscrições no congresso", updatedAt: h(26) },
  { id: "t4", title: "Prazo do relatório e contas", updatedAt: h(24 * 4) },
  { id: "t5", title: "Alterar os órgãos sociais", updatedAt: h(24 * 12) },
  { id: "t6", title: "Exportar a lista de associados", updatedAt: h(24 * 60) },
];

const RESPOSTA = `Em março ficaram **3 quotas em atraso** na Associação Mutualista Aurora do Minho [1]:

| Associado | N.º | Valor | Em atraso desde |
| :-- | --: | --: | :-- |
| Maria da Conceição Silva | 1234 | 12,50 € | 01/03/2026 |
| João Pedro Costa | 2087 | 12,50 € | 01/03/2026 |
| Ana Rita Ferreira | 3312 | 25,00 € | 01/02/2026 |

O prazo para regularizar sem juros termina a **31 de março** [2]. Pode:

1. Enviar um aviso por email a cada associado;
2. Registar um pagamento recebido em numerário;
3. Exportar a lista para a reunião da direção.

Quer que prepare o aviso para os três?`;

const INICIAIS: ChatMessageData[] = [
  { id: "s0", role: "system", content: "Conversa sobre a Associação Mutualista Aurora do Minho" },
  { id: "m1", role: "user", content: "Que quotas ficaram em atraso em março?", createdAt: h(0.25) },
  {
    id: "m2",
    role: "assistant",
    content: RESPOSTA,
    createdAt: h(0.24),
    status: "done",
    feedback: "util",
    sources: [
      { id: "f1", n: 1, title: "Quotas de março de 2026", href: "#simplex/quotas", kind: "registo", app: "simplex" },
      { id: "f2", n: 2, title: "Prazos de pagamento das quotas", href: "#ajuda/quotas/prazos", kind: "ajuda", excerpt: "As quotas do ano pagam-se até 31 de março." },
    ],
  },
  { id: "m3", role: "user", content: "Sim, prepare o aviso.\nMas não envie à Ana, ela já pagou ontem.", createdAt: h(0.22) },
  {
    id: "m4",
    role: "assistant",
    content: "Preparei o aviso para a Maria e o João. Confirme antes de o enviar:",
    createdAt: h(0.21),
    status: "done",
  },
  { id: "m5", role: "error", content: "Não foi possível consultar os pagamentos de ontem. A ligação ao Simplex falhou." },
];

export function PaginaConversa() {
  const [mensagens, setMensagens] = useState<ChatMessageData[]>(INICIAIS);
  const [ativa, setAtiva] = useState("t1");
  const [titulo, setTitulo] = useState("Quotas em atraso de março");
  const [conversas, setConversas] = useState(CONVERSAS);
  const [acao, setAcao] = useState<ActionStatus>("proposta");
  const [pensar, setPensar] = useState<{ label: string; steps: Array<{ label: string; status: "done" | "active" | "pending" }> } | undefined>();
  const temporizador = useRef<ReturnType<typeof setInterval>>(undefined);
  const aEscrever = mensagens.some((m) => m.status === "streaming");
  const vazia = new URLSearchParams(location.search).get("vazia") === "1";

  useEffect(() => () => clearInterval(temporizador.current), []);

  const responder = (pergunta: string) => {
    const id = `r${Date.now()}`;
    setMensagens((m) => [...m, { id: `u${Date.now()}`, role: "user", content: pergunta, createdAt: new Date().toISOString() }, { id, role: "assistant", content: "", status: "streaming" }]);
    setPensar({ label: "A consultar os seus dados", steps: [{ label: "A procurar na ajuda", status: "done" }, { label: "A consultar as quotas no Simplex", status: "active" }, { label: "A preparar a resposta", status: "pending" }] });
    const texto = "O recibo de uma quota paga pode ser emitido de novo a qualquer momento [1]. Em **Quotas**, abra o pagamento e escolha «Emitir segunda via». O recibo sai com a mesma numeração e a indicação *segunda via*.";
    let i = 0;
    setTimeout(() => {
      temporizador.current = setInterval(() => {
        i += 4;
        setMensagens((m) =>
          m.map((x) =>
            x.id === id
              ? { ...x, content: texto.slice(0, i), status: i >= texto.length ? "done" : "streaming", createdAt: new Date().toISOString(), sources: i >= texto.length ? [{ id: "a", n: 1, title: "Segunda via de recibos", href: "#ajuda/recibos", kind: "ajuda" }] : undefined }
              : x,
          ),
        );
        if (i >= texto.length) clearInterval(temporizador.current);
      }, 45);
    }, 1400);
  };

  const parar = () => {
    clearInterval(temporizador.current);
    setMensagens((m) => m.map((x) => (x.status === "streaming" ? { ...x, status: "stopped" } : x)));
  };

  const threads = (
    <ThreadList
      threads={conversas}
      activeId={ativa}
      onSelect={(t) => {
        setAtiva(t.id);
        setTitulo(t.title);
      }}
      onNew={() => {}}
      onRename={(t, novo) => setConversas((c) => c.map((x) => (x.id === t.id ? { ...x, title: novo } : x)))}
      onDelete={(t) => setConversas((c) => c.filter((x) => x.id !== t.id))}
    />
  );

  return (
    <>
      <Section id="v-conversa" title="Assistente — conversa" description="Lista de conversas, mensagens com fontes, ação proposta, erro, resposta a ser escrita e caixa de mensagem.">
        <div className="m-surface overflow-hidden rounded-2xl">
          <ChatLayout
            className="h-[52rem] max-h-[calc(100dvh-6rem)] min-h-[36rem]"
            threads={threads}
            header={
              <>
                <ConversationTitle title={titulo} onRename={setTitulo} level={2} />
                <Button variant="outline" size="sm" className="shrink-0">
                  <MessageSquarePlus aria-hidden /> <span className="max-sm:sr-only">Nova conversa</span>
                </Button>
              </>
            }
            composer={
              <Composer
                onSubmit={responder}
                onStop={parar}
                streaming={aEscrever}
                maxLength={2000}
                attachments={<AttachmentChip name="extrato-marco-2026.pdf" size={248_000} onRemove={() => {}} />}
                actions={
                  <Button variant="ghost" size="sm" iconOnly aria-label="Anexar ficheiro">
                    <Paperclip aria-hidden />
                  </Button>
                }
              />
            }
          >
            <MessageList
              messages={vazia ? [] : mensagens}
              thinking={pensar}
              onRetry={() => setMensagens((m) => m.filter((x) => x.role !== "error"))}
              onRegenerate={() => {}}
              onFeedback={(m, v) => setMensagens((ms) => ms.map((x) => (x.id === m.id ? { ...x, feedback: v } : x)))}
              onFeedbackComment={() => {}}
              empty={
                <ChatEmptyState
                  description="Pergunte sobre as quotas, os eventos ou a forma de usar as aplicações. As respostas usam a ajuda e os dados a que tem acesso."
                  backdrop={<PontosFundo mascara={{ x: "50%", y: "60%", largura: "22rem", altura: "12rem" }} />}
                  onSelect={responder}
                  prompts={[
                    { title: "Que quotas estão em atraso?", icon: <Receipt aria-hidden />, description: "Lista por associado, com valores." },
                    { title: "Como emito a segunda via de um recibo?", icon: <BookOpen aria-hidden /> },
                    { title: "Quantas inscrições tem o congresso?", icon: <CalendarDays aria-hidden /> },
                    { title: "Quem pertence à direção?", icon: <Users aria-hidden /> },
                  ]}
                />
              }
              renderMessage={(m) =>
                m.id === "m4" ? (
                  <ChatMessage message={m}>
                    <ActionCard
                      app="simplex"
                      status={acao}
                      title="Enviar aviso de quota em atraso"
                      description="Um email para cada associado, com o valor e a referência Multibanco."
                      details={[
                        { term: "Para", details: "Maria da Conceição Silva, João Pedro Costa" },
                        { term: "Quota", details: "março de 2026 · 12,50 €" },
                        { term: "Enviado por", details: "Tesouraria da Aurora do Minho" },
                      ]}
                      onApply={() => {
                        setAcao("a-aplicar");
                        setTimeout(() => setAcao("aplicada"), 1100);
                      }}
                      onCancel={() => setAcao("cancelada")}
                      result={<p className="text-muted-foreground">2 emails enviados às 14:32. <a href="#simplex/avisos" className="font-medium text-brand underline underline-offset-4">Ver avisos enviados</a></p>}
                    />
                  </ChatMessage>
                ) : (
                  <ChatMessage
                    message={m}
                    thinking={pensar}
                    onRetry={() => setMensagens((ms) => ms.filter((x) => x.id !== m.id))}
                    onRegenerate={m.role === "assistant" ? () => {} : undefined}
                    onFeedback={m.role === "assistant" ? (v) => setMensagens((ms) => ms.map((x) => (x.id === m.id ? { ...x, feedback: v } : x))) : undefined}
                    onFeedbackComment={() => {}}
                  />
                )
              }
              footer={
                !vazia && !aEscrever ? (
                  <SuggestionChips suggestions={["Como emito a segunda via de um recibo?", "Exportar a lista para Excel", "Quem pagou ontem?"]} onSelect={responder} className="pl-11" />
                ) : null
              }
            />
          </ChatLayout>
        </div>
      </Section>
    </>
  );
}
