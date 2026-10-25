# **Vampiro: A Máscara - Rolagem de Dados**

Rolador de dados para o RPG **Vampiro: A Máscara (V5)**. HTML, CSS e JavaScript puros: basta abrir o `index.html` no navegador ou publicar no GitHub Pages.

---

## **Funcionalidades**

### 🎲 Rolagem
- Parada de dados (1 a 30), Fome (0 a 5) e Dificuldade (0 a 20; 0 = só contar sucessos).
- Dados de Fome substituem dados normais. Se a Fome for maior que a parada, todos os dados são de Fome.
- Animação de giro (desligada automaticamente com `prefers-reduced-motion`).
- Enter no formulário rola os dados.

### 📜 Regras do V5
- **Sucesso:** cada dado de 6 a 10.
- **Crítico:** cada par de 10 (de qualquer cor) vale 4 sucessos.
- **Crítico Bagunçado:** crítico vencedor com pelo menos um 10 em dado de Fome.
- **Falha Bestial:** a rolagem falha e há um 1 em dado de Fome.
- **Falha Total:** nenhum sucesso.
- **Margem:** sucessos menos a dificuldade.

### 💪 Força de Vontade
Após a rolagem, selecione até 3 dados **normais** e rerrole uma vez. Dados de Fome nunca são rerrolados.

### 🩸 Teste de Despertar
Rola 1d10: em 6+ a Fome se mantém; caso contrário sobe 1 (até 5) e o campo de Fome é atualizado.

### 🕰️ Histórico
As últimas 10 rolagens ficam salvas no navegador (`localStorage`).

---

## **Estrutura**
- `static/js/v5.js`: regras do jogo, sem dependência do DOM.
- `static/js/script.js`: interface.
- `static/js/v5.test.mjs`: testes das regras.

## **Testes**
```bash
node static/js/v5.test.mjs
```
