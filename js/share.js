// Compartilhamento: título + data + placar + grade de emojis.
// Nunca inclui a resposta nem as letras usadas.

import { dataSP } from './daily.js';

const EMOJI = {
  certo: '🟩',
  presente: '🟨',
  ausente: '⬛'
};

const SIMBOLO = {
  certo: '▲',
  presente: '●',
  ausente: '✕'
};

function dataCurta(dataISO) {
  const base = dataISO ?? dataSP();
  const [, mes, dia] = base.split('-');
  return `${dia}/${mes}`;
}

export function gerarGrade(estado, { simbolos = false } = {}) {
  const mapa = simbolos ? SIMBOLO : EMOJI;
  return estado.avaliacoes
    .map((linha) => linha.map((casa) => mapa[casa.estado] ?? mapa.ausente).join(''))
    .join('\n');
}

export function gerarTexto(estado) {
  const total = estado.tentativas.length;
  const placar = estado.status === 'won' ? `${total}/6` : `X/6`;
  const data = estado.modo === 'diario' ? ` ${dataCurta(estado.data)}` : '';
  const titulo = estado.modo === 'diario' ? 'Palavra do Dia' : 'Palavra do Dia · Prática';
  const grade = gerarGrade(estado);

  return `${titulo}${data} — ${placar}\n\n${grade}`;
}

export async function copiar(texto) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    /* tenta o fallback abaixo */
  }

  try {
    const area = document.createElement('textarea');
    area.value = texto;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch {
    return false;
  }
}
