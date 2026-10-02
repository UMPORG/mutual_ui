# One origin, SSO, Cérebro calls, security headers, monitoring

## One origin (ADR 0004, [../adr-0004-subcaminhos.md](../adr-0004-subcaminhos.md))

- Every staff app and the public events site live on ONE origin `MUTUAL_URL` (production
  `https://mutual.mutualismo.pt`) at fixed paths (`CAMINHOS`): Portal `/`, `/backoffice`, `/eventos`
  (organisers `/eventos/gestao`), `/simplex`, `/saude`, `/qr`, `/dns`, `/assistente`, `/protocolos`,
  `/monitor`, help centre `/ajuda`, Cérebro `/api`. No sub-domains.
- Next apps set `basePath` to their path (Portal: none). Browsers call the Cérebro at `/api/v1` and
  `/api/auth` on the same origin (no rewrites); server code uses `CEREBRO_URL_INTERNO` or
  `${MUTUAL_URL}/api`.
- Cookies are host-only (no cookie domain). `localStorage` keys are prefixed `<app>.`; the only shared
  prefix is the floating assistant's `assistente.flutuante.*` (open, corner, conversation id — never
  message contents).
- The **Cartão Digital** is the one exception: its own host (`CARTAO_URL_PRODUCAO` =
  `https://id.mutualismo.pt`, locally `http://127.0.0.1:3002`), no `basePath`, own session, not in
  `CAMINHOS` nor `MUTUAL_APPS`. Links into it: `urlCartao(base?, caminho?)`; its name: `APP_CARTAO`,
  `nomeDaApp("cartao")`.

## SSO and access

- Login/2FA only on the Portal: `portalLoginUrl(caminhoDoPedido(request.url), "sem-sessao")` (relative
  `/login?next=…`); `safeReturnUrl` accepts same-origin paths only; logout → `portalAfterLogoutUrl()`.
  Emails and other out-of-band links: `urlAbsoluta(MUTUAL_URL, caminho)`.
- Access comes from profiles in `GET /api/v1/acessos/eu` (`apps.<id>` not null = can use the app;
  `apps.<id>.nome` = profile name), never from a login role. No access → `<SemAcesso …>`.

## Lançamento

`GET /api/v1/acessos/eu` → `lancamento` (same JSON public at `GET /api/v1/publico/lancamento`):

```json
{ "appsDesligadas": ["eventos"],
  "paginasDesligadas": { "backoffice": ["/associacao/pagamentos"] },
  "assistente": { "desligado": false, "paginasDesligadas": { "backoffice": ["/associacao/caracterizacao"] } } }
```

- A missing field = everything on. Page entries are path prefixes relative to the app's basePath,
  matched on segments (`/a/b` covers `/a/b/c`, not `/a/bc`). The Portal is never switched off.
- Pure, server-safe helpers (`@umporg/ui/apps` and main entry): `lancamentoDe(eu)` (normalised,
  tolerant), `appLigada(lanc, app)`, `paginaLigada(lanc, app, caminho)`, `assistenteLigado(lanc, app,
  caminho)`, `filtrarNavPorLancamento(grupos, lanc, app)`, `appsDisponiveis(eu.apps, eu.lancamento)`
  (the Validador QR goes with Eventos).
