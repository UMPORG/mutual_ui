export * from "./apps";
export * from "./sso";
export * from "./brand";
// Shell G: top bar + tinted frame + navigation + one content layer.
export { LancadorApps, posicionarPopover } from "./app-switcher";
// The app icon family and the grid launcher.
export { GlifoApp, IconeApp, IconeWaffle } from "./icone-app";
export { BASE_ICONE, COR_MARCA_APP, GLIFOS_APPS, svgIconeApp, type FormaGlifo, type PapelGlifo } from "./icones";
export { indiceNaGrelha } from "./grelha-teclado";
export {
  AppShell,
  NavApp,
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
export { EmBreve, TEXTOS_EM_BREVE } from "./em-breve";
export { useLancamento, useAssistenteLigado, type EstadoLancamento } from "./lancamento-contexto";
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
// The floating assistant: the top-bar button, the page context hook and
// the position registry (the chat itself is `@umporg/ui/assistente`).
export {
  BotaoAssistente,
  ID_CHAT_FLUTUANTE,
  ProvedorPosicoes,
  useContextoAssistente,
  useEstadoChat,
  useRegistoPosicoes,
  type OpcoesContextoAssistente,
} from "./assistente";
export { RegistoPosicoes, type EstadoChat } from "./assistente-estado";
export {
  diferencaContexto,
  hashContexto,
  normalizarContexto,
  type CampoContexto,
  type ContextoPagina,
  type EntradaContexto,
  type EntradaDado,
} from "./assistente-contexto";
export { cantoMaisProximo, posicaoDoChat, type CantoChat } from "./assistente-posicao";
export * from "./formatar";
export * from "./dados";
export * from "./cartao";
export * from "./estatisticas";
export * from "./tabela";
// Scrolling: edge shadows for any scroller (client hook + wrapper).
export { ScrollShadow, useScrollShadow, bordasComMais } from "./rolagem";
// Server-safe primitives and form fields (no Base UI).
export * from "./basicos";
export { FormField, Fieldset, Input, Textarea, NativeSelect, type FormFieldProps, type FieldControlProps } from "./campo";
export { normalizarTexto, filtrarOpcoes, textoParaCriar, partesDestacadas, pontuarCorrespondencia } from "./filtrar";
// Portuguese identifiers: validators/normalisers (also `@umporg/ui/validar`),
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
