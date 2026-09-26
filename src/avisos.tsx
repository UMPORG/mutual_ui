"use client";

import type { ReactNode } from "react";
import { Toast } from "@base-ui/react/toast";
import { CheckCircle2, Info, X } from "lucide-react";
import { cx } from "./cx";

/**
 * Toasts (v0.7) — ONLY to confirm something the person just did and can
 * see anyway ("Alterações guardadas", "Convite enviado"), optionally with
 * "Anular". Never for errors, warnings or anything the person must read:
 * those are persistent `StatusCallout`s next to where they happened.
 *
 * Render `<Toaster />` once (root layout, client side) and call
 * `toast.success("Alterações guardadas")` from anywhere — event handlers,
 * server-action results, outside React.
 */

type DadosToast = { tom: "success" | "info"; acao?: { label: string; onClick: () => void } };

const gestor = Toast.createToastManager();

export interface ToastOptions {
  description?: ReactNode;
  /** One action, usually "Anular" for a reversible change. */
  action?: { label: string; onClick: () => void };
  /** ms before it closes (default 5 s; 10 s with an action). Pauses on hover and focus. */
  timeout?: number;
}

function adicionar(tom: DadosToast["tom"], title: ReactNode, o: ToastOptions = {}): string {
  return gestor.add<DadosToast>({
    title,
    description: o.description,
    timeout: o.timeout ?? (o.action ? 10_000 : 5_000),
    priority: "low",
    data: { tom, acao: o.action },
  });
}

export const toast = {
  /** "Alterações guardadas." */
  success: (title: ReactNode, options?: ToastOptions) => adicionar("success", title, options),
  /** Neutral confirmation ("A exportação começou. O ficheiro fica em Transferências."). */
  info: (title: ReactNode, options?: ToastOptions) => adicionar("info", title, options),
  close: (id?: string) => gestor.close(id),
};

function Lista() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((t) => {
    const dados = (t.data ?? { tom: "success" }) as DadosToast;
    const Icone = dados.tom === "success" ? CheckCircle2 : Info;
    return (
      <Toast.Root key={t.id} toast={t} swipeDirection={["right", "down"]} className="m-toast">
        <div className="m-float h-full overflow-hidden !rounded-xl">
          <Toast.Content className="m-toast-conteudo flex items-start gap-3 p-4 pr-3">
            <Icone aria-hidden size={22} className={cx("mt-px shrink-0", dados.tom === "success" ? "text-success" : "text-info")} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <Toast.Title className="text-base leading-snug font-semibold" />
              <Toast.Description className="text-[0.9375rem] text-muted-foreground" />
              {dados.acao && (
                <Toast.Action
                  onClick={() => {
                    dados.acao?.onClick();
                    gestor.close(t.id);
                  }}
                  className="mt-1.5 inline-flex min-h-9 items-center self-start rounded-md px-0 text-[0.9375rem] font-semibold text-brand underline underline-offset-4 hover:no-underline"
                >
                  {dados.acao.label}
                </Toast.Action>
              )}
            </div>
            <Toast.Close aria-label="Fechar aviso" className="-mt-1 grid size-9 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-foreground/8 hover:text-foreground">
              <X aria-hidden size={18} />
            </Toast.Close>
          </Toast.Content>
        </div>
      </Toast.Root>
    );
  });
}

/** Where toasts appear: bottom-right on desktop, bottom of the screen on phones. Render once. */
export function Toaster({ limit = 3 }: { limit?: number }) {
  return (
    <Toast.Provider toastManager={gestor} limit={limit}>
      <Toast.Portal>
        <Toast.Viewport className="fixed right-4 bottom-4 z-[60] w-[calc(100vw-2rem)] sm:right-6 sm:bottom-6 sm:w-[24rem]">
          <Lista />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}
