// Orquestração do app: navegação, eventos, persistência e modais.

import { dataSP, palavraDoDia, numeroDoDia } from './daily.js';
import { iniciar, submeter, estadoTeclado, podeDigitar } from './game.js';
import { palavraAleatoria, ehValida, normalizar } from './dictionary.js';
import { vazio as statsVazio, registrarFim, resumo as statsResumo } from './stats.js';
import { gerarTexto, gerarGrade, copiar } from './share.js';
import { carregar, salvar, remover, apagarTudo, armazenamentoDisponivel } from './storage.js';
import { aplicarTema, aplicarMovimento, anunciar, movimentoAtivo } from './a11y.js';
import { descreverLinha } from './feedback.js';
import * as board from './components/board.js';
import * as keyboard from './components/keyboard.js';
import * as modal from './components/modal.js';
import { mostrar as toast } from './components/toast.js';
import * as homeScreen from './screens/home.js';
import * as gameScreen from './screens/game.js';
import * as statsScreen from './screens/stats.js';

const main = document.getElementById('app');
const hoje = dataSP();

let stats = normalizarStats(carregar('stats', null));
let ajustes = normalizarAjustes(carregar('ajustes', null));
let diarioHoje = carregar('diarioHoje', null);
let partidaDiaria = carregar('partidaDiaria', null);
let partidaPratica = carregar('partidaPratica', null);
let dicaEtapa = Math.min(2, Math.max(0, Number(carregar('onboarding', 0)) || 0));

let estado = null;
let tela = 'home';
let refs = null;
let digitacao = '';
let bloqueado = false;
let temporizador = null;
let fimRegistrado = false;

const ESTADOS_CASA = new Set(['certo', 'presente', 'ausente']);

function inteiro(valor) {
  return Math.max(0, Math.floor(Number(valor) || 0));
}

function normalizarStats(bruto) {
  const base = statsVazio();
  if (!bruto || typeof bruto !== 'object') return base;

  const jogos = inteiro(bruto.jogos);
  const vitorias = Math.min(inteiro(bruto.vitorias), jogos);
  const streak = inteiro(bruto.streak);
  const distribuicao =
    Array.isArray(bruto.distribuicao) && bruto.distribuicao.length === 6
      ? bruto.distribuicao.map(inteiro)
      : [...base.distribuicao];

  return {
    jogos,
    vitorias,
    streak,
    maxStreak: Math.max(streak, inteiro(bruto.maxStreak)),
    distribuicao,
    ultimoDia: typeof bruto.ultimoDia === 'string' ? bruto.ultimoDia : null
  };
}

function normalizarAjustes(bruto) {
  return {
    tema: bruto?.tema === 'daltonico' ? 'daltonico' : 'padrao',
    movimento: bruto?.movimento === 'off' ? 'off' : 'on'
  };
}

// ---------------------------------------------------------------------------
// Saneamento do que veio do localStorage
// ---------------------------------------------------------------------------

/**
 * Valida a estrutura de uma partida persistida antes de confiar nela.
 * Evita crash e impede que HTML arbitrário chegue aos innerHTML do app.
 */
function estruturaValida(partida, modo, statusValidos, minimoTentativas = 0) {
  if (!partida || typeof partida !== 'object') return false;
  if (partida.modo !== modo) return false;
  if (!statusValidos.includes(partida.status)) return false;
  if (typeof partida.resposta !== 'string' || !ehValida(partida.resposta)) return false;
  if (!Array.isArray(partida.tentativas) || !Array.isArray(partida.avaliacoes)) return false;
  if (partida.tentativas.length !== partida.avaliacoes.length) return false;
  if (partida.tentativas.length < minimoTentativas || partida.tentativas.length > 6) return false;
  if (partida.linhaAtual !== partida.tentativas.length) return false;

  for (const tentativa of partida.tentativas) {
    if (typeof tentativa !== 'string') return false;
    const limpa = normalizar(tentativa);
    if (!/^[A-Z]{5}$/.test(limpa) || !ehValida(limpa)) return false;
  }

  for (const linha of partida.avaliacoes) {
    if (!Array.isArray(linha) || linha.length !== 5) return false;
    for (const casa of linha) {
      if (!casa || typeof casa !== 'object' || !ESTADOS_CASA.has(casa.estado)) return false;
    }
  }

  return true;
}

