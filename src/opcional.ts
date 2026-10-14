/** `{ [k]: v }` só quando `v` não é `undefined`: props opcionais para bibliotecas que não aceitam `undefined` sob `exactOptionalPropertyTypes`. Interno. */
export function opcional<K extends string, V>(chave: K, valor: V | undefined): { [P in K]?: V } {
  return valor === undefined ? {} : ({ [chave]: valor } as { [P in K]?: V });
}
