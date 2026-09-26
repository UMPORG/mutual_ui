import { useState } from "react";
import { ArrowRight, CalendarDays, Download, FileCheck2, MapPin, Search, SearchX, Sparkles } from "lucide-react";
import { Badge, Button, Card, CardContent, CardFooter, CardHeader, EmptyState, MutualWordmark, Section } from "../src/index.ts";
import { BrilhoDestaque, ConstelacaoFundo, MalhaFundo, MomentoSucesso, PontosFundo, TopografiaFundo } from "../src/efeitos.ts";

function Rotulo({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">{children}</p>;
}

export function PaginaEfeitos() {
  const [celebrar, setCelebrar] = useState(0);
  return (
    <>
      <Section id="e-constelacao" title="Constelação — a rede de associações" description="Portal e páginas públicas sobre a rede. O mapa fica de um lado, o texto do outro.">
        <div className="relative isolate min-h-[26rem] overflow-hidden rounded-2xl border border-border m-canvas">
          <ConstelacaoFundo posicao="direita" />
          <div className="relative flex max-w-xl flex-col gap-4 p-6 sm:p-10">
            <MutualWordmark app="portal" />
            <h3 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">312 associações mutualistas, de Viana a Faro</h3>
            <p className="text-lg text-muted-foreground">Todas as aplicações num só lugar.</p>
            <div className="flex flex-wrap gap-2">
              <Button size="lg">
                Entrar <ArrowRight aria-hidden />
              </Button>
              <Button size="lg" variant="outline">
                Conhecer a rede
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <Section id="e-topografia" title="Topografia — ajuda e capas públicas" description="Linhas de nível que derivam devagar, na cor da aplicação.">
        <div data-app="eventos" className="relative isolate overflow-hidden rounded-2xl border border-border bg-card">
          <TopografiaFundo mascara={{ x: "50%", y: "55%", largura: "40rem", altura: "15rem" }} />
          <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 py-16 text-center">
            <Badge variant="app">Centro de ajuda</Badge>
            <h3 className="text-3xl font-bold tracking-tight text-balance">Como podemos ajudar?</h3>
            <label className="m-field flex h-12 w-full max-w-lg items-center gap-2 rounded-xl px-4">
              <Search aria-hidden size={20} className="text-muted-foreground" />
              <span className="sr-only">Pesquisar na ajuda</span>
              <input placeholder="Pesquise, por exemplo, «recibo de quota»" className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground" />
            </label>
          </div>
        </div>
      </Section>

      <Section id="e-malha" title="Malha — heróis públicos" description="Cor suave com grão, só CSS. Texto grande por cima, uma ação.">
        <div className="grid gap-4 lg:grid-cols-2">
          <div data-app="eventos" className="relative isolate min-h-72 overflow-hidden rounded-2xl border border-border bg-card">
            <MalhaFundo tons="app" />
            <div className="relative flex h-full flex-col justify-end gap-3 p-6 sm:p-8">
              <div>
                <Badge variant="outline" icon={<CalendarDays />}>
                  17 e 18 de outubro · Coimbra
                </Badge>
              </div>
              <h3 className="text-3xl font-bold tracking-tight text-balance">Congresso Nacional do Mutualismo 2026</h3>
              <div>
                <Button size="lg">Inscrever-me</Button>
              </div>
            </div>
          </div>
          <div className="relative isolate min-h-72 overflow-hidden rounded-2xl border border-border bg-card">
            <MalhaFundo tons="bandeira" />
            <div className="relative flex h-full flex-col justify-end gap-3 p-6 sm:p-8">
              <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Tons «bandeira» e «marca»</p>
              <h3 className="text-3xl font-bold tracking-tight text-balance">Dia Nacional do Mutualismo</h3>
              <p className="text-base text-muted-foreground">25 de outubro, em todas as associações.</p>
            </div>
          </div>
        </div>
      </Section>

      <Section id="e-pontos" title="Pontos — estados vazios e pesquisa" description="Uma grelha parada que responde ao ponteiro. Sem animação quando ninguém mexe.">
        <div className="relative isolate overflow-hidden rounded-2xl border border-dashed border-border bg-card">
          <PontosFundo mascara={{ x: "50%", y: "50%", largura: "30rem", altura: "16rem" }} />
          <EmptyState icon={<SearchX />} title="Nenhum resultado para «Aurora do Mino»" variant="inline" className="relative py-16" action={<Button variant="outline">Limpar pesquisa</Button>}>
            Confirme a ortografia ou pesquise pelo NIF.
          </EmptyState>
        </div>
      </Section>

      <Section id="e-brilho" title="Brilho — um cartão em destaque por página" description="Uma luz lenta à volta do cartão recomendado.">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { t: "Mensal", p: "12,50 €", d: "por mês, débito direto" },
            { t: "Anual", p: "135,00 €", d: "por ano · poupa 15,00 €", destaque: true },
            { t: "Familiar", p: "210,00 €", d: "por ano, até 4 pessoas" },
          ].map((x) =>
            x.destaque ? (
              <BrilhoDestaque key={x.t} className="shadow-lg">
                <div className="flex flex-col gap-3 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{x.t}</h3>
                    <Badge variant="brand" icon={<Sparkles />}>
                      Recomendado
                    </Badge>
                  </div>
                  <p className="text-3xl font-bold tabular-nums">{x.p}</p>
                  <p className="text-muted-foreground">{x.d}</p>
                  <Button>Escolher</Button>
                </div>
              </BrilhoDestaque>
            ) : (
              <Card key={x.t}>
                <CardHeader title={x.t} level={3} />
                <CardContent className="flex flex-col gap-3">
                  <p className="text-3xl font-bold tabular-nums">{x.p}</p>
                  <p className="text-muted-foreground">{x.d}</p>
                  <Button variant="outline">Escolher</Button>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      </Section>

      <Section id="e-sucesso" title="Celebração — momentos de conclusão" description="Uma só vez, no fim de uma tarefa. Nada acontece com «Reduzir movimento».">
        <Card>
          <MomentoSucesso
            key={celebrar}
            headingLevel={2}
            title="Documento submetido"
            actions={
              <>
                <Button variant="outline">
                  <Download aria-hidden /> Descarregar comprovativo
                </Button>
                <Button>Voltar aos documentos</Button>
              </>
            }
          >
            O relatório e contas de 2025 foi entregue à UMP em 26/09/2026, às 14:32. Receberá a confirmação por email.
          </MomentoSucesso>
          <CardFooter className="justify-center">
            <Button variant="ghost" size="sm" onClick={() => setCelebrar((n) => n + 1)} data-repetir>
              <FileCheck2 aria-hidden /> Repetir
            </Button>
          </CardFooter>
        </Card>
      </Section>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin aria-hidden size={16} /> O fundo ASCII da bandeira continua reservado aos ecrãs de entrada (login, Portal, /sem-acesso).
      </p>
    </>
  );
}