function partidaValida(partida, modo) {
  if (!estruturaValida(partida, modo, ['typing'])) return false;
  if (modo === 'diario' && partida.data !== hoje) return false;
  if (modo === 'pratica' && partida.data !== null) return false;
  return true;
}

function diarioValido(partida) {
  return estruturaValida(partida, 'diario', ['won', 'lost'], 1) && partida.data === hoje;
}

if (diarioHoje && !diarioValido(diarioHoje)) {
  diarioHoje = null;
  remover('diarioHoje');
}

// Migração defensiva: versões antigas podiam gravar a partida já encerrada.
if (partidaDiaria && partidaDiaria.modo === 'diario' && partidaDiaria.status !== 'typing') {
  if (
    !diarioHoje &&
    partidaDiaria.data === hoje &&
    estruturaValida(partidaDiaria, 'diario', ['won', 'lost'], 1)
  ) {
    stats = registrarFim(stats, {
      modo: 'diario',
      venceu: partidaDiaria.status === 'won',
      tentativas: partidaDiaria.tentativas.length,
      data: hoje
    });
    salvar('stats', stats);
    diarioHoje = partidaDiaria;
    salvar('diarioHoje', diarioHoje);
  }
  partidaDiaria = null;
  remover('partidaDiaria');
}

if (partidaDiaria && !partidaValida(partidaDiaria, 'diario')) {
  partidaDiaria = null;
  remover('partidaDiaria');
}

if (partidaPratica && !partidaValida(partidaPratica, 'pratica')) {
  partidaPratica = null;
  remover('partidaPratica');
}

// Um resultado concluído tem precedência sobre qualquer partida em andamento.
if (diarioHoje) {
  partidaDiaria = null;
  remover('partidaDiaria');
}

// ---------------------------------------------------------------------------
// Cabeçalho e navegação
// ---------------------------------------------------------------------------

function atualizarCabecalho(pulsar = false) {
  const selo = document.getElementById('selo-streak');
  if (!selo) return;

  if (stats.streak > 0) {
    selo.hidden = false;
    const numero = selo.querySelector('b');
    if (numero) numero.textContent = String(stats.streak);
    selo.setAttribute(
      'aria-label',
      `Sequência de ${stats.streak} ${stats.streak === 1 ? 'dia' : 'dias'}. Abrir estatísticas.`
    );
    if (pulsar && movimentoAtivo()) {
      selo.classList.remove('pulso');
      void selo.offsetWidth;
      selo.classList.add('pulso');
      window.setTimeout(() => selo.classList.remove('pulso'), 800);
    }
  } else {
    selo.hidden = true;
  }
}

function irPara(nome) {
  if (nome === 'home') {
    tela = 'home';
    renderizarHome();
  } else if (nome === 'stats') {
    tela = 'stats';
    renderizarStats();
  } else if (nome === 'game') {
    if (!estado) {
      tela = 'home';
      renderizarHome();
      return;
    }
    tela = 'game';
    abrirJogo();
  }

  // Foco no título da tela: leitores de tela recebem o contexto da navegação.
  const titulo = main.querySelector('.screen h1');
  if (titulo) {
    if (!titulo.hasAttribute('tabindex')) titulo.setAttribute('tabindex', '-1');
    titulo.focus({ preventScroll: true });
  } else {
    main.focus({ preventScroll: true });
  }
  window.scrollTo({ top: 0, behavior: movimentoAtivo() ? 'smooth' : 'auto' });
}

function renderizarHome() {
  estado = null;
  refs = null;
  homeScreen.render(main, {
    data: hoje,
    numero: numeroDoDia(hoje),
    resumo: statsResumo(stats),
    diarioConcluido: diarioHoje,
    emAndamento: Boolean(partidaDiaria),
    tentativas: partidaDiaria?.tentativas.length ?? 0,
    praticaEmAndamento: Boolean(partidaPratica)
  });
  atualizarCabecalho();
}

function renderizarStats() {
  estado = null;
  refs = null;
  statsScreen.render(main, { resumo: statsResumo(stats) });
  atualizarCabecalho();
}

