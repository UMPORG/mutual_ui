# Identidade visual do ecossistema MUTU@L — v2

Contrato de cores, marca e rótulos partilhado por todas as aplicações.
**v2 aplicada em 2026-09-25** (substitui a v1 de 2026-07-13).

A fonte de verdade técnica é este pacote, **`@umporg/ui`** (repositório público
[`UMPORG/mutual_ui`](https://github.com/UMPORG/mutual_ui)):
tokens CSS, logótipo, marca de cada app, seletor de
aplicações, cabeçalho de página, estados e o contrato de SSO. Este documento
explica as decisões; os valores vivem em `css/tokens.css`.

## O que mudou da v1 para a v2

- **v1:** uma cor primária por aplicação. Resultado: cada app parecia um
  produto diferente (botões azuis, violeta, âmbar, ciano, verde-azulado), sem
  logótipo comum e com shells diferentes.
- **v2:** **uma só marca MUTU@L** para todas as apps — o verde da bandeira
  MUTU@L é a cor primária de todos os botões, ligações e focos; o mesmo
  logótipo, tipografia, raio, sombras e cores de estado. Cada app continua
  **reconhecível** pela sua cor de acento e por uma shell pensada para quem a
  usa.

## Princípios

1. **Uma marca.** `--primary` = `--brand` `#1f6f36` (verde da bandeira,
   escurecido para 6,2:1 sobre branco). Em modo escuro `#7cc97a` com texto
   escuro. As cores puras da bandeira (`#6dba6a`, `#e8393c`) só aparecem no
   logótipo e em ilustrações.
2. **Cada app é reconhecível** pelo seu acento (`--app-accent`, ativado por
   `data-app` no `<html>`): marca da app, nome da app sob "MUTU@L", indicador
   da navegação ativa, mosaico no Portal. **Nunca** em botões primários nem em
   estados.
3. **Cor de perfil (role)** igual em todas as apps, só no crachá de quem tem
   sessão iniciada (`--role-accent`, `data-role`).
4. **Estados semânticos partilhados** (`success`, `warning`, `info`,
   `destructive` + variantes `-soft`). Nunca classes de paleta crua para
   estado. Estado = ícone + palavras, nunca só cor.
5. **Shell escura "MUTU@L ink"** (`#12241a`) na barra lateral de todas as
   apps de secretária, igual nos dois temas.
6. **Rótulos sem abreviaturas** (mantido da v1), texto base 16 px, alvos
   ≥ 44 px (48 px nos fluxos principais), WCAG AA em todos os pares (AAA onde
   já estava medido).

## Cores de aplicação (`--app-accent`)

| App | Claro | Sobre a shell / escuro | Nota |
| --- | --- | --- | --- |
| Portal, Cartão Digital | marca `#1f6f36` | `#7cc97a` | |
| Backoffice | `#1d4ed8` | `#93b4fb` | igual à v1 |
| Eventos | `#6d28d9` | `#c4a8f7` | igual à v1 |
| Simplex | `#b45309` | `#f5b76a` | igual à v1 |
| Validador QR | `#0e7490` | `#7fd3e6` | igual à v1 |
| Saúde | `#be185d` | `#f59ac2` | **mudou** — o verde-azulado colidia com o perfil Associação |

## Cores de perfil (`--role-accent`)

| Perfil (roles) | Claro | Escuro |
| --- | --- | --- |
| Administração UMP (`admin`) | `#881337` | `#fda4af` |
| Associação (`associacao`, `admin_associacao`) | `#0f766e` | `#5eead4` |
| Equipa de Eventos (`gestor_evento`, `operador_evento`) | `#3730a3` | `#a5b4fc` |
| Saúde (`profissional_saude`, `gestor_clinica`, `rececionista`) | `#9d174d` | `#f9a8d4` |
| Associado (Cartão Digital) | usa a marca | — |

## Uma família, shells por público

| App | Público-alvo | Shell |
| --- | --- | --- |
| Portal MUTU@L | Equipas da UMP e das associações | Porta de entrada: único login, lançador das apps a que o perfil tem acesso. |
| Backoffice | Serviços administrativos da UMP e dirigentes das associações | Secretária: barra lateral, tabelas primeiro. |
| Eventos | Organizadores (UMP/associações) e participantes (associados e público) | Site público próprio + área de gestão de secretária. |
| Validador QR | Funcionários à entrada de eventos e balcões | Ferramenta de ecrã inteiro, estados grandes, sem navegação. |
| Simplex | Tesoureiros, contabilistas e direções | Secretária; formulários e mapas financeiros. |
| Saúde | Rececionistas, profissionais de saúde e gestores de clínica | Secretária com seletor de unidade; Balcão como início da receção; navegação para tablet. |

Anatomia comum das shells de secretária: logótipo + "MUTU@L" + nome da app →
"Aplicações" (seletor, abre as outras apps pelo Portal) → navegação agrupada →
cartão do utilizador (perfil, tema, terminar sessão). Página = cabeçalho de
página (localização, título, descrição, ações) + conteúdo.

## Sessão única (SSO)

O Portal MUTU@L é o único ecrã de login dos funcionários. O Cérebro escreve o
cookie de sessão para o domínio-pai (`AUTH_COOKIE_DOMAIN`, produção
`.mutualismo.pt`) e todas as apps o veem pelo seu proxy `/api/auth`. Terminar
sessão numa app termina-a em todas. Ver `mutual_cerebro/docs/cors.md` e
`src/sso.ts`.