- Wiring: `AppShell lancamento={eu.lancamento}`; pages with `paginaLigada` + `<EmBreve />`
  ([shell.md](shell.md#lançamento)).
- The Cérebro enforces it: a switched-off app's API answers 503 `APP_INDISPONIVEL`; the assistant 503
  `ASSISTENTE_INDISPONIVEL`, which the chat shows as a calm note (`TEXTO_ASSISTENTE_INDISPONIVEL`).

## Cérebro calls (`@umporg/ui/cerebro`)

- `pedirAoCerebro(url, { tempoLimiteMs, falharEm5xx, ...fetchInit })` with `TEMPO_LIMITE_CEREBRO_MS`
  (`proxy` 5 s, `servidor` 10 s, `browser` 15 s). No connection, timeout or (by default) a 5xx throw
  `CerebroIndisponivel` (`motivo`: `rede` | `tempo-esgotado` | `estado`); 4xx are returned (401 = no
  session, never «unavailable»). The caller's own abort stays an `AbortError`.
- `proxy.ts` **rewrites** to `PAGINA_INDISPONIVEL` (`/indisponivel`) with status 503 and
  `CABECALHOS_INDISPONIVEL` (`Retry-After: 120`, `no-store`), rendering `ServicoIndisponivel`
  (`TEXTOS_INDISPONIVEL` for browser states). Never redirect to the Portal login (the Portal sees the
  valid session and sends the person back: a loop); no Portal link on it.

## Security headers (`@umporg/ui/seguranca`)

Every app gets the SAME strict policy; an app only adds what it needs (`PermissoesCsp`: `script`,
`connect`, `img`, `style`, `font`, `frame`, `worker`, `media`, `frameAncestors`), never loosens the base.

- `cabecalhosNext({ producao, funcionalidades?, enquadrar? })` in `next.config` `headers()`: nosniff,
  `Referrer-Policy`, `Permissions-Policy` (all `()` unless asked, e.g. `{ camera: ["self"] }` for a QR
  reader), COOP, `Cross-Origin-Resource-Policy: same-origin`, `X-Frame-Options: DENY`,
  `Origin-Agent-Cluster`, HSTS when `producao`. **Never a CSP in `next.config`** (two CSP headers
  intersect and the static one has no nonce).
- `comCsp(request.headers, { dev, permissoes })` in `proxy.ts` on EVERY page request (matcher skips
  `_next/static`, images and `/api`): fresh nonce, `script-src 'self' 'nonce-…' 'strict-dynamic'` (no
  `unsafe-eval` outside `next dev`), `frame-ancestors 'none'`, `object-src 'none'`, `base-uri`/
  `form-action 'self'`. Return `NextResponse.next({ request: { headers: cabecalhosPedido } })` (or a
  rewrite with the same request headers) and set `Content-Security-Policy` on the response.
- The root layout reads `(await headers()).get(NONCE_CABECALHO)` (`x-nonce`) and passes it to
  `<PreferenciasScript nonce>` (this makes every page dynamic, which the nonce requires).

## Monitoring (ADR 0007, `@umporg/ui/monitor`)

Errors go to the Cérebro module `monitor` and appear in the Monitorização app (`/monitor`).

```ts
// instrumentation.ts (Node runtime; see mutual_backoffice for the full file)
const { criarOnRequestError } = await import("@umporg/ui/monitor");
await criarOnRequestError({
  app: "backoffice", cerebroUrl: e.CEREBRO_URL_INTERNO ?? e.MUTUAL_URL, chave: e.MONITOR_CHAVE, versao: e.SOURCE_COMMIT,
})(erro, pedido, contexto);
```

- `reportarErro(erro, { app, lado?, versao?, endpoint?, chave?, url?, pedidoId?, contexto? })` →
  `POST /api/v1/monitor/erros`; never throws, 3 s timeout. Browser: same origin, deduped (same error at
  most once a minute, 20 per page), browser noise ignored. Server: needs the `monitor` Machine Key
  (`MONITOR_CHAVE`, server-only) — without it nothing is sent.
- `instalarReporteGlobal`, `serializarErro`, `CABECALHO_PEDIDO` (`x-pedido-id`), `pedidoIdDe(headers)`,
  `cabecalhosComPedido(id)`, `novoPedidoId()`: server code that calls the Cérebro forwards the incoming
  `x-pedido-id` so page, API call, logs and error are linked.
- `/monitor/react`: `<MonitorCliente app versao />` once in the root layout; `<ErroReportado error reset
  app inicio? />` as the body of `error.tsx`/`global-error.tsx`; `useReportarErro`; `<FronteiraErro app
  alternativa?>` for a part of a page that may fail on its own.
- Never report bodies, cookies or form values; the Cérebro redacts again and keeps only the normalised
  path of `url`.
