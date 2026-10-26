# Palavra do Dia

Jogo diário de adivinhação de palavras em português brasileiro. Cinco letras, seis tentativas,
um desafio por dia — e modo prática ilimitado.

Implementação em **HTML, CSS e JavaScript puros**, com ES Modules, sem build, sem framework e sem
dependências externas. Interface mobile-first, 100% em PT-BR.

## Como jogar

- Descubra a palavra de 5 letras em até 6 tentativas.
- **🟩 verde**: letra no lugar certo.
- **🟨 amarelo**: letra existe na palavra, mas em outra posição.
- **⬛ cinza**: letra não existe na palavra.
- Letras repetidas contam apenas as ocorrências disponíveis. Exemplo: `RAGUA` contra `ARARA`
  produz 🟨🟨⬛⬛🟩.
- O teclado do jogo não tem acentos; digite normalmente (ex.: `ACUDE` encontra `AÇUDE`).
- O desafio do dia vale até a meia-noite de **São Paulo** e é o mesmo para todos os aparelhos.
- A sequência cresce a cada vitória no diário e zera **somente** em uma derrota. Dias sem jogar
  não quebram a sequência. O modo prática não altera estatísticas.

## Como rodar

ES Modules não funcionam abrindo o arquivo direto (`file://`). Sirva a pasta por HTTP:

```bash
# Opção 1 — servidor incluído (Node 18+)
node serve.mjs

# Opção 2 — Python
python -m http.server 8000
```

Depois abra <http://localhost:8000>.

> No Windows deste ambiente o Python não está instalado; `node serve.mjs` é o caminho mais direto.
> `PORT=3000 node serve.mjs` troca a porta.

## Testes

Com o servidor no ar:

- **Núcleo:** <http://localhost:8000/tests/test.html> — 29 verificações de feedback, dicionário,
  partida, diário (incluindo a janela sem repetição de 90 dias), estatísticas, compartilhamento e
  armazenamento.
- **Fluxo completo (E2E):** <http://localhost:8000/tests/e2e.html> — primeira visita sem modal
  automático, “Como jogar” sob demanda, diário, descoberta da resposta via `localStorage`,
  vitória, estatísticas e modo prática. A página limpa `pdd:v1:*` antes de abrir o app.

`npm test` faz apenas a verificação de **sintaxe** de todos os módulos (Node 18+). As suítes
funcionais precisam de navegador, porque dependem de DOM e `localStorage`.

```bash
npm test   # sintaxe
```

## Estrutura

```text
index.html                 shell: topbar, live regions, toast, script module
sw.js                      service worker: app shell offline (stale-while-revalidate)
css/
  tokens.css               paleta "Amanhecer", tipografia, espaçamento, raios
  base.css                 reset, layout, tipografia, botões globais
  components.css           início, tabuleiro, teclado, modais, estatísticas
  animations.css           keyframes + prefers-reduced-motion / data-motion
js/
  app.js                   orquestração, navegação, eventos, persistência, modais
  game.js                  regras puras da partida (submeter, estado do teclado)
  feedback.js              algoritmo de 2 passagens para letras repetidas
  daily.js                 data de São Paulo, hash e palavra determinística do dia
  dictionary.js            normalização sem acento, validação e sorteio
  stats.js                 sequência, histograma, taxa, média e derrotas
  share.js                 texto com grade de emojis (sem spoiler) e clipboard
  a11y.js                  live regions, tema, movimento, foco preso
  storage.js               localStorage com fallback em memória
  components/              board, keyboard, modal, toast
  screens/                 home, game, stats
data/
  respostas.js             359 respostas curadas (exibição com acentos)
  validas.js               378 palpites extras (forma normalizada)
tests/
  test.html + suites.js    testes do núcleo
  e2e.html                 fluxo completo em iframe
  check-syntax.mjs         verificação de sintaxe usada por npm test
serve.mjs                  servidor estático de desenvolvimento
```

## Decisões e detalhes

