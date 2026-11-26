# Pendentes

## Acessibilidade

- `FormField` (`src/campo.tsx`): quando o controlo filho traz um `id` próprio e o `FormField` não recebe `id`, o
  filho fica com o seu id mas o `<label htmlFor>` aponta para o `campo-…` gerado, e o rótulo deixa de estar ligado
  ao controlo. Vale para qualquer controlo. Nenhuma app o faz hoje (encontrado a 2026-11-26 na correção do
  `NumberField`, v0.25.2). Correção provável: o rótulo usar o id final do filho.

## Dependências retidas

- `braces@3.0.3` (showcase, transitiva de `@tailwindcss/cli > @parcel/watcher > micromatch`): `pnpm audit` no
  showcase aponta 1 vulnerabilidade alta (GHSA-vfj7-8cjw-p6xm) sem versão corrigida a montante. Só afeta a
  ferramenta de build do showcase (não publicado, não corre em produção). A CI audita apenas o pacote
  (0 vulnerabilidades). Rever quando existir `braces` corrigido ou o Tailwind CLI deixar de a puxar.
