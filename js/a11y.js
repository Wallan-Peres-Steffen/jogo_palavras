// Acessibilidade: anúncios em live regions, preferências e foco.

export function anunciar(texto, { urgente = false } = {}) {
  const regiao = document.getElementById(urgente ? 'live-alert' : 'live-polite');
  if (!regiao) return;
  regiao.textContent = '';
  window.setTimeout(() => {
    regiao.textContent = texto;
  }, 40);
}

export function aplicarTema(tema) {
  document.documentElement.dataset.theme = tema === 'daltonico' ? 'daltonico' : 'padrao';
}

export function aplicarMovimento(valor) {
  document.documentElement.dataset.motion = valor === 'off' ? 'off' : 'on';
}

export function movimentoAtivo() {
  if (document.documentElement.dataset.motion === 'off') return false;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function rotuloEstado(estado) {
  switch (estado) {
    case 'certo':
      return 'no lugar certo';
    case 'presente':
      return 'em outra posição';
    case 'ausente':
      return 'não existe na palavra';
    default:
      return 'vazia';
  }
}

export function textoCelula(linha, coluna, letra, estado) {
  const base = `Linha ${linha}, coluna ${coluna}`;
  if (!letra) return `${base}, vazia`;
  return `${base}, letra ${letra}, ${rotuloEstado(estado)}`;
}

const FOCAVEIS =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function prenderFoco(container) {
  function aoTeclar(evento) {
    if (evento.key !== 'Tab') return;
    const elementos = [...container.querySelectorAll(FOCAVEIS)].filter(
      (elemento) => elemento.offsetParent !== null
    );
    if (elementos.length === 0) return;

    const primeiro = elementos[0];
    const ultimo = elementos[elementos.length - 1];

    if (!elementos.includes(document.activeElement)) {
      evento.preventDefault();
      (evento.shiftKey ? ultimo : primeiro).focus();
    } else if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
  }

  document.addEventListener('keydown', aoTeclar);
  return () => document.removeEventListener('keydown', aoTeclar);
}
