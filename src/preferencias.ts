/**
 * Display preferences of the MUTU@L ecosystem ("Acessibilidade").
 *
 * One cookie (`mutual_pref`) holds the choices; it is written for the parent
 * domain when one is given (e.g. `.mutualismo.pt`), so the same choices apply
 * in every app. On localhost cookies are shared across ports already.
 *
 * The choices are applied as attributes on <html> before the first paint by
 * `PREFERENCIAS_SCRIPT` (inline in <head>), and live by `aplicarPreferencias`.
 * The CSS that reacts to them is in css/preferencias.css.
 *
 * Framework-free: safe in server components, client components and the
 * inline script.
 */

export type Tema = "sistema" | "claro" | "escuro" | "contraste";
export type TamanhoTexto = "100" | "112" | "125" | "150";
export type Espacamento = "normal" | "amplo";

export interface Preferencias {
  tema: Tema;
  texto: TamanhoTexto;
  espaco: Espacamento;
  letraLegivel: boolean;
  sublinharLigacoes: boolean;
  destacarFoco: boolean;
  reduzirMovimento: boolean;
  guiaLeitura: boolean;
}

export const PREFERENCIAS_PADRAO: Preferencias = {
  tema: "sistema",
  texto: "100",
  espaco: "normal",
  letraLegivel: false,
  sublinharLigacoes: false,
  destacarFoco: false,
  reduzirMovimento: false,
  guiaLeitura: false,
};

export const PREFERENCIAS_COOKIE = "mutual_pref";
const UM_ANO = 60 * 60 * 24 * 365;

const TEMAS: readonly Tema[] = ["sistema", "claro", "escuro", "contraste"];
const TEXTOS: readonly TamanhoTexto[] = ["100", "112", "125", "150"];

/** Compact, URL-safe encoding: t=escuro;x=125;e=amplo;l;s;f;m;g */
export function codificarPreferencias(p: Preferencias): string {
  const partes = [`t=${p.tema}`, `x=${p.texto}`, `e=${p.espaco}`];
  if (p.letraLegivel) partes.push("l");
  if (p.sublinharLigacoes) partes.push("s");
  if (p.destacarFoco) partes.push("f");
  if (p.reduzirMovimento) partes.push("m");
  if (p.guiaLeitura) partes.push("g");
  return partes.join(";");
}

export function descodificarPreferencias(valor: string | null | undefined): Preferencias {
  const p: Preferencias = { ...PREFERENCIAS_PADRAO };
  if (!valor) return p;
  for (const parte of decodeURIComponent(valor).split(";")) {
    const [k, v] = parte.split("=");
    if (k === "t" && TEMAS.includes(v as Tema)) p.tema = v as Tema;
    else if (k === "x" && TEXTOS.includes(v as TamanhoTexto)) p.texto = v as TamanhoTexto;
    else if (k === "e" && (v === "normal" || v === "amplo")) p.espaco = v;
    else if (k === "l") p.letraLegivel = true;
    else if (k === "s") p.sublinharLigacoes = true;
    else if (k === "f") p.destacarFoco = true;
    else if (k === "m") p.reduzirMovimento = true;
    else if (k === "g") p.guiaLeitura = true;
  }
  return p;
}

export function lerCookiePreferencias(cookieHeader: string | null | undefined): Preferencias {
  const m = (cookieHeader ?? "").match(new RegExp(`(?:^|;\\s*)${PREFERENCIAS_COOKIE}=([^;]*)`));
  return descodificarPreferencias(m?.[1]);
}

export function cookiePreferencias(p: Preferencias, dominio?: string | null): string {
  const partes = [
    `${PREFERENCIAS_COOKIE}=${encodeURIComponent(codificarPreferencias(p))}`,
    "Path=/",
    `Max-Age=${UM_ANO}`,
    "SameSite=Lax",
  ];
  if (dominio) partes.push(`Domain=${dominio}`);
  if (typeof location !== "undefined" && location.protocol === "https:") partes.push("Secure");
  return partes.join("; ");
}

