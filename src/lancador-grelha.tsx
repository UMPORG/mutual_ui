"use client";

import { useId, useRef, type CSSProperties, type KeyboardEvent } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { MUTUAL_APPS, type MutualAppId } from "./apps";
import { posicionarPopover } from "./app-switcher";
import { IconeApp, IconeWaffle, type DirecaoIcone } from "./icones-apps";
import { indiceNaGrelha } from "./grelha-teclado";
import { CAMINHOS } from "./sso";
import { cx } from "./cx";

/**
 * PRÉ-VISUALIZAÇÃO (ramo icones-preview) — o lançador de apps à maneira do
 * Google Workspace: botão redondo de nove pontos na barra de topo (dica
 * «Aplicações MUTU@L»), painel arredondado com uma grelha de 3 colunas
 * (ícone + nome) só com as apps a que a pessoa tem acesso
 * (`appsDisponiveis(eu.apps)`), a atual marcada («Está aqui» + visto).
 *
 * Teclado: ao abrir, o foco vai para a app atual; setas movem-se na grelha
 * (←/→ uma, ↑/↓ uma linha), Início/Fim; Enter abre; Esc fecha e devolve o
 * foco ao botão. Todas as ligações são também alcançáveis com Tab.
 * Movimento: o de `m-menu-barra` (tokens v0.14; nulo com «Reduzir movimento»).
 */
export function LancadorGrelha({
  atual,
  disponiveis,
  direcao = "a",
  rotulo = "Aplicações MUTU@L",
  className,
}: {
  atual: MutualAppId;
  disponiveis: readonly MutualAppId[];
  direcao?: DirecaoIcone | undefined;
  rotulo?: string | undefined;
  className?: string | undefined;
}) {
  const id = useId().replace(/:/g, "");
  const popId = `mutual-grelha-${id}`;
  const botaoRef = useRef<HTMLButtonElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);
  const apps: { id: MutualAppId; nome: string }[] = [
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
            // Esc or a click outside: focus back on the waffle unless the
            // person clicked somewhere focusable.
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
                  <a href={CAMINHOS[a.id as keyof typeof CAMINHOS]} aria-current={aqui ? "page" : undefined} className="m-grelha-app">
                    <IconeApp app={a.id} direcao={direcao} tamanho={44} />
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
