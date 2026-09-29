"use client";

import { useId, useRef, type CSSProperties, type ReactNode } from "react";
import { Check, LayoutGrid } from "lucide-react";
import { MUTUAL_APPS, type MutualAppId } from "./apps";
import { AppMark } from "./brand";
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
 * The app launcher of the top bar («Aplicações MUTU@L», the waffle): the
 * apps the person can use in the active organisation, always in the same
 * order (`MUTUAL_APPS`) — exactly what the Portal launcher shows — the
 * current one marked «Está aqui». With one origin (ADR 0004) the person
 * lands signed in. Build `disponiveis` with `appsDisponiveis(eu.apps)`.
 *
 * Uses the native Popover API (light-dismiss, Esc, top layer) — no deps.
 */
export function LancadorApps({
  atual,
  disponiveis,
  className,
  rotulo = "Aplicações MUTU@L",
  botao,
}: {
  atual: MutualAppId;
  /** `appsDisponiveis(eu.apps)` (the Validador QR comes with Eventos). */
  disponiveis: readonly MutualAppId[];
  className?: string | undefined;
  rotulo?: string | undefined;
  /** Replaces the icon-only waffle (e.g. a labelled button in a drawer). */
  botao?: ReactNode | undefined;
}) {
  const id = useId().replace(/:/g, "");
  const popId = `mutual-apps-${id}`;
  const apps = MUTUAL_APPS.filter((a) => a.id === atual || disponiveis.includes(a.id));
  const botaoRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={botaoRef}
        type="button"
        popoverTarget={popId}
        aria-label={botao ? undefined : rotulo}
        data-shell="aplicacoes"
        className={cx(botao ? "m-barra-util" : "m-barra-botao", className)}
      >
        {botao ?? <LayoutGrid aria-hidden />}
      </button>
      <div
        id={popId}
        popover="auto"
        aria-label={rotulo}
        className="m-float m-menu-barra"
        onToggle={(e) => {
          if (e.newState === "open") posicionarPopover(e.currentTarget, botaoRef.current);
        }}
      >
        <p className="px-3 pt-2 pb-1 text-sm font-semibold text-muted-foreground">{rotulo}</p>
        <ul className="flex flex-col">
          {apps.map((a, i) => {
            const aqui = a.id === atual;
            return (
              <li key={a.id} className="m-menu-escalonado" style={{ "--i": i } as CSSProperties}>
                <a
                  href={CAMINHOS[a.id]}
                  aria-current={aqui ? "page" : undefined}
                  className={cx("m-menu-item min-h-14", aqui && "bg-accent")}
                >
                  <AppMark app={a.id} size={36} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-semibold">{a.nome}</span>
                    <span className="truncate text-sm font-normal text-muted-foreground">
                      {aqui ? "Está aqui" : a.descricao}
                    </span>
                  </span>
                  {aqui && <Check aria-hidden className="!text-brand" />}
                </a>
              </li>
            );
          })}
        </ul>
        <div className="mt-1 border-t border-border pt-1">
          <a href={CAMINHOS.portal} className="m-menu-item font-semibold text-brand">
            <LayoutGrid aria-hidden className="!text-brand" />
            Todas as aplicações — Portal MUTU@L
          </a>
        </div>
      </div>
    </>
  );
}
