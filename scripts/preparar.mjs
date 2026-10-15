import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

// Manual (`pnpm run hooks`): o pnpm 12 recusa dependências git com scripts de ciclo de vida, por isso não corre em `prepare`.
if (process.env.CI === "true" || existsSync("/.dockerenv") || !existsSync(".git") || !existsSync(".githooks/pre-commit")) process.exit(0);

try {
  execFileSync("git", ["config", "core.hooksPath", ".githooks"], { stdio: "ignore" });
} catch {
  // sem git disponível: o hook fica por ativar, sem falhar
}
