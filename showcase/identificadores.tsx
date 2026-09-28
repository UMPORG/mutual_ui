import { useState, type FormEvent } from "react";
import {
  Button,
  CampoCodigoPostal,
  CampoIban,
  CampoNif,
  CampoTelefone,
  Card,
  CardContent,
  CardHeader,
  DemoPreencher,
  DescriptionList,
  FormField,
  Input,
  Section,
  StatusCallout,
  Telefone,
  formatarCodigoPostal,
  formatarIban,
  formatarNif,
  formatarTelefone,
  validarCodigoPostal,
  validarIban,
  validarNif,
  validarTelefone,
  type CatalogoDemo,
} from "../src/index.ts";

/** v0.8.9 — phone numbers, NIF, código postal and IBAN: display, inputs and validation. */

const CENARIOS: CatalogoDemo = {
  "ficha-contactos": {
    titulo: "Contactos da associação",
    cenarios: [
      {
        id: "valida",
        nome: "Dados válidos",
        descricao: "Números com e sem indicativo.",
        campos: { nome: "Associação de Socorros Mútuos de Braga", telefone: "253 000 111", telemovel: "+351912345678", nif: "501234560", codigoPostal: "4700328", iban: "PT50000201231234567890154" },
      },
      {
        id: "erros",
        nome: "Com erros",
        descricao: "Telemóvel curto, NIF e IBAN errados.",
        campos: { nome: "Associação Mutualista do Porto", telefone: "22208417", telemovel: "951234567", nif: "123456788", codigoPostal: "400", iban: "PT50000201231234567890155" },
        submeter: true,
      },
    ],
  },
};

type Campos = "telefone" | "telemovel" | "nif" | "codigoPostal" | "iban";
const VAZIO: Record<Campos, string> = { telefone: "", telemovel: "", nif: "", codigoPostal: "", iban: "" };

function Formulario() {
  const [valores, setValores] = useState<Record<Campos, string>>(VAZIO);
  const [erros, setErros] = useState<Partial<Record<Campos, string>>>({});
  const [guardado, setGuardado] = useState<Record<string, string> | null>(null);
  const mudar = (c: Campos) => (v: string) => {
    setValores((a) => ({ ...a, [c]: v }));
    if (erros[c]) setErros((e) => ({ ...e, [c]: undefined }));
  };
  const verificar = (c: Campos, v: string): string | undefined => {
    const opcional = c === "telefone" || c === "iban";
    if (opcional && !v) return undefined;
    const r =
      c === "telefone" ? validarTelefone(v)
      : c === "telemovel" ? validarTelefone(v, { tipo: "movel" })
      : c === "nif" ? validarNif(v, { tipo: "coletiva" })
      : c === "codigoPostal" ? validarCodigoPostal(v)
      : validarIban(v, { pais: "PT" });
    return r.valido ? undefined : r.erro;
  };
  const sair = (c: Campos) => () => valores[c] && setErros((e) => ({ ...e, [c]: verificar(c, valores[c]) }));
  const submeter = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const novos = Object.fromEntries((Object.keys(VAZIO) as Campos[]).map((c) => [c, verificar(c, valores[c])]));
    setErros(novos);
    if (Object.values(novos).some(Boolean)) return setGuardado(null);
    setGuardado(Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>);
  };
  return (
    <form data-demo-form="ficha-contactos" noValidate onSubmit={submeter} className="m-surface flex flex-col gap-5 p-6">
      <FormField label="Nome da associação">
        <Input name="nome" />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Telefone" optional error={erros.telefone}>
          <CampoTelefone name="telefone" value={valores.telefone} onValueChange={mudar("telefone")} onBlur={sair("telefone")} />
        </FormField>
        <FormField label="Telemóvel" required error={erros.telemovel}>
          <CampoTelefone name="telemovel" autoComplete="tel" value={valores.telemovel} onValueChange={mudar("telemovel")} onBlur={sair("telemovel")} />
        </FormField>
        <FormField label="NIPC" required hint="O número de identificação da associação." error={erros.nif}>
          <CampoNif name="nif" value={valores.nif} onValueChange={mudar("nif")} onBlur={sair("nif")} />
        </FormField>
        <FormField label="Código postal" required error={erros.codigoPostal}>
          <CampoCodigoPostal name="codigoPostal" value={valores.codigoPostal} onValueChange={mudar("codigoPostal")} onBlur={sair("codigoPostal")} />
        </FormField>
      </div>
      <FormField label="IBAN para reembolsos" optional error={erros.iban}>
        <CampoIban name="iban" value={valores.iban} onValueChange={mudar("iban")} onBlur={sair("iban")} />
      </FormField>
      <div className="flex flex-wrap gap-3">
        <Button type="submit">Guardar</Button>
        <Button variant="outline" onClick={() => { setValores(VAZIO); setErros({}); setGuardado(null); }}>
          Limpar
        </Button>
      </div>
      {guardado && (
        <StatusCallout tone="success" title="O que o formulário envia (normalizado)">
          <pre data-testid="enviado" className="mt-1 text-sm whitespace-pre-wrap">{JSON.stringify(guardado, null, 2)}</pre>
        </StatusCallout>
      )}
    </form>
  );
}

export function PaginaIdentificadores() {
  return (
    <div className="flex flex-col gap-10">
      <DemoPreencher ativo cenarios={CENARIOS} />
      <Section id="s-mostrar" title="Mostrar" description="Guardados normalizados, mostrados como se leem.">
        <Card>
          <CardHeader title="Associação de Socorros Mútuos de Braga" level={3} divider />
          <CardContent>
            <DescriptionList
              columns={2}
              items={[
                { term: "Telefone", details: <Telefone numero="+351253000111" icone copiar /> },
                { term: "Telemóvel", details: <Telefone numero="+351912345678" icone /> },
                { term: "Delegação em Genebra", details: <Telefone numero="+41223456789" /> },
                { term: "Com indicativo", details: <Telefone numero="+351222084177" indicativo /> },
                { term: "Texto livre (sem ligação)", details: <Telefone numero="Ext. 21 da sede" /> },
                { term: "Sem número", details: <Telefone numero={null} vazio="Sem telefone" /> },
                { term: "NIPC", details: formatarNif("501234560") },
                { term: "Código postal", details: formatarCodigoPostal("4700328") },
                { term: "IBAN", details: <span className="tabular-nums">{formatarIban("PT50000201231234567890154")}</span>, wide: true },
              ]}
            />
            <p className="mt-4 text-sm [overflow-wrap:anywhere] text-muted-foreground">
              formatarTelefone("+351222084177") → «{formatarTelefone("+351222084177")}» · com indicativo → «
              {formatarTelefone("+351912345678", { indicativo: true })}»
            </p>
          </CardContent>
        </Card>
      </Section>
      <Section id="s-campos" title="Campos" description="Máscara ao escrever; o valor guardado é normalizado. Cole «+44 20 7946 0958» no telefone.">
        <Formulario />
      </Section>
    </div>
  );
}
