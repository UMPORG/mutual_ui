/** Key: the dica id prefixed by the app, value "1". Blocked storage never throws: the choice then lasts for the page's life. */

const VALOR = "1";
const nestaSessao = new Set<string>();
const ouvintes = new Set<() => void>();

function avisar(): void {
  for (const ouvinte of ouvintes) ouvinte();
}

export function dicaDispensada(id: string): boolean {
  if (nestaSessao.has(id)) return true;
  try {
    return globalThis.localStorage?.getItem(id) === VALOR;
  } catch {
    return false;
  }
}

export function dispensarDica(id: string): void {
  nestaSessao.add(id);
  try {
    globalThis.localStorage?.setItem(id, VALOR);
  } catch {
    // Storage refused: the dica stays closed until the page reloads.
  }
  avisar();
}

export function reporDica(id: string): void {
  nestaSessao.delete(id);
  try {
    globalThis.localStorage?.removeItem(id);
  } catch {
    // Storage refused: nothing stored to remove.
  }
  avisar();
}

export function subscreverDicas(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  globalThis.addEventListener?.("storage", ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
    globalThis.removeEventListener?.("storage", ouvinte);
  };
}
