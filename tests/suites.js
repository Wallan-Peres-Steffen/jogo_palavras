// Suíte de testes do núcleo (sem DOM, exceto storage).
// Execute abrindo tests/test.html via servidor HTTP.

import { avaliar } from '../js/feedback.js';
import { ehValida, normalizar, totalDePalavras } from '../js/dictionary.js';
import { iniciar, submeter, estadoTeclado } from '../js/game.js';
import { dataSP, numeroDoDia, palavraDoDia } from '../js/daily.js';
import { vazio, registrarFim, resumo } from '../js/stats.js';
import { gerarTexto, gerarGrade } from '../js/share.js';
import { salvar, carregar, remover } from '../js/storage.js';

const resultados = [];

function teste(nome, fn) {
  try {
    fn();
    resultados.push({ nome, ok: true });
  } catch (erro) {
    resultados.push({ nome, ok: false, erro: erro instanceof Error ? erro.message : String(erro) });
  }
}

function igual(esperado, recebido, mensagem = '') {
  const a = JSON.stringify(esperado);
  const b = JSON.stringify(recebido);
  if (a !== b) throw new Error(`${mensagem} esperado ${a}, recebido ${b}`);
}

function verdadeiro(valor, mensagem = 'valor deveria ser verdadeiro') {
  if (!valor) throw new Error(mensagem);
}

function falso(valor, mensagem = 'valor deveria ser falso') {
  if (valor) throw new Error(mensagem);
}

const estados = (avaliacao) => avaliacao.map((casa) => casa.estado);
const letras = (avaliacao) => avaliacao.map((casa) => casa.letra);

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

teste('feedback: RAGUA × ARARA repete letras corretamente', () => {
  igual(['presente', 'presente', 'ausente', 'ausente', 'certo'], estados(avaliar('RAGUA', 'ARARA')));
});

teste('feedback: AAAAA × ARARA consome ocorrências', () => {
  igual(['certo', 'ausente', 'certo', 'ausente', 'certo'], estados(avaliar('AAAAA', 'ARARA')));
});

teste('feedback: comparação ignora acentos', () => {
  igual(['certo', 'certo', 'certo', 'certo', 'certo'], estados(avaliar('ACUDE', 'AÇUDE')));
  igual(['certo', 'certo', 'certo', 'certo', 'certo'], estados(avaliar('órfão', 'ORFAO')));
});

teste('feedback: retorna letras normalizadas', () => {
  igual(['A', 'C', 'U', 'D', 'E'], letras(avaliar('açude', 'ACUDE')));
});

teste('feedback: todas ausentes quando não há letras em comum', () => {
  igual(['ausente', 'ausente', 'ausente', 'ausente', 'ausente'], estados(avaliar('ZZZZZ', 'ABRIR')));
});

teste('feedback: palavra idêntica fica toda certa', () => {
  igual(['certo', 'certo', 'certo', 'certo', 'certo'], estados(avaliar('ARARA', 'ARARA')));
  igual(['certo', 'certo', 'certo', 'certo', 'certo'], estados(avaliar('ABRIR', 'ABRIR')));
});

teste('feedback: letra repetida no palpite consome só uma ocorrência', () => {
  igual(['certo', 'ausente', 'ausente', 'ausente', 'ausente'], estados(avaliar('AAAAA', 'ABRIR')));
});

teste('feedback: repetição no palpite e na resposta', () => {
  igual(
    ['presente', 'presente', 'ausente', 'ausente', 'ausente'],
    estados(avaliar('MAMAE', 'AMIGO'))
  );
  igual(
    ['presente', 'presente', 'presente', 'presente', 'ausente'],
    estados(avaliar('NANAN', 'ANANA'))
  );
});

teste('feedback: verde tem prioridade antes de contar amarelos', () => {
  igual(
    ['certo', 'presente', 'ausente', 'presente', 'ausente'],
    estados(avaliar('ARARA', 'ABRIR'))
  );
});

// ---------------------------------------------------------------------------
// Dicionário
// ---------------------------------------------------------------------------

teste('dicionário: aceita resposta com acento e sem acento', () => {
  verdadeiro(ehValida('AÇUDE'));
  verdadeiro(ehValida('acude'));
  verdadeiro(ehValida('AVIÃO'));
  falso(ehValida('ZZZZZ'));
  falso(ehValida('ABCD'));
});

teste('dicionário: base tem pelo menos 700 palavras válidas', () => {
  verdadeiro(totalDePalavras() >= 700, `total ${totalDePalavras()}`);
});

