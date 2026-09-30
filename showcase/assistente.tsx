import { useState } from "react";
import { BotaoAssistente, useContextoAssistente } from "../src/index.ts";
import { ChatFlutuante } from "../src/assistente-chat.tsx";

/**
 * The floating assistant next to the «Demonstração» widget: drag it,
 * move it with the arrows of «Mover», open the demo panel and watch it stack.
 * The answers come from a fake server (no network).
 */

const json = (data: unknown, status = 200) => new Response(JSON.stringify({ success: status < 400, data }), { status, headers: { "content-type": "application/json" } });

function sse(eventos: Array<[string, unknown]>): Response {
  const corpo = eventos.map(([e, d]) => `event: ${e}\ndata: ${JSON.stringify(d)}\n\n`).join("");
  return new Response(corpo, { headers: { "content-type": "text/event-stream" } });
}

const ID = "0192f2f0-1111-7abc-8def-0123456789ab";

async function servidorFalso(url: string, init?: RequestInit): Promise<Response> {
  await new Promise((r) => setTimeout(r, 250));
  if (url.endsWith("/estado")) {
    return json({ capacidades: ["conversar", "dados", "preencher", "pagina"], maxPergunta: 4000, limiteAtingido: null, ficheiros: { extensoes: ".pdf", maxPorPergunta: 5 }, configuracao: { estado: "pronto", mensagem: null } });
  }
  if (url.endsWith("/conversas")) {
    return json([{ id: ID, titulo: "Morada da sede", atualizadaEm: new Date().toISOString(), origem: { app: "backoffice", pagina: "Caracterização", seccao: "A. Identificação" } }]);
  }
  if (url.includes("/conversas/")) return json({ id: ID, titulo: "Morada da sede", origem: null, mensagens: [] });
  if (url.endsWith("/perguntar")) {
    const corpo = JSON.parse(String(init?.body ?? "{}")) as { texto?: string };
    return sse([
      ["conversa", { id: ID, titulo: corpo.texto ?? "Nova conversa" }],
      ["passo", { id: "ajuda", rotulo: "A procurar no centro de ajuda…", estado: "done" }],
      ["texto", { delta: "Nesta secção falta a **localidade**. Proponho o valor abaixo; reveja-o antes de aplicar." }],
      ["propostas", { propostas: [{ caminho: "localidade", rotulo: "Localidade", valor: "Braga", origem: "Conversa", excerto: "A morada indica Braga.", confianca: "media", rota: location.pathname }] }],
      ["fim", { mensagemId: "0192f2f0-2222-7abc-8def-0123456789ab" }],
    ]);
  }
  return json(null, 404);
}

export function AssistenteFlutuanteDemo() {
  const [localidade, setLocalidade] = useState("");
  useContextoAssistente({
    app: "backoffice",
    pagina: "Ficha da associação",
    seccao: "Morada",
    dados: { localidade: { valor: localidade, rotulo: "Localidade", editavel: true } },
    aoAplicar: (v) => setLocalidade(String(v.localidade ?? "")),
  });
  return (
    <div className="m-surface flex flex-wrap items-center gap-4 p-4">
      <BotaoAssistente className="!text-foreground" />
      <p className="text-[0.9375rem]">
        Localidade no rascunho: <strong>{localidade || "—"}</strong>
      </p>
      <ChatFlutuante app="backoffice" fetcher={servidorFalso} />
    </div>
  );
}
