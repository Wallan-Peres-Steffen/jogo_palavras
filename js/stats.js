// Estatísticas do modo diário.
// Decisão (PRD D3): a sequência cresce a cada vitória e zera apenas na derrota.
// Dias sem jogar não quebram a sequência.

export function vazio() {
  return {
    jogos: 0,
    vitorias: 0,
    streak: 0,
    maxStreak: 0,
    distribuicao: [0, 0, 0, 0, 0, 0],
    ultimoDia: null
  };
}

export function registrarFim(estatisticas, { modo, venceu, tentativas, data }) {
  if (modo !== 'diario') return estatisticas;
  // Idempotente por dia: reload/troca de tela não podem contar a mesma partida duas vezes.
  if (data && estatisticas.ultimoDia === data) return estatisticas;

  const proximo = {
    ...estatisticas,
    distribuicao: [...estatisticas.distribuicao]
  };

  proximo.jogos += 1;
  proximo.ultimoDia = data;

  if (venceu) {
    proximo.vitorias += 1;
    const indice = Math.min(Math.max(tentativas, 1), 6) - 1;
    proximo.distribuicao[indice] += 1;
    proximo.streak = estatisticas.streak + 1;
    proximo.maxStreak = Math.max(estatisticas.maxStreak, proximo.streak);
  } else {
    proximo.streak = 0;
  }

  return proximo;
}

export function resumo(estatisticas) {
  const { jogos, vitorias, distribuicao } = estatisticas;
  const taxa = jogos > 0 ? Math.round((vitorias / jogos) * 100) : 0;

  let soma = 0;
  let acertos = 0;
  distribuicao.forEach((quantidade, indice) => {
    soma += quantidade * (indice + 1);
    acertos += quantidade;
  });

  return {
    ...estatisticas,
    taxa,
    derrotas: Math.max(0, jogos - vitorias),
    media: acertos > 0 ? (soma / acertos).toFixed(1).replace('.', ',') : '—'
  };
}
