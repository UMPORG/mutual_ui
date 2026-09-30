# @umporg/ui — MUTU@L design system

Tokens, brand, app icons, the desk shell (shell G), data components (cards, stat tiles, charts, tables,
pt-PT formatting), form controls and overlays, the assistant's components, decorative effects, and the
single-sign-on, security-header and monitoring helpers shared by every MUTU@L app.

```jsonc
"@umporg/ui": "github:UMPORG/mutual_ui#vX.Y.Z"   // always a tag
```

```css
@import "tailwindcss";
@import "@umporg/ui/css/index.css";
```

Next.js apps add `transpilePackages: ["@umporg/ui"]`.

```bash
pnpm install && pnpm typecheck && pnpm test
```

Rules: [CLAUDE.md](CLAUDE.md). Guide by topic (setup, shell, forms, data, platform, assistant, demo):
[docs/guia/README.md](docs/guia/README.md).
