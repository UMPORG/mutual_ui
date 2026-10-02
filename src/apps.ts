/**
 * The MUTU@L applications, as every app names and describes them.
 * Addresses are NOT here: the fixed paths are `CAMINHOS` and the Cartão's
 * host `urlCartao` (sso.ts); only the origin `MUTUAL_URL` varies per deployment.
 */

export type MutualAppId = "portal" | "backoffice" | "eventos" | "simplex" | "qr" | "saude" | "dns" | "assistente" | "protocolos" | "monitor" | "cartao" | "carta";
/** Apps served under the shared host (ADR 0004). The Cartão Digital has its own. */
export type AppNoEndereco = Exclude<MutualAppId, "cartao">;

/**
 * The Cartão Digital: the associados' own app (not for UMP or association
 * teams). The only app on another host (`urlCartao`, ADR 0004 exception), so
 * it is not in `MUTUAL_APPS` (the Portal launcher and the app switcher list
 * the staff apps).
 */
export const APP_CARTAO = {
  id: "cartao",
  nome: "Cartão Digital",
  descricao: "O seu cartão de associado: identificação, quotas, benefícios, eventos e saúde.",
  publico: "Associados das associações mutualistas",
  palavrasChave: ["cartão de associado", "sócio", "quotas", "benefícios", "descontos", "identificação"],
  publica: false,
} as const;

export interface MutualApp {
  id: Exclude<AppNoEndereco, "portal">;
  nome: string;
  /** One line, shown under the name in the Portal and in the app switcher. */
  descricao: string;
  /** Who the app is for — drives its shell; shown in the Portal. */
  publico: string;
  /** Search synonyms (Portal Ctrl+K). Never displayed. */
  palavrasChave: string[];
  /** Public app (no login, e.g. the Validador QR). Access to the others comes
   *  from the person's profile in the active organisation
   *  (`GET /api/v1/acessos/eu` → `apps.<id>`). */
  publica: boolean;
}

export const MUTUAL_APPS: readonly MutualApp[] = [
  {
    id: "backoffice",
    nome: "Backoffice",
    descricao: "Associações e associados: quotas, licenças, documentos e caracterização.",
    publico: "Serviços administrativos da UMP e dirigentes das associações",
    palavrasChave: ["quotas", "pagamentos", "membros", "sócios", "fichas", "licenciamento", "dados das associações"],
    publica: false,
  },
  {
    id: "eventos",
    nome: "Eventos",
    descricao: "Eventos e formações: inscrições, convites, presenças e relatórios.",
    publico: "Organizadores (UMP e associações) e participantes",
    palavrasChave: ["inscrições", "bilhetes", "formações", "atividades", "calendário", "participantes"],
    publica: false,
  },
  {
    id: "simplex",
    nome: "Simplex",
    descricao: "Contas das associações: balanços, orçamentos, reportes e diagnóstico.",
    publico: "Tesoureiros, contabilistas e direções",
    palavrasChave: ["contabilidade", "finanças", "orçamento", "contas", "tesouraria", "balanço", "relatórios financeiros"],
    publica: false,
  },
  {
    id: "saude",
    nome: "Saúde",
    descricao: "Balcão, agenda e marcações, utentes e registo clínico.",
    publico: "Rececionistas, profissionais de saúde e gestores de clínica",
    palavrasChave: ["consultas", "marcações", "agenda", "clínica", "médico", "enfermagem", "utentes", "atendimento", "balcão"],
    publica: false,
  },
  {
    id: "dns",
    nome: "Servidores e DNS",
    descricao: "Endereços da MUTU@L e os servidores onde vivem, sem complicações.",
    publico: "Equipa de informática da UMP",
    palavrasChave: ["dns", "servidores", "domínios", "subdomínios", "cloudflare", "vps", "coolify", "endereços"],
    publica: false,
  },
  {
    id: "assistente",
    nome: "Assistente",
    descricao: "Respostas sobre as aplicações e os seus dados, com ligações para a ajuda.",
    publico: "Equipas da UMP e das associações com acesso ao piloto",
    palavrasChave: ["ia", "inteligência artificial", "chat", "conversa", "perguntas", "dúvidas", "ajuda"],
    publica: false,
  },
  {
    id: "protocolos",
    nome: "Protocolos",
    descricao: "Protocolos e parcerias: propostas das empresas, negociação, validação no balcão e relatórios.",
    publico: "Empresas parceiras, associações e UMP",
    palavrasChave: ["parcerias", "benefícios", "descontos", "convenções", "empresas parceiras", "propostas", "balcão"],
    publica: false,
  },
  {
    id: "monitor",
    nome: "Monitorização",
    descricao: "Estado das aplicações, erros, entradas e segurança, desempenho e tarefas, em linguagem simples.",
    publico: "Equipa de informática da UMP",
    palavrasChave: ["monitorização", "erros", "disponibilidade", "segurança", "ips", "países", "registos", "logs", "alertas", "desempenho"],
    publica: false,
  },
  {
    id: "qr",
    nome: "Validador QR",
    descricao: "Leitura de cartões de associado e bilhetes à entrada.",
    publico: "Funcionários à entrada de eventos e balcões de atendimento",
    palavrasChave: ["scanner", "leitor", "código qr", "entradas", "check-in", "controlo de acessos"],
    publica: true,
  },
  {
    id: "carta",
    nome: "Carta Social Mutualista",
    descricao: "As associações mutualistas e o que oferecem: pesquisa, mapa e indicadores.",
    publico: "Todas as pessoas (público), e a UMP na versão completa",
    palavrasChave: ["carta social", "mapa", "associações mutualistas", "indicadores", "respostas sociais", "saúde", "farmácias", "pesquisa"],
    publica: true,
  },
] as const;

