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
5. **Shell escura com o tom de cada app** (v0.8). A barra lateral das apps
   de secretária é escura em todas, com a mesma profundidade da "MUTU@L ink"
   (`#12241a`), mas cada app tem o seu tom (azul-noite, beringela, nogueira,
   petróleo, vinho, ardósia). O Portal e o Cartão mantêm o verde da tinta.
   Ver "Tons das shells".
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
| Monitor (proposta) | `#4d7c0f` (oliva, 5,0:1) | `#bef264` | reservada em v0.8, app ainda não existe |
| Assistente (proposta) | `#a21caf` (orquídea, 6,3:1) | `#f0abfc` | reservada em v0.8, app ainda não existe |

## Tons das shells (v0.8)

Pedido do dono: ao mudar de aplicação "parecia que não tinha mudado". Agora
muda o fundo da barra lateral (e da barra de topo no telemóvel), e o
conteúdo tem uma linha fina na cor da app no topo e uma faixa muito leve
dessa cor atrás do cabeçalho da página (`--app-canvas`), para que a mudança
se veja também com a barra fechada ou no telemóvel.

Regras: a mesma luminosidade OKLCH da tinta (0,241; 0,204 em modo escuro),
só muda o tom. Texto ≥ 7:1, texto secundário e acento ≥ 4,5:1 sobre a barra
e sobre o item ativo; vermelho da bandeira ≥ 3,9:1. `tests/tokens.test.ts`
volta a medir tudo. Em Alto contraste todas as barras ficam pretas e não há
faixa nem linha.

| App | Barra (claro) | Item ativo | Barra (escuro) | Texto · secundário · acento (barra / item ativo) |
| --- | --- | --- | --- | --- |
| Portal, Cartão | `#12241a` (tinta) | `#1d3528` | `#0e1a13` | 15,0 · 9,0 · 8,1 / 12,2 · 7,3 · 6,6 |
| Backoffice | `#101e3b` azul-noite | `#1a2e53` | `#0c162b` | 15,3 · 9,3 · 8,0 / 12,4 · 7,6 · 6,5 |
| Eventos | `#221939` beringela | `#322650` | `#191229` | 15,3 · 9,3 · 8,1 / 12,7 · 7,7 · 6,7 |
| Simplex | `#301909` nogueira | `#442712` | `#231307` | 15,3 · 9,3 · 9,4 / 12,5 · 7,6 · 7,7 |
| Validador QR | `#00242f` petróleo | `#023543` | `#031a22` | 15,0 · 9,2 · 9,6 / 12,2 · 7,4 · 7,8 |
| Saúde | `#341220` vinho | `#4a1e30` | `#260e17` | 15,4 · 9,3 · 8,2 / 12,7 · 7,7 · 6,8 |
| Servidores e DNS | `#18202c` ardósia | `#25303f` | `#111720` | 15,1 · 9,2 · 11,0 / 12,3 · 7,5 · 9,0 |
| Monitor (proposta) | `#19230b` musgo | `#273414` | `#121a08` | 15,1 · 9,3 · 12,5 / 12,3 · 7,5 · 10,1 |
| Assistente (proposta) | `#2d152e` ameixa | `#412143` | `#210f22` | 15,4 · 9,3 · 9,5 / 12,7 · 7,7 · 7,8 |

Em modo escuro os valores sobem (texto ≥ 16,6:1, secundário ≥ 10,1:1,
acento ≥ 8,7:1). Na faixa do conteúdo o texto fica ≥ 15:1 (claro) e o texto
secundário ≥ 7,4:1.

**Propostas para apps futuras:** Monitor — oliva `#4d7c0f` (5,0:1 sobre
branco; sobre a barra `#bef264`); Assistente — orquídea `#a21caf` (6,3:1;
sobre a barra `#f0abfc`). Ficam reservadas em `data-app="monitor"` e
`data-app="assistente"`; ainda não estão em `MUTUAL_APPS`.

## Rolagem (v0.8)

Uma só barra de rolagem em todo o ecossistema, vertical e horizontal: fina
(6 px numa faixa de 12 px), arredondada, cresce para 8 px e escurece sob o
ponteiro. Polegar 3,3:1 sobre o fundo (claro), 3,6:1 (escuro), ≥ 3,7:1 sobre
a barra lateral. Em Alto contraste é mais grossa (16 px) e sólida; com as
cores forçadas do Windows usa as cores do sistema. As zonas que rolam de lado
(tabelas, separadores, código, faixas) mostram uma sombra suave na ponta onde
há mais conteúdo. Detalhes técnicos em `css/rolagem.css` e no AGENTS.md.

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
