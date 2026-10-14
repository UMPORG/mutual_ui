import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// Também corre quando uma app instala este pacote por git: só configura no checkout do próprio repositório.
if (process.env.CI || existsSync("/.dockerenv") || !existsSync(".githooks/pre-commit")) process.exit(0);

try {
  const raiz = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  if (resolve(raiz) !== resolve(process.cwd())) process.exit(0);
  execFileSync("git", ["config", "core.hooksPath", ".githooks"], { stdio: "ignore" });
} catch {
  process.exit(0);
}