function sincronizarPartida() {
  if (!estado) return;
  if (estado.modo === 'diario') {
    partidaDiaria = estado;
    salvar('partidaDiaria', estado);
  } else {
    partidaPratica = estado;
    salvar('partidaPratica', estado);
  }
}

function sairDoJogo() {
  window.clearTimeout(temporizador);
  bloqueado = false;

  // Se a última tentativa já encerrou a partida mas a animação ainda não abriu
  // o modal, garante o registro do resultado antes de navegar.
  if (estado && estado.status !== 'typing') {
    if (!fimRegistrado) persistirFimDaPartida(estado);
    fimRegistrado = false;
    estado = null;
    refs = null;
    return;
  }

  sincronizarPartida();
  fimRegistrado = false;
  estado = null;
  refs = null;
}

// ---------------------------------------------------------------------------
// Partida
// ---------------------------------------------------------------------------

function abrirJogo() {
  refs = gameScreen.montar(main, { modo: estado.modo });
  board.montar(refs.boardEl);
  keyboard.montar(refs.keyboardEl);
  digitacao = '';
  fimRegistrado = false;
  renderizarEstado();
  atualizarDica();
}

function renderizarEstado() {
  if (!estado || !refs) return;

  board.atualizar(refs.boardEl, estado, digitacao);
  keyboard.atualizar(refs.keyboardEl, estadoTeclado(estado));

  if (refs.progressoEl) {
    refs.progressoEl.innerHTML =
      estado.status === 'typing'
        ? `Tentativa <b>${estado.linhaAtual + 1}</b> de 6`
        : 'Partida concluída';
  }
}

function atualizarDica() {
  if (!refs?.dicaEl || !estado) return;

  if (estado.status !== 'typing' || dicaEtapa >= 2) {
    refs.dicaEl.hidden = true;
    return;
  }

  refs.dicaEl.hidden = false;

  if (dicaEtapa === 0) {
    refs.dicaEl.innerHTML = 'Digite uma palavra de <b>5 letras</b> e toque em <b>Enter</b>.';
  } else if (ajustes.tema === 'daltonico') {
    refs.dicaEl.innerHTML = '<b>▲</b> lugar certo · <b>●</b> outra posição · <b>✕</b> fora da palavra';
  } else {
    refs.dicaEl.innerHTML = '<b>🟩</b> lugar certo · <b>🟨</b> na palavra · <b>⬛</b> fora da palavra';
  }
}

function jogarDiario() {
  if (dataSP() !== hoje) {
    window.location.reload();
    return;
  }

  if (diarioHoje && diarioHoje.data === hoje) {
    abrirResultado(diarioHoje);
    return;
  }

  if (!partidaDiaria || partidaDiaria.data !== hoje) {
    const { palavra } = palavraDoDia(hoje);
    partidaDiaria = iniciar({ modo: 'diario', palavra, data: hoje });
    salvar('partidaDiaria', partidaDiaria);
  }

  estado = partidaDiaria;
  irPara('game');
}

function praticar() {
  if (!partidaPratica) {
    partidaPratica = iniciar({ modo: 'pratica', palavra: palavraAleatoria(), data: null });
    salvar('partidaPratica', partidaPratica);
  }

  estado = partidaPratica;
  irPara('game');
}

function digitarLetra(letra) {
  if (bloqueado || tela !== 'game' || !estado || !podeDigitar(estado) || modal.aberto()) return;
  if (digitacao.length >= 5) return;
  digitacao += letra;
  renderizarEstado();
}

function apagarLetra() {
  if (bloqueado || tela !== 'game' || !estado || !podeDigitar(estado) || modal.aberto()) return;
  digitacao = digitacao.slice(0, -1);
  renderizarEstado();
}

