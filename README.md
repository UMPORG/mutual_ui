# @umporg/ui — MUTU@L design system

Tokens, brand, shell pieces and the single-sign-on contract shared by every
MUTU@L application (Portal, Backoffice, Eventos, Simplex, Saúde, Validador QR).

```jsonc
"@umporg/ui": "github:UMPORG/mutual_ui#v0.2.1"
```

```css
@import "tailwindcss";
@import "@umporg/ui/css/index.css";
```

```tsx
import { MutualWordmark, AppSwitcher, PageHeader, StatusCallout } from "@umporg/ui";
import { portalLoginUrl, safeReturnUrl } from "@umporg/ui/sso";
```

Next.js apps must add `transpilePackages: ["@umporg/ui"]`.

See [AGENTS.md](AGENTS.md) for the visual identity (v2), the shell per
audience, the UX rules and the SSO contract.
