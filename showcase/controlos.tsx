import { useState } from "react";
import {
  Archive,
  Bell,
  Building2,
  Calendar,
  Copy,
  Download,
  Eye,
  FileText,
  FolderInput,
  LayoutGrid,
  List,
  Map as MapIcon,
  MoreHorizontal,
  Pencil,
  Printer,
  Share2,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import {
  Badge,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Fieldset,
  FormField,
  Input,
  Kbd,
  NativeSelect,
  Section,
  Separator,
  Spinner,
  Stepper,
  Tag,
  Textarea,
} from "../src/index.ts";
import {
  Accordion,
  Avatar,
  AvatarGroup,
  Checkbox,
  Collapsible,
  Combobox,
  ConfirmDialog,
  ContextMenu,
  Dialog,
  DialogClose,
  DropdownMenu,
  MultiSelect,
  NumberField,
  Popover,
  RadioCards,
  RadioGroup,
  ScrollArea,
  SegmentedControl,
  Select,
  Sheet,
  Slider,
  Switch,
  Tabs,
  Toaster,
  Tooltip,
  TooltipProvider,
  toast,
  type Option,
} from "../src/controlos.ts";
import { DatePicker, DateRangePicker } from "../src/datas.tsx";

const DISTRITOS: Option[] = [
  "Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra", "Évora", "Faro", "Guarda", "Leiria", "Lisboa",
  "Portalegre", "Porto", "Santarém", "Setúbal", "Viana do Castelo", "Vila Real", "Viseu", "Região Autónoma dos Açores", "Região Autónoma da Madeira",
].map((d) => ({ value: d.toLowerCase().replace(/\s+/g, "-"), label: d }));

const ASSOCIACOES: Option[] = [
  { value: "a1", label: "Associação Mutualista Aurora do Minho", description: "Braga · NIF 501 234 569" },
  { value: "a2", label: "Montepio Operário de Setúbal", description: "Setúbal · NIF 500 876 540" },
  { value: "a3", label: "Associação de Socorros Mútuos Ribeira Nova", description: "Lisboa · NIF 502 118 736" },
  { value: "a4", label: "Mutualidade Popular do Douro", description: "Porto · NIF 503 920 113" },
  { value: "a5", label: "Caixa de Previdência Serra da Estrela", description: "Guarda · NIF 501 002 347" },
  { value: "a6", label: "Associação Mutualista Farol do Sul", description: "Faro · NIF 504 661 280" },
];

async function pesquisar(q: string, signal: AbortSignal): Promise<Option[]> {
  await new Promise((r, rej) => {
    const t = setTimeout(r, 450);
    signal.addEventListener("abort", () => (clearTimeout(t), rej(new DOMException("abort", "AbortError"))));
  });
  const n = q.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  return ASSOCIACOES.filter((a) => a.label.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().includes(n));
}

function Grupo({ titulo, children, className }: { titulo: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={"flex min-w-0 flex-col gap-3 " + (className ?? "")}>
      <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{titulo}</p>
      {children}
    </div>
  );
}

function Campos() {
  const [nome, setNome] = useState("Associação Mutualista Aurora do Minho");
  const [obs, setObs] = useState("A direção reúne na primeira segunda-feira de cada mês. As quotas de março foram pagas em duas prestações por transferência bancária, com o comprovativo enviado por email.");
  const [distrito, setDistrito] = useState<string | null>("braga");
  const [associacao, setAssociacao] = useState<string | null>(null);
  const [etiquetas, setEtiquetas] = useState<string[]>(["porto", "braga", "viana-do-castelo"]);
  const [extra, setExtra] = useState<Option[]>([]);
  const [data, setData] = useState<string | null>("2026-10-03");
  const [periodo, setPeriodo] = useState<{ inicio: string | null; fim: string | null }>({ inicio: "2026-09-01", fim: "2026-09-26" });
  const [quantidade, setQuantidade] = useState<number | null>(12);
  const [raio, setRaio] = useState<number | readonly number[]>(25);
  return (
    <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
      <FormField label="Nome da associação" required count={{ value: nome.length, max: 80 }}>
        <Input value={nome} onChange={(e) => setNome(e.target.value)} />
      </FormField>
      <FormField label="NIF" required hint="Nove algarismos, sem espaços." error="O NIF não é válido. Confirme os algarismos.">
        <Input defaultValue="501 234 560" inputMode="numeric" />
      </FormField>
      <FormField label="Distrito" required>
        <Select options={DISTRITOS} value={distrito} onValueChange={setDistrito} name="distrito" />
      </FormField>
      <FormField label="Tipo de associado" optional>
        <NativeSelect defaultValue="efetivo">
          <option value="efetivo">Efetivo</option>
          <option value="contribuinte">Contribuinte</option>
          <option value="honorario">Honorário</option>
        </NativeSelect>
      </FormField>
      <FormField label="Associação" hint="Pesquise pelo nome, NIF ou distrito.">
        <Combobox onSearch={pesquisar} value={associacao} onValueChange={setAssociacao} placeholder="Escreva pelo menos 2 letras" />
      </FormField>
      <FormField label="Distritos abrangidos" hint="Pode escolher vários ou criar uma região.">
        <MultiSelect
          options={[...DISTRITOS, ...extra]}
          value={etiquetas}
          onValueChange={setEtiquetas}
          onCreate={(t) => {
            const o = { value: `r-${t}`, label: t };
            setExtra((x) => [...x, o]);
            return o;
          }}
        />
      </FormField>
      <FormField label="Data da assembleia geral" required>
        <DatePicker value={data} onValueChange={setData} min="2026-01-01" name="data" />
      </FormField>
      <FormField label="Período do relatório">
        <DateRangePicker value={periodo} onValueChange={setPeriodo} />
      </FormField>
      <FormField label="Número de participantes">
        <NumberField value={quantidade} onValueChange={setQuantidade} min={1} max={400} />
      </FormField>
      <div className="flex flex-col justify-end">
        <Slider label="Raio de pesquisa" value={raio} onValueChange={setRaio} min={5} max={100} step={5} format={{ style: "unit", unit: "kilometer" }} />
      </div>
      <FormField label="Observações" optional count={{ value: obs.length, max: 200 }} className="md:col-span-2">
        <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={3} />
      </FormField>
      <FormField label="Código postal" hint="Formato 0000-000." className="md:col-span-1">
        <Input placeholder="4700-000" disabled />
      </FormField>
    </div>
  );
}

function Escolhas() {
  const [vista, setVista] = useState("lista");
  const [plano, setPlano] = useState("anual");
  const [todos, setTodos] = useState<boolean[]>([true, false, true]);
  const marcados = todos.filter(Boolean).length;
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Grupo titulo="Interruptores (efeito imediato)">
        <div className="m-surface flex flex-col divide-y divide-border rounded-xl">
          <Switch className="p-4" align="end" label="Avisos por email" description="Receba um email quando uma quota ficar em atraso." defaultChecked />
          <Switch className="p-4" align="end" label="Resumo semanal" description="À segunda-feira, às 9h00." />
          <Switch className="p-4" align="end" label="Avisos por SMS" description="Disponível para contas com telemóvel confirmado." disabled />
        </div>
      </Grupo>
      <Grupo titulo="Caixas de seleção">
        <Fieldset legend="Documentos a incluir" hint="Escolha o que vai no relatório anual.">
          <Checkbox
            label="Todos os documentos"
            checked={marcados === 3}
            indeterminate={marcados > 0 && marcados < 3}
            onCheckedChange={(v) => setTodos([v, v, v])}
          />
          <div className="flex flex-col gap-3 pl-8">
            {["Relatório e contas", "Parecer do conselho fiscal", "Mapa de quotas"].map((l, i) => (
              <Checkbox key={l} label={l} checked={todos[i]} onCheckedChange={(v) => setTodos((t) => t.map((x, k) => (k === i ? v : x)))} />
            ))}
          </div>
        </Fieldset>
        <Checkbox label="Li e aceito o regulamento de inscrição" description="Obrigatório para confirmar a inscrição." required aria-invalid />
      </Grupo>
      <Grupo titulo="Opções (uma de poucas)">
        <Fieldset legend="Forma de pagamento" required>
          <RadioGroup
            defaultValue="mbway"
            options={[
              { value: "mbway", label: "MB WAY" },
              { value: "ref", label: "Referência Multibanco", description: "Válida durante 3 dias." },
              { value: "transf", label: "Transferência bancária" },
              { value: "local", label: "Pagamento no local", disabled: true, description: "Esgotado para este evento." },
            ]}
          />
        </Fieldset>
      </Grupo>
      <Grupo titulo="Vista (controlo segmentado)">
        <SegmentedControl
          label="Vista"
          value={vista}
          onValueChange={setVista}
          options={[
            { value: "lista", label: "Lista", icon: <List aria-hidden /> },
            { value: "grelha", label: "Grelha", icon: <LayoutGrid aria-hidden /> },
            { value: "mapa", label: "Mapa", icon: <MapIcon aria-hidden /> },
          ]}
        />
        <SegmentedControl label="Período" defaultValue="mes" options={[{ value: "semana", label: "Semana" }, { value: "mes", label: "Mês" }, { value: "ano", label: "Ano" }]} />
      </Grupo>
      <Grupo titulo="Cartões de opção" className="lg:col-span-2">
        <Fieldset legend="Quota" hideLegend>
          <RadioCards
            value={plano}
            onValueChange={setPlano}
            options={[
              { value: "mensal", label: "Mensal", description: "12,50 € por mês, débito direto.", icon: <Calendar aria-hidden /> },
              { value: "anual", label: "Anual", description: "135,00 € por ano. Poupa 15,00 €.", icon: <Wallet aria-hidden /> },
              { value: "familiar", label: "Familiar", description: "Até 4 pessoas do mesmo agregado.", icon: <Users aria-hidden /> },
            ]}
          />
        </Fieldset>
      </Grupo>
    </div>
  );
}

