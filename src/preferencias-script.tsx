import { PREFERENCIAS_SCRIPT } from "./preferencias";

/**
 * Put in the root layout's <head> (and add `suppressHydrationWarning` to
 * <html>): applies the saved "Acessibilidade" choices before the first paint.
 * Replaces next-themes' script — the theme is one of those choices.
 */
export function PreferenciasScript({ nonce }: { nonce?: string }) {
  return <script nonce={nonce} dangerouslySetInnerHTML={{ __html: PREFERENCIAS_SCRIPT }} />;
}
