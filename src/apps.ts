/**
 * The MUTU@L applications, as the whole ecosystem names and describes them.
 * URLs are NOT here: each deployment configures them (the Portal owns the
 * list of URLs; every other app only needs the Portal's URL — see sso.ts).
 */

export type MutualAppId = "portal" | "backoffice" | "eventos" | "simplex" | "qr" | "saude" | "cartao";

export interface MutualApp {
  id: MutualAppId;
  nome: string;
  /** One line, shown under the name in the Portal and in the app switcher. */
  descricao: string;
  /** Who the app is for — drives its shell; shown in the Portal. */
  publico: string;
  /** Search synonyms (Portal Ctrl+K). Never displayed. */
  palavrasChave: string[];
  /** Login roles that may use the app. `null` = public, no login. */
  roles: readonly string[] | null;
}

export const MUTUAL_APPS: readonly MutualApp[] = [
  {
    id: "backoffice",
    nome: "Backoffice",
    descricao: "Associações e associados: quotas, licenças, protocolos e caracterização.",
    publico: "Serviços administrativos da UMP e dirigentes das associações",
    palavrasChave: ["quotas", "pagamentos", "membros", "sócios", "fichas", "licenciamento", "dados das associações"],
    roles: ["admin", "associacao"],
  },
  {
    id: "eventos",
    nome: "Eventos",
    descricao: "Eventos e formações: inscrições, convites, presenças e relatórios.",
    publico: "Organizadores (UMP e associações) e participantes",
    palavrasChave: ["inscrições", "bilhetes", "formações", "atividades", "calendário", "participantes"],
    roles: ["admin", "gestor_evento", "operador_evento", "admin_associacao", "associacao"],
  },
  {
    id: "simplex",
    nome: "Simplex",
    descricao: "Contas das associações: balanços, orçamentos, reportes e diagnóstico.",
    publico: "Tesoureiros, contabilistas e direções",
    palavrasChave: ["contabilidade", "finanças", "orçamento", "contas", "tesouraria", "balanço", "relatórios financeiros"],
    roles: ["admin", "associacao"],
  },
  {
    id: "saude",
    nome: "Saúde",
    descricao: "Balcão, agenda e marcações, utentes e registo clínico.",
    publico: "Rececionistas, profissionais de saúde e gestores de clínica",
    palavrasChave: ["consultas", "marcações", "agenda", "clínica", "médico", "enfermagem", "utentes", "atendimento", "balcão"],
    roles: ["admin", "profissional_saude", "gestor_clinica", "rececionista"],
  },
  {
    id: "qr",
    nome: "Validador QR",
    descricao: "Leitura de cartões de associado e bilhetes à entrada.",
    publico: "Funcionários à entrada de eventos e balcões de atendimento",
    palavrasChave: ["scanner", "leitor", "código qr", "entradas", "check-in", "controlo de acessos"],
    roles: null,
  },
] as const;

export function getMutualApp(id: MutualAppId): MutualApp | undefined {
  return MUTUAL_APPS.find((a) => a.id === id);
}

/** True when `role` may use the app (public apps accept everyone). */
export function canUseApp(app: MutualApp, role: string | null | undefined): boolean {
  if (app.roles === null) return true;
  return !!role && app.roles.includes(role);
}

/** Human label for a login role, in pt-PT, without abbreviations. */
export const ROLE_LABELS: Record<string, string> = {
  admin: "Administração UMP",
  associacao: "Associação",
  admin_associacao: "Associação",
  gestor_evento: "Equipa de Eventos",
  operador_evento: "Equipa de Eventos",
  profissional_saude: "Profissional de saúde",
  gestor_clinica: "Gestão de clínica",
  rececionista: "Receção",
  user: "Associado",
};

export function roleLabel(role: string | null | undefined): string {
  return (role && ROLE_LABELS[role]) || "Utilizador";
}