function Menus() {
  const [arquivadas, setArquivadas] = useState(false);
  const [ordem, setOrdem] = useState("recentes");
  return (
    <div className="flex flex-wrap items-start gap-8">
      <Grupo titulo="Menu de ações">
        <div className="flex flex-wrap gap-2">
          <DropdownMenu
            trigger={
              <Button variant="outline">
                <MoreHorizontal aria-hidden /> Ações
              </Button>
            }
            items={[
              { label: "Editar", icon: <Pencil aria-hidden size={18} /> },
              { label: "Duplicar", icon: <Copy aria-hidden size={18} />, description: "Cria uma cópia em rascunho." },
              {
                type: "submenu",
                label: "Mover para",
                icon: <FolderInput aria-hidden size={18} />,
                items: [{ label: "Quotas de 2026" }, { label: "Quotas de 2025" }, { type: "separator" }, { label: "Arquivo" }],
              },
              { label: "Imprimir", icon: <Printer aria-hidden size={18} />, shortcut: "Ctrl + P" },
              { type: "separator" },
              { type: "checkbox", label: "Mostrar arquivadas", checked: arquivadas, onCheckedChange: setArquivadas },
              { type: "radio", label: "Ordenar por", value: ordem, onValueChange: setOrdem, options: [{ value: "recentes", label: "Mais recentes" }, { value: "nome", label: "Nome" }, { value: "valor", label: "Valor" }] },
              { type: "separator" },
              { label: "Eliminar", icon: <Trash2 aria-hidden size={18} />, destructive: true },
            ]}
          />
          <DropdownMenu
            align="end"
            trigger={
              <Button variant="ghost" iconOnly aria-label="Mais opções">
                <MoreHorizontal aria-hidden />
              </Button>
            }
            items={[
              { label: "Partilhar", icon: <Share2 aria-hidden size={18} /> },
              { label: "Exportar", icon: <Download aria-hidden size={18} /> },
              { type: "link", label: "Ver na ajuda", href: "#ajuda", icon: <FileText aria-hidden size={18} /> },
            ]}
          />
        </div>
      </Grupo>
      <Grupo titulo="Menu de contexto">
        <ContextMenu
          className="grid h-28 w-72 place-items-center rounded-xl border-2 border-dashed border-border text-center text-[0.9375rem] text-muted-foreground"
          items={[
            { label: "Abrir ficha", icon: <Eye aria-hidden size={18} /> },
            { label: "Arquivar", icon: <Archive aria-hidden size={18} /> },
            { type: "separator" },
            { label: "Eliminar", icon: <Trash2 aria-hidden size={18} />, destructive: true },
          ]}
        >
          Clique com o botão direito aqui
        </ContextMenu>
      </Grupo>
      <Grupo titulo="Dica e painel">
        <TooltipProvider>
          <div className="flex flex-wrap items-center gap-2">
            <Tooltip content="Copiar ligação">
              <Button variant="outline" iconOnly aria-label="Copiar ligação">
                <Copy aria-hidden />
              </Button>
            </Tooltip>
            <Tooltip content="Avisos">
              <Button variant="outline" iconOnly aria-label="Avisos">
                <Bell aria-hidden />
              </Button>
            </Tooltip>
            <Popover
              trigger={<Button variant="outline">Filtros</Button>}
              title="Filtrar associações"
              description="Os filtros aplicam-se à lista e aos totais."
              showClose
            >
              <div className="flex flex-col gap-3">
                <Checkbox label="Só com quotas em atraso" />
                <Checkbox label="Só associações ativas" defaultChecked />
                <div className="flex justify-end gap-2 pt-1">
                  <Button size="sm" variant="ghost">
                    Limpar
                  </Button>
                  <Button size="sm">Aplicar</Button>
                </div>
              </div>
            </Popover>
          </div>
        </TooltipProvider>
      </Grupo>
    </div>
  );
}

