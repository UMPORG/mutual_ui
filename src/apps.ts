/** App names and descriptions. Addresses are NOT here: paths are `CAMINHOS`, the Cartão's host `urlCartao` (sso.ts). */

export type MutualAppId = "portal" | "backoffice" | "eventos" | "simplex" | "qr" | "saude" | "dns" | "assistente" | "protocolos" | "monitor" | "cartao" | "carta";
/** Apps under the shared host; the Cartão Digital has its own. */
export type AppNoEndereco = Exclude<MutualAppId, "cartao">;

/** The associados' own app, on another host (`urlCartao`, ADR 0004 exception): not in `MUTUAL_APPS`. */
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
  descricao: string;
  /** Drives its shell; shown in the Portal. */
  publico: string;
  /** Search synonyms (Portal Ctrl+K). Never displayed. */
  palavrasChave: string[];
  /** Public app (no login, e.g. the Validador QR); access to the others comes from `GET /api/v1/acessos/eu` → `apps.<id>`. */
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
    descricao: "Endereços da plataforma e os servidores onde vivem, sem complicações.",
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

export function nomeDaApp(id: MutualAppId): string | undefined {
  if (id === "portal") return "Portal";
  if (id === "cartao") return APP_CARTAO.nome;
  return getMutualApp(id)?.nome;
}

/**
 * Launch switches set by the UMP (`lancamento` of `GET /api/v1/acessos/eu` and the public `GET /api/v1/publico/lancamento`); a missing field = everything on.
 * Page entries are path PREFIXES relative to the app's basePath. Switched-off API calls answer 503 `APP_INDISPONIVEL` / `ASSISTENTE_INDISPONIVEL`.
 */
export interface Lancamento {
  /** The Portal is never switched off. */
  appsDesligadas?: readonly string[] | undefined;
  paginasDesligadas?: Readonly<Record<string, readonly string[]>> | undefined;
  assistente?:
    | {
        desligado?: boolean | undefined;
        paginasDesligadas?: Readonly<Record<string, readonly string[]>> | undefined;
      }
    | undefined;
  /** «Nome da plataforma» (trimmed, ≤ 60 code points); absent/null = unset, show `nomeDaPlataforma`. */
  nomePlataforma?: string | null | undefined;
}

export interface LancamentoNormalizado extends Lancamento {
  appsDesligadas: readonly string[];
  paginasDesligadas: Readonly<Record<string, readonly string[]>>;
  assistente: { desligado: boolean; paginasDesligadas: Readonly<Record<string, readonly string[]>> };
  nomePlataforma: string | null;
}

/** The long name, for long spots (email sender, footers) when no name is set. */
export const NOME_UMP = "União das Mutualidades Portuguesas";

const MAX_NOME_PLATAFORMA = 60;

/** C0/C1 control characters (U+0000–U+001F, U+007F–U+009F). */
function eControlo(c: string): boolean {
  const n = c.codePointAt(0) ?? 0;
  return n < 0x20 || (n >= 0x7f && n <= 0x9f);
}

function nomePlataformaDe(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const limpo = Array.from(v).filter((c) => !eControlo(c)).join("").trim();
  if (!limpo) return null;
  return Array.from(limpo).slice(0, MAX_NOME_PLATAFORMA).join("").trim();
}

/** Short brand name (wordmark, tab titles): the launch config's name, or «UMP» when unset. */
export function nomeDaPlataforma(l?: Lancamento | null): string {
  return nomePlataformaDe(l?.nomePlataforma) ?? "UMP";
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

/** Normalises the `lancamento` of `acessos/eu` or the public endpoint; missing or malformed = everything on. Accepts the whole `eu` or the `lancamento` object. */
export function lancamentoDe(eu: unknown): LancamentoNormalizado {
  const o = (eu && typeof eu === "object" ? eu : {}) as Record<string, unknown>;
  const l = (o.lancamento && typeof o.lancamento === "object" ? o.lancamento : "appsDesligadas" in o || "paginasDesligadas" in o || "assistente" in o || "nomePlataforma" in o ? o : {}) as Record<string, unknown>;
  const a = (l.assistente && typeof l.assistente === "object" ? l.assistente : {}) as Record<string, unknown>;
  return {
    appsDesligadas: listaDeTextos(l.appsDesligadas).filter((id) => id !== "portal"),
    paginasDesligadas: mapaDeListas(l.paginasDesligadas),
    assistente: { desligado: a.desligado === true, paginasDesligadas: mapaDeListas(a.paginasDesligadas) },
    nomePlataforma: nomePlataformaDe(l.nomePlataforma),
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

export function appLigada(lanc: Lancamento | null | undefined, app: MutualAppId | string): boolean {
  if (app === "portal") return true;
  return !(lanc?.appsDesligadas ?? []).includes(app);
}

/** The app is on AND `caminho` (relative to its basePath) is not under a switched-off page. */
export function paginaLigada(lanc: Lancamento | null | undefined, app: MutualAppId | string, caminho: string): boolean {
  if (!appLigada(lanc, app)) return false;
  const lista = lanc?.paginasDesligadas?.[app] ?? [];
  return !lista.some((p) => caminhoSob(caminho, p));
}

export function assistenteLigado(lanc: Lancamento | null | undefined, app: MutualAppId | string, caminho: string): boolean {
  const a = lanc?.assistente;
  if (a?.desligado === true) return false;
  const lista = a?.paginasDesligadas?.[app] ?? [];
  return !lista.some((p) => caminhoSob(caminho, p));
}

/** Navigation without switched-off pages; `externo` entries stay and empty groups are dropped. `AppShell` already applies it when given `lancamento`. */
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
 * Apps openable in the active organisation, in ecosystem order: non-null keys of `apps` from `acessos/eu`, plus the Portal.
 * The Validador QR comes with Eventos (as in the Portal launcher); with `lancamento`, switched-off apps are left out.
 */
export function appsDisponiveis(
  apps: Readonly<Record<string, unknown>> | null | undefined,
  lancamento?: Lancamento | null | undefined,
): MutualAppId[] {
  const tem = (id: string) => apps?.[id] !== null && apps?.[id] !== undefined;
  const lista: MutualAppId[] = ["portal"];
  for (const a of MUTUAL_APPS) {
    // The Validador QR (public) comes with Eventos, the Portal's rule.
    // The Carta Social Mutualista is public: in every launcher.
    if (!(a.id === "carta" || (a.id === "qr" ? tem("eventos") : tem(a.id)))) continue;
    if (!appLigada(lancamento, a.id) || (a.id === "qr" && !appLigada(lancamento, "eventos"))) continue;
    lista.push(a.id);
  }
  return lista;
}
