// Lets `node --test` load the package sources as the apps' bundlers do:
// `src/*.ts` import siblings without an extension ("./formatar"), which
// Node's ESM resolver does not try on its own.
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      try {
        return nextResolve(`${specifier}.ts`, context);
      } catch {
        // fall through to the default resolution (and its error)
      }
    }
    return nextResolve(specifier, context);
  },
});
