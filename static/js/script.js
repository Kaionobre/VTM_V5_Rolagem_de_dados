const form = document.getElementById("dice-form");
const formError = document.getElementById("form-error");
const diceContainer = document.getElementById("dice-container");
const resultsEl = document.getElementById("results");
const willpowerEl = document.getElementById("willpower");
const rerollBtn = document.getElementById("reroll-btn");
const rouseBtn = document.getElementById("rouse-btn");
const rouseResult = document.getElementById("rouse-result");
const historyEl = document.getElementById("history");
const historyList = document.getElementById("history-list");
const fomeInput = document.getElementById("fome");

const ANIMACAO_MS = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1000;
const HISTORICO_KEY = "vtm-v5-historico";
const HISTORICO_MAX = 10;

// Faces de falha (2-5) ficam em branco, como no dado oficial do V5
function imagemDoDado(tipo, valor) {
    if (tipo === "fome" && valor === 1) return "static/img/bestial-fail.png";
    const cor = tipo === "fome" ? "red" : "normal";
    if (valor === 10) return `static/img/${cor}-crit.png`;
    if (valor >= 6) return `static/img/${cor}-success.png`;
    return null;
}

let rolagem = null; // { normais, fome, dificuldade, rerrolou }
let selecionados = new Set();

function lerCampo(id, min, max, nome) {
    const valor = Number(document.getElementById(id).value);
    if (!Number.isInteger(valor) || valor < min || valor > max) {
        throw new Error(`${nome} deve ser um número inteiro entre ${min} e ${max}.`);
    }
    return valor;
}

function criarDado(tipo, valor, indice, animar) {
    const dice = document.createElement("button");
    dice.type = "button";
    dice.className = `dice ${tipo}`;
    dice.disabled = true;
    dice.setAttribute("aria-label", `${tipo === "fome" ? "Fome" : "Normal"}: ${valor}`);
    if (animar && ANIMACAO_MS) dice.classList.add("rolling");

    const imagem = imagemDoDado(tipo, valor);
    if (imagem) {
        const diceResult = document.createElement("span");
        diceResult.className = "dice-result";
        diceResult.style.backgroundImage = `url(${imagem})`;
        dice.appendChild(diceResult);
    }

    if (tipo === "normal") {
        dice.dataset.indice = indice;
        dice.addEventListener("click", () => alternarSelecao(dice));
    }
    return dice;
}

function renderizarDados(animarIndices) {
    diceContainer.replaceChildren(
        ...rolagem.normais.map((v, i) => criarDado("normal", v, i, animarIndices === "todos" || animarIndices.has(i))),
        ...rolagem.fome.map(v => criarDado("fome", v, null, animarIndices === "todos"))
    );
}

function alternarSelecao(dice) {
    const i = Number(dice.dataset.indice);
    if (selecionados.has(i)) selecionados.delete(i);
    else if (selecionados.size < 3) selecionados.add(i);
    dice.classList.toggle("selected", selecionados.has(i));
    dice.setAttribute("aria-pressed", selecionados.has(i));
    rerollBtn.textContent = `Rerrolar (${selecionados.size}/3)`;
    rerollBtn.disabled = selecionados.size === 0;
}

function liberarForcaDeVontade() {
    const podeRerrolar = !rolagem.rerrolou && rolagem.normais.length > 0;
    willpowerEl.hidden = !podeRerrolar;
    selecionados = new Set();
    rerollBtn.textContent = "Rerrolar (0/3)";
    rerollBtn.disabled = true;
    diceContainer.querySelectorAll(".dice.normal").forEach(d => {
        d.disabled = !podeRerrolar;
        if (podeRerrolar) d.setAttribute("aria-pressed", "false");
    });
}

function linha(rotulo, valor) {
    const div = document.createElement("div");
    const strong = document.createElement("strong");
    strong.textContent = `${rotulo}: `;
    div.append(strong, String(valor));
    return div;
}

function mostrarResultado(r) {
    const titulo = document.createElement("div");
    titulo.className = `message ${r.resultado}`;
    titulo.textContent = V5.RESULTADOS[r.resultado];

    const detalhes = {
        "critico-baguncado": "A Besta toma conta da vitória. Você consegue, mas de forma brutal ou cruel.",
        "falha-bestial": "A Besta reage ao fracasso: compulsão ou ação descontrolada.",
        "falha-total": "Nenhum sucesso."
    }[r.resultado];

    const margem = rolagem.dificuldade > 0 ? linha("Margem", r.margem > 0 ? `+${r.margem}` : r.margem) : null;

    resultsEl.replaceChildren(
        titulo,
        ...(detalhes ? [Object.assign(document.createElement("p"), { className: "detalhe", textContent: detalhes })] : []),
        linha("Sucessos", rolagem.dificuldade > 0 ? `${r.sucessos} de ${rolagem.dificuldade}` : r.sucessos),
        ...(margem ? [margem] : []),
        linha("Pares de 10", r.criticosPares),
        linha("Dados Normais", rolagem.normais.join(", ") || "—"),
        linha("Dados de Fome", rolagem.fome.join(", ") || "—")
    );
    resultsEl.hidden = false;
}