function enviarPalpite() {
  if (bloqueado || tela !== 'game' || !estado || !podeDigitar(estado) || modal.aberto()) return;

  // A aba pode ter ficado aberta durante a meia-noite: não grava um palpite de
  // ontem no dia novo. O reload reinicia com a palavra e a data corretas.
  if (dataSP() !== hoje) {
    window.location.reload();
    return;
  }

  if (digitacao.length < 5) {
    toast('Complete as 5 letras.');
    anunciar('A palavra precisa ter cinco letras.', { urgente: true });
    board.tremer(refs.boardEl);
    return;
  }

  const resultado = submeter(estado, digitacao);

  if (resultado.evento.tipo === 'invalido') {
    toast('Essa palavra não está na lista. Tente outra.');
    anunciar('Palavra não encontrada na lista. Tente outra.', { urgente: true });
    board.tremer(refs.boardEl);
    return;
  }

  if (resultado.evento.tipo === 'bloqueado') return;

  estado = resultado.estado;
  digitacao = '';
  bloqueado = true;
  sincronizarPartida();
  renderizarEstado();

  // Persiste o fim imediatamente: se a aba recarregar durante a animação, o
  // resultado (e a sequência) já estão salvos e o dia não pode ser rejogado.
  if (resultado.evento.fim) {
    persistirFimDaPartida(estado);
    fimRegistrado = true;
  }

  const linha = estado.linhaAtual - 1;
  board.animarRevelacao(refs.boardEl, linha);

  const tentativa = estado.tentativas[linha];
  anunciar(
    `Tentativa ${estado.linhaAtual} de 6: ${tentativa}. ${descreverLinha(tentativa, estado.avaliacoes[linha])}.`,
    { urgente: true }
  );

  if (dicaEtapa < 2) {
    dicaEtapa += 1;
    salvar('onboarding', dicaEtapa);
  }

  const espera = movimentoAtivo() ? 900 : 60;
  window.clearTimeout(temporizador);
  temporizador = window.setTimeout(() => {
    if (tela !== 'game' || !estado) {
      bloqueado = false;
      return;
    }

    bloqueado = false;
    board.pararRevelacao(refs.boardEl);

    if (estado.status === 'won' || estado.status === 'lost') {
      finalizarPartida();
    } else {
      renderizarEstado();
      atualizarDica();
    }
  }, espera);
}

function persistirFimDaPartida(final) {
  if (final.modo === 'diario') {
    const salvo = carregar('diarioHoje', null);
    const jaConcluido = Boolean(salvo) && diarioValido(salvo);

    if (!jaConcluido) {
      const base = normalizarStats(carregar('stats', null));
      stats = registrarFim(base, {
        modo: 'diario',
        venceu: final.status === 'won',
        tentativas: final.tentativas.length,
        data: final.data
      });
      salvar('stats', stats);

      diarioHoje = final;
      salvar('diarioHoje', final);
      atualizarCabecalho(true);
    } else {
      diarioHoje = salvo;
    }

    partidaDiaria = null;
    remover('partidaDiaria');
  } else {
    partidaPratica = null;
    remover('partidaPratica');
  }
}

function finalizarPartida() {
  const final = estado;
  if (!final) return;

  if (!fimRegistrado) persistirFimDaPartida(final);
  fimRegistrado = false;
  estado = null;
  refs = null;
  abrirResultado(final);
}

// ---------------------------------------------------------------------------
// Modais
// ---------------------------------------------------------------------------

function descreverGrade(final) {
  const linhas = final.avaliacoes.map((linha, indice) => {
    const contagem = { certo: 0, presente: 0, ausente: 0 };
    linha.forEach((casa) => {
      contagem[casa.estado] += 1;
    });
    return `linha ${indice + 1}: ${contagem.certo} no lugar certo, ${contagem.presente} em outra posição, ${contagem.ausente} fora`;
  });
  return `Grade de resultado, sem letras. ${linhas.join('; ')}.`;
}

