/**
 * `@umporg/ui/validar` — normalise and check what people type in
 * Portuguese forms: phone numbers (E.164), NIF/NIPC, código postal, IBAN.
 * Pure, no dependencies. `comZod(validarX)` plugs any of them into zod 4;
 * the display side is in `@umporg/ui/formatar` (`formatarTelefone`…).
 */
export {
  INDICATIVO_PT,
  INDICATIVOS,
  comZod,
  digitosAoEscrever,
  eTelemovel,
  maxDigitosNacionais,
  mascaraCodigoPostal,
  mascaraIban,
  mascaraNif,
  mascaraTelefoneNacional,
  normalizarCodigoPostal,
  normalizarIban,
  normalizarNif,
  normalizarTelefone,
  posicaoAposMascara,
  separarIndicativo,
  significativosAte,
  soDigitos,
  tipoDeNif,
  validarCodigoPostal,
  validarIban,
  validarNif,
  validarNipc,
  validarTelefone,
  type ContextoZod,
  type OpcoesTelefone,
  type ResultadoValidacao,
  type TipoNif,
  type TipoTelefone,
} from "./identificadores";
