// Servidor estático mínimo (sem dependências) para desenvolvimento local.
// Uso: node serve.mjs  →  http://localhost:8000
// Alternativa: python -m http.server 8000

import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = await realpath(fileURLToPath(new URL('.', import.meta.url)));
const porta = Number(process.env.PORT) || 8000;
const raizComSeparador = raiz.endsWith(sep) ? raiz : raiz + sep;

function dentroDaRaiz(caminho) {
  return caminho === raiz || caminho.startsWith(raizComSeparador);
}

// Só arquivos que o app realmente precisa. Qualquer outra extensão vira 404.
const tipos = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

function responder(resposta, status, texto) {
  if (resposta.headersSent) return;
  resposta.writeHead(status, {
    'content-type': 'text/plain; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  });
  resposta.end(texto);
}

const servidor = createServer(async (requisicao, resposta) => {
  if (requisicao.method !== 'GET' && requisicao.method !== 'HEAD') {
    resposta.writeHead(405, {
      'content-type': 'text/plain; charset=utf-8',
      allow: 'GET, HEAD',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff'
    });
    resposta.end('405 — método não permitido');
    return;
  }

  try {
    const url = new URL(requisicao.url ?? '/', `http://${requisicao.headers.host ?? 'localhost'}`);
    let caminho = decodeURIComponent(url.pathname);
    if (caminho === '/') caminho = '/index.html';

    const absoluto = normalize(join(raiz, caminho));
    if (!dentroDaRaiz(absoluto)) {
      responder(resposta, 403, '403 — acesso negado');
      return;
    }

    // Resolve symlinks antes de validar segmentos/extensão: um link dentro da
    // raiz não pode apontar para .env ou .git/config.
    const real = await realpath(absoluto);
    if (!dentroDaRaiz(real)) {
      responder(resposta, 403, '403 — acesso negado');
      return;
    }

    const relativo = real.slice(raiz.length);
    const segmentos = relativo.split(/[\\/]+/).filter(Boolean);
    if (segmentos.some((segmento) => segmento.startsWith('.'))) {
      responder(resposta, 404, '404 — arquivo não encontrado');
      return;
    }

    const tipo = tipos[extname(real).toLowerCase()];
    if (!tipo) {
      responder(resposta, 404, '404 — arquivo não encontrado');
      return;
    }

    const conteudo = await readFile(real);
    resposta.writeHead(200, {
      'content-type': tipo,
      'content-length': conteudo.byteLength,
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff'
    });

    if (requisicao.method === 'HEAD') resposta.end();
    else resposta.end(conteudo);
  } catch (erro) {
    const naoEncontrado =
      erro && (erro.code === 'ENOENT' || erro.code === 'EISDIR' || erro.code === 'ENOTDIR');
    if (erro && erro.name === 'URIError') {
      responder(resposta, 400, '400 — requisição inválida');
      return;
    }
    responder(
      resposta,
      naoEncontrado ? 404 : 500,
      naoEncontrado ? '404 — arquivo não encontrado' : '500 — erro interno'
    );
  }
});

servidor.listen(porta, '127.0.0.1', () => {
  console.log(`Palavra do Dia em http://localhost:${porta}`);
  console.log('Testes em http://localhost:' + porta + '/tests/test.html');
});
