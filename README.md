# @umporg/ui — MUTU@L design system

Tokens, brand, shell pieces, data components (cards, stat tiles, charts,
tables, pt-PT formatting) and the single-sign-on contract shared by every
MUTU@L application (Portal, Backoffice, Eventos, Simplex, Saúde, Servidores e
DNS, Validador QR).

```jsonc
"@umporg/ui": "github:UMPORG/mutual_ui#v0.8.0"
```

```css
@import "tailwindcss";
@import "@umporg/ui/css/index.css";
```

```tsx
import { MutualWordmark, AppSwitcher, PageHeader, StatusCallout } from "@umporg/ui";
import { StatCard, StatGroup, Card, CardHeader, DataTable, formatarMoeda } from "@umporg/ui";
import { GraficoBarras } from "@umporg/ui/graficos"; // needs recharts (optional peer)
import { portalLoginUrl, safeReturnUrl } from "@umporg/ui/sso";
import { FormField, Input, Button, Stepper } from "@umporg/ui";                // server-safe
import { Select, Combobox, ConfirmDialog, toast } from "@umporg/ui/controlos"; // needs @base-ui/react
import { DatePicker, DateRangePicker } from "@umporg/ui/datas";
import { ConstelacaoFundo, MomentoSucesso } from "@umporg/ui/efeitos";
import { ChatLayout, MessageList, Composer } from "@umporg/ui/conversa";
```

Next.js apps must add `transpilePackages: ["@umporg/ui"]`.

See [AGENTS.md](AGENTS.md) for the visual identity (v2), the shell per
audience, the UX rules and the SSO contract.
