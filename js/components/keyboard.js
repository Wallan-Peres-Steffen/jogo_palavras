// Teclado virtual A-Z + Enter + apagar. Sem teclas de acento por decisão de UX.

import { rotuloEstado } from '../a11y.js';

const LINHAS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

export function montar(raiz) {
  raiz.innerHTML = '';

  LINHAS.forEach((letras, indice) => {
    const linha = document.createElement('div');
    linha.className = 'tecla-linha';

    if (indice === 2) {
      linha.appendChild(criarTecla('Enter', 'Enter', 'larga'));
    }

    [...letras].forEach((letra) => {
      linha.appendChild(criarTecla(letra, letra));
    });

    if (indice === 2) {
      linha.appendChild(criarTecla('Backspace', '⌫', 'larga'));
    }

    raiz.appendChild(linha);
  });

  const dica = document.createElement('p');
  dica.className = 'atalho';
  dica.textContent = 'Use o teclado do aparelho ou toque nas letras.';
  raiz.appendChild(dica);
}

function criarTecla(chave, rotulo, classeExtra = '') {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = `tecla ${classeExtra}`.trim();
  botao.dataset.key = chave;
  botao.textContent = rotulo;

  if (chave === 'Enter') {
    botao.setAttribute('aria-label', 'Enviar palavra');
  } else if (chave === 'Backspace') {
    botao.setAttribute('aria-label', 'Apagar última letra');
  } else {
    botao.setAttribute('aria-label', `Letra ${chave}`);
  }

  return botao;
}

export function atualizar(raiz, mapa = {}) {
  if (!raiz) return;

  raiz.querySelectorAll('.tecla').forEach((botao) => {
    const chave = botao.dataset.key;
    const estado = mapa[chave];

    botao.classList.remove('certo', 'presente', 'ausente');
    if (estado) botao.classList.add(estado);

    if (chave === 'Enter' || chave === 'Backspace') return;

    botao.setAttribute(
      'aria-label',
      estado ? `Letra ${chave}, ${rotuloEstado(estado)}` : `Letra ${chave}`
    );
  });
}
