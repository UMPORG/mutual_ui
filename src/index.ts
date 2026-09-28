export * from "./apps";
export * from "./sso";
export * from "./brand";
export * from "./app-switcher";
export { ShellBarraLateral, ShellMarca, ShellConta, ShellGrupo, classeItemShell, SHELL_LARGURA } from "./shell";
export * from "./page-header";
export * from "./feedback";
export * from "./preferencias";
export { PreferenciasScript } from "./preferencias-script";
export { AcessibilidadeMenu } from "./acessibilidade";
export { AsciiFundo, iniciarAsciiFundo, type AsciiFundoProps } from "./ascii-fundo";
export { SemAcesso, type MotivoSemAcesso } from "./sem-acesso";
export { cx } from "./cx";
export {
  DemoPreencher,
  preencherFormulario,
  registarPreenchedor,
  type CatalogoDemo,
  type CenarioDemo,
  type ValorDemo,
} from "./demo-preencher";
export * from "./formatar";
export * from "./dados";
export * from "./cartao";
export * from "./estatisticas";
export * from "./tabela";
// v0.8 — scrolling: edge shadows for any scroller (client hook + wrapper).
export { ScrollShadow, useScrollShadow, bordasComMais } from "./rolagem";
// v0.7 — server-safe primitives and form fields (no new dependencies).
export * from "./basicos";
export { FormField, Fieldset, Input, Textarea, NativeSelect, type FormFieldProps, type FieldControlProps } from "./campo";
export { normalizarTexto, filtrarOpcoes, textoParaCriar, partesDestacadas, pontuarCorrespondencia } from "./filtrar";
// v0.8.9 — Portuguese identifiers: validators/normalisers (also `@umporg/ui/validar`),
// the phone display and the masked inputs (client).
export * from "./validar";
export { Telefone, type TelefoneProps } from "./telefone";
export {
  CampoTelefone,
  CampoNif,
  CampoCodigoPostal,
  CampoIban,
  BotaoCopiar,
  type CampoTelefoneProps,
  type CampoMascaradoProps,
} from "./campos-identificadores";
