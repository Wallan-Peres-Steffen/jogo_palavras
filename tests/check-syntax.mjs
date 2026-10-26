// Verificação rápida de sintaxe de todos os módulos (sem navegador).
// As suítes funcionais rodam em tests/test.html e tests/e2e.html.

import { readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const pastas = ['js', 'data', 'tests'];
const arquivos = [join(raiz, 'serve.mjs'), join(raiz, 'sw.js')];

async function coletar(pasta) {
  const entradas = await readdir(pasta, { withFileTypes: true });
  for (const entrada of entradas) {
    const caminho = join(pasta, entrada.name);
    if (entrada.isDirectory()) await coletar(caminho);
    else if (['.js', '.mjs'].includes(extname(entrada.name))) arquivos.push(caminho);
  }
}

for (const pasta of pastas) await coletar(join(raiz, pasta));

for (const arquivo of arquivos) {
  const resultado = spawnSync(process.execPath, ['--check', arquivo], { stdio: 'inherit' });
  if (resultado.status !== 0) process.exit(resultado.status ?? 1);
}

console.log(`Sintaxe OK em ${arquivos.length} arquivos.`);
console.log('Suítes funcionais: /tests/test.html e /tests/e2e.html (com o servidor no ar).');
