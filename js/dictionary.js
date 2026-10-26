// Dicionário: normalização, validação e sorteio de palavras.
// A exibição pode ter acentos; a comparação é sempre sem acento e maiúscula.

import { RESPOSTAS } from '../data/respostas.js';
import { VALIDAS } from '../data/validas.js';

export function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

const validasNormalizadas = new Set([
  ...RESPOSTAS.map(normalizar),
  ...VALIDAS.map(normalizar)
]);

export function ehValida(palpite) {
  const palavra = normalizar(palpite);
  return /^[A-Z]{5}$/.test(palavra) && validasNormalizadas.has(palavra);
}

export function palavraAleatoria() {
  return RESPOSTAS[Math.floor(Math.random() * RESPOSTAS.length)];
}

export function totalDePalavras() {
  return validasNormalizadas.size;
}

export { RESPOSTAS, VALIDAS };
