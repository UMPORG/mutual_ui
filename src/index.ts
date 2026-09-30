export * from "./apps";
export * from "./sso";
export * from "./brand";
// v0.13 — shell G: top bar + tinted frame + navigation + one content layer.
export { LancadorApps, posicionarPopover } from "./app-switcher";
// Pré-visualização (ramo icones-preview): família de ícones e lançador em grelha.
export { IconeApp, IconeWaffle, GLIFOS_APPS, type DirecaoIcone } from "./icones-apps";
export { LancadorGrelha } from "./lancador-grelha";
export { indiceNaGrelha } from "./grelha-teclado";
export {
  AppShell,
  NavApp,
  AcaoPrincipal,
  MenuConta,
  ProcuraApp,
  Separadores,
  classeItemMenu,
  classeItemNav,
  hrefAtivo,
  hrefAtualDoMenu,
  iniciais,
  type AppShellProps,
  type ItemNavApp,
  type GrupoNavApp,
  type AcaoPrincipalApp,
  type ContaShell,
  type IconeShell,
} from "./shell";
export * from "./page-header";
export * from "./feedback";
export { Dica, dicaDispensada, dispensarDica, reporDica, type DicaProps } from "./dicas";
export * from "./preferencias";
export { PreferenciasScript } from "./preferencias-script";
export { AcessibilidadeMenu } from "./acessibilidade";
export { AsciiFundo, iniciarAsciiFundo, type AsciiFundoProps } from "./ascii-fundo";
export { SemAcesso, type MotivoSemAcesso } from "./sem-acesso";
export { ServicoIndisponivel } from "./indisponivel";
export { cx } from "./cx";
export {
  DemoPreencher,
  preencherFormulario,
  registarPreenchedor,
  useAcoesDemo,
  type CatalogoDemo,
  type CenarioDemo,
  type ValorDemo,
} from "./demo-preencher";
export { registarEntrarComo, type ContextoEntrarComo, type PersonaDemo } from "./demo-entrar-dados";
export { useEntrarComoDemo } from "./demo-entrar";
export { registarAcoesDemo, type AcaoDemo, type GrupoAcoesDemo } from "./demo-acoes";
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