function finalizarRolagem(animarIndices) {
    renderizarDados(animarIndices);
    resultsEl.hidden = true;
    willpowerEl.hidden = true;
    form.querySelector("button[type=submit]").disabled = true;

    setTimeout(() => {
        diceContainer.querySelectorAll(".rolling").forEach(d => d.classList.remove("rolling"));
        const r = V5.evaluate(rolagem.normais, rolagem.fome, rolagem.dificuldade);
        mostrarResultado(r);
        liberarForcaDeVontade();
        salvarNoHistorico(r);
        form.querySelector("button[type=submit]").disabled = false;
    }, ANIMACAO_MS);
}

form.addEventListener("submit", event => {
    event.preventDefault();
    let total, fome, dificuldade;
    try {
        total = lerCampo("dados", 1, 30, "A parada de dados");
        fome = lerCampo("fome", 0, V5.FOME_MAX, "A fome");
        dificuldade = lerCampo("dificuldade", 0, 20, "A dificuldade");
    } catch (erro) {
        formError.textContent = erro.message;
        return;
    }
    formError.textContent = "";
    rouseResult.textContent = "";
    rolagem = { ...V5.rollPool(total, fome), dificuldade, rerrolou: false };
    finalizarRolagem("todos");
});

rerollBtn.addEventListener("click", () => {
    if (!rolagem || rolagem.rerrolou || selecionados.size === 0) return;
    rolagem.normais = V5.rerollWillpower(rolagem.normais, [...selecionados]);
    rolagem.rerrolou = true;
    finalizarRolagem(new Set(selecionados));
});

rouseBtn.addEventListener("click", () => {
    const fomeAtual = Math.min(Math.max(Number(fomeInput.value) || 0, 0), V5.FOME_MAX);
    const r = V5.rouseCheck(fomeAtual);
    fomeInput.value = r.fome;
    rouseResult.className = `rouse-result ${r.sucesso ? "ok" : "fail"}`;
    rouseResult.textContent = r.sucesso
        ? `Teste de Despertar: ${r.valor}. A Fome continua ${r.fome}.`
        : r.noLimite
            ? `Teste de Despertar: ${r.valor}. Fome já está em 5: risco de frenesi!`
            : `Teste de Despertar: ${r.valor}. A Fome sobe para ${r.fome}.`;
});

// Histórico (localStorage pode falhar em aba anônima; o app funciona sem ele)
function carregarHistorico() {
    try {
        const dados = JSON.parse(localStorage.getItem(HISTORICO_KEY));
        return Array.isArray(dados) ? dados : [];
    } catch {
        return [];
    }
}

function renderizarHistorico(historico) {
    historyEl.hidden = historico.length === 0;
    historyList.replaceChildren(...historico.map(h => {
        const li = document.createElement("li");
        const rotulo = document.createElement("span");
        rotulo.className = `tag ${h.resultado}`;
        rotulo.textContent = V5.RESULTADOS[h.resultado] || h.resultado;
        li.append(rotulo, ` ${h.sucessos} suc. (dif. ${h.dificuldade}) · [${h.normais.join(" ")}]${h.fome.length ? ` fome [${h.fome.join(" ")}]` : ""}${h.rerrolou ? " · FdV" : ""}`);
        return li;
    }));
}

function salvarNoHistorico(r) {
    const entrada = { resultado: r.resultado, sucessos: r.sucessos, dificuldade: rolagem.dificuldade, normais: rolagem.normais, fome: rolagem.fome, rerrolou: rolagem.rerrolou };
    const historico = [entrada, ...carregarHistorico()].slice(0, HISTORICO_MAX);
    try { localStorage.setItem(HISTORICO_KEY, JSON.stringify(historico)); } catch { /* sem persistência */ }
    renderizarHistorico(historico);
}

document.getElementById("clear-history").addEventListener("click", () => {
    try { localStorage.removeItem(HISTORICO_KEY); } catch { /* sem persistência */ }
    renderizarHistorico([]);
});

renderizarHistorico(carregarHistorico());
