// Regras puras da partida. Nada aqui toca no DOM.

import { ehValida, normalizar } from './dictionary.js';
import { avaliar, venceu } from './feedback.js';

export const MAX_TENTATIVAS = 6;
export const TAMANHO_PALAVRA = 5;

export function iniciar({ modo, palavra, data = null }) {
  return {
    modo,
    data,
    resposta: palavra,
    tentativas: [],
    avaliacoes: [],
    linhaAtual: 0,
    status: 'typing',
    iniciadoEm: Date.now()
  };
}

export function podeDigitar(estado) {
  return Boolean(estado) && estado.status === 'typing' && estado.linhaAtual < MAX_TENTATIVAS;
}

export function estadoTeclado(estado) {
  const mapa = {};
  const peso = { ausente: 1, presente: 2, certo: 3 };

  estado.avaliacoes.forEach((linha, indiceLinha) => {
    linha.forEach((casa, indiceCasa) => {
      const letra = estado.tentativas[indiceLinha]?.[indiceCasa];
      if (!letra) return;
      if (!mapa[letra] || peso[casa.estado] > peso[mapa[letra]]) {
        mapa[letra] = casa.estado;
      }
    });
  });

  return mapa;
}

export function submeter(estado, bruto) {
  const palavra = normalizar(bruto);

  if (!podeDigitar(estado)) {
    return { estado, evento: { tipo: 'bloqueado' } };
  }

  if (palavra.length !== TAMANHO_PALAVRA) {
    return { estado, evento: { tipo: 'invalido', motivo: 'tamanho' } };
  }

  if (!ehValida(palavra)) {
    return { estado, evento: { tipo: 'invalido', motivo: 'dicionario' } };
  }

  const avaliacao = avaliar(palavra, estado.resposta);
  const tentativas = [...estado.tentativas, palavra];
  const avaliacoes = [...estado.avaliacoes, avaliacao];
  const ganhou = venceu(avaliacao);
  const perdeu = !ganhou && tentativas.length >= MAX_TENTATIVAS;

  const novo = {
    ...estado,
    tentativas,
    avaliacoes,
    linhaAtual: tentativas.length,
    status: ganhou ? 'won' : perdeu ? 'lost' : 'typing'
  };

  return {
    estado: novo,
    evento: {
      tipo: 'linha',
      avaliacao,
      ganhou,
      fim: ganhou || perdeu
    }
  };
}