function abrirResultado(final) {
  if (!final) return;
  const venceu = final.status === 'won';
  const tentativas = final.tentativas.length;
  const simbolos = ajustes.tema === 'daltonico';

  const mensagem = venceu
    ? `<p class="body-s" style="text-align:center">Você acertou em ${tentativas} ${
        tentativas === 1 ? 'tentativa' : 'tentativas'
      }.</p>`
    : `<p class="resultado-palavra">A palavra era <strong>${final.resposta}</strong></p>
       <p class="body-s" style="text-align:center">${
         final.modo === 'diario'
           ? 'Não foi desta vez. A sequência zera, mas o próximo desafio vem aí.'
           : 'Não foi desta vez. A prática não altera suas estatísticas.'
       }</p>`;

  const placares =
    final.modo === 'diario'
      ? `<div><b>${stats.streak}</b><span>Sequência</span></div>
         <div><b>${stats.maxStreak}</b><span>Recorde</span></div>`
      : `<div><b>∞</b><span>Prática</span></div>`;

  const html = `
    <p class="resultado-emoji" aria-hidden="true">${venceu ? '🌅' : '🌙'}</p>
    ${mensagem}
    <div class="placar">
      <div><b>${tentativas}<span style="font-size:12px;color:inherit">/6</span></b><span>Tentativas</span></div>
      ${placares}
    </div>
    <pre class="grade-emoji" role="img" aria-label="${descreverGrade(final)}">${gerarGrade(final, { simbolos })}</pre>
    <p class="mini" style="text-align:center;margin-top:8px">A grade não revela a palavra nem suas letras.</p>
  `;

  modal.abrir({
    titulo: venceu ? 'Você descobriu!' : 'Quase lá',
    html,
    confete: venceu,
    classe: venceu ? 'vitoria' : '',
    aoFechar: () => irPara('home'),
    botoes: [
      {
        label: 'Compartilhar resultado',
        classe: 'btn-coral',
        acao: () => compartilhar(final)
      },
      ...(final.modo === 'diario' && !venceu
        ? [
            {
              label: 'Jogar modo prática',
              classe: 'btn-mel',
              acao: () => {
                modal.fechar(false);
                praticar();
              }
            }
          ]
        : []),
      {
        label: 'Ver estatísticas',
        classe: 'btn-fantasma',
        acao: () => {
          modal.fechar(false);
          irPara('stats');
        }
      },
      {
        label: 'Fechar',
        classe: 'btn-fantasma',
        acao: () => modal.fechar()
      }
    ]
  });
}

async function compartilhar(final) {
  const ok = await copiar(gerarTexto(final));
  if (ok) {
    toast('Resultado copiado! Cole onde quiser.', { tipo: 'sucesso' });
    anunciar('Resultado copiado para a área de transferência.');
  } else {
    toast('Não foi possível copiar automaticamente.');
    anunciar('Não foi possível copiar automaticamente.', { urgente: true });
  }
}

function comoJogar() {
  modal.abrir({
    titulo: 'Como jogar',
    html: `
      <p>Descubra a palavra de cinco letras em até seis tentativas. Digite normalmente, sem acentos — o jogo cuida disso.</p>
      <div class="exemplo-grade" aria-hidden="true">
        <div class="linha">
          <div class="casa presente">R</div>
          <div class="casa presente">A</div>
          <div class="casa ausente">G</div>
          <div class="casa ausente">U</div>
          <div class="casa certo">A</div>
        </div>
      </div>
      <ul class="legenda">
        <li><span class="amostra certo" aria-hidden="true">A</span> Letra no lugar certo.</li>
        <li><span class="amostra presente" aria-hidden="true">A</span> Letra existe, mas em outra posição.</li>
        <li><span class="amostra ausente" aria-hidden="true">A</span> Letra não existe na palavra.</li>
      </ul>
      <p class="mini">Letras repetidas contam só as ocorrências disponíveis. Em RAGUA × ARARA, os dois primeiros A e R ficam amarelos; G e U ficam cinza.</p>
      <p class="mini">Um desafio novo por dia, à meia-noite de São Paulo. O modo prática é ilimitado e não altera suas estatísticas.</p>
    `,
    botoes: [
      { label: 'Entendi', classe: 'btn-mel', acao: () => modal.fechar() }
    ]
  });
}

