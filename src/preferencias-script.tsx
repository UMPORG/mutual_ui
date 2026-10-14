import { PREFERENCIAS_SCRIPT } from "./preferencias";

/** Put in the root layout's <head> (with `suppressHydrationWarning` on <html>): applies the saved "Acessibilidade" choices, theme included (replaces next-themes), before first paint. */
export function PreferenciasScript({ nonce }: { nonce?: string | undefined }) {
  return <script nonce={nonce} dangerouslySetInnerHTML={{ __html: PREFERENCIAS_SCRIPT }} />;
}
