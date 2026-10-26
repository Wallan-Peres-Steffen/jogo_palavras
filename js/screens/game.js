// Tela da partida: cabeçalho, tabuleiro, dica de onboarding e teclado.

export function montar(raiz, { modo }) {
  const tag = modo === 'diario' ? 'DIÁRIO' : 'PRÁTICA';
  const rotuloModo = modo === 'diario' ? 'Desafio diário' : 'Modo prática';

  raiz.innerHTML = `
    <section class="screen tela-jogo" aria-labelledby="titulo-jogo">
      <h1 class="sr-only" id="titulo-jogo">${rotuloModo}</h1>
      <div class="topo-partida">
        <button class="btn-voltar" type="button" data-action="voltar" aria-label="Voltar para a tela inicial">←</button>
        <span class="progresso" id="progresso">Tentativa <b>1</b> de 6</span>
        <span class="modo-tag" aria-hidden="true">${tag}</span>
      </div>

      <div class="board" id="board" role="group" aria-label="Tabuleiro de seis linhas e cinco colunas"></div>

      <div class="dica" id="dica" hidden></div>

      <div class="keyboard" id="keyboard" role="group" aria-label="Teclado virtual"></div>
    </section>
  `;

  return {
    boardEl: raiz.querySelector('#board'),
    keyboardEl: raiz.querySelector('#keyboard'),
    dicaEl: raiz.querySelector('#dica'),
    progressoEl: raiz.querySelector('#progresso')
  };
}
