import { useSyncExternalStore } from "react";
import { getMutualApp, type MutualAppId } from "../src/apps.ts";

/**
 * The app whose tint the page wears (`data-app` on <html>). Read live, not
 * once at render: the screenshot scripts and the browser tools switch
 * `data-app` after load, and the header must follow the tint (never
 * "Backoffice" on the Saúde tint).
 */
function subscrever(aviso: () => void) {
  const o = new MutationObserver(aviso);
  o.observe(document.documentElement, { attributes: true, attributeFilter: ["data-app"] });
  return () => o.disconnect();
}

export function useAppAtual(): { id: MutualAppId; nome: string } {
  const id = useSyncExternalStore(subscrever, () => (document.documentElement.dataset.app as MutualAppId | undefined) ?? "backoffice");
  return { id, nome: id === "portal" ? "Portal" : (getMutualApp(id)?.nome ?? id) };
}
