# Pendentes

## Dependências retidas

- `braces@3.0.3` (showcase, transitiva de `@tailwindcss/cli > @parcel/watcher > micromatch`): `pnpm audit` no
  showcase aponta 1 vulnerabilidade alta (GHSA-vfj7-8cjw-p6xm) sem versão corrigida a montante. Só afeta a
  ferramenta de build do showcase (não publicado, não corre em produção). A CI audita apenas o pacote
  (0 vulnerabilidades). Rever quando existir `braces` corrigido ou o Tailwind CLI deixar de a puxar.
