// Tela inicial — "Polegar Primeiro": CTA do dia no topo, prática e stats abaixo.

import { formatarDataLonga } from '../daily.js';

export function render(raiz, { data, numero, resumo, diarioConcluido, emAndamento = false, tentativas = 0, praticaEmAndamento = false }) {
  const jogado = Boolean(diarioConcluido) && diarioConcluido.data === data;
  const venceu = jogado && diarioConcluido.status === 'won';
  const dataLonga = formatarDataLonga(data);

  const blocoDia = jogado
    ? `<div class="resultado-hoje ${venceu ? 'ok' : 'nao'}">
         <span aria-hidden="true">${venceu ? '✓' : '✕'}</span>
         ${venceu ? 'Você acertou hoje' : 'Hoje não foi'} — ${diarioConcluido.tentativas.length}/6
       </div>
       <button class="btn btn-mel btn-cta" type="button" data-action="ver-resultado">Ver meu resultado</button>`
    : `<button class="btn btn-mel btn-cta" type="button" data-action="jogar-diario">▶ ${
        emAndamento ? 'Continuar o desafio' : 'Jogar o desafio de hoje'
      }</button>
       ${
         emAndamento
           ? `<p class="mini" style="text-align:center">${
               tentativas === 0
                 ? 'Você ainda não fez nenhuma tentativa.'
                 : `Você parou na tentativa ${tentativas} de 6.`
             }</p>`
           : ''
       }`;

  const sequencia =
    !jogado && resumo.streak > 0
      ? `<p class="streak-linha">🔥 Sequência de ${resumo.streak} ${resumo.streak === 1 ? 'dia' : 'dias'}</p>`
      : '';

  raiz.innerHTML = `
    <section class="screen tela-inicial" aria-labelledby="titulo-inicial">
      <p class="chip-data">${dataLonga} · São Paulo</p>

      <div class="card card-dia">
        <span class="eyebrow">Desafio do dia · Nº ${numero}</span>
        <h1 id="titulo-inicial" class="h-display">Palavra do Dia</h1>
        <p class="body-s">Cinco letras. Seis tentativas. O mesmo desafio para todo mundo, até a meia-noite.</p>
        ${blocoDia}
        ${sequencia}
      </div>

      <div class="grade-acoes">
        <button class="acao" type="button" data-action="pratica">
          <span aria-hidden="true">🎲</span>
          ${praticaEmAndamento ? 'Continuar prática' : 'Praticar'}
        </button>
        <button class="acao" type="button" data-action="stats">
          <span aria-hidden="true">📊</span>
          Estatísticas
        </button>
      </div>

      <button class="link-como" type="button" data-action="como-jogar">Como jogar</button>
      <p class="confianca">Sem cadastro · seu progresso fica só neste aparelho</p>
    </section>
  `;
}
