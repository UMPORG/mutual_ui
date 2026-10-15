# Changelog

Todas as alterações notáveis a este pacote estão documentadas neste ficheiro.

O formato segue o [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), e o projeto usa o [Versionamento Semântico](https://semver.org/lang/pt-BR/). Cada versão é uma etiqueta Git (`vX.Y.Z`) e as apps consomem-na pelo mesmo número.

## [Unreleased]

## [0.21.2] - 2026-10-15

### Segurança

- Next 16.4.1 e React 19.3.1, com as correções de execução remota de código publicadas a 2026-10-14. As apps devem atualizar.

### Corrigido

- Instalar o pacote por git deixa de falhar no pnpm 12.

## [0.21.1] - 2026-10-14

### Alterado

- Manutenção interna, sem alterações visíveis.

## [0.21.0] - 2026-10-07

### Adicionado

- Nome da plataforma configurável; por omissão «UMP».

### Alterado

- Os textos visíveis deixam de usar «MUTU@L».

## [0.20.2] - 2026-10-06

### Segurança

- O retorno após o início de sessão recusa caminhos que se normalizam para outro site (redirecionamento aberto).

## [0.20.1] - 2026-10-06

### Alterado

- «Entidade» em vez de «Organização» nos textos partilhados.

## [0.20.0] - 2026-10-02

### Adicionado

- Lançamento: apps, páginas e assistente podem ser desligados pela UMP; as páginas desligadas mostram «Em breve».

## [0.19.1] - 2026-10-01

### Corrigido

- O logótipo do Assistente passa a ser o robô de conversa.

## [0.19.0] - 2026-10-01

### Adicionado

- Logótipo novo do Assistente, glifo de app sem base e a app Carta Social Mutualista.

## [0.18.3] - 2026-09-30

### Corrigido

- O contexto da página do assistente volta quando um diálogo que o publicou se fecha.

## [0.18.2] - 2026-09-30

### Corrigido

- Assistente flutuante: ligações das respostas corretas, foco na caixa logo na primeira abertura, Demonstração sempre visível no telemóvel e nome completo da página na barra.

## [0.18.1] - 2026-09-30

### Corrigido

- Assistente flutuante: a mola só atua depois de a pessoa o mover (nunca atravessa a Demonstração); Esc num diálogo aberto no chat já não minimiza o assistente.

## [0.18.0] - 2026-09-30

### Adicionado

- Assistente flutuante: botão na barra de topo, janela arrastável com íman para os cantos e contexto da página.

## [0.17.0] - 2026-09-30

### Adicionado

- Assistente nos formulários: preencher a partir de documento, revisão das propostas, «O que falta?», rascunho de texto e botão de anexo.

## [0.16.2] - 2026-09-30

### Corrigido

- Um NIF cheio deixa de ser estragado ao ser introduzido.

## [0.16.1] - 2026-09-30

### Corrigido

- Botões diretos numa subsecção mantêm a sua largura.

## [0.16.0] - 2026-09-30

### Adicionado

- Subsecções e barra de ações nos formulários.

### Alterado

- Navegação sem botão de criar; procura num campo neutro com borda visível.

## [0.15.2] - 2026-09-30

### Corrigido

- Campos lado a lado alinhados; só um campo sozinho partilha as linhas da grelha.

## [0.15.1] - 2026-09-30

### Corrigido

- Campos lado a lado alinhados; mensagens de NIF/NIPC que explicam o erro.

## [0.15.0] - 2026-09-30

### Adicionado

- Ícone próprio por aplicação e lançador em grelha ao estilo do Google Workspace.

## [0.14.0] - 2026-09-29

### Adicionado

- Movimento com tokens únicos para menus, gaveta, pílula, separadores e transições; instantâneo com «Reduzir movimento».

## [0.13.2] - 2026-09-29

### Corrigido

- Um só item atual no menu e nos separadores; o «Início» deixa de acender em simultâneo.

## [0.13.1] - 2026-09-29

### Corrigido

- Estrutura do chat corrigida para leitores de ecrã; nome da app na ligação da barra de topo.

## [0.13.0] - 2026-09-29

### Alterado

- Shell única: barra de topo, moldura com 9% da cor da app e uma só camada de conteúdo; paleta reespaçada.

## [0.12.1] - 2026-09-29

### Corrigido

- O componente Dica tem alvos de 48 px.

## [0.12.0] - 2026-09-29

### Adicionado

- Componente Dica: uma dica calma e compacta para todas as apps, com contraste medido.

## [0.11.3] - 2026-09-29

### Adicionado

- Ações de demonstração no widget «Demonstração».

## [0.11.2] - 2026-09-29

### Alterado

- O «Entrar como…» da demonstração passa a estar dentro do widget, em vez de um painel no login.

## [0.11.1] - 2026-09-29

### Corrigido

- «Entrar como…»: a contagem do grupo não quebra de linha.

## [0.11.0] - 2026-09-29

### Adicionado

- «Entrar como…» da demonstração.

### Alterado

- Conteúdo em cinzentos neutros e modo escuro legível.

## [0.10.1] - 2026-09-29

### Alterado

- Manutenção interna, sem alterações visíveis.

## [0.10.0] - 2026-09-29

### Segurança

- Cabeçalhos de segurança partilhados por todas as apps (CSP com nonce) e página «serviço indisponível» comum.

## [0.9.8] - 2026-09-28

### Corrigido

- O rolo da tabela de dados é um grupo com nome, não uma região.

## [0.9.7] - 2026-09-28

### Adicionado

- O seletor de aplicações lista exatamente o que o Portal mostra (QR com Eventos).

### Corrigido

- Tabela de dados rolável pelo teclado; paginação com rótulo acessível.

## [0.9.6] - 2026-09-28

### Adicionado

- Títulos de página uniformes em todas as apps.

### Corrigido

- Os itens da barra lateral deixam de encolher.

## [0.9.5] - 2026-09-28

### Corrigido

- O nome do utilizador na shell não tem tooltip nativo; itens de Acessibilidade com 48 px.

## [0.9.4] - 2026-09-28

### Alterado

- Itens da shell com 48 px.

## [0.9.3] - 2026-09-28

### Adicionado

- Conta na shell com ligação à declaração de acessibilidade e alvos para as visitas guiadas.

## [0.9.2] - 2026-09-28

### Corrigido

- Anel de foco claro na shell escura, e o do conteúdo em popovers, cartões e ecrã.

## [0.9.1] - 2026-09-28

### Adicionado

- Shell de secretária partilhada (marca, conta e apps disponíveis); o seletor mostra a app atual.

### Corrigido

- Alto contraste nos acentos aninhados.

## [0.9.0] - 2026-09-28

### Adicionado

- App de monitorização e pacote de monitorização: reporta erros ao serviço central e identifica cada pedido.

## [0.8.9] - 2026-09-28

### Adicionado

- Identificadores: telefone, NIF, código postal e IBAN, com campos, formatação e validação.

## [0.8.8] - 2026-09-28

### Adicionado

- Demonstração: a pílula «Demonstração» fica acima de uma barra de navegação inferior.

## [0.8.7] - 2026-09-28

### Corrigido

- O preenchimento da demonstração funciona dentro de diálogos sem tapar as últimas ações dos formulários.

## [0.8.6] - 2026-09-28

### Adicionado

- Cartão Digital no seu próprio endereço, com página «Sem acesso» para quem não tem associação.

## [0.8.5] - 2026-09-27

### Adicionado

- App Protocolos (caminho próprio, ícone e cor).

## [0.8.4] - 2026-09-27

### Alterado

- O interruptor passa a ter nome acessível.

## [0.8.3] - 2026-09-27

### Adicionado

- App Assistente (caminho próprio e ícone).

## [0.8.2] - 2026-09-27

### Corrigido

- A tabela deixa de alargar a página; campos inválidos, rótulos das caixas e alvos das etiquetas corrigidos.

## [0.8.1] - 2026-09-26

### Corrigido

- Nome acessível dos campos, alvos dos filtros e cabeçalho do showcase.

## [0.8.0] - 2026-09-26

### Adicionado

- Barra lateral com o tom de cada app.

## [0.7.0] - 2026-09-26

### Adicionado

- Controlos, efeitos e componentes de conversa.

## [0.6.0] - 2026-09-26

### Adicionado

- Componentes de dados (cartões, indicadores, gráficos e tabelas) e app Servidores e DNS.

## [0.5.1] - 2026-09-26

### Corrigido

- Concordância no título da página «Sem acesso».

## [0.5.0] - 2026-09-25

### Alterado

- Um só endereço com subcaminhos para todas as apps (ADR 0004). Alteração com quebra de compatibilidade.

## [0.4.0] - 2026-09-25

### Alterado

- O acesso às apps segue as aplicações do perfil. Alteração com quebra de compatibilidade.

### Removido

- Os papéis de login deixam de controlar o acesso.

## [0.3.3] - 2026-09-25

### Corrigido

- Botão Demonstração no canto inferior direito, fora da barra lateral.

## [0.3.2] - 2026-09-25

### Corrigido

- Botões primários e destrutivos com fundo de cor no alto contraste.

## [0.3.1] - 2026-09-25

### Corrigido

- Preferências aplicadas antes de desenhar a página (sem flash); estados de foco e pressão; botões do painel de demonstração sem encolher.

## [0.3.0] - 2026-09-25

### Adicionado

- Modo demonstração com preenchimento de formulários por cenários.

## [0.2.3] - 2026-09-25

### Alterado

- Manutenção interna, sem alterações visíveis.

## [0.2.2] - 2026-09-25

### Corrigido

- O ícone de acessibilidade cresce com o texto; rótulo só em ecrãs largos; botões em barras escuras no alto contraste.

## [0.2.1] - 2026-09-25

### Corrigido

- Menus de acessibilidade sincronizados, um só guia de leitura, aviso distinto em alto contraste e impressão sem preferências.

## [0.2.0] - 2026-09-25

### Adicionado

- Menu Acessibilidade para todo o sistema, profundidade e fundo animado.

## [0.1.2] - 2026-09-25

### Corrigido

- Contorno dos campos a 3:1 e nome da app a 14 px.

## [0.1.1] - 2026-09-25

### Segurança

- O retorno após o início de sessão recusa caracteres de controlo e credenciais no URL.

## [0.1.0] - 2026-09-25

### Adicionado

- Sistema de design inicial: tokens, marca, peças da shell e auxiliares de SSO.

[Unreleased]: https://github.com/UMPORG/mutual_ui/compare/v0.21.1...HEAD
[0.21.1]: https://github.com/UMPORG/mutual_ui/compare/v0.21.0...v0.21.1
[0.21.0]: https://github.com/UMPORG/mutual_ui/compare/v0.20.2...v0.21.0
[0.20.2]: https://github.com/UMPORG/mutual_ui/compare/v0.20.1...v0.20.2
[0.20.1]: https://github.com/UMPORG/mutual_ui/compare/v0.20.0...v0.20.1
[0.20.0]: https://github.com/UMPORG/mutual_ui/compare/v0.19.1...v0.20.0
[0.19.1]: https://github.com/UMPORG/mutual_ui/compare/v0.19.0...v0.19.1
[0.19.0]: https://github.com/UMPORG/mutual_ui/compare/v0.18.3...v0.19.0
[0.18.3]: https://github.com/UMPORG/mutual_ui/compare/v0.18.2...v0.18.3
[0.18.2]: https://github.com/UMPORG/mutual_ui/compare/v0.18.1...v0.18.2
[0.18.1]: https://github.com/UMPORG/mutual_ui/compare/v0.18.0...v0.18.1
[0.18.0]: https://github.com/UMPORG/mutual_ui/compare/v0.17.0...v0.18.0
[0.17.0]: https://github.com/UMPORG/mutual_ui/compare/v0.16.2...v0.17.0
[0.16.2]: https://github.com/UMPORG/mutual_ui/compare/v0.16.1...v0.16.2
[0.16.1]: https://github.com/UMPORG/mutual_ui/compare/v0.16.0...v0.16.1
[0.16.0]: https://github.com/UMPORG/mutual_ui/compare/v0.15.2...v0.16.0
[0.15.2]: https://github.com/UMPORG/mutual_ui/compare/v0.15.1...v0.15.2
[0.15.1]: https://github.com/UMPORG/mutual_ui/compare/v0.15.0...v0.15.1
[0.15.0]: https://github.com/UMPORG/mutual_ui/compare/v0.14.0...v0.15.0
[0.14.0]: https://github.com/UMPORG/mutual_ui/compare/v0.13.2...v0.14.0
[0.13.2]: https://github.com/UMPORG/mutual_ui/compare/v0.13.1...v0.13.2
[0.13.1]: https://github.com/UMPORG/mutual_ui/compare/v0.13.0...v0.13.1
[0.13.0]: https://github.com/UMPORG/mutual_ui/compare/v0.12.1...v0.13.0
[0.12.1]: https://github.com/UMPORG/mutual_ui/compare/v0.12.0...v0.12.1
[0.12.0]: https://github.com/UMPORG/mutual_ui/compare/v0.11.3...v0.12.0
[0.11.3]: https://github.com/UMPORG/mutual_ui/compare/v0.11.2...v0.11.3
[0.11.2]: https://github.com/UMPORG/mutual_ui/compare/v0.11.1...v0.11.2
[0.11.1]: https://github.com/UMPORG/mutual_ui/compare/v0.11.0...v0.11.1
[0.11.0]: https://github.com/UMPORG/mutual_ui/compare/v0.10.1...v0.11.0
[0.10.1]: https://github.com/UMPORG/mutual_ui/compare/v0.10.0...v0.10.1
[0.10.0]: https://github.com/UMPORG/mutual_ui/compare/v0.9.8...v0.10.0
[0.9.8]: https://github.com/UMPORG/mutual_ui/compare/v0.9.7...v0.9.8
[0.9.7]: https://github.com/UMPORG/mutual_ui/compare/v0.9.6...v0.9.7
[0.9.6]: https://github.com/UMPORG/mutual_ui/compare/v0.9.5...v0.9.6
[0.9.5]: https://github.com/UMPORG/mutual_ui/compare/v0.9.4...v0.9.5
[0.9.4]: https://github.com/UMPORG/mutual_ui/compare/v0.9.3...v0.9.4
[0.9.3]: https://github.com/UMPORG/mutual_ui/compare/v0.9.2...v0.9.3
[0.9.2]: https://github.com/UMPORG/mutual_ui/compare/v0.9.1...v0.9.2
[0.9.1]: https://github.com/UMPORG/mutual_ui/compare/v0.9.0...v0.9.1
[0.9.0]: https://github.com/UMPORG/mutual_ui/compare/v0.8.9...v0.9.0
[0.8.9]: https://github.com/UMPORG/mutual_ui/compare/v0.8.8...v0.8.9
[0.8.8]: https://github.com/UMPORG/mutual_ui/compare/v0.8.7...v0.8.8
[0.8.7]: https://github.com/UMPORG/mutual_ui/compare/v0.8.6...v0.8.7
[0.8.6]: https://github.com/UMPORG/mutual_ui/compare/v0.8.5...v0.8.6
[0.8.5]: https://github.com/UMPORG/mutual_ui/compare/v0.8.4...v0.8.5
[0.8.4]: https://github.com/UMPORG/mutual_ui/compare/v0.8.3...v0.8.4
[0.8.3]: https://github.com/UMPORG/mutual_ui/compare/v0.8.2...v0.8.3
[0.8.2]: https://github.com/UMPORG/mutual_ui/compare/v0.8.1...v0.8.2
[0.8.1]: https://github.com/UMPORG/mutual_ui/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/UMPORG/mutual_ui/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/UMPORG/mutual_ui/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/UMPORG/mutual_ui/compare/v0.5.1...v0.6.0
[0.5.1]: https://github.com/UMPORG/mutual_ui/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/UMPORG/mutual_ui/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/UMPORG/mutual_ui/compare/v0.3.3...v0.4.0
[0.3.3]: https://github.com/UMPORG/mutual_ui/compare/v0.3.2...v0.3.3
[0.3.2]: https://github.com/UMPORG/mutual_ui/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/UMPORG/mutual_ui/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/UMPORG/mutual_ui/compare/v0.2.3...v0.3.0
[0.2.3]: https://github.com/UMPORG/mutual_ui/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/UMPORG/mutual_ui/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/UMPORG/mutual_ui/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/UMPORG/mutual_ui/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/UMPORG/mutual_ui/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/UMPORG/mutual_ui/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/UMPORG/mutual_ui/tree/v0.1.0