function Divulgacao() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Grupo titulo="Acordeão (um de cada vez)">
        <Accordion
          defaultValue={["prazos"]}
          items={[
            { value: "prazos", title: "Qual é o prazo para pagar as quotas?", content: "As quotas do ano pagam-se até 31 de março. Depois dessa data ficam em atraso e a associação recebe um aviso.", meta: "Quotas" },
            { value: "recibos", title: "Onde encontro os recibos?", content: "Em Quotas, abra o pagamento e escolha «Descarregar recibo». Os recibos ficam disponíveis durante 10 anos." },
            { value: "direcao", title: "Como altero os membros da direção?", content: "Em Associação, Órgãos sociais, escolha «Alterar composição» e anexe a ata da eleição." },
          ]}
        />
      </Grupo>
      <Grupo titulo="Acordeão (vários) dentro de um cartão">
        <Card>
          <CardContent>
            <Accordion
              multiple
              variant="plain"
              defaultValue={["a", "b"]}
              items={[
                { value: "a", title: "Dados da associação", content: "NIF 501 234 569 · Sede em Braga · 4820 associados." },
                { value: "b", title: "Contactos", content: "geral@auroradominho.pt · 253 000 000" },
                { value: "c", title: "Órgãos sociais", content: "Mandato 2025–2028.", disabled: true },
              ]}
            />
          </CardContent>
        </Card>
        <Collapsible label="Mostrar detalhes do cálculo" openLabel="Esconder detalhes do cálculo" defaultOpen>
          <p className="text-[0.9375rem] text-muted-foreground">Quota base de 120,00 € + 15,00 € de fundo de solidariedade. Desconto de 10% para pagamento anual.</p>
        </Collapsible>
      </Grupo>
      <Grupo titulo="Separadores (linha, sob o cabeçalho da página)" className="lg:col-span-2">
        <Tabs
          label="Secções do evento"
          defaultValue="inscricoes"
          tabs={[
            { value: "resumo", label: "Resumo", content: <p className="text-muted-foreground">Congresso Nacional do Mutualismo 2026 · Coimbra.</p> },
            { value: "inscricoes", label: "Inscrições", count: 372, content: <p className="text-muted-foreground">372 inscrições, 28 em lista de espera.</p> },
            { value: "pagamentos", label: "Pagamentos", count: 18, content: <p className="text-muted-foreground">18 pagamentos por confirmar.</p> },
            { value: "definicoes", label: "Definições", content: null, disabled: true },
          ]}
        />
      </Grupo>
      <Grupo titulo="Separadores (pílula, dentro de um cartão)">
        <Card>
          <CardContent>
            <Tabs
              variant="pill"
              label="Período"
              tabs={[
                { value: "mes", label: "Este mês", content: <p className="text-muted-foreground">24 560,00 € recebidos.</p> },
                { value: "ano", label: "Este ano", content: <p className="text-muted-foreground">189 400,00 € recebidos.</p> },
                { value: "sempre", label: "Sempre", content: <p className="text-muted-foreground">1,2 milhões de euros.</p> },
              ]}
            />
          </CardContent>
        </Card>
      </Grupo>
    </div>
  );
}

