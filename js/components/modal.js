// Modal acessível: role=dialog, aria-modal, focus trap, Esc e retorno de foco.

import { movimentoAtivo, prenderFoco } from '../a11y.js';

let atual = null;

export function aberto() {
  return Boolean(atual);
}

export function abrir({
  titulo,
  html = '',
  botoes = [],
  aoFechar = null,
  confete = false,
  classe = ''
} = {}) {
  fechar(false);

  const focoAnterior = document.activeElement;
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  const dialog = document.createElement('div');
  dialog.className = `modal ${classe}`.trim();
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'modal-titulo');

  const fecharBtn = document.createElement('button');
  fecharBtn.type = 'button';
  fecharBtn.className = 'modal-fechar';
  fecharBtn.setAttribute('aria-label', 'Fechar');
  fecharBtn.textContent = '✕';

  const heading = document.createElement('h2');
  heading.id = 'modal-titulo';
  heading.tabIndex = -1;
  heading.textContent = titulo;

  const corpo = document.createElement('div');
  corpo.className = 'modal-corpo';
  corpo.innerHTML = html;

  const acoes = document.createElement('div');
  acoes.className = 'modal-acoes';

  botoes.forEach((configuracao) => {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = `btn ${configuracao.classe ?? 'btn-fantasma'}`;
    botao.textContent = configuracao.label;
    botao.addEventListener('click', () => configuracao.acao?.());
    acoes.appendChild(botao);
  });

  dialog.append(fecharBtn, heading, corpo, acoes);
  backdrop.appendChild(dialog);

  if (confete && movimentoAtivo()) {
    const cores = ['#F2B544', '#E4674C', '#2F7D50', '#E9B949', '#F5EFE3'];
    for (let i = 0; i < 26; i += 1) {
      const pedaco = document.createElement('span');
      pedaco.className = 'confete';
      pedaco.setAttribute('aria-hidden', 'true');
      pedaco.style.left = `${Math.random() * 100}%`;
      pedaco.style.background = cores[i % cores.length];
      pedaco.style.animationDelay = `${Math.random() * 0.5}s`;
      pedaco.style.animationDuration = `${1.2 + Math.random() * 0.9}s`;
      pedaco.style.transform = `rotate(${Math.random() * 180}deg)`;
      dialog.appendChild(pedaco);
    }
  }

  document.body.appendChild(backdrop);

  // Isola o conteúdo de fundo para leitores de tela e cursor virtual.
  const fundo = [document.querySelector('.skip-link'), document.querySelector('.topbar'), document.getElementById('app')].filter(Boolean);
  fundo.forEach((elemento) => elemento.setAttribute('inert', ''));
  const overflowAnterior = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  const liberarFoco = prenderFoco(dialog);
  const aoTeclar = (evento) => {
    if (evento.key === 'Escape') {
      evento.preventDefault();
      fechar();
    }
  };

  document.addEventListener('keydown', aoTeclar);
  fecharBtn.addEventListener('click', () => fechar());
  backdrop.addEventListener('click', (evento) => {
    if (evento.target === backdrop) fechar();
  });

  atual = {
    backdrop,
    dialog,
    liberarFoco,
    aoTeclar,
    aoFechar,
    focoAnterior,
    fundo,
    overflowAnterior
  };
  heading.focus();
  return dialog;
}

export function fechar(executarCallback = true) {
  if (!atual) return;

  const { backdrop, liberarFoco, aoTeclar, aoFechar, focoAnterior, fundo, overflowAnterior } = atual;
  atual = null;

  document.removeEventListener('keydown', aoTeclar);
  liberarFoco?.();
  backdrop.remove();
  fundo?.forEach((elemento) => elemento.removeAttribute('inert'));
  document.body.style.overflow = overflowAnterior ?? '';

  if (focoAnterior && typeof focoAnterior.focus === 'function' && focoAnterior.isConnected) {
    focoAnterior.focus();
  }

  if (executarCallback) aoFechar?.();
}
