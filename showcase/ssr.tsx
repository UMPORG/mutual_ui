// Server-rendered fixture for verificar.mjs: the same tree is rendered to
// HTML by serve.ts (/ssr) and hydrated by ssr-cliente.tsx, so the checks see
// what an app's first paint (no JavaScript yet) and its hydrated page expose.
import { useState } from "react";
import { Checkbox, RadioGroup, Switch } from "../src/controlos";

export function CaixasSsr() {
  const [aceito, setAceito] = useState(false);
  return (
    <form className="flex flex-col gap-4 p-6" aria-label="Caixas renderizadas no servidor">
      <Checkbox name="quotas" label="Só com quotas em atraso" />
      <Checkbox name="ativas" label="Só associações ativas" defaultChecked />
      <Checkbox
        name="regulamento"
        label="Li e aceito o regulamento de inscrição"
        description="Obrigatório para confirmar a inscrição."
        required
        checked={aceito}
        onCheckedChange={setAceito}
      />
      <output data-testid="estado">{aceito ? "aceite" : "por aceitar"}</output>
      <Switch name="avisos" label="Avisos por email" />
      <RadioGroup
        name="pagamento"
        aria-label="Forma de pagamento"
        options={[
          { value: "mbway", label: "MB WAY" },
          { value: "multibanco", label: "Referência Multibanco" },
        ]}
      />
    </form>
  );
}