function abrirAjustes() {
  const dialog = modal.abrir({
    titulo: 'Ajustes',
    html: `
      <div class="ajuste">
        <div>
          <b id="ajuste-tema-titulo">Modo daltônico</b>
          <span class="mini">Cores + símbolos ▲ ● ✕</span>
        </div>
        <button class="toggle" type="button" data-ajuste="tema" aria-pressed="false" aria-labelledby="ajuste-tema-titulo">Desligado</button>
      </div>
      <div class="ajuste">
        <div>
          <b id="ajuste-movimento-titulo">Reduzir animações</b>
          <span class="mini">Desliga flip, confete e transições</span>
        </div>
        <button class="toggle" type="button" data-ajuste="movimento" aria-pressed="false" aria-labelledby="ajuste-movimento-titulo">Desligado</button>
      </div>
      <p class="mini" style="margin-top:12px">Tudo é salvo só neste navegador. Nenhum dado é enviado.</p>
      <button class="link-como" type="button" data-extra="apagar">Apagar meus dados</button>
    `,
    botoes: [{ label: 'Fechar', classe: 'btn-fantasma', acao: () => modal.fechar() }],
    aoFechar: () => {
      // Devolve o foco à tela do jogo, não ao botão de ajustes: o teclado
      // físico e o Enter voltam a funcionar imediatamente.
      if (tela === 'game') {
        const titulo = main.querySelector('.screen h1');
        (titulo ?? main).focus({ preventScroll: true });
      }
    }
  });

  const botaoTema = dialog.querySelector('[data-ajuste="tema"]');
  const botaoMovimento = dialog.querySelector('[data-ajuste="movimento"]');

  const pintarTema = () => {
    const ativo = ajustes.tema === 'daltonico';
    botaoTema.setAttribute('aria-pressed', String(ativo));
    botaoTema.textContent = ativo ? 'Ligado' : 'Desligado';
  };

  const pintarMovimento = () => {
    const ativo = ajustes.movimento === 'off';
    botaoMovimento.setAttribute('aria-pressed', String(ativo));
    botaoMovimento.textContent = ativo ? 'Ligado' : 'Desligado';
  };

  pintarTema();
  pintarMovimento();

  botaoTema.addEventListener('click', () => {
    ajustes.tema = ajustes.tema === 'daltonico' ? 'padrao' : 'daltonico';
    aplicarTema(ajustes.tema);
    salvar('ajustes', ajustes);
    pintarTema();
    if (tela === 'game') atualizarDica();
  });

  botaoMovimento.addEventListener('click', () => {
    ajustes.movimento = ajustes.movimento === 'off' ? 'on' : 'off';
    aplicarMovimento(ajustes.movimento);
    salvar('ajustes', ajustes);
    pintarMovimento();
  });

  dialog.querySelector('[data-extra="apagar"]').addEventListener('click', () => {
    const confirmado = window.confirm(
      'Apagar estatísticas, sequência e partidas salvas deste aparelho? Essa ação não pode ser desfeita.'
    );
    if (!confirmado) return;

    apagarTudo();
    stats = normalizarStats(null);
    diarioHoje = null;
    partidaDiaria = null;
    partidaPratica = null;
    dicaEtapa = 0;
    estado = null;
    ajustes = normalizarAjustes(null);
    aplicarTema(ajustes.tema);
    aplicarMovimento(ajustes.movimento);
    modal.fechar(false);
    atualizarCabecalho();
    irPara('home');
    toast('Dados apagados.', { tipo: 'sucesso' });
    anunciar('Seus dados foram apagados.');
  });
}

// ---------------------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------------------

function tratarTecla(chave) {
  if (chave === 'Enter') enviarPalpite();
  else if (chave === 'Backspace') apagarLetra();
  else if (/^[A-Z]$/.test(chave)) digitarLetra(chave);
}

function aoClicar(evento) {
  if (!(evento.target instanceof Element)) return;

  const alvoAcao = evento.target.closest('[data-action]');
  if (alvoAcao) {
    const acao = alvoAcao.dataset.action;

    if (acao === 'inicio') {
      sairDoJogo();
      irPara('home');
    } else if (acao === 'stats') {
      sairDoJogo();
      irPara('stats');
    } else if (acao === 'jogar-diario') {
      jogarDiario();
    } else if (acao === 'ver-resultado') {
      if (diarioHoje) abrirResultado(diarioHoje);
    } else if (acao === 'pratica') {
      praticar();
    } else if (acao === 'como-jogar') {
      comoJogar();
    } else if (acao === 'ajustes') {
      abrirAjustes();
    } else if (acao === 'voltar') {
      sairDoJogo();
      irPara('home');
    }
    return;
  }

  const tecla = evento.target.closest('[data-key]');
  if (tecla) {
    evento.preventDefault();
    tratarTecla(tecla.dataset.key);
  }
}