- **Desafio diário determinístico:** a data (`YYYY-MM-DD` em `America/Sao_Paulo`) alimenta um hash
  FNV-1a com semente fixa. A palavra escolhida não repete nenhuma candidata dos 90 dias anteriores.
  Não há estado envolvido, então dois aparelhos chegam à mesma palavra no mesmo dia.
- **Acentos:** as respostas podem ser exibidas com acento (`AÇUDE`, `ÓRGÃO`, `AVIÃO`), mas toda
  comparação é normalizada (NFD, sem diacríticos, maiúscula). O teclado envia apenas A–Z.
- **Persistência:** `localStorage` com chaves versionadas `pdd:v1:*` e fallback em memória quando o
  armazenamento está bloqueado. Partidas em andamento do diário e da prática são salvas
  separadamente, então trocar de modo não perde progresso. O resultado final é gravado de forma
  síncrona, antes da animação, e o registro do dia é idempotente: recarregar não conta duas vezes.
- **Offline (RNF-05):** um service worker (`sw.js`) guarda o app shell (23 arquivos) e responde mesmo
  sem rede. Navegação é rede-primeiro com fallback para o app shell; assets usam
  stale-while-revalidate. As estatísticas continuam locais e não passam pelo cache.
- **Sequência (PRD D3):** vitória soma 1, mesmo depois de dias ausentes; derrota zera. O recorde é
  preservado. A prática nunca altera os números.
- **Compartilhamento:** título, data, placar e grade de emojis. O texto não contém a resposta nem as
  letras digitadas. Usa `navigator.clipboard` com fallback por `textarea` + `execCommand`.
- **Acessibilidade:** navegação por teclado físico, foco visível, `role="dialog"` com foco preso e
  `Esc`, live regions para cada tentativa e erro, tabuleiro com rótulos por célula, alvos altos,
  modo daltônico (cores + símbolos ▲ ● ✕), respeito a `prefers-reduced-motion` e opção manual de
  reduzir animações.
- **Tema:** identidade "Amanhecer" do protótipo visual: noite/índigo, creme, mel e coral; Georgia
  para display, system-ui para interface e monoespaçada para o tabuleiro.
- **Privacidade:** não há backend, analytics ou cadastro. Todo o progresso fica no navegador e pode
  ser apagado em **Ajustes → Apagar meus dados**.

## Limitações conhecidas

- O dicionário é uma curadoria inicial de **737 palavras válidas** (359 respostas + 378 palpites
  extras), suficiente para meses de desafios e para jogar, mas menor que as 4.000–6.000 palavras de
  um produto comercial. A estrutura permite ampliar apenas editando `data/*.js`.
- **Editar a lista muda o desafio:** a sequência diária depende da ordem e do tamanho de
  `data/respostas.js`, então acrescentar ou reordenar palavras altera também datas já calculadas.
  Antes de publicar, congele a lista (ou versione a sequência) para não mudar desafios já jogados.
  Esta versão não foi publicada em URL pública.
- A curadoria não eliminou todos os estrangeirismos consagrados (ex.: `PIZZA`, `HOTEL`) nem termos
  que podem ser sensíveis em contextos escolares; uma revisão editorial definitiva ainda é necessária.
- O progresso fica em `localStorage`; por ser um jogo offline de um jogador, a resposta do dia também
  está legível ali (risco R-01 do documento técnico). Não há proteção contra inspeção do navegador.
- Sem ranking global e sem sincronização entre dispositivos (decisão de escopo: sem backend).
  Abas abertas ao mesmo tempo trocam atualizações de estatísticas/resultado, mas a última escrita de
  uma partida em andamento prevalece.
- O layout cobre 320 px sem rolagem horizontal. Em 320 px, as 10 teclas ficam com cerca de 27 px de
  largura (mínimo AA de 24×24) e 44 px de altura; não é possível atingir 44×44 por tecla sem quebrar
  a disposição QWERTY de 10 colunas. Em 360×640 e 320×568 o tabuleiro e o teclado cabem sem rolagem.
- O modo daltônico usa a paleta azul/laranja do protótipo de acessibilidade, além dos símbolos
  ▲ ● ✕ no tabuleiro, no teclado e na grade de resultado.
