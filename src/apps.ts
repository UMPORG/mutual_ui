/**
 * The MUTU@L applications, as the whole ecosystem names and describes them.
 * URLs are NOT here: each deployment configures them (the Portal owns the
 * list of URLs; every other app only needs the Portal's URL — see sso.ts).
 */

export type MutualAppId = "portal" | "backoffice" | "eventos" | "simplex" | "qr" | "saude" | "dns" | "assistente" | "protocolos" | "monitor" | "cartao";
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

/**
 * The apps a person can open in the active organisation, in the ecosystem's
 * order: the keys of `apps` from `GET /api/v1/acessos/eu` whose value is not
 * null, plus the Portal (always). The `disponiveis` of `AppSwitcher` /
 * `ShellMarca` — every app uses this one function, so a new app appears in
 * every switcher by bumping `@umporg/ui` (v0.9.1). The Validador QR is listed
 * with Eventos, as in the Portal launcher (v0.9.7).
 */
export function appsDisponiveis(apps: Readonly<Record<string, unknown>> | null | undefined): MutualAppId[] {
  const tem = (id: string) => apps?.[id] !== null && apps?.[id] !== undefined;
  const lista: MutualAppId[] = ["portal"];
  for (const a of MUTUAL_APPS) {
    // The Validador QR (public, no profile) comes with Eventos — the Portal's rule
    // (v0.9.7): the door of an event is where it is used.
    if (a.id === "qr" ? tem("eventos") : tem(a.id)) lista.push(a.id);
  }
  return lista;
}
