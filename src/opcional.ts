/**
 * `{ [k]: v }` só quando `v` não é `undefined` — para passar props opcionais a
 * bibliotecas (Recharts, Base UI) cujos tipos não aceitam `undefined` sob
 * `exactOptionalPropertyTypes`. Interno: não é exportado pelo pacote.
 */
export function opcional<K extends string, V>(chave: K, valor: V | undefined): { [P in K]?: V } {
  return valor === undefined ? {} : ({ [chave]: valor } as { [P in K]?: V });
}
