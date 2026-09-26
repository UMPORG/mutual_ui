/**
 * The MUTU@L applications, as the whole ecosystem names and describes them.
 * URLs are NOT here: each deployment configures them (the Portal owns the
 * list of URLs; every other app only needs the Portal's URL — see sso.ts).
 */

export type MutualAppId = "portal" | "backoffice" | "eventos" | "simplex" | "qr" | "saude" | "dns" | "cartao";
/** Apps served under the shared host (ADR 0004). The Cartão Digital has its own. */
export type AppNoEndereco = Exclude<MutualAppId, "cartao">;

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
    descricao: "Associações e associados: quotas, licenças, protocolos e caracterização.",
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
