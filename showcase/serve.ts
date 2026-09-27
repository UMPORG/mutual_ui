// Tiny static server for the showcase: `bun serve.ts` → http://localhost:5199
// `/ssr` serves a server-rendered fixture (showcase/ssr.tsx) hydrated by
// dist/ssr-cliente.js — `?js=0` leaves the script out (first paint only).
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { CaixasSsr } from "./ssr";

const PORT = Number(process.env.PORT ?? 5199);
Bun.serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);
    const p = url.pathname;
    if (p === "/ssr") {
      const html = renderToString(createElement(CaixasSsr));
      const script = url.searchParams.get("js") === "0" ? "" : '<script type="module" src="./dist/ssr-cliente.js"></script>';
      return new Response(
        `<!doctype html><html lang="pt-PT" data-app="backoffice"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>SSR</title><link rel="stylesheet" href="./dist/app.css" /></head><body><div id="ssr">${html}</div>${script}</body></html>`,
        { headers: { "content-type": "text/html; charset=utf-8" } },
      );
    }
    const f = Bun.file(import.meta.dir + (p === "/" ? "/index.html" : p));
    return f.size ? new Response(f) : new Response("Não encontrado", { status: 404 });
  },
});
console.log(`Showcase em http://localhost:${PORT}`);
