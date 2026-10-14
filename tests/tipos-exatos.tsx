/** Teste de TIPOS (não corre), compilado com `exactOptionalPropertyTypes` (`pnpm typecheck`): toda a prop/opção opcional de cada export tem de aceitar `undefined` explícito. O export que falhe aparece pelo nome no erro de `falhas`. */
import type * as Raiz from "../src/index";
import type * as Controlos from "../src/controlos";
import type * as Datas from "../src/datas";
import type * as Graficos from "../src/graficos";
import type * as Conversa from "../src/conversa";
import type * as Markdown from "../src/markdown";
import type * as Efeitos from "../src/efeitos";
import type * as Sso from "../src/sso";
import type * as Formatar from "../src/formatar";
import type * as Validar from "../src/validar";
import type * as Calendario from "../src/calendario";
import type * as Preferencias from "../src/preferencias";
import type * as Apps from "../src/apps";
import type * as Monitor from "../src/monitor";
import type * as Assistente from "../src/assistente-chat";
import type * as AssistenteApi from "../src/assistente-api";
import type * as MonitorReact from "../src/monitor-react";
import { buttonClasses } from "../src/basicos";
import { Switch } from "../src/escolhas";

type ChavesOpcionais<P> = { [K in keyof P]-?: {} extends Pick<P, K> ? K : never }[keyof P];
type ComUndefined<P> = { [K in ChavesOpcionais<P>]: undefined };
type AceitaUndefined<P> = P extends object
  ? P extends readonly unknown[] | Node | Date | ((...a: never[]) => unknown)
    ? true
    : ComUndefined<P> extends Pick<P, ChavesOpcionais<P>>
      ? true
      : false
  : true;
type ParametrosOk<F> = F extends (...a: infer A) => unknown
  ? false extends { [I in keyof A]: AceitaUndefined<NonNullable<A[I]>> }[number]
    ? false
    : true
  : true;
type Falhas<M> = { [K in keyof M]: ParametrosOk<M[K]> extends true ? never : K }[keyof M];

type Todas =
  | Falhas<typeof Raiz>
  | Falhas<typeof Controlos>
  | Falhas<typeof Datas>
  | Falhas<typeof Graficos>
  | Falhas<typeof Conversa>
  | Falhas<typeof Markdown>
  | Falhas<typeof Efeitos>
  | Falhas<typeof Sso>
  | Falhas<typeof Formatar>
  | Falhas<typeof Validar>
  | Falhas<typeof Calendario>
  | Falhas<typeof Preferencias>
  | Falhas<typeof Apps>
  | Falhas<typeof Monitor>
  | Falhas<typeof Assistente>
  | Falhas<typeof AssistenteApi>
  | Falhas<typeof MonitorReact>;

export const falhas: never = null as unknown as Todas;

declare const talvez: boolean | undefined;
declare const texto: string | undefined;
export const classes = buttonClasses({ iconOnly: talvez, className: texto, variant: undefined, size: undefined });
export const interruptor = (
  <Switch label="Ligada" checked={talvez} aria-label={texto} aria-labelledby={texto} onCheckedChange={undefined} />
);
