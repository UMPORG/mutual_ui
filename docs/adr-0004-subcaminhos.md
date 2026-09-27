# ADR 0004 — Um só endereço com subcaminhos (sem subdomínios)

Estado: aceite pelo dono (2026-09-25). Substitui o modelo de um subdomínio
por aplicação (`portal.`, `eventos.`, `simplex.`… `.mutualismo.pt`) e o
cookie de sessão partilhado pelo domínio-pai (`AUTH_COOKIE_DOMAIN`).

## Decisão

Todas as aplicações dos funcionários e o site público de eventos vivem num
**só endereço** (`MUTUAL_URL`, produção `https://mutual.mutualismo.pt`;
staging e demonstração têm o seu próprio endereço com o mesmo desenho):

| Caminho | Serviço | Notas |
| --- | --- | --- |
| `/` | Portal | entrar, lançador, `/acessos`, `/organizacao`, `/convite/…`, `/ir/…`, centro de ajuda em `/ajuda` |
| `/backoffice` | Backoffice | Next `basePath: "/backoffice"` |
| `/eventos` | Eventos | site público na raiz do `basePath`; área de gestão em `/eventos/gestao` |
| `/simplex` | Simplex | `basePath: "/simplex"` |
| `/saude` | Saúde | `basePath: "/saude"` |
| `/qr` | Validador QR | `basePath: "/qr"` (PWA com `scope: /qr/`) |
| `/api` | Cérebro | `/api/v1/*`, `/api/auth/*` — sem remover o prefixo |

O Cartão Digital (associados) mantém o seu endereço próprio — ver a exceção
abaixo.

### Exceção: Cartão Digital em `id.mutualismo.pt` (dono, 2026-09-27)

O Cartão Digital é a app dos **associados** (não da UMP nem das equipas das
associações) e é o **único** serviço fora de `MUTUAL_URL`: vive em
`CARTAO_DIGITAL_URL` (produção `https://id.mutualismo.pt`), na raiz desse
anfitrião (sem `basePath`; PWA, manifesto e service worker em `/`).

- **Sessões separadas**: o servidor do Cartão encaminha `/api/auth/*` e uma
  lista fechada de `/api/v1/*` (as rotas do associado: `cartao/*`,
  `eventos/cartao*`, inscrição em eventos, imagens `files/*`, `health`) para o
  Cérebro. O browser só fala com `id.mutualismo.pt`; o cookie do Better Auth
  (sem `Domain`) fica só desse anfitrião — nunca visível em
  `mutual.mutualismo.pt`, e vice-versa. A lista fechada impede que uma sessão
  aberta no Cartão (de alguém que também é da equipa) chegue às rotas da
  equipa através dele. Sem CORS nem cookies de terceiros.
- **Ligações dos emails** (verificar email, repor palavra-passe) pedidas no
  Cartão passam pelo anfitrião do Cartão (`ligacaoDeConta` em
  `src/lib/enderecos.ts`): com `autoSignInAfterVerification`, a sessão nasce
  aí e não no anfitrião da equipa.
- `trustedOrigins` inclui `CARTAO_DIGITAL_URL` (os `callbackURL` e o `Origin`
  dos pedidos do Cartão). Fora de produção, por omissão,
  `http://127.0.0.1:3002` — `127.0.0.1` e não `localhost`, porque os cookies
  ignoram a porta e em `localhost` a sessão do associado misturar-se-ia com a
  da equipa no gateway `:8080`.
- Sem contas Google/Apple (retiradas pelo dono): só email e palavra-passe,
  com verificação do email e código por email.
- A app nativa (Capacitor) abre o mesmo `CARTAO_DIGITAL_URL`.
- O Portal tem uma ligação discreta «É associado? Abra o Cartão Digital» para o
  endereço absoluto do Cartão (`@umporg/ui` › `urlCartao`).


Os caminhos são **constantes** (em `@umporg/ui` → `CAMINHOS`), não
configuração. Só o endereço base varia por ambiente.

## Consequências técnicas

- **Sessão**: cookie do Better Auth só do anfitrião (`__Secure-` em https),
  sem `Domain`. Removidos `AUTH_COOKIE_DOMAIN`, `crossSubDomainCookies`,
  `PREFERENCIAS_COOKIE_DOMAIN`. O cookie de preferências também é só do
  anfitrião — partilhado por todas as apps por serem a mesma origem.
- **Chamadas à API**: o browser chama `/api/v1/…` e `/api/auth/…` na mesma
  origem. **Removem-se** os `rewrites`/proxies `/api/auth` e `/api/v1` de cada
  app e a variável de build `CEREBRO_URL`. As rotas próprias de cada app ficam
  debaixo do seu `basePath` (ex.: `/simplex/api/health`); o Portal move as
  suas (`/api/status`, `/api/health`) para fora de `/api` (ex.:
  `/estado-servicos`, `/saude-portal` — a decidir pelo Portal, documentado).
- **Chamadas do servidor** (RSC, `proxy.ts`, route handlers) usam
  `CEREBRO_URL_INTERNO` (opcional, runtime; ex.: a rede interna do Coolify)
  e, por omissão, `${MUTUAL_URL}/api`.
- **CORS**: mesma origem → `CORS_ORIGINS` só para origens extra de
  desenvolvimento (o Cartão encaminha pelo seu servidor e não precisa de CORS).
  `trustedOrigins` = `MUTUAL_URL` + Cartão.
- **SSO**: `portalLoginUrl()` passa a devolver caminhos relativos
  (`/login?next=/simplex/…`); `safeReturnUrl` só aceita caminhos da mesma
  origem. Sem `PORTAL_URL`, `APP_URL` nem `PORTAL_*_URL`.
- **Emails** (repor palavra-passe, convites, confirmações de inscrição,
  certificados) constroem ligações com `MUTUAL_URL` + caminho.
- **Segurança**: uma origem partilhada aumenta o alcance de um XSS numa app.
  Mitigação: CSP estrita por app (já existe), `localStorage` com prefixo por
  app, sem `dangerouslySetInnerHTML` com dados de utilizador.

## Configuração (depois)

Cada app Next: **`MUTUAL_URL`** (runtime) e, opcional,
`CEREBRO_URL_INTERNO` + `DEMO_MODE`. Saúde mantém os seus segredos.
Cérebro: `MUTUAL_URL`, `CARTAO_DIGITAL_URL` e os segredos; tudo o resto
(BETTER_AUTH_URL, PORTAL_URL, PUBLIC_EVENTOS_URL, CORS, cookie) é derivado.
Segredos comuns definidos uma vez como **Shared Variables** do Coolify
(nível projeto/ambiente) e referenciados em cada serviço.

## Coolify

Cada app continua um serviço próprio, com o domínio
`https://mutual.mutualismo.pt/<caminho>` (Portal: `https://mutual.mutualismo.pt`,
Cérebro: `https://mutual.mutualismo.pt/api`). O Traefik encaminha pelo
prefixo mais longo; **não** remover o prefixo (o `basePath` espera-o).
Health checks passam a `/<caminho>/api/health`.

## Desenvolvimento local

Um gateway local (`mutual_portal/scripts/gateway-local.ts`, Bun, sem
dependências) em `http://localhost:8080` encaminha os mesmos caminhos para as
portas de cada app e para o Cérebro — o mesmo desenho que em produção.
