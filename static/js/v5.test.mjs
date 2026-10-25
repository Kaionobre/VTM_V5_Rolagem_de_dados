// Rodar: node static/js/v5.test.mjs
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const V5 = createRequire(import.meta.url)("./v5.js");
const seq = (...valores) => { let i = 0; return () => (valores[i++ % valores.length] - 1) / 10; };

let r = V5.evaluate([10, 10], [], 3);
assert.equal(r.sucessos, 4);
assert.equal(r.resultado, "critico");

r = V5.evaluate([10, 10, 10], [], 1);
assert.equal(r.sucessos, 5, "três 10 = um par (4) + 1");

r = V5.evaluate([10], [10], 2);
assert.equal(r.resultado, "critico-baguncado");

r = V5.evaluate([10], [10], 5);
assert.equal(r.resultado, "falha", "par de 10 que não atinge a dificuldade não é crítico");
assert.equal(r.margem, -1);

r = V5.evaluate([7], [1], 3);
assert.equal(r.resultado, "falha-bestial");

r = V5.evaluate([7, 8, 9], [1], 3);
assert.equal(r.resultado, "sucesso", "1 na fome com sucesso não é bestial");
assert.equal(r.bestial, false);

r = V5.evaluate([2, 3], [4], 1);
assert.equal(r.resultado, "falha-total");

r = V5.evaluate([2], [], 0);
assert.equal(r.resultado, "falha-total", "zero sucessos é falha total mesmo sem dificuldade");

let pool = V5.rollPool(3, 5, seq(4));
assert.deepEqual(pool, { normais: [], fome: [4, 4, 4] }, "fome maior que a parada");

pool = V5.rollPool(4, 1, seq(1, 2, 3, 4));
assert.deepEqual(pool, { normais: [1, 2, 3], fome: [4] });

assert.deepEqual(V5.rerollWillpower([1, 2, 3, 4, 5], [0, 1, 2, 3, 0, 9], seq(10)), [10, 10, 10, 4, 5], "no máximo 3, ignora repetidos e índices inválidos");

assert.deepEqual(V5.rouseCheck(2, seq(6)), { valor: 6, sucesso: true, fome: 2, noLimite: false });
assert.deepEqual(V5.rouseCheck(2, seq(5)), { valor: 5, sucesso: false, fome: 3, noLimite: false });
assert.deepEqual(V5.rouseCheck(5, seq(1)), { valor: 1, sucesso: false, fome: 5, noLimite: true });

for (let i = 0; i < 1000; i++) {
    const v = V5.rollDie();
    assert.ok(v >= 1 && v <= 10 && Number.isInteger(v));
}

console.log("v5: todos os testes passaram");