/** True when the effective theme is dark (resolving "sistema"). */
export function temaEscuro(p: Preferencias, sistemaEscuro: boolean): boolean {
  return p.tema === "escuro" || (p.tema === "sistema" && sistemaEscuro);
}

/**
 * Applies the preferences to <html>:
 *  - class `dark` (escuro, or sistema + OS dark) and `contraste`;
 *  - data-texto, data-espaco, data-letra, data-ligacoes, data-foco,
 *    data-movimento, data-guia;
 *  - `color-scheme` for native controls.
 */
export function aplicarPreferencias(p: Preferencias, raiz: HTMLElement = document.documentElement): void {
  const escuro = temaEscuro(p, matchMedia("(prefers-color-scheme: dark)").matches);
  raiz.classList.toggle("dark", escuro && p.tema !== "contraste");
  raiz.classList.toggle("contraste", p.tema === "contraste");
  raiz.style.colorScheme = escuro && p.tema !== "contraste" ? "dark" : "light";
  raiz.dataset.tema = p.tema;
  raiz.dataset.texto = p.texto;
  raiz.dataset.espaco = p.espaco;
  alternar(raiz, "letra", p.letraLegivel ? "legivel" : null);
  alternar(raiz, "ligacoes", p.sublinharLigacoes ? "sublinhadas" : null);
  alternar(raiz, "foco", p.destacarFoco ? "destacado" : null);
  alternar(raiz, "movimento", p.reduzirMovimento ? "reduzido" : null);
  alternar(raiz, "guia", p.guiaLeitura ? "ativo" : null);
  if (p.letraLegivel) carregarLetraLegivel();
}

function alternar(raiz: HTMLElement, chave: string, valor: string | null) {
  if (valor) raiz.dataset[chave] = valor;
  else delete raiz.dataset[chave];
}

const LETRA_LEGIVEL_URL =
  "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;600;700&display=swap";

/** The easy-reading typeface is only downloaded when someone turns it on. */
export function carregarLetraLegivel(): void {
  if (document.getElementById("mutual-letra-legivel")) return;
  const l = document.createElement("link");
  l.id = "mutual-letra-legivel";
  l.rel = "stylesheet";
  l.href = LETRA_LEGIVEL_URL;
  document.head.appendChild(l);
}

/** True when motion should be avoided (OS setting or the user's choice). */
export function movimentoReduzido(): boolean {
  return (
    document.documentElement.dataset.movimento === "reduzido" ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Inline <head> script: applies the cookie before the first paint (no flash
 * of the wrong theme or size). Kept dependency-free and tiny on purpose; it
 * mirrors `descodificarPreferencias` + `aplicarPreferencias`.
 */
export const PREFERENCIAS_SCRIPT = `(function(){try{var d=document.documentElement,m=document.cookie.match(/(?:^|;\\s*)${PREFERENCIAS_COOKIE}=([^;]*)/),v=m?decodeURIComponent(m[1]):"",p={t:"sistema",x:"100",e:"normal"},f={};v.split(";").forEach(function(s){var a=s.split("=");if(a.length>1)p[a[0]]=a[1];else if(a[0])f[a[0]]=1});var esc=p.t==="escuro"||(p.t==="sistema"&&matchMedia("(prefers-color-scheme: dark)").matches);var c=p.t==="contraste";d.classList.toggle("dark",esc&&!c);d.classList.toggle("contraste",c);d.style.colorScheme=esc&&!c?"dark":"light";d.dataset.tema=p.t;d.dataset.texto=p.x;d.dataset.espaco=p.e;if(f.l){d.dataset.letra="legivel";var l=document.createElement("link");l.id="mutual-letra-legivel";l.rel="stylesheet";l.href="${LETRA_LEGIVEL_URL}";document.head.appendChild(l)}if(f.s)d.dataset.ligacoes="sublinhadas";if(f.f)d.dataset.foco="destacado";if(f.m)d.dataset.movimento="reduzido";if(f.g)d.dataset.guia="ativo"}catch(e){}})();`;
