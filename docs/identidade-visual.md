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
5. **Moldura com a cor da app — shell G** (v0.13, dono 2026-09-29: estrutura
   do Google Workspace + camadas do Fluent). A barra de topo e a navegação
   partilham uma superfície cinzenta com **9 %** da cor da app (`--moldura`);
   o conteúdo assenta numa **só camada neutra** elevada (`--camada`, cantos
   de 8 px). A cor da app só aparece saturada no azulejo da app, no ícone da
   página atual (dentro da pílula de 20 %, 24 % no escuro) e no traço do
   separador atual. Tudo o resto é neutro; botões principais verde-marca;
   estados com as cores de estado. Substitui as barras laterais escuras da
   v0.8. Ver "Moldura (shell G)".
6. **Rótulos sem abreviaturas** (mantido da v1), texto base 16 px, alvos
   ≥ 44 px (48 px nos fluxos principais), WCAG AA em todos os pares (AAA onde
   já estava medido).

## Cores de aplicação (`--app-accent`, `--app-marca`)

v0.13 voltou a espaçar as cores (pedido do dono: Eventos, Assistente e Saúde
pareciam iguais, tal como Simplex e Protocolos). Matiz OKLCH: nenhum par de
apps a menos de **33°** no claro (28° no escuro; antes 17°). O Servidores e
DNS é a ardósia (pouco croma). `tests/tokens.test.ts` falha se dois tons se
aproximarem.

| App | Claro (azulejo e acento) | Escuro | Matiz | Nota |
| --- | --- | --- | --- | --- |
| Portal, Cartão Digital | marca `#1f6f36` | `#7cc97a` | 149° | |
| Backoffice | `#1d4ed8` | `#93b4fb` | 264° | igual |
| Eventos | `#7a1fc4` púrpura | `#d4a5f9` | 303° | **mudou** (era `#6d28d9`, 293°) |
| Simplex | `#9c6100` ocre | `#f2bf5e` | 69° | **mudou** (era `#b45309`, 49°) |
| Validador QR | `#0e7490` | `#7fd3e6` | 223° | igual |
| Saúde | `#b8166e` framboesa | `#f59ecb` | 355° | **ajustou** (era `#be185d`, 4°) |
| Servidores e DNS | `#475569` ardósia | `#cbd5e1` | — | igual |
| Monitorização | `#6b7500` oliva | `#d9dc6a` | 116° | **mudou** (era `#4d7c0f`, 132°, junto do verde do Portal) |
| Assistente | `#0b7a72` verde-água | `#72dfcf` | 187° | **mudou** (era `#a21caf`, 324°, junto dos Eventos e da Saúde) |
| Protocolos | `#b93a2e` tijolo | `#fca99f` | 29° | igual |

Todas as cores claras têm ≥ 5,0:1 sobre branco (servem de texto e do
azulejo com glifo branco). O verde-água do Assistente fica perto do perfil
«Associação» (`#0f766e`); os perfis só aparecem no crachá de perfil, que as
apps já não mostram (mostram o nome do perfil).

## Moldura (shell G, v0.13)

Barra de topo e navegação numa só superfície: `color-mix(in srgb, <cor da
app> 9 %, #f2f2f2)` no claro e `… 9 %, #1a1a1a` no escuro (a cor da app no
escuro é a clara). Item atual: pílula com 20 % (24 % no escuro), texto a
negrito e ícone na cor da app. Passar o ponteiro e a procura: 14 %. Conteúdo:
`--camada` branca (claro) ou `#141414` (escuro), cantos de 8 px, sombra suave.

Medido em todas as apps, claro e escuro (`tests/tokens.test.ts`):