function aoTeclar(evento) {
  if (evento.ctrlKey || evento.metaKey || evento.altKey) return;
  if (modal.aberto()) return;
  if (tela !== 'game') return;

  const alvo = evento.target instanceof Element ? evento.target : null;

  // Campos editáveis mantêm o comportamento nativo.
  if (alvo?.closest('input, textarea, select, [contenteditable="true"]')) return;

  // Enter em um controle focado deve ativar o próprio controle (inclusive as
  // teclas virtuais). Só interceptamos Enter quando o foco está na tela.
  if (evento.key === 'Enter') {
    if (alvo?.closest('button, a, [role="button"], [role="link"], [role="menuitem"]')) return;
    evento.preventDefault();
    tratarTecla('Enter');
  } else if (evento.key === 'Backspace') {
    evento.preventDefault();
    tratarTecla('Backspace');
  } else if (/^[a-zA-Z]$/.test(evento.key)) {
    tratarTecla(evento.key.toUpperCase());
  }
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

function mostrarAvisoArmazenamento() {
  const aviso = document.getElementById('aviso-storage');
  if (aviso) aviso.hidden = false;
}

window.addEventListener('pdd:storage-fallback', mostrarAvisoArmazenamento);
if (!armazenamentoDisponivel()) mostrarAvisoArmazenamento();

// Outras abas: mantém o que está visível coerente sem sobrescrever a partida
// em andamento desta aba.
window.addEventListener('storage', (evento) => {
  if (evento.key === null || !evento.key.startsWith('pdd:v1:')) return;
  const chave = evento.key.slice('pdd:v1:'.length);

  // "Apagar meus dados" em outra aba encerra qualquer partida desta aba, para
  // que um palpite posterior não recrie os dados que acabaram de ser apagados.
  if (evento.newValue === null && chave === 'stats' && tela === 'game') {
    window.clearTimeout(temporizador);
    estado = null;
    refs = null;
    bloqueado = false;
    fimRegistrado = false;
    digitacao = '';
    stats = normalizarStats(null);
    diarioHoje = null;
    partidaDiaria = null;
    partidaPratica = null;
    ajustes = normalizarAjustes(null);
    aplicarTema(ajustes.tema);
    aplicarMovimento(ajustes.movimento);
    tela = 'home';
    renderizarHome();
    toast('Os dados foram apagados em outra aba.');
    anunciar('Os dados foram apagados em outra aba. A partida foi encerrada.', { urgente: true });
    return;
  }

  if (chave === 'stats') {
    stats = normalizarStats(carregar('stats', null));
    atualizarCabecalho();
  } else if (chave === 'diarioHoje') {
    diarioHoje = carregar('diarioHoje', null);
    if (diarioHoje && !diarioValido(diarioHoje)) diarioHoje = null;
    if (diarioHoje) {
      partidaDiaria = null;
      remover('partidaDiaria');
    }
  } else if (chave === 'partidaDiaria') {
    partidaDiaria = carregar('partidaDiaria', null);
    if (partidaDiaria && !partidaValida(partidaDiaria, 'diario')) partidaDiaria = null;
  } else if (chave === 'partidaPratica') {
    partidaPratica = carregar('partidaPratica', null);
    if (partidaPratica && !partidaValida(partidaPratica, 'pratica')) partidaPratica = null;
  } else if (chave === 'ajustes') {
    ajustes = normalizarAjustes(carregar('ajustes', null));
    aplicarTema(ajustes.tema);
    aplicarMovimento(ajustes.movimento);
  }

  if (!modal.aberto() && tela === 'home') renderizarHome();
  else if (!modal.aberto() && tela === 'stats') renderizarStats();
});

aplicarTema(ajustes.tema);
aplicarMovimento(ajustes.movimento);
atualizarCabecalho();
tela = 'home';
renderizarHome();

document.addEventListener('click', aoClicar);
document.addEventListener('keydown', aoTeclar);

// Vira o dia mesmo com a aba aberta: recarrega quando a data de São Paulo muda.
window.setInterval(() => {
  if (dataSP() !== hoje) window.location.reload();
}, 60_000);

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && dataSP() !== hoje) window.location.reload();
});

// Offline: o service worker guarda o app shell e responde mesmo sem rede.
if (
  'serviceWorker' in navigator &&
  (location.protocol === 'https:' ||
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1')
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* offline opcional: o jogo continua funcionando online */
    });
  });
}
