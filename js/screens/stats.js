// Tela de estatísticas: cartões, histograma e regra da sequência.

function cartao(valor, rotulo) {
  return `<div class="stat"><b>${valor}</b><span>${rotulo}</span></div>`;
}

function descricaoDistribuicao(distribuicao) {
  return distribuicao
    .map((quantidade, indice) => `${indice + 1} tentativa${indice === 0 ? '' : 's'}: ${quantidade}`)
    .join('; ');
}

export function render(raiz, { resumo }) {
  const maximo = Math.max(...resumo.distribuicao, 1);

  const barras = resumo.distribuicao
    .map((quantidade, indice) => {
      const altura = Math.round((quantidade / maximo) * 100);
      return `
        <div class="barra-col">
          <span class="barra-num">${quantidade}</span>
          <div class="barra ${quantidade === 0 ? 'zero' : ''}" style="--h:${altura}%; animation-delay:${indice * 55}ms"></div>
          <span class="barra-rotulo">${indice + 1}</span>
        </div>
      `;
    })
    .join('');

  raiz.innerHTML = `
    <section class="screen tela-stats" aria-labelledby="titulo-stats">
      <button class="btn-voltar" type="button" data-action="inicio" aria-label="Voltar para a tela inicial">←</button>

      <h1 id="titulo-stats" class="h-1">Estatísticas</h1>

      <div class="grade-stats">
        ${cartao(resumo.jogos, 'Jogos')}
        ${cartao(resumo.vitorias, 'Vitórias')}
        ${cartao(resumo.derrotas, 'Derrotas')}
        ${cartao(resumo.taxa, '% de vitória')}
        ${cartao(resumo.streak, 'Sequência')}
        ${cartao(resumo.maxStreak, 'Máx. sequência')}
        ${cartao(resumo.media, 'Média')}
      </div>

      <div>
        <h2 class="h-1" style="font-size:20px;margin-bottom:10px">Distribuição de tentativas</h2>
        <div class="histograma" role="img" aria-label="Distribuição de vitórias: ${descricaoDistribuicao(resumo.distribuicao)}">
          ${barras}
        </div>
      </div>

      <p class="nota">
        Sua sequência cresce a cada vitória no desafio do dia e zera <b>somente</b> em uma derrota.
        Dias sem jogar não quebram a sequência.
      </p>

      <button class="btn btn-fantasma" type="button" data-action="inicio">Voltar ao início</button>
    </section>
  `;
}