teste('dicionário: normalização remove acentos e caixa', () => {
  igual('ORGAO', normalizar('órgão'));
});

// ---------------------------------------------------------------------------
// Partida
// ---------------------------------------------------------------------------

teste('partida: vitória na primeira tentativa', () => {
  const partida = iniciar({ modo: 'pratica', palavra: 'ABRIR' });
  const { estado, evento } = submeter(partida, 'abrir');
  igual('won', estado.status);
  verdadeiro(evento.fim);
  igual(1, estado.tentativas.length);
});

teste('partida: palavra fora da lista não consome tentativa', () => {
  const partida = iniciar({ modo: 'pratica', palavra: 'ABRIR' });
  const { estado, evento } = submeter(partida, 'ZZZZZ');
  igual('invalido', evento.tipo);
  igual('dicionario', evento.motivo);
  igual(0, estado.tentativas.length);
});

teste('partida: palavra curta é recusada', () => {
  const partida = iniciar({ modo: 'pratica', palavra: 'ABRIR' });
  const { evento } = submeter(partida, 'ABC');
  igual('tamanho', evento.motivo);
});

teste('partida: derrota após seis tentativas', () => {
  let partida = iniciar({ modo: 'pratica', palavra: 'ABRIR' });
  for (let i = 0; i < 5; i += 1) {
    partida = submeter(partida, 'ABUSO').estado;
    igual('typing', partida.status);
  }
  const final = submeter(partida, 'ABUSO').estado;
  igual('lost', final.status);
  igual(6, final.tentativas.length);
});

teste('partida: teclado prioriza certo > presente > ausente', () => {
  const partida = {
    ...iniciar({ modo: 'pratica', palavra: 'ARARA' }),
    tentativas: ['RAGUA'],
    avaliacoes: [avaliar('RAGUA', 'ARARA')],
    linhaAtual: 1
  };
  const mapa = estadoTeclado(partida);
  igual('presente', mapa.R);
  igual('certo', mapa.A);
  igual('ausente', mapa.G);
});

// ---------------------------------------------------------------------------
// Estatísticas
// ---------------------------------------------------------------------------

teste('estatísticas: vitória incrementa sequência e distribuição', () => {
  const s1 = registrarFim(vazio(), { modo: 'diario', venceu: true, tentativas: 3, data: '2026-10-20' });
  igual(1, s1.streak);
  igual(1, s1.vitorias);
  igual([0, 0, 1, 0, 0, 0], s1.distribuicao);
  const s2 = registrarFim(s1, { modo: 'diario', venceu: true, tentativas: 2, data: '2026-10-25' });
  igual(2, s2.streak, 'dias ausentes não quebram a sequência');
  igual(2, s2.maxStreak);
});

teste('estatísticas: derrota zera sequência', () => {
  const vitoria = registrarFim(vazio(), { modo: 'diario', venceu: true, tentativas: 4, data: '2026-10-20' });
  const derrota = registrarFim(vitoria, { modo: 'diario', venceu: false, tentativas: 6, data: '2026-10-21' });
  igual(0, derrota.streak);
  igual(1, derrota.maxStreak);
  igual(2, derrota.jogos);
});

teste('estatísticas: prática não altera números', () => {
  const base = vazio();
  igual(base, registrarFim(base, { modo: 'pratica', venceu: true, tentativas: 1, data: null }));
});

teste('estatísticas: resumo calcula taxa, média e derrotas', () => {
  let s = registrarFim(vazio(), { modo: 'diario', venceu: true, tentativas: 2, data: '2026-10-20' });
  s = registrarFim(s, { modo: 'diario', venceu: true, tentativas: 4, data: '2026-10-21' });
  s = registrarFim(s, { modo: 'diario', venceu: false, tentativas: 6, data: '2026-10-22' });
  const r = resumo(s);
  igual(67, r.taxa);
  igual('3,0', r.media);
  igual(2, r.vitorias);
  igual(1, r.derrotas);
});

teste('estatísticas: registrar o mesmo dia duas vezes não conta de novo', () => {
  const s1 = registrarFim(vazio(), {
    modo: 'diario',
    venceu: true,
    tentativas: 3,
    data: '2026-10-22'
  });
  const s2 = registrarFim(s1, {
    modo: 'diario',
    venceu: true,
    tentativas: 3,
    data: '2026-10-22'
  });
  igual(s1, s2);
  igual(1, s2.jogos);
});

