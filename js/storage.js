// Armazenamento local com fallback em memória (modo privado / cota cheia).
// Todas as chaves usam um prefixo versionado para permitir migrações futuras.

const PREFIXO = 'pdd:v1:';
const memoria = new Map();

let disponivel = true;
try {
  const chaveTeste = `${PREFIXO}__teste`;
  window.localStorage.setItem(chaveTeste, '1');
  window.localStorage.removeItem(chaveTeste);
} catch {
  disponivel = false;
}

function lerLocal(chave) {
  try {
    return window.localStorage.getItem(PREFIXO + chave);
  } catch {
    disponivel = false;
    return null;
  }
}

export function carregar(chave, padrao = null) {
  // O localStorage é sempre a fonte mais recente (outras abas também escrevem
  // nele). A memória só entra como fallback quando a leitura falha ou não há
  // valor gravado.
  let emMemoria = null;
  try {
    const bruto = lerLocal(chave);
    if (bruto != null) return JSON.parse(bruto);
  } catch {
    emMemoria = memoria.get(chave);
  }

  if (emMemoria != null) {
    try {
      return JSON.parse(emMemoria);
    } catch {
      return padrao;
    }
  }

  return padrao;
}

export function salvar(chave, valor) {
  const bruto = JSON.stringify(valor);
  try {
    window.localStorage.setItem(PREFIXO + chave, bruto);
    memoria.delete(chave);
    disponivel = true;
  } catch {
    disponivel = false;
    memoria.set(chave, bruto);
    window.dispatchEvent(new CustomEvent('pdd:storage-fallback'));
  }
}

export function remover(chave) {
  memoria.delete(chave);
  try {
    // A remoção limpa também o valor que ficou preso no fallback de memória.
    window.localStorage.removeItem(PREFIXO + chave);
  } catch {
    disponivel = false;
  }
}

export function apagarTudo() {
  memoria.clear();
  try {
    const chaves = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const chave = window.localStorage.key(i);
      if (chave && chave.startsWith(PREFIXO)) chaves.push(chave);
    }
    chaves.forEach((chave) => window.localStorage.removeItem(chave));
  } catch {
    disponivel = false;
  }
}

export function armazenamentoDisponivel() {
  return disponivel;
}
