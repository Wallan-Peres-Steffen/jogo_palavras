// Algoritmo de feedback em duas passagens (regra de letras repetidas).
// Primeiro marca os verdes e consome as ocorrências; depois marca os amarelos
// apenas enquanto houver ocorrências restantes da letra no alvo.

import { normalizar } from './dictionary.js';

/**
 * @param {string} tentativa palpite (com ou sem acento)
 * @param {string} resposta palavra secreta (com ou sem acento)
 * @returns {{letra: string, estado: 'certo'|'presente'|'ausente'}[]}
 */
export function avaliar(tentativa, resposta) {
  const palpite = [...normalizar(tentativa)];
  const alvo = [...normalizar(resposta)];
  const resultado = palpite.map((letra) => ({ letra, estado: 'ausente' }));
  const restantes = new Map();

  for (let i = 0; i < 5; i += 1) {
    if (palpite[i] === alvo[i]) {
      resultado[i].estado = 'certo';
    } else {
      restantes.set(alvo[i], (restantes.get(alvo[i]) ?? 0) + 1);
    }
  }

  for (let i = 0; i < 5; i += 1) {
    if (resultado[i].estado === 'certo') continue;
    const disponivel = restantes.get(palpite[i]) ?? 0;
    if (disponivel > 0) {
      resultado[i].estado = 'presente';
      restantes.set(palpite[i], disponivel - 1);
    }
  }

  return resultado;
}

export function venceu(avaliacao) {
  return avaliacao.every((casa) => casa.estado === 'certo');
}

export function rotuloEstado(estado) {
  switch (estado) {
    case 'certo':
      return 'no lugar certo';
    case 'presente':
      return 'em outra posição';
    case 'ausente':
      return 'não existe na palavra';
    default:
      return 'vazia';
  }
}

export function descreverLinha(tentativa, avaliacao) {
  const letras = [...tentativa].map((letra, indice) => {
    const estado = avaliacao[indice]?.estado ?? 'ausente';
    return `${letra}: ${rotuloEstado(estado)}`;
  });
  return letras.join('; ');
}
