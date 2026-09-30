"use client";

import type { ReactNode } from "react";
import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import { Avatar as BaseAvatar } from "@base-ui/react/avatar";
import { cx } from "./cx";

/**
 * ScrollArea, Avatar, AvatarGroup, built on Base UI.
 */

// ─── ScrollArea ───────────────────────────────────────────────────────────

/**
 * A scrolling region with a thin, calm scrollbar (lists in side panels,
 * thread lists, long menus). Keyboard users can focus it and scroll with the
 * arrows. The page itself never needs one — let the page scroll.
 */
export function ScrollArea({
  children,
  label,
  className,
  viewportClassName,
  orientation = "vertical",
}: {
  children: ReactNode;
  /** Spoken name of the region ("Conversas"). */
  label?: string | undefined;
  /** Size the root (e.g. `h-80` or `max-h-[60vh]`). */
  className?: string | undefined;
  viewportClassName?: string | undefined;
  orientation?: "vertical" | "horizontal" | "both" | undefined;
}) {
  return (
    <BaseScrollArea.Root className={cx("relative flex min-h-0 flex-col overflow-hidden", className)}>
      <BaseScrollArea.Viewport
        tabIndex={0}
        role={label ? "region" : undefined}
        aria-label={label}
        className={cx("min-h-0 flex-1 overscroll-contain rounded-[inherit] outline-none focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-ring", viewportClassName)}
      >
        {children}
      </BaseScrollArea.Viewport>
      {orientation !== "horizontal" && (
        <BaseScrollArea.Scrollbar orientation="vertical" className="m-scroll-barra">
          <BaseScrollArea.Thumb className="m-scroll-polegar" />
        </BaseScrollArea.Scrollbar>
      )}
      {orientation !== "vertical" && (
        <BaseScrollArea.Scrollbar orientation="horizontal" className="m-scroll-barra">
          <BaseScrollArea.Thumb className="m-scroll-polegar" />
        </BaseScrollArea.Scrollbar>
      )}
    </BaseScrollArea.Root>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────

/** "Maria da Conceição Silva" → "MS" (first and last name). */
export function iniciais(nome: string): string {
  const partes = nome
    .trim()
    .split(/\s+/)
    .filter((p) => !/^(da|de|do|das|dos|e)$/i.test(p));
  if (!partes.length) return "?";
  const a = partes[0]![0] ?? "";
  const b = partes.length > 1 ? (partes[partes.length - 1]![0] ?? "") : "";
  return (a + b).toLocaleUpperCase("pt-PT");
}

function tomDoNome(nome: string): number {
  let h = 0;
  for (let i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) >>> 0;
  return (h % 8) + 1;
}

const TAMANHO_AVATAR = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-14 text-lg" } as const;

export function Avatar({
  name,
  src,
  size = "md",
  label,
  className,
}: {
  /** Person or organisation name (initials and colour come from it). */
  name: string;
  /** Photo URL; the initials show while it loads or if it fails. */
  src?: string | null | undefined;
  size?: keyof typeof TAMANHO_AVATAR | undefined;
  /** Spoken name; omit when the name is written next to the avatar (then it is decorative). */
  label?: string | undefined;
  className?: string | undefined;
}) {
  const tom = tomDoNome(name);
  return (
    <BaseAvatar.Root
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
      className={cx(
        "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold select-none",
        "ring-2 ring-card",
        TAMANHO_AVATAR[size],
        className,
      )}
      style={{
        background: `color-mix(in oklab, var(--serie-${tom}) 22%, var(--card))`,
        color: `color-mix(in oklab, var(--serie-${tom}) 55%, var(--foreground))`,
      }}
    >
      {src && <BaseAvatar.Image src={src} alt="" className="size-full object-cover" />}
      <BaseAvatar.Fallback>{iniciais(name)}</BaseAvatar.Fallback>
    </BaseAvatar.Root>
  );
}

/** Overlapping avatars with "+N". Always say the total in words nearby or via `label`. */
export function AvatarGroup({
  people,
  max = 4,
  size = "md",
  label,
  className,
}: {
  people: Array<{ name: string; src?: string | null | undefined }>;
  max?: number | undefined;
  size?: keyof typeof TAMANHO_AVATAR | undefined;
  /** "5 participantes: Maria Silva, João Costa e mais 3" — default built from the names. */
  label?: string | undefined;
  className?: string | undefined;
}) {
  const visiveis = people.slice(0, max);
  const resto = people.length - visiveis.length;
  const falado =
    label ??
    `${people.length} ${people.length === 1 ? "pessoa" : "pessoas"}: ${visiveis.map((p) => p.name).join(", ")}${resto > 0 ? ` e mais ${resto}` : ""}`;
  return (
    <div role="img" aria-label={falado} className={cx("flex items-center", className)}>
      {visiveis.map((p, i) => (
        <Avatar key={`${p.name}-${i}`} name={p.name} src={p.src} size={size} className={i > 0 ? "-ml-2.5" : undefined} />
      ))}
      {resto > 0 && (
        <span aria-hidden className={cx("-ml-2.5 inline-grid shrink-0 place-items-center rounded-full bg-muted font-semibold text-muted-foreground ring-2 ring-card", TAMANHO_AVATAR[size])}>
          +{resto}
        </span>
      )}
    </div>
  );
}
