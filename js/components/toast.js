// Toast curto e não bloqueante. A mensagem também é anunciada por live region.

let timer = null;

export function mostrar(mensagem, { tipo = 'erro', duracao = 2400 } = {}) {
  let elemento = document.getElementById('toast');

  if (!elemento) {
    elemento = document.createElement('div');
    elemento.id = 'toast';
    elemento.className = 'toast';
    elemento.setAttribute('role', 'status');
    elemento.setAttribute('aria-live', 'polite');
    document.body.appendChild(elemento);
  }

  elemento.textContent = mensagem;
  elemento.className = `toast ${tipo} visivel`;

  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    elemento.classList.remove('visivel');
  }, duracao);
}