// ---------------------------------------------------------------------------
// Desafio diário
// ---------------------------------------------------------------------------

teste('diário: determinístico por data', () => {
  const a = palavraDoDia('2026-10-22');
  const b = palavraDoDia('2026-10-22');
  igual(a.palavra, b.palavra);
  verdadeiro(ehValida(a.palavra), 'palavra do dia deve estar no dicionário');
});

teste('diário: número do dia', () => {
  igual(1, numeroDoDia('2026-01-01'));
  igual(295, numeroDoDia('2026-10-22'));
});

teste('diário: fuso de São Paulo', () => {
  igual('2026-10-22', dataSP(new Date('2026-10-22T03:00:00Z')));
  igual('2025-12-31', dataSP(new Date('2026-01-01T02:00:00Z')));
});

teste('diário: não repete nenhuma palavra nos 90 dias anteriores', () => {
  let data = '2025-09-01';
  const recentes = [];

  for (let i = 0; i < 365; i += 1) {
    const { palavra } = palavraDoDia(data);
    falso(recentes.includes(palavra), `palavra ${palavra} repetiu em ${data}`);
    verdadeiro(ehValida(palavra), `palavra inválida em ${data}: ${palavra}`);

    recentes.push(palavra);
    if (recentes.length > 90) recentes.shift();

    const [ano, mes, dia] = data.split('-').map(Number);
    const seguinte = new Date(Date.UTC(ano, mes - 1, dia + 1));
    data = seguinte.toISOString().slice(0, 10);
  }
});

// ---------------------------------------------------------------------------
// Compartilhamento
// ---------------------------------------------------------------------------

teste('compartilhamento: não revela resposta nem letras', () => {
  const partida = {
    ...iniciar({ modo: 'diario', palavra: 'ARARA', data: '2026-10-22' }),
    tentativas: ['RAGUA'],
    avaliacoes: [avaliar('RAGUA', 'ARARA')],
    linhaAtual: 1,
    status: 'lost'
  };
  const texto = gerarTexto(partida);
  falso(texto.includes('ARARA'), 'texto não deve conter a resposta');
  falso(texto.includes('RAGUA'), 'texto não deve conter o palpite');
  verdadeiro(texto.includes('🟨🟨⬛⬛🟩'), 'texto deve conter a grade');
  verdadeiro(texto.includes('22/10'), 'texto deve conter a data');
  verdadeiro(texto.includes('X/6'), 'texto deve conter o placar');
});

teste('compartilhamento: derrota usa X/6', () => {
  let partida = iniciar({ modo: 'diario', palavra: 'ABRIR', data: '2026-10-22' });
  for (let i = 0; i < 6; i += 1) partida = submeter(partida, 'ABUSO').estado;
  const texto = gerarTexto(partida);
  verdadeiro(texto.includes('X/6'));
  igual(6, gerarGrade(partida).split('\n').length);
});

// ---------------------------------------------------------------------------
// Armazenamento
// ---------------------------------------------------------------------------

teste('armazenamento: salva, lê e remove', () => {
  const chave = '__teste_suite';
  salvar(chave, { ok: true, valor: 42 });
  igual({ ok: true, valor: 42 }, carregar(chave));
  remover(chave);
  igual(null, carregar(chave, null));
});

// ---------------------------------------------------------------------------
// Relatório
// ---------------------------------------------------------------------------

const falhas = resultados.filter((r) => !r.ok);
const aprovados = resultados.length - falhas.length;
const container = document.getElementById('resultado');

const resumoHtml = document.createElement('div');
resumoHtml.className = `resumo ${falhas.length === 0 ? 'ok' : 'falha'}`;
resumoHtml.innerHTML = `<b>${aprovados}/${resultados.length}</b> testes aprovados`;
container.appendChild(resumoHtml);

resultados.forEach((r) => {
  const item = document.createElement('div');
  item.className = `teste ${r.ok ? 'ok' : 'falha'}`;
  item.innerHTML = `<span aria-hidden="true">${r.ok ? '✓' : '✕'}</span> ${r.nome}${
    r.ok ? '' : `<small>${r.erro}</small>`
  }`;
  container.appendChild(item);
});

document.getElementById('status').textContent =
  falhas.length === 0 ? 'Tudo certo!' : `${falhas.length} falha(s) encontrada(s).`;

document.title = falhas.length === 0 ? `✓ Testes (${aprovados}/${resultados.length})` : `✕ Testes com falhas`;
