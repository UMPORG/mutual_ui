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

O Cartão Digital (associados) mantém o seu endereço próprio.

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
- **CORS**: mesma origem → `CORS_ORIGINS` só com o Cartão Digital (e
  localhost em desenvolvimento). `trustedOrigins` = `MUTUAL_URL` + Cartão.
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
