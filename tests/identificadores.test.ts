import { test } from "node:test";
import assert from "node:assert/strict";
import {
  comZod,
  eTelemovel,
  mascaraCodigoPostal,
  mascaraIban,
  mascaraNif,
  mascaraTelefoneNacional,
  normalizarCodigoPostal,
  normalizarIban,
  normalizarNif,
  normalizarTelefone,
  posicaoAposMascara,
  separarIndicativo,
  significativosAte,
  validarCodigoPostal,
  validarIban,
  validarNif,
  validarNipc,
  validarTelefone,
  type ContextoZod,
} from "../src/validar.ts";
import {
  formatarCodigoPostal,
  formatarIban,
  formatarNif,
  formatarTelefone,
  hrefTelefone,
  SEM_VALOR,
} from "../src/formatar.ts";

test("telefone: normaliza para E.164", () => {
  assert.equal(normalizarTelefone("222 084 177"), "+351222084177");
  assert.equal(normalizarTelefone("912-345-678"), "+351912345678");
  assert.equal(normalizarTelefone("+351 912 345 678"), "+351912345678");
  assert.equal(normalizarTelefone("00351912345678"), "+351912345678");
  assert.equal(normalizarTelefone("(+351) 22 208 41 77"), "+351222084177");
  assert.equal(normalizarTelefone("+44 20 7946 0958"), "+442079460958");
  assert.equal(normalizarTelefone("020 7946 0958", { indicativo: "44" }), "+442079460958");
  assert.equal(normalizarTelefone("+33 6 12 34 56 78"), "+33612345678");
  for (const mau of ["", "   ", null, undefined, "91234567", "9123456789", "112", "123456789", "951234567", "abc", "+351 91234"])
    assert.equal(normalizarTelefone(mau), null, String(mau));
});

test("telefone: separa o indicativo (códigos sem prefixos comuns)", () => {
  assert.deepEqual(separarIndicativo("351912345678"), { indicativo: "351", nacional: "912345678" });
  assert.deepEqual(separarIndicativo("12025550123"), { indicativo: "1", nacional: "2025550123" });
  assert.deepEqual(separarIndicativo("442079460958"), { indicativo: "44", nacional: "2079460958" });
  assert.deepEqual(separarIndicativo("244923456789"), { indicativo: "244", nacional: "923456789" });
});

test("telefone: mensagens em pt-PT", () => {
  assert.deepEqual(validarTelefone("912 345 678"), { valido: true, valor: "+351912345678" });
  assert.equal(validarTelefone("").valido, false);
  const curto = validarTelefone("91234");
  assert.ok(!curto.valido && curto.erro.includes("9 algarismos"));
  const inexistente = validarTelefone("951234567");
  assert.ok(!inexistente.valido && inexistente.erro.includes("não existe"));
  const fixoComoMovel = validarTelefone("222084177", { tipo: "movel" });
  assert.ok(!fixoComoMovel.valido && fixoComoMovel.erro.includes("telemóvel"));
  assert.equal(validarTelefone("912345678", { tipo: "fixo" }).valido, false);
  assert.equal(validarTelefone("+44 20 7946 0958", { tipo: "movel" }).valido, true); // foreign: no mobile rule
  const estrangeiro = validarTelefone("+99");
  assert.ok(!estrangeiro.valido && estrangeiro.erro.includes("indicativo"));
  assert.equal(eTelemovel("+351963000111"), true);
  assert.equal(eTelemovel("222084177"), false);
});

test("telefone: formatação e ligação tel:", () => {
  assert.equal(formatarTelefone("+351222084177"), "222 084 177");
  assert.equal(formatarTelefone("912345678", { indicativo: true }), "+351 912 345 678");
  assert.equal(formatarTelefone("+442079460958"), "+44 207 946 0958");
  assert.equal(formatarTelefone("+12025550123"), "+1 202 555 0123");
  assert.equal(formatarTelefone("extensão 21"), "extensão 21"); // never lose what was stored
  assert.equal(formatarTelefone(null), SEM_VALOR);
  assert.equal(formatarTelefone("  "), SEM_VALOR);
  assert.equal(hrefTelefone("222 084 177"), "tel:+351222084177");
  assert.equal(hrefTelefone("extensão 21"), null);
});

test("telefone: máscara ao escrever", () => {
  assert.equal(mascaraTelefoneNacional("9"), "9");
  assert.equal(mascaraTelefoneNacional("9123"), "912 3");
  assert.equal(mascaraTelefoneNacional("9123456789999"), "912 345 678"); // at most 9 digits
  assert.equal(mascaraTelefoneNacional("2079460958", "44"), "207 946 0958");
});

