# Assistant: conversation components, floating assistant, forms

The Assistente app itself is `UMPORG/mutual_assistente` (ADR 0006). Calls are same-origin
(`/api/v1/assistente/*`); errors come back as pt-PT messages (`mensagemDoErro`).

## Conversation components (`@umporg/ui/conversa`)

The app owns threads, messages, streaming and tools; the components render `ChatMessageData` (`role`
user / assistant / system / error, `content` in Markdown, `status` streaming / done / stopped / error,
`sources`, `feedback`).

```tsx
<ChatLayout className="h-dvh"
  threads={<ThreadList threads={…} activeId={id} hrefFor={(t) => `/assistente/${t.id}`} LinkComponent={Link} onNew onRename onDelete />}
  header={<ConversationTitle title={titulo} onRename={…} />}
  composer={<Composer onSubmit={enviar} onStop={parar} streaming={aEscrever} maxLength={4000} actions={<AttachButton … />} />}>
  <MessageList messages={mensagens} LinkComponent={Link} thinking={{ steps }} onRetry onFeedback
    empty={<ChatEmptyState prompts={[…]} onSelect={enviar} backdrop={<PontosFundo />} />} />
</ChatLayout>
```

- `ChatLayout` renders a `<div>` and a labelled `<section>` (it lives inside the shell's `<main>`).
- Replies are Markdown rendered as React elements (never HTML): raw HTML shows as text, links limited to
  http(s) / mailto / tel / relative, images become links, code blocks have «Copiar», tables scroll, «[1]»
  markers link to `sources`. While streaming, unclosed markers are hidden.
- Screen readers hear «O assistente está a responder.» once, then the reply as plain text (cut near 600
  characters); errors once, assertively. Every message has a hidden heading.
- The list follows new text only while the person is at the bottom («Ir para o fim»); long threads render
  the last 60 messages («Mostrar mensagens anteriores»).
- Composer: Enter sends, Shift + Enter new line (IME-safe), Esc stops; counter from 80% of the limit; the
  line «As respostas podem conter erros. O que é enviado» links to `/assistente/transparencia`.
- `ActionCard` proposes a change; nothing happens until «Aplicar»; the card stays as the record.
- Sources: `kind: "ajuda"` (help-centre page) or `"registo"` (an app record; `app` gives its accent).
- `ThreadList` shows `ChatThread.subtitle` (where the conversation started).

## Floating assistant (`@umporg/ui/assistente`)

- The app passes `assistente={eu.assistenteNaPagina ? <ChatFlutuante app="…" /> : undefined}` to
  `AppShell`; nothing else is mounted by hand. Not in the Assistente app, not in the Cartão. The shell
  shows «Assistente» next to Ajuda (icon only on phones; a dot when a reply arrived while minimised) and
  keeps the chat mounted across navigation.
- **No `LinkComponent`**: reply links are paths from the MUTU@L root (`/ajuda/…`, `/ir/…`) and are
  plain `<a>` (a Next `Link` would add the app's basePath; the prop is ignored).
- Non-modal `role="dialog"` portalled to `<body>`: dragged by its header to the nearest of four corners
  (spring only after a move the person made; «Mover» + arrow keys; corner announced); below 40rem a
  bottom sheet. Esc minimises it (a dialog opened from the chat closes only itself). On first open the
  window takes focus until `GET /assistente/estado` loads, then the message box.
- Offers «Conversas», «Nova conversa», «Abrir no Assistente» (`/assistente/c/<id>`), documents
  (`AttachButton`, capability `ficheiros`), drafted texts (`RascunhoTexto`), proposed drafts
  (`ActionCard`).
- Stacking: floating widgets publish their footprint with `useRegistoPosicoes().publicar(id, rect)` (one
  registry per page by default; `ProvedorPosicoes` isolates one). `DemoPreencher` already does; it never
  moves for the chat — the chat stacks above it with a 12px gap, shrinks, or mirrors
  (`posicaoDoChat`). At phone width the sheet sets `data-demo-folha` and the demo pill docks at the bottom.
- Pure logic in `src/assistente-posicao.ts`, `src/assistente-contexto.ts`, `src/assistente-api.ts`,
  tested in `tests/assistente.test.ts`.

## Page context (`useContextoAssistente`, main entry)

`useContextoAssistente({ app, pagina, seccao?, dados | campos, formulario?, alvo?, aoAplicar? })`:

- `dados` maps a draft path to a value or `{ valor, rotulo, sensivel, editavel }`. Mark personal data
  `sensivel` (the model only learns it is filled) and the fields the assistant may propose `editavel`.
  Saúde never publishes fields (clinical data; the server drops them anyway).
- **List pages** publish each row with the same columns the table shows (formatted dates, status labels,
  not enums), the active filters and the sort order, so «qual foi a última…?» can be answered; people's
  emails, phones, names and NIF out or `sensivel`.
- Normalised (≤ 80 fields, values ≤ 300 characters, record ids out of the route), hashed, and sent with
  the next question only when changed; the server gives the model only the difference.
- A stack of publishers: a dialog that publishes its own context and closes gives the page's context back.
- With `formulario` the chat offers «O que falta?»; with `alvo` + `aoAplicar` «Com um documento»; with
  `aoAplicar`, values proposed for the section (SSE `propostas`) are reviewed (`RevisaoPropostas`) and
  «Aplicar N valores» calls `aoAplicar` — only on the page they were proposed for. **Nothing is ever
  submitted**: `aoAplicar` writes the DRAFT (`aplicarValores(rascunho, valores)`).

## In forms (`@umporg/ui/preencher`)

- `PreencherComDocumento({ alvo, nomeFormulario, valoresAtuais, aoAplicar })`: «Preencher com um
  documento» (PDF, Word, Excel, CSV, image, scans). The Cérebro reads it (`POST
  /api/v1/assistente/ficheiros` + `/extracoes`, polled with a progress bar); the review shows per field the
  current value, the proposal, where it came from and a confidence badge. New high/medium values start
  ticked; replacing a value the person wrote or a low-confidence one starts unticked. «Aplicar N valores ao
  rascunho» → `aoAplicar({ caminho: valor })`.
- `ListaDoQueFalta({ dados })`: «O que falta?» by chapter with a link per field
  (`pedirOQueFalta(fetch, "caracterizacao" | "simplex")`).
- `RascunhoTexto({ tipo, titulo, texto, onUsar })`: editable drafted text with «Copiar» and «Usar»
  (also in `/conversa` for the SSE `rascunho` event); `pedirTexto(fetch, …)` → `POST /redigir`.
