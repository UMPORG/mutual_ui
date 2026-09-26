// Screenshots of the v0.7 pages (controls, effects, assistant) in every theme
// and size, plus the interactive states (open popups, dialogs, streaming…).
// `node shots-v07.mjs <outDir> [filtro]` with `bun serve.ts` running.
import { chromium } from "file:///D:/Mutual/mutual_eventos/node_modules/@playwright/test/index.mjs";
import { mkdirSync } from "node:fs";

const OUT = process.argv[2] ?? "shots-v07";
const FILTRO = process.argv[3] ?? "";
mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:5199/";
const b = await chromium.launch({ executablePath: process.env.LOCALAPPDATA + "/ms-playwright/chromium-1243/chrome-win64/chrome.exe" });
const erros = [];

async function abrir(q, vp = { width: 1440, height: 900 }, reduzido = true) {
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: 1 });
  p.on("pageerror", (e) => erros.push(`${q}: ${e.message}`));
  p.on("console", (m) => m.type() === "error" && erros.push(`${q}: ${m.text()}`));
  await p.goto(BASE + q + (reduzido ? "&movimento=reduzido" : ""), { waitUntil: "networkidle" });
  await p.waitForTimeout(500);
  return p;
}
const quer = (n) => !FILTRO || n.includes(FILTRO);

// 1) Whole pages and sections per theme / size.
const casos = [
  ["claro-desktop", "tema=claro", { width: 1440, height: 900 }],
  ["escuro-desktop", "tema=escuro", { width: 1440, height: 900 }],
  ["contraste-desktop", "tema=contraste", { width: 1440, height: 900 }],
  ["claro-390", "tema=claro", { width: 390, height: 844 }],
  ["escuro-390", "tema=escuro", { width: 390, height: 844 }],
  ["texto150-1280", "tema=claro&texto=150", { width: 1280, height: 900 }],
  ["saude-escuro-1024", "tema=escuro&app=saude", { width: 1024, height: 800 }],
];
const SECOES = {
  controlos: ["c-basicos", "c-campos", "c-escolhas", "c-menus", "c-divulgacao", "c-sobreposicoes", "c-navegacao"],
  efeitos: ["e-constelacao", "e-topografia", "e-malha", "e-pontos", "e-brilho", "e-sucesso"],
  conversa: ["v-conversa"],
};
for (const pagina of Object.keys(SECOES)) {
  for (const [nome, q, vp] of casos) {
    const id = `${pagina}-${nome}`;
    if (!quer(id)) continue;
    const p = await abrir(`?pagina=${pagina}&${q}`, vp);
    const [sw, iw] = await p.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    await p.screenshot({ path: `${OUT}/${id}.png`, fullPage: true });
    if (!nome.startsWith("saude")) {
      for (const s of SECOES[pagina]) {
        const sec = p.locator(`section[aria-labelledby="${s}"]`);
        if (await sec.count()) await sec.screenshot({ path: `${OUT}/${id}-${s}.png` });
      }
    }
    console.log(id, sw > iw ? `TRANSBORDA ${sw}/${iw}` : "ok");
    await p.close();
  }
}

