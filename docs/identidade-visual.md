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
| Servidores e DNS | `#475569` (ardósia, 7,6:1 sobre branco) | `#cbd5e1` (10,9:1 sobre a shell) | nova em 2026-09 (v0.6.0) — distinta das outras apps e dos perfis |

## Cores de perfil (`--role-accent`)

| Perfil (roles) | Claro | Escuro |
| --- | --- | --- |
| Administração UMP (`admin`) | `#881337` | `#fda4af` |
| Associação (`associacao`, `admin_associacao`) | `#0f766e` | `#5eead4` |
| Equipa de Eventos (`gestor_evento`, `operador_evento`) | `#3730a3` | `#a5b4fc` |
| Saúde (`profissional_saude`, `gestor_clinica`, `rececionista`) | `#9d174d` | `#f9a8d4` |
| Associado (Cartão Digital) | usa a marca | — |

## Dados: gráficos, indicadores e tabelas (v0.6)

- **Paleta dos gráficos "MUTU@L"** (`css/dados.css`, `--serie-1..8`): o
  verde da marca vem primeiro e os restantes tons seguem uma ordem fixa
  (azul, magenta, amarelo, água, laranja, violeta, vermelho). Tem passos
  próprios para o modo escuro e para o alto contraste. Foi validada para
  daltonismo (pior par adjacente ΔE 9,1 no claro, 8,4 no escuro, 10,6 no
  alto contraste). Os quatro primeiros tons distinguem-se todos entre si.
  Cinzento `--serie-outros` para "Outros" e séries de contexto. Nunca um
  9.º tom.
- Os estados (sucesso, aviso, perigo, informação) nunca são cor de série,
  exceto quando a série é mesmo um estado.
- Indicadores com variação: seta + sinal + palavras; a cor diz se a
  variação é boa ou má para aquele indicador.
- Todos os gráficos têm uma tabela equivalente ("Ver dados") e uma
  descrição para leitores de ecrã.
- Números, moeda, percentagens e datas em pt-PT (Europe/Lisbon). Um valor
  em falta mostra-se sempre como "—".
- Levantamento e plano de adoção: `docs/inventario-componentes.md`.

## Uma família, shells por público

| App | Público-alvo | Shell |
| --- | --- | --- |
| Portal MUTU@L | Equipas da UMP e das associações | Porta de entrada: único login, lançador das apps a que o perfil tem acesso. |
| Backoffice | Serviços administrativos da UMP e dirigentes das associações | Secretária: barra lateral, tabelas primeiro. |
| Eventos | Organizadores (UMP/associações) e participantes (associados e público) | Site público próprio + área de gestão de secretária. |
| Validador QR | Funcionários à entrada de eventos e balcões | Ferramenta de ecrã inteiro, estados grandes, sem navegação. |
| Simplex | Tesoureiros, contabilistas e direções | Secretária; formulários e mapas financeiros. |
| Saúde | Rececionistas, profissionais de saúde e gestores de clínica | Secretária com seletor de unidade; Balcão como início da receção; navegação para tablet. |
| Servidores e DNS | Equipa de informática da UMP | Secretária; lista de endereços e servidores, tabelas primeiro. |

Anatomia comum das shells de secretária: logótipo + "MUTU@L" + nome da app →
"Aplicações" (seletor, abre as outras apps pelo Portal) → navegação agrupada →
cartão do utilizador (perfil, tema, terminar sessão). Página = cabeçalho de
página (localização, título, descrição, ações) + conteúdo.

## Um só endereço e sessão única

Todas as aplicações vivem num só endereço (`https://mutual.mutualismo.pt`),
cada uma no seu caminho: Portal `/`, `/backoffice`, `/eventos`, `/simplex`,
`/saude`, `/qr`, `/dns`, centro de ajuda `/ajuda` (ADR 0004,
`docs/adr-0004-subcaminhos.md`). O Portal é o único ecrã de login; como tudo
é a mesma origem, a sessão e as escolhas de Acessibilidade valem em todas as
aplicações sem configuração. Terminar sessão numa app termina-a em todas.
Ver `src/sso.ts`.
