import { defineConfig } from "vite-plus";

// tipos-exatos.tsx fica de fora: só o tsc o verifica. O Vite resolve os imports sem extensão de src/.
export default defineConfig({
  test: {
    include: ["tests/*.test.ts"],
  },
});