// 2) Interactive states (viewport shots).
async function estado(nome, q, vp, acao, reduzido = true) {
  if (!quer(nome)) return;
  const p = await abrir(q, vp, reduzido);
  try {
    await acao(p);
    await p.waitForTimeout(450);
    await p.screenshot({ path: `${OUT}/estado-${nome}.png` });
    console.log("estado", nome, "ok");
  } catch (e) {
    console.log("estado", nome, "FALHOU", e.message.split("\n")[0]);
  }
  await p.close();
}
const campo = (p, rotulo) => p.getByLabel(rotulo, { exact: true });
const D = { width: 1440, height: 900 };
const M = { width: 390, height: 844 };
for (const tema of ["claro", "escuro", "contraste"]) {
  const q = `?pagina=controlos&tema=${tema}`;
  await estado(`${tema}-select`, q, D, async (p) => {
    await p.getByRole("combobox", { name: /^Distrito \(/ }).scrollIntoViewIfNeeded();
    await p.getByRole("combobox", { name: /^Distrito \(/ }).click();
  });
  await estado(`${tema}-combobox-async`, q, D, async (p) => {
    const c = campo(p, "Associação");
    await c.scrollIntoViewIfNeeded();
    await c.click();
    await c.pressSequentially("mutual", { delay: 40 });
    await p.waitForTimeout(900);
  });
  await estado(`${tema}-multiselect-criar`, q, D, async (p) => {
    const c = campo(p, "Distritos abrangidos");
    await c.scrollIntoViewIfNeeded();
    await c.click();
    await c.pressSequentially("Alto Minho", { delay: 30 });
  });
  await estado(`${tema}-datepicker`, q, D, async (p) => {
    const b2 = p.getByRole("button", { name: /Escolher data/ });
    await b2.scrollIntoViewIfNeeded();
    await b2.click();
  });
  await estado(`${tema}-intervalo`, q, D, async (p) => {
    const b2 = p.getByLabel("Período do relatório", { exact: true });
    await b2.scrollIntoViewIfNeeded();
    await b2.click();
  });
  await estado(`${tema}-menu`, q, D, async (p) => {
    const b2 = p.getByRole("button", { name: "Ações" });
    await b2.scrollIntoViewIfNeeded();
    await b2.click();
    await p.getByRole("menuitem", { name: "Mover para" }).hover();
    await p.waitForTimeout(300);
  });
  await estado(`${tema}-popover-dica`, q, D, async (p) => {
    const b2 = p.getByRole("button", { name: "Filtros" });
    await b2.scrollIntoViewIfNeeded();
    await b2.click();
  });
  await estado(`${tema}-dialogo`, q, D, (p) => p.locator("[data-abrir=dialogo]").click());
  await estado(`${tema}-confirmar-escrito`, q, D, async (p) => {
    await p.locator("[data-abrir=escrever]").click();
    await p.waitForTimeout(300);
    await p.keyboard.type("auroradominho");
  });
  await estado(`${tema}-folha`, q, D, (p) => p.locator("[data-abrir=folha]").click());
  await estado(`${tema}-toast`, q, D, async (p) => {
    await p.locator("[data-abrir=toast]").click();
  });
}
await estado("claro-dica-teclado", "?pagina=controlos&tema=claro", D, async (p) => {
  const b2 = p.getByRole("button", { name: "Avisos" });
  await b2.scrollIntoViewIfNeeded();
  await b2.focus();
  await p.keyboard.press("Shift+Tab");
  await p.keyboard.press("Tab");
  await p.waitForTimeout(700);
});
await estado("claro-390-folha-baixo", "?pagina=controlos&tema=claro", M, (p) => p.locator("[data-abrir=baixo]").click());
await estado("claro-390-select", "?pagina=controlos&tema=claro", M, async (p) => {
  await p.getByRole("combobox", { name: /^Distrito \(/ }).scrollIntoViewIfNeeded();
  await p.getByRole("combobox", { name: /^Distrito \(/ }).click();
});
await estado("claro-390-intervalo", "?pagina=controlos&tema=claro", M, async (p) => {
  const b2 = p.getByLabel("Período do relatório", { exact: true });
  await b2.scrollIntoViewIfNeeded();
  await b2.click();
});
await estado("claro-390-confirmar", "?pagina=controlos&tema=claro", M, (p) => p.locator("[data-abrir=confirmar]").click());

// Assistant states.
for (const tema of ["claro", "escuro", "contraste"]) {
  const q = `?pagina=conversa&tema=${tema}`;
  await estado(`${tema}-conversa-a-pensar`, q, D, async (p) => {
    await p.getByRole("button", { name: "Quem pagou ontem?" }).click();
    await p.waitForTimeout(700);
  });
  await estado(`${tema}-conversa-a-escrever`, q, D, async (p) => {
    await p.getByRole("button", { name: "Quem pagou ontem?" }).click();
    await p.waitForTimeout(3000);
  });
  await estado(`${tema}-conversa-vazia`, `?pagina=conversa&vazia=1&tema=${tema}`, D, async () => {});
}
await estado("claro-conversa-menu-conversa", "?pagina=conversa&tema=claro", D, async (p) => {
  await p.getByRole("button", { name: /Opções de «Recibos|Opções de «Como emitir/ }).first().click({ force: true });
});
await estado("claro-conversa-nao-util", "?pagina=conversa&tema=claro", D, async (p) => {
  await p.getByRole("button", { name: "Não útil" }).first().click();
  await p.getByRole("button", { name: "Incompleta" }).click();
});
await estado("claro-conversa-acao-aplicada", "?pagina=conversa&tema=claro", D, async (p) => {
  await p.getByRole("button", { name: "Aplicar" }).click();
  await p.waitForTimeout(1500);
  await p.getByText("Ação proposta").first().scrollIntoViewIfNeeded();
});
await estado("claro-390-conversa", "?pagina=conversa&tema=claro", M, async () => {});
await estado("claro-390-conversa-lista", "?pagina=conversa&tema=claro", M, async (p) => {
  await p.getByRole("button", { name: "Mostrar conversas" }).click();
});
await estado("escuro-390-conversa-vazia", "?pagina=conversa&vazia=1&tema=escuro", M, async () => {});

// Effects in motion (not reduced) — a frame mid-animation.
for (const tema of ["claro", "escuro"]) {
  for (const s of ["e-constelacao", "e-topografia", "e-malha", "e-pontos", "e-brilho"]) {
    const nome = `${tema}-movimento-${s}`;
    if (!quer(nome)) continue;
    const p = await abrir(`?pagina=efeitos&tema=${tema}`, D, false);
    const sec = p.locator(`section[aria-labelledby="${s}"]`);
    await sec.scrollIntoViewIfNeeded();
    if (s === "e-pontos") {
      const box = await sec.boundingBox();
      await p.mouse.move(box.x + box.width * 0.22, box.y + box.height * 0.55);
      await p.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.6, { steps: 4 });
    }
    await p.waitForTimeout(s === "e-constelacao" ? 2600 : s === "e-pontos" ? 200 : 900);
    await sec.screenshot({ path: `${OUT}/${nome}.png` });
    console.log(nome, "ok");
    await p.close();
  }
}
{
  const nome = "claro-movimento-celebracao";
  if (quer(nome)) {
    const p = await abrir("?pagina=efeitos&tema=claro", D, false);
    const sec = p.locator(`section[aria-labelledby="e-sucesso"]`);
    await sec.scrollIntoViewIfNeeded();
    await p.locator("[data-repetir]").click();
    await p.waitForTimeout(380);
    await sec.screenshot({ path: `${OUT}/${nome}.png` });
    console.log(nome, "ok");
    await p.close();
  }
}

await b.close();
console.log("erros:", erros.length ? "\n" + [...new Set(erros)].join("\n") : "nenhum");
