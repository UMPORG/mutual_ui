# Identidade visual MUTU@L

Contrato de cores e marca partilhado por todas as aplicações: as decisões e os
valores medidos. Os valores vivem em `css/tokens.css` e `css/dados.css`; os
testes em `tests/tokens.test.ts`. Classes e movimento: [superficies.md](superficies.md).

## Princípios

1. **Uma marca.** `--primary` = `--brand` `#1f6f36` (verde da bandeira,
   escurecido para 6,2:1 sobre branco). Em modo escuro `#7cc97a` com texto
   escuro. As cores puras da bandeira (`#6dba6a`, `#e8393c`) só aparecem no
   logótipo e em ilustrações.
2. **Cada app é reconhecível** pela sua cor (`--app-accent`, ativada por
   `data-app` no `<html>`), só na moldura, no azulejo, no ícone da página
   atual, no traço do separador atual e no mosaico do Portal. **Nunca** em
   botões, ligações, foco, crachás ou estados.
3. **Cor de perfil** (`--role-accent`, `data-role`) só no crachá de perfil.
4. **Estados semânticos partilhados** (`success`, `warning`, `info`,
   `destructive` + variantes `-soft`). Nunca classes de paleta crua para
   estado. Estado = ícone + palavras, nunca só cor.
5. **Moldura com a cor da app — shell G** (decisão do dono: estrutura do
   Google Workspace + camadas do Fluent). A barra de topo e a navegação
   partilham uma superfície cinzenta com **9 %** da cor da app (`--moldura`);
   o conteúdo assenta numa **só camada neutra** elevada (`--camada`, cantos
   de 8 px). Os cinzentos do conteúdo são neutros puros (`r = g = b`), nos
   dois temas.
6. **Rótulos sem abreviaturas**, texto base 16 px, alvos ≥ 44 px (48 px nos
   fluxos principais), WCAG AA em todos os pares; Alto contraste 7:1.

## Cores de aplicação (`--app-accent`, `--app-marca`)

Matiz OKLCH: nenhum par de apps a menos de **33°** no claro (28° no escuro).
O Servidores e DNS é a ardósia (pouco croma). `tests/tokens.test.ts` falha se
dois tons se aproximarem.

| App | Claro (azulejo e acento) | Escuro | Matiz |
| --- | --- | --- | --- |
| Portal, Cartão Digital | marca `#1f6f36` | `#7cc97a` | 149° |
| Backoffice | `#1d4ed8` | `#93b4fb` | 264° |
| Eventos | `#7a1fc4` púrpura | `#d4a5f9` | 303° |
| Simplex | `#9c6100` ocre | `#f2bf5e` | 69° |
| Validador QR | `#0e7490` | `#7fd3e6` | 223° |
| Saúde | `#b8166e` framboesa | `#f59ecb` | 355° |
| Servidores e DNS | `#475569` ardósia | `#cbd5e1` | — |
| Monitorização | `#6b7500` oliva | `#d9dc6a` | 116° |
| Assistente | `#0b7a72` verde-água | `#72dfcf` | 187° |
| Protocolos | `#b93a2e` tijolo | `#fca99f` | 29° |

Todas as cores claras têm ≥ 5,0:1 sobre branco (servem de texto e do
azulejo com glifo branco). O verde-água do Assistente fica perto do perfil
«Associação» (`#0f766e`); as apps mostram o nome do perfil, não o crachá.

## Moldura (shell G)

Barra de topo e navegação numa só superfície: `color-mix(in srgb, <cor da
app> 9 %, #f2f2f2)` no claro e `… 9 %, #1a1a1a` no escuro (a cor da app no
escuro é a clara). Item atual: pílula com 20 % (24 % no escuro), texto a
negrito e ícone na cor da app. Passar o ponteiro: 14 %. Conteúdo: `--camada`
branca (claro) ou `#141414` (escuro), cantos de 8 px, sombra suave. A procura
é um campo neutro com borda (`--procura-fundo`, `--procura-borda`), nunca
tingido.

Medido em todas as apps, claro e escuro (`tests/tokens.test.ts`):