function Sobreposicoes() {
  const [dialogo, setDialogo] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [escrever, setEscrever] = useState(false);
  const [pendente, setPendente] = useState(false);
  const [folha, setFolha] = useState(false);
  const [baixo, setBaixo] = useState(false);
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" onClick={() => setDialogo(true)} data-abrir="dialogo">
        Diálogo
      </Button>
      <Button variant="outline" onClick={() => setConfirmar(true)} data-abrir="confirmar">
        Confirmar eliminação
      </Button>
      <Button variant="destructive" onClick={() => setEscrever(true)} data-abrir="escrever">
        <Trash2 aria-hidden /> Eliminar zona DNS
      </Button>
      <Button variant="outline" onClick={() => setFolha(true)} data-abrir="folha">
        Painel lateral
      </Button>
      <Button variant="outline" onClick={() => setBaixo(true)} data-abrir="baixo">
        Painel inferior
      </Button>
      <Button
        variant="secondary"
        data-abrir="toast"
        onClick={() => toast.success("Alterações guardadas.", { description: "A ficha da associação foi atualizada.", action: { label: "Anular", onClick: () => toast.info("Alteração anulada.") } })}
      >
        Mostrar aviso de confirmação
      </Button>

      <Dialog
        open={dialogo}
        onOpenChange={setDialogo}
        title="Convidar pessoa"
        description="A pessoa recebe um email para criar a conta."
        dismissible={false}
        footer={
          <>
            <DialogClose />
            <Button onClick={() => setDialogo(false)}>Enviar convite</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <FormField label="Email" required>
            <Input type="email" placeholder="nome@associacao.pt" />
          </FormField>
          <FormField label="Perfil" required>
            <Select options={[{ value: "tes", label: "Tesouraria" }, { value: "dir", label: "Direção" }, { value: "sec", label: "Secretaria" }]} defaultValue="tes" />
          </FormField>
        </div>
      </Dialog>
      <ConfirmDialog
        open={confirmar}
        title="Eliminar este pagamento?"
        description="O pagamento de 135,00 € de Maria Silva deixa de contar para as quotas de 2026. Pode anular durante 10 segundos."
        confirmLabel="Eliminar"
        pending={pendente}
        onCancel={() => setConfirmar(false)}
        onConfirm={() => {
          setPendente(true);
          setTimeout(() => {
            setPendente(false);
            setConfirmar(false);
            toast.success("Pagamento eliminado.", { action: { label: "Anular", onClick: () => {} } });
          }, 900);
        }}
      />
      <ConfirmDialog
        open={escrever}
        title="Eliminar a zona auroradominho.pt?"
        description="Os 14 registos desta zona deixam de responder e o site e o email da associação deixam de funcionar. Esta ação não pode ser anulada."
        confirmLabel="Eliminar zona"
        confirmText="auroradominho.pt"
        onCancel={() => setEscrever(false)}
        onConfirm={() => setEscrever(false)}
      />
      <Sheet
        open={folha}
        onOpenChange={setFolha}
        title="Maria da Conceição Silva"
        description="Associada n.º 1234 · desde 2011"
        footer={
          <>
            <DialogClose>Fechar</DialogClose>
            <Button>Abrir ficha</Button>
          </>
        }
      >
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-base">
          <dt className="text-muted-foreground">Quota de 2026</dt>
          <dd>Paga em 12/02/2026</dd>
          <dt className="text-muted-foreground">Telefone</dt>
          <dd>912 345 678</dd>
          <dt className="text-muted-foreground">Morada</dt>
          <dd>Rua de São Vicente, 120, 4700-000 Braga</dd>
        </dl>
      </Sheet>
      <Sheet open={baixo} onOpenChange={setBaixo} side="bottom" title="Partilhar evento" description="Escolha como quer partilhar.">
        <div className="grid grid-cols-2 gap-2 pb-2 sm:grid-cols-4">
          {["Copiar ligação", "Email", "WhatsApp", "Código QR"].map((x) => (
            <Button key={x} variant="outline">
              {x}
            </Button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

function Basicos() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Grupo titulo="Botões">
        <div className="flex flex-wrap items-center gap-2">
          <Button>Guardar</Button>
          <Button variant="outline">Cancelar</Button>
          <Button variant="secondary">Exportar</Button>
          <Button variant="ghost">Limpar</Button>
          <Button variant="destructive">Eliminar</Button>
          <Button pending>A guardar</Button>
          <Button size="sm" variant="outline">
            Pequeno
          </Button>
          <Button size="lg">Inscrever-me</Button>
        </div>
      </Grupo>
      <Grupo titulo="Etiquetas, marcadores e teclas">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Rascunho</Badge>
          <Badge variant="brand">Novo</Badge>
          <Badge variant="app" icon={<Building2 />}>Backoffice</Badge>
          <Badge variant="outline">12 documentos</Badge>
          <Badge variant="solid" size="sm">
            3
          </Badge>
          <Tag onRemove={() => {}}>Braga</Tag>
          <Tag onRemove={() => {}}>Viana do Castelo</Tag>
        </div>
        <p className="text-[0.9375rem] text-muted-foreground">
          Carregue em <Kbd>Enter</Kbd> para enviar ou em <Kbd keys={["Shift", "Enter"]} /> para mudar de linha.
        </p>
      </Grupo>
      <Grupo titulo="Avatares">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name="Maria da Conceição Silva" size="lg" />
          <Avatar name="João Costa" />
          <Avatar name="Ana Rita Ferreira" size="sm" />
          <AvatarGroup people={[{ name: "Maria Silva" }, { name: "João Costa" }, { name: "Ana Ferreira" }, { name: "Rui Lopes" }, { name: "Inês Martins" }, { name: "Pedro Sousa" }]} />
        </div>
      </Grupo>
      <Grupo titulo="A carregar e separadores">
        <div className="flex flex-wrap items-center gap-6">
          <Spinner label="A carregar as associações…" />
          <Spinner />
        </div>
        <Separator label="ou" />
      </Grupo>
    </div>
  );
}

function Navegacao() {
  const [passo, setPasso] = useState(2);
  const passos = [
    { label: "Associação", description: "Dados gerais" },
    { label: "Morada" },
    { label: "Órgãos sociais" },
    { label: "Documentos" },
    { label: "Confirmar" },
  ];
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-6">
        <Grupo titulo="Localização">
          <Breadcrumbs items={[{ label: "Início", href: "#" }, { label: "Associações", href: "#" }, { label: "Aurora do Minho", href: "#" }, { label: "Quotas", href: "#" }, { label: "Pagamento de março" }]} />
        </Grupo>
        <Grupo titulo="Passos de um assistente">
          <Stepper steps={passos} current={passo} onStepClick={setPasso} />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPasso((p) => Math.max(0, p - 1))}>
              Anterior
            </Button>
            <Button onClick={() => setPasso((p) => Math.min(passos.length - 1, p + 1))}>Seguinte</Button>
          </div>
        </Grupo>
      </div>
      <div className="flex flex-col gap-6">
        <Grupo titulo="Passos (vertical)">
          <Stepper orientation="vertical" steps={[...passos.slice(0, 3), { label: "Documentos", error: true, description: "Falta a ata da eleição." }, passos[4]!]} current={4} />
        </Grupo>
        <Grupo titulo="Área com deslocamento">
          <ScrollArea className="h-44 rounded-xl border border-border" label="Últimos movimentos">
            <ul className="divide-y divide-border">
              {Array.from({ length: 14 }, (_, i) => (
                <li key={i} className="flex justify-between px-4 py-2.5 text-[0.9375rem]">
                  <span>Quota de {["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho"][i % 7]}</span>
                  <span className="tabular-nums">12,50 €</span>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </Grupo>
      </div>
    </div>
  );
}

export function PaginaControlos() {
  return (
    <>
      <Toaster />
      <Section id="c-basicos" title="Básicos" description="Botões, etiquetas, teclas, avatares e indicadores.">
        <Basicos />
      </Section>
      <Section id="c-campos" title="Campos de formulário" description="Rótulo, ajuda, erro, obrigatório e contagem de caracteres. Seleção, pesquisa, datas e números.">
        <Card>
          <CardContent className="p-5 sm:p-6">
            <Campos />
          </CardContent>
        </Card>
      </Section>
      <Section id="c-escolhas" title="Escolhas" description="Interruptores, caixas, opções, cartões de opção e controlo segmentado.">
        <Escolhas />
      </Section>
      <Section id="c-menus" title="Menus, dicas e painéis">
        <Menus />
      </Section>
      <Section id="c-divulgacao" title="Mostrar e esconder" description="Acordeão, bloco recolhível e separadores.">
        <Divulgacao />
      </Section>
      <Section id="c-sobreposicoes" title="Diálogos, painéis e avisos" description="A confirmação escrita protege ações difíceis de desfazer.">
        <Sobreposicoes />
      </Section>
      <Section id="c-navegacao" title="Localização e passos">
        <Navegacao />
      </Section>
    </>
  );
}

