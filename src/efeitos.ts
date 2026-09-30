"use client";

/**
 * `@umporg/ui/efeitos` — decorative effects. Which one goes where:
 * docs/guia/superficies.md → "Effects". `AsciiFundo` stays in the main
 * entry (entry and login screens).
 */
export {
  ConstelacaoFundo,
  TopografiaFundo,
  MalhaFundo,
  PontosFundo,
  BrilhoDestaque,
  Celebracao,
  MomentoSucesso,
  type ConstelacaoFundoProps,
  type TopografiaFundoProps,
  type MalhaFundoProps,
  type PontosFundoProps,
  type CelebracaoProps,
} from "./efeitos-fundos";
export { iniciarEfeito, estiloMascara, type Mascara, type OpcoesEfeito, type EstadoEfeito } from "./efeitos-base";
export { AsciiFundo } from "./ascii-fundo";
