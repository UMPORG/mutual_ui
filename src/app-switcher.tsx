"use client";

import { useId, useRef, type CSSProperties, type KeyboardEvent } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { MUTUAL_APPS, type MutualAppId } from "./apps";
import { IconeApp, IconeWaffle } from "./icone-app";
import { indiceNaGrelha } from "./grelha-teclado";
import { CAMINHOS } from "./sso";
import { cx } from "./cx";

/**
 * Places a popover of the top bar under its button, aligned to the button's
 * right edge (the bar's utilities sit on the right) and kept on screen;
 * flips above near the bottom edge.
 */
export function posicionarPopover(pop: HTMLElement, botao: HTMLElement | null, alinhar: "inicio" | "fim" = "fim") {
  if (!botao) return;
  const r = botao.getBoundingClientRect();
  const h = pop.offsetHeight;
  const w = pop.offsetWidth;
  const abaixo = r.bottom + 8 + h <= window.innerHeight;
  const esquerda = alinhar === "fim" ? r.right - w : r.left;
  pop.style.top = `${abaixo ? r.bottom + 8 : Math.max(8, r.top - 8 - h)}px`;
  pop.style.left = `${Math.min(Math.max(8, esquerda), window.innerWidth - w - 8)}px`;
}

/**
 * The app launcher of the top bar (Google Workspace style): a round
 * nine-dot button (tooltip «Aplicações») opening a rounded panel with
 * a 3-column grid of app icon + name — only the apps the person can use in
 * the active organisation (`appsDisponiveis(eu.apps)`, the Portal first),
 * the current one marked (tick + outline + «está aqui» for screen readers).
 * The Cartão Digital (the associados' own app) is never listed. With one
 * origin (ADR 0004) the person lands signed in.
 *
 * Keyboard: on open, focus goes to the current app; arrows move in the grid
 * (←/→ one, ↑/↓ one row), Home/End; Enter opens; Esc closes and gives focus
 * back to the button. Every link is also reachable with Tab. Native Popover
 * API (light-dismiss, top layer) — no deps; motion of `m-menu-barra`.
 */
export function LancadorApps({
  atual,
  disponiveis,
  rotulo = "Aplicações",
  className,
}: {
  atual: MutualAppId;
  /** `appsDisponiveis(eu.apps)` (the Validador QR comes with Eventos). */
  disponiveis: readonly MutualAppId[];
  rotulo?: string | undefined;
  className?: string | undefined;
}) {
  const id = useId().replace(/:/g, "");
  const popId = `mutual-apps-${id}`;
  const botaoRef = useRef<HTMLButtonElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);
  const apps: { id: Exclude<MutualAppId, "cartao">; nome: string }[] = [
    ...(atual === "portal" || disponiveis.includes("portal") ? [{ id: "portal" as const, nome: "Portal" }] : []),
    ...MUTUAL_APPS.filter((a) => a.id === atual || disponiveis.includes(a.id)).map((a) => ({ id: a.id, nome: a.nome })),
  ];

  const ligacoes = () => Array.from(listaRef.current?.querySelectorAll<HTMLAnchorElement>("a") ?? []);

  function teclas(e: KeyboardEvent<HTMLUListElement>) {
    const todas = ligacoes();
    const i = todas.indexOf(document.activeElement as HTMLAnchorElement);
    if (i < 0) return;
    const j = indiceNaGrelha(i, e.key, todas.length, 3);
    if (j === null) return;
    e.preventDefault();
    todas[j]?.focus();
  }

  return (
    <>
      <button
        ref={botaoRef}
        type="button"
        popoverTarget={popId}
        aria-label={rotulo}
        data-shell="aplicacoes"
        className={cx("m-barra-botao m-waffle", className)}
        onPointerLeave={(e) => e.currentTarget.removeAttribute("data-dica")}
        onBlur={(e) => e.currentTarget.removeAttribute("data-dica")}
        onKeyDown={(e) => {
          if (e.key === "Escape") e.currentTarget.setAttribute("data-dica", "oculta");
        }}
      >
        <IconeWaffle />
        <span className="m-waffle-dica" aria-hidden>
          {rotulo}
        </span>
      </button>
      <div
        id={popId}
        popover="auto"
        aria-label={rotulo}
        className="m-float m-menu-barra m-grelha-apps"
        onToggle={(e) => {
          const botao = botaoRef.current;
          if (e.newState === "open") {
            posicionarPopover(e.currentTarget, botao);
            const alvo = ligacoes().find((a) => a.getAttribute("aria-current") === "page") ?? ligacoes()[0];
            alvo?.focus();
          } else if (botao) {
            // Esc or a click outside: focus back on the button unless the
            // person clicked something focusable.
            const foco = document.activeElement;
            if (!foco || foco === document.body || e.currentTarget.contains(foco)) {
              botao.setAttribute("data-dica", "oculta");
              botao.focus();
            }
          }
        }}
      >
        <div className="m-grelha-apps-rolagem">
          <ul ref={listaRef} onKeyDown={teclas}>
            {apps.map((a, i) => {
              const aqui = a.id === atual;
              return (
                <li key={a.id} className="m-menu-escalonado" style={{ "--i": i } as CSSProperties}>
                  <a href={CAMINHOS[a.id]} aria-current={aqui ? "page" : undefined} className="m-grelha-app">
                    <IconeApp app={a.id} tamanho={44} />
                    <span>
                      {a.nome}
                      {aqui ? <span className="sr-only"> (está aqui)</span> : null}
                    </span>
                    {aqui ? (
                      <span className="m-grelha-app-aqui" aria-hidden>
                        <Check strokeWidth={3} />
                      </span>
                    ) : null}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="m-grelha-apps-rodape">
          <a href={CAMINHOS.portal}>
            Todas as aplicações no Portal
            <ArrowUpRight aria-hidden size={18} />
          </a>
        </div>
      </div>
    </>
  );
}
