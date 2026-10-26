// Tabuleiro: 6 linhas x 5 colunas. Monta uma vez e atualiza células.

import { textoCelula } from '../a11y.js';

export const LINHAS = 6;
export const COLUNAS = 5;

export function montar(raiz) {
  raiz.innerHTML = '';

  for (let linha = 0; linha < LINHAS; linha += 1) {
    const elementoLinha = document.createElement('div');
    elementoLinha.className = 'linha';
    elementoLinha.dataset.linha = String(linha);
    elementoLinha.setAttribute('role', 'group');
    elementoLinha.setAttribute('aria-label', `Linha ${linha + 1}, vazia`);

    for (let coluna = 0; coluna < COLUNAS; coluna += 1) {
      const casa = document.createElement('div');
      casa.className = 'casa';
      casa.dataset.coluna = String(coluna);
      casa.setAttribute('role', 'img');
      casa.setAttribute('aria-label', textoCelula(linha + 1, coluna + 1, '', ''));
      elementoLinha.appendChild(casa);
    }

    raiz.appendChild(elementoLinha);
  }
}

export function atualizar(raiz, estado, digitacao = '') {
  if (!raiz || !estado) return;

  [...raiz.children].forEach((elementoLinha, linha) => {
    const avaliacao = estado.avaliacoes[linha];
    const emDigitacao = linha === estado.linhaAtual && estado.status === 'typing';
    const resumo = [];

    [...elementoLinha.children].forEach((casa, coluna) => {
      let letra = '';
      let classe = '';

      if (avaliacao) {
        letra = estado.tentativas[linha]?.[coluna] ?? '';
        classe = avaliacao[coluna]?.estado ?? '';
      } else if (emDigitacao) {
        letra = digitacao[coluna] ?? '';
        classe = letra ? 'preenchida' : '';
      }

      casa.textContent = letra;
      casa.className = classe ? `casa ${classe}` : 'casa';

      if (!letra) {
        casa.setAttribute('aria-label', textoCelula(linha + 1, coluna + 1, '', ''));
      } else if (classe === 'preenchida') {
        casa.setAttribute('aria-label', `Linha ${linha + 1}, coluna ${coluna + 1}, letra ${letra}`);
      } else {
        casa.setAttribute('aria-label', textoCelula(linha + 1, coluna + 1, letra, classe));
      }

      if (letra) resumo.push(letra);
    });

    elementoLinha.setAttribute(
      'aria-label',
      resumo.length > 0 ? `Linha ${linha + 1}: ${resumo.join(' ')}` : `Linha ${linha + 1}, vazia`
    );
  });
}

export function animarRevelacao(raiz, indiceLinha) {
  const linha = raiz?.children?.[indiceLinha];
  if (!linha) return;
  [...linha.children].forEach((casa, coluna) => {
    casa.style.setProperty('--d', `${coluna * 110}ms`);
    casa.classList.add('revelar');
  });
}

export function pararRevelacao(raiz) {
  raiz?.querySelectorAll('.revelar').forEach((casa) => {
    casa.classList.remove('revelar');
    casa.style.removeProperty('--d');
  });
}

export function tremer(raiz) {
  if (!raiz) return;
  raiz.classList.remove('tremer');
  void raiz.offsetWidth;
  raiz.classList.add('tremer');
  window.setTimeout(() => raiz.classList.remove('tremer'), 420);
}
