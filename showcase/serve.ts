// Tiny static server for the showcase: `bun serve.ts` → http://localhost:5199
const PORT = Number(process.env.PORT ?? 5199);
Bun.serve({
  port: PORT,
  fetch(req) {
    const p = new URL(req.url).pathname;
    const f = Bun.file(import.meta.dir + (p === "/" ? "/index.html" : p));
    return f.size ? new Response(f) : new Response("Não encontrado", { status: 404 });
  },
});
console.log(`Showcase em http://localhost:${PORT}`);
