/**
 * Dicas: the device's memory of «I do not need this tip any more».
 * No React here, so `node --test` can exercise it (tests/dicas.test.ts).
 *
 * The key is the dica's `id`, prefixed by the app (`cartao.dica.passe-digital`,
 * `eventos.dica.convites`); the value is "1". Blocked storage (private window,
 * refused site data) never throws: the choice then lasts for this page's life.
 */

const VALOR = "1";
const nestaSessao = new Set<string>();
const ouvintes = new Set<() => void>();

function avisar(): void {
  for (const ouvinte of ouvintes) ouvinte();
}

/** Was this dica closed on this device (or in this session, without storage)? */
export function dicaDispensada(id: string): boolean {
  if (nestaSessao.has(id)) return true;
  try {
    return globalThis.localStorage?.getItem(id) === VALOR;
  } catch {
    return false;
  }
}

/** Closes the dica and remembers it on this device. */
export function dispensarDica(id: string): void {
  nestaSessao.add(id);
  try {
    globalThis.localStorage?.setItem(id, VALOR);
  } catch {
    // Storage refused: the dica stays closed until the page reloads.
  }
  avisar();
}

/** Shows a closed dica again (its «reabrir» button, or «Mostrar as dicas outra vez» in help). */
export function reporDica(id: string): void {
  nestaSessao.delete(id);
  try {
    globalThis.localStorage?.removeItem(id);
  } catch {
    // Storage refused: nothing stored to remove.
  }
  avisar();
}

/** For `useSyncExternalStore`: this tab's changes and other tabs' (`storage` event). */
export function subscreverDicas(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  globalThis.addEventListener?.("storage", ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
    globalThis.removeEventListener?.("storage", ouvinte);
  };
}