export function getMutualApp(id: MutualAppId): MutualApp | undefined {
  return MUTUAL_APPS.find((a) => a.id === id);
}

/** The display name of any app ("Portal", "Cartão Digital", "Eventos"…). */
export function nomeDaApp(id: MutualAppId): string | undefined {
  if (id === "portal") return "Portal";
  if (id === "cartao") return APP_CARTAO.nome;
  return getMutualApp(id)?.nome;
}

// ─── Lançamento (launch switches) ────────────────────────────────────────────

/**
 * The launch switches the UMP sets in the Cérebro (`GET /api/v1/acessos/eu` →
 * `lancamento`, and the public `GET /api/v1/publico/lancamento`). A missing
 * field means everything is on. Page entries are path PREFIXES relative to
 * the app's basePath (like `caminhoAtual`). An API call of a switched-off app
 * answers 503 `APP_INDISPONIVEL`; the assistant 503 `ASSISTENTE_INDISPONIVEL`.
 */
export interface Lancamento {
  /** Apps switched off («eventos»…). The Portal is never switched off. */
  appsDesligadas?: readonly string[] | undefined;
  /** Per app, the pages switched off (`{ backoffice: ["/associacao/pagamentos"] }`). */
  paginasDesligadas?: Readonly<Record<string, readonly string[]>> | undefined;
  assistente?:
    | {
        /** The floating assistant and the assistant actions are off everywhere. */
        desligado?: boolean | undefined;
        /** Per app, the pages where the assistant is off. */
        paginasDesligadas?: Readonly<Record<string, readonly string[]>> | undefined;
      }
    | undefined;
}

/** `lancamentoDe` result: every field present (empty = everything on). */
export interface LancamentoNormalizado extends Lancamento {
  appsDesligadas: readonly string[];
  paginasDesligadas: Readonly<Record<string, readonly string[]>>;
  assistente: { desligado: boolean; paginasDesligadas: Readonly<Record<string, readonly string[]>> };
}

function listaDeTextos(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.length > 0) : [];
}

function mapaDeListas(v: unknown): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  if (v && typeof v === "object" && !Array.isArray(v)) {
    for (const [k, l] of Object.entries(v as Record<string, unknown>)) {
      const lista = listaDeTextos(l);
      if (lista.length) out[k] = lista;
    }
  }
  return out;
}

/**
 * The `lancamento` of `GET /api/v1/acessos/eu` (or of the public endpoint's
 * body), normalised. Tolerant: a missing or malformed field = everything on.
 * Accepts the whole `eu` object or the `lancamento` object itself.
 */
export function lancamentoDe(eu: unknown): LancamentoNormalizado {
  const o = (eu && typeof eu === "object" ? eu : {}) as Record<string, unknown>;
  const l = (o.lancamento && typeof o.lancamento === "object" ? o.lancamento : "appsDesligadas" in o || "paginasDesligadas" in o || "assistente" in o ? o : {}) as Record<string, unknown>;
  const a = (l.assistente && typeof l.assistente === "object" ? l.assistente : {}) as Record<string, unknown>;
  return {
    appsDesligadas: listaDeTextos(l.appsDesligadas).filter((id) => id !== "portal"),
    paginasDesligadas: mapaDeListas(l.paginasDesligadas),
    assistente: { desligado: a.desligado === true, paginasDesligadas: mapaDeListas(a.paginasDesligadas) },
  };
}