| Par | Mínimo exigido | Pior caso medido |
| --- | --- | --- |
| Texto sobre a moldura, a pílula e o hover | 7:1 | 8,5:1 (Monitorização escuro) |
| Texto suave e títulos dos grupos | 4,5:1 | 5,2:1 (Monitorização escuro) |
| Anel de foco sobre a moldura e a pílula | 3:1 | 3,96:1 (Eventos claro) |
| Borda da procura sobre a moldura e o hover | 3:1 | 3,5:1 (Eventos claro), 3,6:1 (Monitorização escuro) |
| Texto, sugestão e lupa no campo da procura | 7:1 / 4,5:1 | campo branco / `#1c1c1c`, como os campos dos formulários |
| Ícone da página atual (cor da app) sobre a pílula | 3:1 | 3,5:1 (Monitorização claro) |
| Glifo branco no azulejo | 4,5:1 | 5,0:1 (Monitorização) |
| Traço do separador atual sobre a camada | 3:1 | 5,0:1 |
| Contador e iniciais do avatar | 4,5:1 | 16,9:1 |

Também medidos, nos dois temas: texto e texto suave ≥ 7:1 sobre fundo,
cartão, `muted` e `secondary`; estados, marca e pares `-soft` ≥ 4,5:1;
`--input` (bordas dos campos) e `--ring` ≥ 3:1.

A moldura contra a camada é informativa (1,2–1,3:1): a separação faz-se pelo
canto e pela sombra. Em Alto contraste tudo fica preto sobre branco: moldura
branca, item atual preto com texto branco, camada com contorno de 2 px,
`[data-app]` e `[data-role]` aninhados também a preto.

## Rolagem

Uma só barra de rolagem, vertical e horizontal: fina (6 px numa faixa de
12 px), arredondada, cresce para 8 px e escurece sob o ponteiro. Polegar
3,3:1 sobre o fundo (claro), 3,6:1 (escuro). Em Alto contraste é mais grossa
(16 px) e sólida; com as cores forçadas do Windows usa as cores do sistema.
Detalhes técnicos: `css/rolagem.css` e [superficies.md](superficies.md).

## Cores de perfil (`--role-accent`)

| Perfil (roles) | Claro | Escuro |
| --- | --- | --- |
| Administração UMP (`admin`) | `#881337` | `#fda4af` |
| Associação (`associacao`, `admin_associacao`) | `#0f766e` | `#5eead4` |
| Equipa de Eventos (`gestor_evento`, `operador_evento`) | `#3730a3` | `#a5b4fc` |
| Saúde (`profissional_saude`, `gestor_clinica`, `rececionista`) | `#9d174d` | `#f9a8d4` |
| Associado (Cartão Digital) | usa a marca | — |

## Paleta dos gráficos «MUTU@L» (`css/dados.css`)

Uma só paleta categórica, `--serie-1..8`: o verde da marca primeiro, depois
uma ordem fixa (azul, magenta, amarelo, água, laranja, violeta, vermelho), com
passos próprios para o escuro e o alto contraste. Cinzento `--serie-outros`
para «Outros» e séries de contexto. Nunca um 9.º tom: o resto agrupa-se em
«Outros». Validada com ΔE OKLab ×100 e simulação de daltonismo (Machado 2009):

| Modo | Superfície | Daltonismo, pior par adjacente | Visão normal, pior par | Contraste |
| --- | --- | --- | --- | --- |
| Claro | `#ffffff` | 9,1 | 19,6 | 3 tons abaixo de 3:1: há sempre «Ver dados» e legenda |
| Escuro | `#1d231f` | 8,4 | 19,3 | todos ≥ 3:1 |
| Alto contraste | `#ffffff` | 10,6 | 16,6 | todos ≥ 5:1 |

Os quatro primeiros tons passam o teste em todos os pares nos dois modos
(13,0 no claro, 9,4 no escuro); por isso o `GraficoDonut` mostra no máximo 4
fatias mais «Outros». A cor segue a entidade (`color` fixa um tom). Os estados
usam as suas cores (`sucesso`, `aviso`, `perigo`, `info`), nunca um tom da
série, exceto quando a série é mesmo um estado.