| Par | Mínimo exigido | Pior caso medido |
| --- | --- | --- |
| Texto sobre a moldura, a pílula e o hover | 7:1 | 8,5:1 (Monitorização escuro) |
| Texto suave e títulos dos grupos | 4,5:1 | 5,2:1 (Monitorização escuro) |
| Anel de foco sobre a moldura e a pílula | 3:1 | 3,96:1 (Eventos claro) |
| Borda da procura (campo neutro, v0.16) sobre a moldura e o hover | 3:1 | 3,5:1 (Eventos claro), 3,6:1 (Monitorização escuro) |
| Texto, sugestão e lupa no campo da procura | 7:1 / 4,5:1 | campo branco / `#1c1c1c`, como os campos dos formulários |
| Ícone da página atual (cor da app) sobre a pílula | 3:1 | 3,5:1 (Monitorização claro) |
| Glifo branco no azulejo | 4,5:1 | 5,0:1 (Monitorização) |
| Traço do separador atual sobre a camada | 3:1 | 5,0:1 |
| Contador e iniciais do avatar | 4,5:1 | 16,9:1 |

A moldura contra a camada é informativa (1,2–1,3:1): a separação faz-se pelo
canto e pela sombra, como no Fluent e no Workspace. Em Alto contraste tudo
fica preto sobre branco: moldura branca, item atual preto com texto branco,
camada com contorno de 2 px.

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
| Backoffice | Serviços administrativos da UMP e dirigentes das associações | Secretária (shell G), tabelas primeiro. |
| Eventos | Organizadores (UMP/associações) e participantes (associados e público) | Site público próprio + área de gestão de secretária. |
| Validador QR | Funcionários à entrada de eventos e balcões | Ferramenta de ecrã inteiro, estados grandes, sem navegação. |
| Simplex | Tesoureiros, contabilistas e direções | Secretária; formulários e mapas financeiros. |
| Saúde | Rececionistas, profissionais de saúde e gestores de clínica | Secretária com seletor de unidade; Balcão como início da receção; navegação para tablet. |
| Servidores e DNS | Equipa de informática da UMP | Secretária; lista de endereços e servidores, tabelas primeiro. |

Anatomia comum (shell G, v0.13, `AppShell`): **barra de topo** — ☰, azulejo
da app + «MUTU@L» + nome da app, procura ao centro (quando a app a tem),
Ajuda e Acessibilidade **com texto**, «Aplicações MUTU@L» (grelha, as mesmas
apps que o Portal mostra, a atual marcada «Está aqui») e o avatar (nome,
perfil, organização, «Mudar de organização», «Terminar sessão»);
**navegação** à esquerda — só destinos (v0.16: nenhum botão de criar no
menu), no máximo 8 em 2–3 grupos curtos com títulos pequenos, item atual em
pílula; a ação da página («Nova campanha», «Criar evento») é o botão verde
principal do cabeçalho dessa página, junto ao título; **subpáginas em separadores** na própria página
(`Separadores`), nunca um segundo nível no menu; **conteúdo** numa só camada
neutra com `.m-pagina` (margens de 16 / 24 / 32 px, largura máxima de
80 rem). No telemóvel e no tablet (< 64 rem): barra de topo + gaveta (com
Ajuda, Acessibilidade e a conta no fim); a ação da página fica no seu
cabeçalho, por baixo do título se não couber. A procura é um campo branco
(no escuro, a superfície escura dos campos) com borda visível, nunca tingido
com a cor da app. Alvos de 44–48 px.

## Um só endereço e sessão única

Todas as aplicações vivem num só endereço (`https://mutual.mutualismo.pt`),
cada uma no seu caminho: Portal `/`, `/backoffice`, `/eventos`, `/simplex`,
`/saude`, `/qr`, `/dns`, centro de ajuda `/ajuda` (ADR 0004,
`docs/adr-0004-subcaminhos.md`). O Portal é o único ecrã de login; como tudo
é a mesma origem, a sessão e as escolhas de Acessibilidade valem em todas as
aplicações sem configuração. Terminar sessão numa app termina-a em todas.
Ver `src/sso.ts`.