test("NIF / NIPC", () => {
  assert.equal(normalizarNif("PT 501 234 560"), "501234560");
  assert.equal(normalizarNif("50123456"), null);
  assert.deepEqual(validarNif("501 234 560"), { valido: true, valor: "501234560" });
  assert.deepEqual(validarNif("123456789"), { valido: true, valor: "123456789" });
  const mau = validarNif("123456788");
  assert.ok(!mau.valido && mau.erro.startsWith("O último algarismo não confere"));
  // The NIPC reported by the association (526 705 245: the check digit would be 8).
  assert.deepEqual(validarNipc("526 705 245"), {
    valido: false,
    erro: "O último algarismo não confere com os anteriores. Confirme o NIPC na certidão permanente ou no cartão de pessoa coletiva.",
  });
  assert.equal(validarNipc("526705248").valido, true);
  assert.deepEqual(validarNif("401234567"), {
    valido: false,
    erro: "O NIF não pode começar por 40. Verifique os primeiros algarismos.",
  });
  assert.deepEqual(validarNipc("023456789"), {
    valido: false,
    erro: "O NIPC não pode começar por 0. Verifique os primeiros algarismos.",
  });
  assert.equal(validarNif("12345").valido, false);
  assert.equal(validarNif("401234567").valido, false); // prefix 40 is not issued
  assert.equal(validarNif("501234560", { tipo: "singular" }).valido, false);
  assert.equal(validarNipc("123456789").valido, false);
  assert.equal(validarNipc("501234560").valido, true);
  assert.equal(formatarNif("501234560"), "501 234 560");
  assert.equal(formatarNif(""), SEM_VALOR);
  assert.equal(mascaraNif("5012"), "501 2");
});

test("código postal", () => {
  assert.equal(normalizarCodigoPostal("4000123"), "4000-123");
  assert.equal(normalizarCodigoPostal("4000 123"), "4000-123");
  assert.equal(normalizarCodigoPostal("4000-123"), "4000-123");
  assert.equal(normalizarCodigoPostal("0400-123"), null);
  assert.equal(normalizarCodigoPostal("4000"), null);
  assert.equal(validarCodigoPostal("4000").valido, false);
  assert.equal(formatarCodigoPostal("1000001"), "1000-001");
  assert.equal(mascaraCodigoPostal("40001"), "4000-1");
  assert.equal(mascaraCodigoPostal("4000"), "4000");
});

test("IBAN", () => {
  const iban = "PT50000201231234567890154";
  assert.equal(normalizarIban("pt50 0002 0123 1234 5678 9015 4"), iban);
  assert.deepEqual(validarIban("PT50 0002 0123 1234 5678 9015 4"), { valido: true, valor: iban });
  assert.equal(validarIban("PT50000201231234567890155").valido, false); // check digits
  assert.equal(validarIban("PT5000020123").valido, false);
  assert.equal(validarIban("GB82WEST12345698765432").valido, true);
  assert.equal(validarIban("GB82WEST12345698765432", { pais: "PT" }).valido, false);
  assert.equal(formatarIban(iban), "PT50 0002 0123 1234 5678 9015 4");
  assert.equal(mascaraIban("pt500002"), "PT50 0002");
});

test("máscaras: o cursor fica depois dos mesmos algarismos", () => {
  // "912 34|5" → typing keeps the caret after the 5th digit.
  assert.equal(posicaoAposMascara("912 345 678", 5), 6);
  assert.equal(posicaoAposMascara("912 345 678", 3), 3);
  assert.equal(posicaoAposMascara("912 345 678", 0), 0);
  assert.equal(significativosAte("912 34", 6), 5);
  assert.equal(posicaoAposMascara("4000-1", 5), 6);
});

test("comZod: valor normalizado ou a mensagem como problema", () => {
  const problemas: unknown[] = [];
  const ctx: ContextoZod = { issues: { push: (i) => problemas.push(i) } };
  const telefone = comZod(validarTelefone);
  assert.equal(telefone("912 345 678", ctx), "+351912345678");
  assert.equal(problemas.length, 0);
  telefone("123", ctx);
  assert.equal(problemas.length, 1);
  assert.equal((problemas[0] as { code: string }).code, "custom");
  const opcional = comZod(validarTelefone, { opcional: true });
  assert.equal(opcional("  ", ctx), null);
  assert.equal(problemas.length, 1);
});
