// Desafio diário determinístico no fuso de São Paulo.
// A sequência é calculada a partir de uma âncora fixa: cada data escolhe a
// primeira candidata do hash que não apareceu nos 90 dias anteriores. Como o
// cálculo é feito dia a dia, a janela sem repetição é garantida (não há
// dependência de localStorage e todos os aparelhos chegam ao mesmo resultado).

import { RESPOSTAS } from '../data/respostas.js';

const FUZO = 'America/Sao_Paulo';
const SEMENTE = 'palavra-do-dia-2026';
const JANELA_SEM_REPETICAO = 90;
const ANCORA = '2020-01-01';
const EPOCH = Date.UTC(2026, 0, 1);

const cache = new Map();
let cursor = null;
let janela = [];

export function dataSP(data = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUZO }).format(data);
}

export function formatarDataLonga(dataISO) {
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia, 12));
  const texto = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC'
  }).format(data);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function numeroDoDia(dataISO = dataSP()) {
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  const diferenca = Date.UTC(ano, mes - 1, dia) - EPOCH;
  return Math.floor(diferenca / 86400000) + 1;
}

function hash32(texto) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < texto.length; i += 1) {
    hash ^= texto.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function deslocar(dataISO, dias) {
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

function candidata(dataISO, tentativa) {
  const indice = hash32(`${dataISO}#${SEMENTE}#${tentativa}`) % RESPOSTAS.length;
  return RESPOSTAS[indice];
}

function escolher(dataISO) {
  const usadas = new Set(janela);
  // Percorre até achar uma palavra fora da janela. Com 359 respostas e 90
  // bloqueadas, isso sempre acontece; o limite evita laço infinito.
  for (let tentativa = 0; tentativa < RESPOSTAS.length; tentativa += 1) {
    const palavra = candidata(dataISO, tentativa);
    if (!usadas.has(palavra)) return palavra;
  }
  return candidata(dataISO, 0);
}

function reiniciarSequencia() {
  cursor = deslocar(ANCORA, -1);
  janela = [];
}

function calcular(dataISO) {
  if (cache.has(dataISO)) return cache.get(dataISO);

  // Antes da âncora não há sequência definida (não afeta o uso real).
  if (dataISO < ANCORA) return candidata(dataISO, 0);

  if (!cursor || dataISO < cursor) reiniciarSequencia();

  while (cursor < dataISO) {
    cursor = deslocar(cursor, 1);
    const palavra = escolher(cursor);
    cache.set(cursor, palavra);
    janela.push(palavra);
    if (janela.length > JANELA_SEM_REPETICAO) janela.shift();
  }

  return cache.get(dataISO);
}

export function palavraDoDia(dataISO = dataSP()) {
  return { palavra: calcular(dataISO), data: dataISO };
}
