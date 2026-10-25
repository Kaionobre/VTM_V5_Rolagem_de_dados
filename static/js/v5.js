// Regras de Vampiro: A Máscara V5, sem DOM. Usado pelo navegador (global V5) e pelos testes no Node.
(function (root) {
    const FOME_MAX = 5;

    function defaultRng() {
        if (root.crypto && root.crypto.getRandomValues) {
            return root.crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
        }
        return Math.random();
    }

    function rollDie(rng = defaultRng) {
        return Math.floor(rng() * 10) + 1;
    }

    function rollPool(total, fome, rng = defaultRng) {
        const qtdFome = Math.min(fome, total); // Fome maior que a parada: todos os dados viram de fome
        const normais = Array.from({ length: total - qtdFome }, () => rollDie(rng));
        const dadosFome = Array.from({ length: qtdFome }, () => rollDie(rng));
        return { normais, fome: dadosFome };
    }

    function evaluate(normais, fome, dificuldade) {
        const todos = normais.concat(fome);
        const dezes = todos.filter(v => v === 10).length;
        const criticosPares = Math.floor(dezes / 2);
        const sucessos = todos.filter(v => v >= 6).length + criticosPares * 2; // Cada par de 10 vale 4
        const venceu = sucessos > 0 && sucessos >= dificuldade;
        const baguncado = venceu && criticosPares > 0 && fome.includes(10);
        const bestial = !venceu && fome.includes(1);

        let resultado;
        if (venceu) resultado = criticosPares > 0 ? (baguncado ? "critico-baguncado" : "critico") : "sucesso";
        else if (bestial) resultado = "falha-bestial";
        else resultado = sucessos === 0 ? "falha-total" : "falha";

        return { sucessos, criticosPares, margem: sucessos - dificuldade, venceu, baguncado, bestial, resultado };
    }

    // Força de Vontade: rerrola até 3 dados normais; dados de fome nunca são rerrolados
    function rerollWillpower(normais, indices, rng = defaultRng) {
        const escolhidos = [...new Set(indices)].filter(i => i >= 0 && i < normais.length).slice(0, 3);
        const novos = normais.slice();
        escolhidos.forEach(i => { novos[i] = rollDie(rng); });
        return novos;
    }

    function rouseCheck(fomeAtual, rng = defaultRng) {
        const valor = rollDie(rng);
        const sucesso = valor >= 6;
        return { valor, sucesso, fome: sucesso ? fomeAtual : Math.min(fomeAtual + 1, FOME_MAX), noLimite: !sucesso && fomeAtual >= FOME_MAX };
    }

    const RESULTADOS = {
        "critico-baguncado": "Crítico Bagunçado",
        "critico": "Sucesso Crítico",
        "sucesso": "Sucesso",
        "falha-bestial": "Falha Bestial",
        "falha-total": "Falha Total",
        "falha": "Falha"
    };

    const api = { FOME_MAX, RESULTADOS, rollDie, rollPool, evaluate, rerollWillpower, rouseCheck };
    if (typeof module !== "undefined" && module.exports) module.exports = api;
    else root.V5 = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
