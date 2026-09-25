/** Tiny class joiner — the package avoids depending on clsx/tailwind-merge. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