function limparCaminho(c: string): string {
  const sem = c.split(/[?#]/)[0] ?? "";
  const com = sem.startsWith("/") ? sem : `/${sem}`;
  return com.length > 1 && com.endsWith("/") ? com.replace(/\/+$/, "") || "/" : com;
}

/** `caminho` is `prefixo` or below it, on path segments (`/a/b` → `/a/b`, `/a/b/c`; not `/a/bc`). */
export function caminhoSob(caminho: string, prefixo: string): boolean {
  const c = limparCaminho(caminho);
  const p = limparCaminho(prefixo);
  return p === "/" || c === p || c.startsWith(`${p}/`);
}

/** The app is on (not in `appsDesligadas`). The Portal is always on. */
export function appLigada(lanc: Lancamento | null | undefined, app: MutualAppId | string): boolean {
  if (app === "portal") return true;
  return !(lanc?.appsDesligadas ?? []).includes(app);
}

/**
 * The app is on AND `caminho` (relative to the app's basePath, e.g.
 * `usePathname()`) is not under one of its switched-off pages.
 */
export function paginaLigada(lanc: Lancamento | null | undefined, app: MutualAppId | string, caminho: string): boolean {
  if (!appLigada(lanc, app)) return false;
  const lista = lanc?.paginasDesligadas?.[app] ?? [];
  return !lista.some((p) => caminhoSob(caminho, p));
}

/**
 * The floating assistant and the assistant actions (fill from a document,
 * drafts) may show on this page of this app.
 */
export function assistenteLigado(lanc: Lancamento | null | undefined, app: MutualAppId | string, caminho: string): boolean {
  const a = lanc?.assistente;
  if (a?.desligado === true) return false;
  const lista = a?.paginasDesligadas?.[app] ?? [];
  return !lista.some((p) => caminhoSob(caminho, p));
}

/**
 * The navigation without the entries of switched-off pages (`paginaLigada`);
 * `externo` entries (other apps) stay. Groups left empty are dropped. Works
 * with `GrupoNavApp[]` of `AppShell` (which already applies it when it gets
 * `lancamento`).
 */
export function filtrarNavPorLancamento<G extends { itens: readonly { href: string; externo?: boolean | undefined }[] }>(
  grupos: readonly G[],
  lanc: Lancamento | null | undefined,
  app: MutualAppId | string,
): G[] {
  if (!lanc) return [...grupos];
  return grupos
    .map((g) => ({ ...g, itens: g.itens.filter((i) => i.externo === true || paginaLigada(lanc, app, i.href)) }))
    .filter((g) => g.itens.length > 0);
}

/**
 * The apps a person can open in the active organisation, in the ecosystem's
 * order: the keys of `apps` from `GET /api/v1/acessos/eu` whose value is not
 * null, plus the Portal (always). The `disponiveis` of `AppShell` /
 * `LancadorApps` — every app uses this one function, so a new app appears in
 * every switcher by bumping `@umporg/ui`. The Validador QR is listed with
 * Eventos, as in the Portal launcher. With `lancamento` (`eu.lancamento`),
 * switched-off apps are left out (the Portal never; the Validador QR goes
 * with Eventos).
 */
export function appsDisponiveis(
  apps: Readonly<Record<string, unknown>> | null | undefined,
  lancamento?: Lancamento | null | undefined,
): MutualAppId[] {
  const tem = (id: string) => apps?.[id] !== null && apps?.[id] !== undefined;
  const lista: MutualAppId[] = ["portal"];
  for (const a of MUTUAL_APPS) {
    // The Validador QR (public, no profile) comes with Eventos — the Portal's rule:
    // the door of an event is where it is used.
    // The Carta Social Mutualista is public: in every launcher.
    if (!(a.id === "carta" || (a.id === "qr" ? tem("eventos") : tem(a.id)))) continue;
    if (!appLigada(lancamento, a.id) || (a.id === "qr" && !appLigada(lancamento, "eventos"))) continue;
    lista.push(a.id);
  }
  return lista;
}
