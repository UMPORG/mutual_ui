import { useState, type FormEvent } from "react";
import { Button, DemoPreencher, FormField, Input, NativeSelect, Textarea, type CatalogoDemo } from "../src/index.ts";
import { Dialog, DialogClose, Sheet } from "../src/controlos.ts";

/** v0.8.7 — demonstration mode: a long form, a decision dialog and a sheet. */

const CENARIOS: CatalogoDemo = {
  "ficha-associacao": {
    titulo: "Ficha da associação",
    cenarios: [
      {
        id: "valida",
        nome: "Dados válidos",
        descricao: "Associação de Socorros Mútuos de Braga.",
        campos: {
          nome: "Associação de Socorros Mútuos de Braga",
          nif: "501234560",
          email: "geral@asm-braga.pt",
          telefone: "253 000 111",
          morada: "Rua do Souto, 42",
          codigoPostal: "4700-328",
          localidade: "Braga",
          distrito: "Braga",
          associados: 1840,
          observacoes: "Sede renovada em 2025.",
        },
      },
      { id: "erro", nome: "Com erros", descricao: "Código postal inválido.", campos: { nome: "", codigoPostal: "4700" }, submeter: true },
    ],
  },
  "decisao-pedido": {
    titulo: "Recusar pedido",
    cenarios: [
      { id: "motivo", nome: "Motivo claro", campos: { motivo: "Faltam os estatutos aprovados em assembleia geral." } },
      { id: "vazio", nome: "Sem motivo", descricao: "Mostra o erro do campo.", campos: { motivo: "" }, submeter: true },
    ],
  },
  "nota-painel": {
    titulo: "Nota interna",
    cenarios: [{ id: "nota", nome: "Nota de exemplo", campos: { nota: "Telefonar à tesouraria na segunda-feira." } }],
  },
};

function FormularioLongo() {
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const submeter = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const cp = String(d.get("codigoPostal") ?? "");
    setEnviado(false);
    if (!/^\d{4}-\d{3}$/.test(cp)) return setErro("Use o formato 1234-567.");
    setErro(null);
    setEnviado(true);
  };
  return (
    <form data-demo-form="ficha-associacao" onSubmit={submeter} className="m-surface flex flex-col gap-5 p-6" noValidate>
      <FormField label="Nome da associação">
        <Input name="nome" />
      </FormField>
      <FormField label="NIF">
        <Input name="nif" inputMode="numeric" />
      </FormField>
      <FormField label="Email">
        <Input name="email" type="email" />
      </FormField>
      <FormField label="Telefone">
        <Input name="telefone" type="tel" />
      </FormField>
      <FormField label="Morada">
        <Input name="morada" />
      </FormField>
      <FormField label="Código postal" error={erro ?? undefined}>
        <Input name="codigoPostal" />
      </FormField>
      <FormField label="Localidade">
        <Input name="localidade" />
      </FormField>
      <FormField label="Distrito">
        <NativeSelect name="distrito" defaultValue="">
          <option value="">Escolha…</option>
          <option>Braga</option>
          <option>Lisboa</option>
          <option>Porto</option>
        </NativeSelect>
      </FormField>
      <FormField label="Número de associados">
        <Input name="associados" type="number" />
      </FormField>
      <FormField label="Observações">
        <Textarea name="observacoes" rows={4} />
      </FormField>
      {enviado && <p role="status" data-teste="enviado">Ficha guardada.</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" type="button">
          Cancelar
        </Button>
        <Button type="submit" data-teste="guardar">
          Guardar ficha
        </Button>
      </div>
    </form>
  );
}

function Decisao() {
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [recusado, setRecusado] = useState<string | null>(null);
  const submeter = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const motivo = String(new FormData(e.currentTarget).get("motivo") ?? "").trim();
    if (!motivo) return setErro("Indique o motivo.");
    setErro(null);
    setRecusado(motivo);
    setAberto(false);
  };
  return (
    <div className="flex flex-col gap-2">
      <div>
        <Button variant="outline" onClick={() => setAberto(true)} data-abrir="decisao">
          Recusar pedido
        </Button>
      </div>
      {recusado && <p data-teste="recusado">Pedido recusado: {recusado}</p>}
      <Dialog
        open={aberto}
        onOpenChange={setAberto}
        title="Recusar o pedido de adesão?"
        description="A associação recebe o motivo por email."
        dismissible={false}
        footer={
          <>
            <DialogClose />
            <Button type="submit" form="form-decisao" variant="destructive">
              Recusar
            </Button>
          </>
        }
      >
        <form id="form-decisao" data-demo-form="decisao-pedido" onSubmit={submeter} noValidate>
          <FormField label="Motivo" error={erro ?? undefined}>
            <Textarea name="motivo" rows={3} />
          </FormField>
        </form>
      </Dialog>
    </div>
  );
}

function Painel() {
  const [aberto, setAberto] = useState(false);
  return (
    <div>
      <Button variant="outline" onClick={() => setAberto(true)} data-abrir="painel-demo">
        Nota interna
      </Button>
      <Sheet
        open={aberto}
        onOpenChange={setAberto}
        title="Nota interna"
        footer={
          <>
            <DialogClose />
            <Button type="submit" form="form-nota">
              Guardar nota
            </Button>
          </>
        }
      >
        <form id="form-nota" data-demo-form="nota-painel" onSubmit={(e) => (e.preventDefault(), setAberto(false))}>
          <FormField label="Nota">
            <Textarea name="nota" rows={4} />
          </FormField>
        </form>
      </Sheet>
    </div>
  );
}

export function PaginaDemo() {
  return (
    <div className="m-demo-reserva flex flex-col gap-8">
      <div className="flex flex-wrap gap-6">
        <Decisao />
        <Painel />
      </div>
      <FormularioLongo />
      <DemoPreencher ativo cenarios={CENARIOS} />
    </div>
  );
}
