# Documento de Projeto Técnico — Palavra do Dia

> **Como implementar o jogo com o design escolhido**

| Campo | Valor |
|---|---|
| **Produto** | Palavra do Dia |
| **Documento** | Projeto Técnico de Implementação (TDD) |
| **Versão** | 1.0 |
| **Data** | 22/10/2026 |
| **Base** | [PRD.md](./PRD.md) v1.0 + protótipos em [`prototipos/`](./prototipos/) |
| **Stack** | HTML5 + CSS3 + JavaScript ES2022 (módulos), sem build, sem dependências |
| **Entrega** | Site estático hospedado em GitHub Pages |

---

## 1. Escopo e decisão de design

### 1.1 Design escolhido

O painel de agentes produziu três direções complementares. A implementação adota a **fusão recomendada**,
mantendo cada camada sob responsabilidade de um especialista:

| Camada | Protótipo de origem | O que é incorporado |
|---|---|---|
| **Fluxo e estrutura de telas** | `prototipo-ux.html` — *Polegar Primeiro* | Hierarquia da tela inicial, zona de polegar, onboarding em contexto, contador de tentativas, fluxo real entre telas |
| **Acessibilidade** | `prototipo-acessibilidade.html` — *Acessível por Padrão* | Modo daltônico com símbolos ▲●✕, contraste AAA, ARIA completo, foco gerenciado, reduced-motion |
| **Identidade visual** | `prototipo-visual.html` — *Amanhecer* | Paleta Noite/Tinta/Creme/Mel/Coral, tipografia, marca SVG, animações (flip, confete, pulso) |

> **Regra de ouro:** nenhuma camada sobrescreve a outra. A estrutura vem do UX, a semântica/contraste vem da
> acessibilidade e a expressão visual vem da identidade — sempre nessa ordem de precedência em caso de conflito.

### 1.2 Objetivo deste documento

Traduzir o PRD e os protótipos em **decisões de engenharia executáveis**: arquitetura, design tokens, contratos
de módulos, algoritmos com pseudocódigo, modelo de dados, estratégia de testes e ordem de construção.
O documento é a fonte de verdade para o desenvolvimento do MVP (RF-01 a RF-18 do PRD).

---

## 2. Arquitetura geral

### 2.1 Visão de alto nível

Aplicação **SPA estática** (Single Page Application sem framework), com telas alternadas via JavaScript e
estado centralizado em um único objeto `GameState`. Não há backend: toda a lógica roda no cliente e a
persistência é local.

```
┌──────────────────────────────────────────────────────────────────┐
│                          index.html                              │
│  <header> marca + streak  ·  <main id="app">  ·  <div aria-live> │
└───────────────┬──────────────────────────────────────────────────┘
                │ monta
┌───────────────▼──────────────────────────────────────────────────┐
│                         app.js (controlador)                     │
│  • máquina de estados de tela (inicial/partida/vitória/stats)    │
│  • orquestra partida: entrada → validação → feedback → fim       │
│  • delega renderização aos componentes                           │
└───┬──────────┬───────────┬───────────┬───────────┬───────────────┘
    │          │           │           │           │
┌───▼───┐ ┌────▼────┐ ┌────▼─────┐ ┌───▼────┐ ┌────▼─────┐
│ board │ │keyboard │ │  modal   │ │ stats  │ │  share   │
│ .js   │ │  .js    │ │  .js     │ │ .js    │ │  .js     │
└───┬───┘ └────┬────┘ └────┬─────┘ └───┬────┘ └────┬─────┘
    └──────────┴───────────┴───────────┴───────────┘
                │ estado + persistência
┌───────────────▼──────────────────────────────────────────────────┐
│  game.js (regras puras)   ·   dictionary.js (palavras)           │
│  feedback.js (cores)      ·   daily.js (desafio determinístico)  │
│  storage.js (localStorage versionado)   ·   a11y.js (foco/ARIA)  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Princípios arquiteturais

1. **Regras puras e testáveis** — `game.js`, `feedback.js`, `daily.js` e `stats.js` não tocam no DOM.
2. **Renderização idempotente** — cada componente expõe `render(state)`; o controlador chama quando o estado muda.
3. **Sem dependências externas** — zero CDN, zero bundler. ES Modules nativos (`<script type="module">`).
4. **Estado serializável** — todo o progresso cabe em JSON e é recuperável após reload (RF-13).
5. **Acessibilidade é infraestrutura, não feature** — `a11y.js` centraliza anúncios, foco e modo de cor.

### 2.3 Decisão: ES Modules × file://

ES Modules **não carregam via `file://`** (restrição de CORS). Por isso:

- **Desenvolvimento:** servir por HTTP local — `python -m http.server 8000` ou extensão Live Server.
- **Produção:** GitHub Pages (HTTPS), sem configuração extra.
- **Consequência para testes:** os protótipos abrem em `file://`; o app real **não** — documentado no README.

---

## 3. Design system implementável (tokens)

Tokens extraídos de `prototipo-visual.html` e formalizados como CSS Custom Properties em `css/tokens.css`.
**Todos os componentes consomem apenas tokens — nenhum valor mágico.**

### 3.1 Cores — paleta "Amanhecer"

```css
:root {
  /* Superfícies */
  --noite:      #12142A;   /* fundo do app */
  --tinta:      #1C1F3D;   /* cards, casas vazias */
  --borda:      #333A66;   /* divisórias e contornos */
  --tinta-alta: #2A3060;   /* hover de superfície */

  /* Texto */
  --creme:      #F5EFE3;   /* texto principal — AA sobre noite/tinta */
  --creme-dim:  #B9B4C9;   /* texto secundário */

  /* Marca e ação */
  --mel:        #F2B544;   /* CTA primário, streak */
  --coral:      #E4674C;   /* compartilhar, erros */
  --coral-esc:  #D9573D;

  /* Feedback do jogo */
  --verde:      #2F7D50;   /* 🟩 correto — branco sobre ele = 5,0:1 (AA) */
  --amarelo:    #E9B949;   /* 🟨 presente — tinta sobre ele = 9,5:1 */
  --cinza:      #33365A;   /* ⬛ ausente */
  --borda-casa: #343A6B;
}
```

### 3.2 Tipografia

| Papel | Token | Stack | Tamanho / peso |
|---|---|---|---|
| Display / wordmark | `--font-display` | `Georgia, "Times New Roman", serif` | 30 px / 700 |
| Título de tela | `--font-ui` | `system-ui, -apple-system, "Segoe UI", Roboto` | 19 px / 800 |
| Corpo | `--font-ui` | idem | 15 px / 400 |
| Legenda | `--font-ui` | idem | 11 px / 600, `letter-spacing .02em`, uppercase |
| Letras do tabuleiro | `--font-mono` | `ui-monospace, "Cascadia Mono", "Courier New"` | 26 px / 700 |

Escala em `rem` (base 16 px) para suportar zoom de 200% sem corte (RNF-04).

### 3.3 Espaçamento, raios e sombras

```css
--sp-1: 4px;  --sp-2: 8px;  --sp-3: 12px;  --sp-4: 16px;  --sp-5: 24px;  --sp-6: 32px;
--r-s: 8px;   --r-m: 14px;  --r-l: 22px;   --r-xl: 28px;
--sh-1: 0 3px 12px rgba(0,0,0,.28);          /* superfície  */
--sh-2: 0 8px 26px rgba(0,0,0,.36);          /* elevação    */
--sh-mel: 0 6px 20px rgba(242,181,68,.28);   /* brilho de CTA */
```

### 3.4 Movimento

| Animação | Keyframes | Onde | Duração |
|---|---|---|---|
| Entrada de tela | `tela-entra` | troca de telas | 220 ms |
| Revelação de casa | `flip-casa` | feedback por linha (stagger 120 ms) | 500 ms |
| Erro de chute | `shake` | tabuleiro | 320 ms |
| Pulso de streak | `streak-pulso` | selo 🔥 | 2,4 s infinito |
| Florescer do sol | `sol-nasce` | emblema da marca | 5 s infinito |
| Queda de confete | `confete-cai` | modal de vitória | 1,6–2,4 s |
| Subida do modal | `modal-sobe` | vitória/derrota | 260 ms |

**Contrato de reduced-motion:** toda animação acima é desativada por
`@media (prefers-reduced-motion: reduce)` **e** pelo token `data-motion="off"` controlado pelo usuário
(botão de configurações). Em modo reduzido: `animation: none`, `transition: opacity 150ms`.

### 3.5 Tema acessível (modo daltônico)

Ativado por `data-theme="colorblind"` no `<html>`. Troca o trio de feedback para **azul/laranja** e
**adiciona símbolos** — a cor nunca é o único canal (WCAG 1.4.1).

```css
[data-theme="colorblind"] {
  --verde:   #1F5FA8;  /* azul — "certo"    */
  --amarelo: #E08A00;  /* laranja — "presente" */
  --cinza:   #4A4E69;
}
```

| Estado | Cor padrão | Símbolo | `aria-label` da casa |
|---|---|---|---|
| Certo | 🟩 `--verde` | ▲ | `linha 2, coluna 2, letra O, verde, no lugar certo` |
| Presente | 🟨 `--amarelo` | ● | `linha 2, coluna 4, letra R, amarelo, em outra posição` |
| Ausente | ⬛ `--cinza` | ✕ | `linha 2, coluna 5, letra S, cinza, não existe` |
| Vazia | — | — | `linha 3, coluna 1, vazia` |

Os símbolos são renderizados via `::after` no modo daltônico (sem alterar o DOM) e **sempre** presentes
como texto no `aria-label`, independentemente do tema.

---

## 4. Estrutura do projeto

```
jogo_palavras/
├── index.html                  # shell: header, <main id="app">, live regions
├── css/
│   ├── tokens.css              # variáveis (3.1–3.5)
│   ├── base.css                # reset, tipografia, layout, foco visível
│   ├── components.css          # board, teclado, cards, modal, stats
│   └── animations.css          # keyframes + media queries de movimento
├── js/
│   ├── app.js                  # controlador: telas, eventos, orquestração
│   ├── game.js                 # regras puras: init, submitGuess, status
│   ├── feedback.js             # cálculo verde/amarelo/cinza (letras repetidas)
│   ├── daily.js                # data SP, hash determinístico, histórico
│   ├── dictionary.js           # acesso às listas + normalização
│   ├── storage.js              # localStorage versionado + migração
│   ├── stats.js                # agregação e histograma
│   ├── share.js                # texto/emoji-grid + clipboard com fallback
│   ├── a11y.js                 # anúncios, foco, modo de cor, reduced motion
│   ├── components/
│   │   ├── board.js            # tabuleiro 5×6
│   │   ├── keyboard.js         # teclado virtual + entrada física
│   │   ├── modal.js            # vitória/derrota/como jogar
│   │   └── toast.js            # mensagens não bloqueantes
│   └── screens/
│       ├── home.js             # tela inicial
│       ├── game.js             # tela da partida (composição board+keyboard)
│       └── stats.js            # tela de estatísticas
├── data/
│   ├── respostas.js            # export const RESPOSTAS = [...]
│   └── validas.js              # export const VALIDAS = [...]
├── tests/
│   ├── test.html               # runner mínimo (sem framework)
│   └── suites.js               # casos de feedback, daily, stats, storage
├── prototipos/                 # referência visual (não entra em produção)
├── PRD.md
├── projeto-tecnico.md          # este documento
└── README.md
```

**Convenções:** nomes de arquivos em `kebab-case`; funções exportadas em `camelCase`; constantes em
`UPPER_SNAKE`; nenhum módulo importa de `components/` para `screens/` (fluxo unidirecional).

---

## 5. Modelo de estado e persistência

### 5.1 Contrato do estado

```js
/**
 * @typedef {'idle'|'typing'|'revealing'|'won'|'lost'} GameStatus
 * @typedef {{ letra: string, estado: 'certo'|'presente'|'ausente' }} LetraAvaliada
 */

const GameState = {
  modo: 'diario',            // 'diario' | 'pratica'
  data: '2026-10-22',        // chave do dia (modo diário) ou null (prática)
  resposta: 'NEVES',         // nunca renderizada antes do fim
  tentativas: [],            // string[] — máximo 6, 5 letras cada
  avaliacoes: [],            // LetraAvaliada[][] — resultado por linha
  linhaAtual: 0,             // 0..5
  status: 'typing',          // GameStatus
  iniciadoEm: 1698000000000, // epoch ms
  revelando: false           // trava de input durante animação
};
```

### 5.2 Máquina de estados

```
idle ──(abre desafio)──▶ typing
typing ──(Enter)──▶ validando ──inválida──▶ typing  (toast, NÃO consome tentativa)
validando ──válida──▶ revealing ──(fim da animação)──▶ typing | won | lost
won/lost ──(novo desafio/prática)──▶ idle → typing
```

**Regras de transição (invariantes):**
- `tentativas.length === linhaAtual` em todo momento fora de `revealing`.
- Entrada bloqueada enquanto `status === 'finishing'` ou `revelando === true`.
- `won` exige `tentativas.length ≤ 6`; `lost` exige `tentativas.length === 6`.

### 5.3 Persistência (`localStorage`)

| Chave | Conteúdo | Quando grava |
|---|---|---|
| `pdd:v1:partida` | `GameState` (sem `resposta` em modo prática? ver §5.4) | a cada chute e ao abrir |
| `pdd:v1:stats` | agregados + histograma + histórico de dias | ao fim de cada partida diária |
| `pdd:v1:ajustes` | `{ tema:'padrao'|'daltonico', movimento:'on'|'off' }` | ao alternar |
| `pdd:v1:meta` | `{ versao:1, criadoEm, ultimoDiaJogado }` | 1ª execução |

```js
// storage.js — API pública
export const storage = {
  load(key, fallback) { /* JSON.parse com try/catch e validação de versão */ },
  save(key, value)   { /* JSON.stringify + tratamento de QuotaExceededError */ },
  migrate()          { /* pdd:v0 → pdd:v1 se existir schema antigo */ },
  clearAll()         { /* usado apenas pelo botão "Apagar meus dados" */ }
};
```

**Robustez:** toda leitura é defensiva. Se o JSON estiver corrompido, o app inicia uma partida nova e
preserva as estatísticas antigas quando possível (nunca quebra a tela).

### 5.4 Persistência do desafio diário

- Grava a partida **somente no modo diário**, para permitir retomar após reload (RF-13).
- No modo prática, a partida em andamento **também** é salva, mas com `modo:'pratica'` e sem
  afetar streak/estatísticas.
- `resposta` fica no `GameState` por simplicidade (não há servidor); ver risco R-01 (§14).

---

## 6. Algoritmos centrais

### 6.1 Normalização PT-BR (dictionary.js)

O jogador digita **sem acento** (teclado virtual não tem teclas acentuadas); o jogo exibe com acento.

```js
export const normalizar = (s) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function ehValida(palavra, modo = 'diario') {
  const p = normalizar(palavra);
  return p.length === 5 && VALIDAS_NORM.has(p);
}
```

- Listas em memória são `Set<string>` normalizadas para busca O(1).
- A exibição usa a forma original acentuada (`respostaExibicao`).

### 6.2 Feedback de cores com letras repetidas (feedback.js)

Este é o algoritmo mais crítico do jogo. Implementação em **duas passagens**:

```js
/**
 * @param {string} palpite  palavra digitada (5 letras, normalizada)
 * @param {string} resposta palavra secreta (5 letras, normalizada)
 * @returns {('certo'|'presente'|'ausente')[]}
 */
export function avaliar(palpite, resposta) {
  const res = Array(5).fill('ausente');
  const restantes = new Map(); // letra → ocorrências ainda disponíveis

  // Passagem 1 — verdes (posição exata) e contagem do que sobra
  for (let i = 0; i < 5; i++) {
    if (palpite[i] === resposta[i]) res[i] = 'certo';
    else restantes.set(resposta[i], (restantes.get(resposta[i]) ?? 0) + 1);
  }

  // Passagem 2 — amarelos (existe, mas em outra posição, respeitando o limite)
  for (let i = 0; i < 5; i++) {
    if (res[i] === 'certo') continue;
    const qtd = restantes.get(palpite[i]) ?? 0;
    if (qtd > 0) {
      res[i] = 'presente';
      restantes.set(palpite[i], qtd - 1);
    }
  }
  return res;
}
```

**Casos de teste obrigatórios** (`tests/suites.js`):

| Palpite | Resposta | Esperado | O que valida |
|---|---|---|---|
| `RAGUA` | `ARARA` | 🟨🟨⬛⬛🟩 | limite de repetição (2 R, 3 A) |
| `ARARA` | `ARARA` | 🟩🟩🟩🟩🟩 | vitória trivial |
| `SERRA` | `TERRA` | ⬛🟩🟩🟩🟩 | mistura certo/ausente |
| `BANAL` | `BANAL` | 🟩🟩🟩🟩🟩 | todas corretas |
| `AAAAA` | `ARARA` | 🟩⬛🟩⬛🟩 | repetição excessiva no palpite |
| `OVO` (3) | — | erro de validação | tamanho inválido |
| `XXXXX` | — | erro de validação | palavra inexistente |

### 6.3 Palavra do dia determinística (daily.js)

Sem servidor, todos os jogadores do mesmo dia recebem a mesma palavra (RF-05).

```js
/** Data no fuso de São Paulo como 'YYYY-MM-DD' */
export function dataSP(agora = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo'
  }).format(agora);
}

/** FNV-1a 32 bits — estável entre navegadores */
function hash32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function palavraDoDia(data = dataSP(), lista = RESPOSTAS) {
  let tentativa = 0;
  let indice = hash32(`${data}#${SEED}#${tentativa}`) % lista.length;
  // Evita repetição recente: até 10 re-hashes
  const recentes = new Set(storage.load('pdd:v1:recentes', []));
  while (recentes.has(lista[indice]) && tentativa < 10) {
    tentativa++;
    indice = hash32(`${data}#${SEED}#${tentativa}`) % lista.length;
  }
  return { palavra: lista[indice], data };
}
```

- `SEED` é uma constante do projeto (não secreta) que permite “re-embaralhar” as datas de forma estável.
- `Intl.DateTimeFormat` com `timeZone` elimina o problema de fuso; o reset ocorre à meia-noite de São Paulo
  (RF-18).
- A escolha não usa estado: o hash da data é comparado com as candidatas dos 90 dias anteriores
  (determinístico inclusive entre aparelhos). Assim, a mesma data sempre gera a mesma palavra.
- **Colisão após 12 tentativas é aceitável** e documentada; a lista tem 359 respostas, o que cobre
  com folga a janela de 90 dias.

### 6.4 Streak e estatísticas (stats.js)

```js
// Regra do PRD (D3): quebra apenas na DERROTA. Dias ausentes não zeram.
export function registrarFim(stats, { modo, venceu, tentativas, data }) {
  if (modo !== 'diario') return stats;            // prática não altera nada
  const s = structuredClone(stats);
  s.jogos += 1;
  if (venceu) {
    s.vitorias += 1;
    s.distribuicao[tentativas - 1] += 1;          // histograma 1..6
    s.streak += 1;                                // vitória sempre soma, mesmo após dias ausentes
  } else {
    s.streak = 0;                                 // única condição que zera a sequência
  }
  s.ultimoDia = data;
  s.maxStreak = Math.max(s.maxStreak, s.streak);
  return s;
}
```

- `taxaVitoria = vitorias / jogos`; `mediaTentativas = Σ(i × dist[i]) / vitórias`.
- Não há cálculo de “dia anterior”: a sequência é a quantidade de vitórias desde a última derrota,
  exatamente como o PRD D3 determina.
- Estatísticas de prática **nunca** entram no painel (decisão D6 do PRD).

### 6.5 Compartilhamento (share.js)

```js
const EMOJI = { certo: '🟩', presente: '🟨', ausente: '⬛' };

export function gerarTexto(state) {
  const titulo = state.modo === 'diario'
    ? `Palavra do Dia ${formatarData(state.data)}`
    : 'Palavra do Dia — Prática';
  const placar = state.status === 'won' ? `${state.tentativas.length}/6` : 'X/6';
  const grade = state.avaliacoes
    .map(linha => linha.map(a => EMOJI[a.estado]).join(''))
    .join('\n');
  return `${titulo} ${placar}\n\n${grade}`;
}

export async function copiar(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    // Fallback para iOS/iframes/perm Predefinição negada
    const ta = Object.assign(document.createElement('textarea'), { value: texto });
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}
```

**Invariante de segurança:** o texto compartilhado **nunca** contém a resposta (teste automatizado verifica
que `texto` não inclui `state.resposta`).

---

## 7. Telas, componentes e DOM

### 7.1 Shell (`index.html`)

```html
<body data-theme="padrao" data-motion="on">
  <a class="skip-link" href="#app">Pular para o jogo</a>

  <header class="topbar">
    <div class="marca" aria-label="Palavra do Dia">
      <!-- emblema SVG inline (sol nascente sobre 5 casas) -->
    </div>
    <div class="selo-streak" aria-label="Sequência de 12 dias">🔥 12</div>
  </header>

  <main id="app"><!-- telas montadas aqui --></main>

  <div id="live-polite" aria-live="polite" class="sr-only"></div>
  <div id="live-alert" role="alert" class="sr-only"></div>

  <script type="module" src="./js/app.js"></script>
</body>
```

- `.sr-only` = visualmente oculto, acessível a leitores de tela.
- A marca é **SVG inline** (sem arquivo externo) — mesmo desenho de “Amanhecer”.

### 7.2 Tela inicial (Home)

Estrutura herdada de “Polegar Primeiro” (hierarquia de uma escolha):

```html
<section class="screen screen--home" aria-labelledby="titulo-home">
  <p class="chip-data">terça-feira, 22 de outubro · São Paulo</p>
  <div class="card card-dia">
    <span class="eyebrow">DESAFIO DO DIA · Nº 288</span>
    <h1 id="titulo-home">Palavra do Dia</h1>
    <p class="body-s">Uma palavra de 5 letras. Seis tentativas. Sem pressa.</p>
    <button class="btn btn-mel btn-cta" data-action="jogar-diario">
      ▶ Jogar o desafio de hoje
    </button>
  </div>
  <div class="grade-acoes">
    <button class="acao" data-action="pratica">🎲 Praticar</button>
    <button class="acao" data-action="stats">📊 Estatísticas</button>
  </div>
  <p class="confianca">Sem cadastro · tudo fica no seu aparelho</p>
</section>
```

**Regras de layout (zona de polegar):** CTA com `min-height: 56px` posicionado no terço inferior;
ações secundárias com `min-height: 44px`; nenhum controle crítico acima de 25% da altura da viewport.

### 7.3 Tela de partida

```html
<section class="screen screen--game" aria-label="Partida">
  <div class="topo-partida">
    <button class="btn-voltar" aria-label="Voltar para o início">←</button>
    <span class="progresso">Tentativa <b>4</b> de 6</span>
    <span class="modo-tag">DIÁRIO</span>
  </div>

  <div class="board" role="group" aria-label="Tabuleiro de 6 linhas e 5 colunas">
    <!-- 30 .casa geradas por board.js -->
  </div>

  <div class="dica" data-onboarding hidden><!-- dica de 1 linha após 1º chute --></div>
  <div class="toast-erro" role="status" hidden></div>

  <div class="keyboard" role="group" aria-label="Teclado virtual"></div>
</section>
```

**Componente `Board` (components/board.js):**

| Método | Contrato |
|---|---|
| `mount(root, state)` | cria 30 células com `data-linha`/`data-coluna` |
| `update(state)` | preenche letras, aplica classes de avaliação, cursor na linha atual |
| `animateReveal(linha)` | aplica `flip-casa` com stagger de 120 ms/casa |
| `shake()` | aplica `shake` na linha atual |

**Componente `Keyboard` (components/keyboard.js):**

- Layout QWERTY sem acentos + teclas `Enter` e `⌫`.
- Estado consolidado por letra com precedência `certo > presente > ausente` (nunca “rebaixa” uma tecla).
- Entrada física: `keydown` global; aceita apenas `[a-zA-Z]`, `Enter`, `Backspace`.
- Teclas com `min-height: 48px` e `aria-label` (“Letra Q”, “Apagar”, “Enviar”).

### 7.4 Modais de fim de jogo

```html
<div class="modal-backdrop" data-open="false">
  <div class="modal-vitoria" role="dialog" aria-modal="true"
       aria-labelledby="titulo-fim" aria-describedby="detalhe-fim">
    <h2 id="titulo-fim">Você descobriu em 4 tentativas!</h2>
    <p id="detalhe-fim">Sequência de 13 dias 🔥</p>
    <p class="palavra-revelada">NEVES</p>
    <pre class="grade-emoji" aria-label="Prévia do compartilhamento">🟩⬛🟨🟩⬛
🟩🟩⬛🟩⬛
🟩🟩🟨🟩⬛
🟩🟩🟩🟩🟩</pre>
    <button class="btn btn-coral" data-action="compartilhar">Compartilhar</button>
    <button class="btn btn-fantasma" data-action="fechar">Fechar</button>
  </div>
</div>
```

**Gestão de foco (a11y.js):** ao abrir, salva `document.activeElement` e foca o primeiro botão;
`Tab` fica preso ao modal (focus trap); `Esc` fecha; ao fechar, restaura o foco anterior.

### 7.5 Tela de estatísticas

- 6 cartões: `jogos`, `vitórias`, `taxa`, `sequência atual`, `melhor sequência`, `média de tentativas`.
- Histograma de 6 barras com altura proporcional; animação `cresce` (200 ms, stagger 60 ms).
- **Acessibilidade:** `<div class="histograma" role="img"
  aria-label="Distribuição: 1 tentativa 2 vitórias; 2 tentativas 5; 3 tentativas 9; 4 tentativas 12;
  5 tentativas 4; 6 tentativas 1">` + `<table class="sr-only">` equivalente.
- Rodapé com a regra do streak (“Sua sequência só quebra se você perder o desafio do dia”).

### 7.6 Onboarding em contexto (RF-12)

| Momento | Comportamento |
|---|---|
| 1ª partida da vida | Toast/tooltip de **uma linha** abaixo do tabuleiro: “Digite uma palavra de 5 letras e aperte Enter” |
| Após o 1º chute | Tooltip com legenda visual: 🟩 no lugar certo · 🟨 na palavra · ⬛ fora |
| Após o 2º chute | Tooltip desaparece e não volta (flag `pdd:v1:onboarded = true`) |
| “Como jogar” | Modal curto opcional com exemplo animado (replay do flip) |

Nada de tutorial bloqueante — decisão fundamentada nos 48% de abandono por tutorial longo.

---

## 8. Acessibilidade — especificação de implementação

### 8.1 Camada ARIA

| Elemento | Atributos |
|---|---|
| Célula do tabuleiro | `role="img"` + `aria-label` completo (§3.5); células vazias anunciam “vazia” |
| Tabuleiro | `role="group"` + `aria-label="Tabuleiro de 6 linhas e 5 colunas"` |
| Linha revelada | `aria-live="polite"` anuncia “Linha 2: A no lugar certo, R em outra posição, S não existe” |
| Erro de validação | container `role="alert"` — anuncia imediatamente |
| “Copiado!” | `aria-live="polite"` |
| Modal | `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap, `Esc` |
| Abas de tela | `role="tablist"` + setas ←/→, `Home`/`End` (quando aplicável) |
| Teclado virtual | botões reais (`<button>`), nunca `div` clicável |

### 8.2 Teclado e foco

- Todo o jogo é operável **só com teclado**: digitar, apagar, enviar, navegar, abrir modais.
- Anel de foco visível: `outline: 3px solid var(--mel); outline-offset: 2px` — nunca `outline: none`.
- Ordem de tabulação segue a ordem visual (sem `tabindex` positivo).
- Ao trocar de tela, o foco vai para o `<h1>` da tela (com `tabindex="-1"`).

### 8.3 Contraste e alvos

- Texto principal: Creme sobre Noite ≈ **15:1** (AAA).
- Textos secundários: `--creme-dim` sobre `--tinta` ≈ **7:1** (AAA).
- Células no tema padrão: branco sobre verde **5,0:1**, tinta sobre amarelo **9,5:1** (AA/AAA).
- Alvos de toque: botões ≥ **44×44 px**; teclas ≥ **48 px** de altura; células ≈ 59 px.

### 8.4 Movimento e preferências

```js
// a11y.js
export function movimentoAtivo() {
  const prefere = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ajuste = document.documentElement.dataset.motion; // 'on' | 'off'
  return ajuste === 'on' && !prefere;
}
```

- `data-motion="off"` desliga todas as animações (inclusive confete).
- `prefers-color-scheme` não é usado: a identidade é noturna por decisão de marca; o contraste já é AAA.

### 8.5 Checklist WCAG alvo

- [x] 1.4.1 Uso de cor (símbolos ▲●✕ + rótulos)
- [x] 1.4.3/1.4.6 Contraste AA/AAA
- [x] 2.1.1 Teclado
- [x] 2.4.3 Ordem de foco
- [x] 2.4.7 Foco visível
- [x] 2.5.5 Tamanho do alvo
- [x] 4.1.2 Nome, função, valor (roles nativos)
- [x] 2.3.3 Animação sob interação (reduced-motion)

---

## 9. Performance e compatibilidade

| Meta | Estratégia |
|---|---|
| Jogável em < 2 s em 3G | HTML+CSS crítico inline (~14 KB), JS em módulos pequenos, listas carregadas como `Set` na inicialização |
| Assets < 300 KB | Sem imagens (SVG inline), sem fontes externas; o maior peso são as listas de palavras (~120 KB) |
| 60 fps nas animações | Apenas `transform` e `opacity`; `will-change` pontual; sem layout thrashing |
| Compatibilidade | Chrome/Edge/Firefox/Safari (últimas 2 versões); `structuredClone`, `Intl`, `navigator.clipboard` com fallbacks |
| Sem dependências | Nenhum CDN; risco de supply-chain zero |

**Carregamento:** `defer`/módulos no fim do `<body>`; listas de palavras em módulos separados para que o
navegador possa cacheá-las independentemente.

**Offline (RNF-05):** o app é 100% estático. Para offline garantido no navegador, adicionar `sw.js`
(service worker) como tarefa opcional da Fase 5: cache-first para `index.html`, CSS, JS e dados.
Sem SW, o cache HTTP comum já cobre a maioria dos casos.

---

## 10. Estratégia de testes

### 10.1 Testes automatizados (sem framework)

`tests/test.html` executa `tests/suites.js` e exibe ✅/❌ + contagem. Função `assert(cond, msg)` mínima.

| Suíte | Casos |
|---|---|
| `feedback` | 7 casos da §6.2 + fuzz: 10.000 pares aleatórios verificam que a contagem de verdes+amarelos nunca excede a multiplicidade da resposta |
| `daily` | mesma data → mesma palavra (sem estado); datas diferentes → palavras diferentes; reset no fuso SP; janela de 90 dias sem repetição |
| `stats` | vitória soma a sequência, inclusive após dias ausentes; zera apenas na derrota; prática não altera; média e histograma corretos |
| `share` | texto nunca contém a resposta; formato `N/6`; derrota usa `X/6`; contagem de linhas = tentativas |
| `storage` | corrupção de JSON não quebra o app; migração v0→v1; quota excedida é tratada |

### 10.2 Testes manuais (checklist do PRD §11)

- [ ] Partida completa no desktop e no celular (390×844 e 360×640)
- [ ] Chute de 4 letras e palavra inexistente: toast amigável, tentativa **não** consumida
- [ ] Recarregar no meio da partida restaura tabuleiro, teclado e contador
- [ ] Vitória/derrota exibem modal correto; foco preso; `Esc` fecha e devolve foco
- [ ] Modo daltônico troca cores + símbolos e persiste após reload
- [ ] `prefers-reduced-motion`/botão desliga flip, shake e confete
- [ ] Zoom 200% sem corte de conteúdo nem rolagem horizontal
- [ ] Leitor de tela: NVDA (Windows) e VoiceOver (iOS) anunciam células, erros e “copiado”
- [ ] Compartilhar funciona em Chrome, Safari iOS e Firefox (fallback)
- [ ] Meia-noite de São Paulo: desafio muda; streak preservado

### 10.3 Testes exploratórios de dificuldade

- Amostra de 10 jogadores: taxa de vitória entre 70–85% (§2.2 do PRD).
- Se < 60%: revisar curadoria (palavras mais comuns).
- Se > 90%: incluir mais palavras com letras repetidas.

---

## 11. Plano de implementação

Alinhado ao cronograma de 5 semanas do PRD (§13). Cada tarefa tem entrega verificável.

### Semana 1 — Fundação

| ID | Tarefa | Entrega / DoD |
|---|---|---|
| T1.1 | Estrutura de pastas, `index.html`, `tokens.css`, `base.css` | Shell abre e exibe a marca |
| T1.2 | Curadoria inicial: 300 respostas + 2.000 válidas em `data/` | `ehValida()` retorna true/false corretamente |
| T1.3 | `dictionary.js` com normalização e `Set` | Testes de normalização passam |
| T1.4 | `board.js` estático (30 casas) + layout responsivo | Tabuleiro centralizado em 320–1280 px |

### Semana 2 — Loop jogável

| ID | Tarefa | Entrega / DoD |
|---|---|---|
| T2.1 | `feedback.js` + suíte de testes | 7 casos + fuzz verdes |
| T2.2 | `keyboard.js` (virtual + físico) | Digitação, Enter e Backspace funcionam |
| T2.3 | `game.js`: validar, consumir tentativa, detectar fim | Partida completa jogável sem UI final |
| T2.4 | Animações de flip/shake integradas | Revelação escalonada e erro com shake |

### Semana 3 — Retenção

| ID | Tarefa | Entrega / DoD |
|---|---|---|
| T3.1 | `daily.js` (data SP + hash + histórico) | Mesma palavra no mesmo dia em 2 navegadores |
| T3.2 | `storage.js` + retomada de partida | Reload restaura estado |
| T3.3 | `stats.js` + tela de estatísticas | Números e histograma corretos |
| T3.4 | Streak no header + regra na UI | Atualiza após vitória/derrota |

### Semana 4 — Experiência e inclusão

| ID | Tarefa | Entrega / DoD |
|---|---|---|
| T4.1 | Onboarding em contexto (RF-12) | Dicas aparecem só nas 2 primeiras partidas |
| T4.2 | `share.js` + clipboard com fallback | Texto sem spoiler copiado em 3 navegadores |
| T4.3 | `a11y.js`: ARIA, foco, live regions, tema daltônico | Checklist §8.5 completo |
| T4.4 | Responsividade e ajustes finos | Checklist manual §10.2 (itens de layout) |

### Semana 5 — Qualidade e entrega

| ID | Tarefa | Entrega / DoD |
|---|---|---|
| T5.1 | Testes manuais completos + correções | Checklist §10.2 100% |
| T5.2 | Teste com 10 usuários (dificuldade + clareza) | Relatório curto de achados |
| T5.3 | Polimento visual (transições, estados vazios) | Revisão contra protótipo “Amanhecer” |
| T5.4 | README (como rodar, servir, testar) + deploy GitHub Pages | URL pública funcionando |

**Definição de pronto (DoD global):** critérios de aceite do PRD §11 atendidos; suíte automatizada verde;
sem erros no console; Lighthouse ≥ 95 em Acessibilidade e ≥ 90 em Performance; README atualizado.

---

## 12. Mapeamento requisito → implementação

| Requisito (PRD) | Módulo / técnica |
|---|---|
| RF-01 Tabuleiro 5×6 | `components/board.js` + CSS Grid |
| RF-02 Entrada dupla | `keyboard.js` (virtual + `keydown`) |
| RF-03 Validação | `dictionary.js` + toast com `role="alert"` |
| RF-04 Feedback | `feedback.js` (2 passagens, §6.2) |
| RF-05 Desafio diário | `daily.js` (FNV-1a + `Intl` fuso SP) |
| RF-06 Prática | `game.js` com `modo:'pratica'` |
| RF-07 Fim de jogo | `components/modal.js` |
| RF-08 Streak | `stats.js` (§6.4) |
| RF-09 Estatísticas | `screens/stats.js` + histograma acessível |
| RF-10 Compartilhar | `share.js` (emojis + clipboard fallback) |
| RF-11 Estado do teclado | `keyboard.js` com precedência de estados |
| RF-12 Onboarding | `screens/game.js` + flag persistida |
| RF-13 Persistência | `storage.js` (chaves versionadas) |
| RF-14 Animações | `animations.css` + `animateReveal` |
| RF-15 Responsividade | CSS mobile-first (320–1280 px) |
| RF-16 Acessibilidade | `a11y.js` + §8 completo |
| RF-17 Tela inicial | `screens/home.js` |
| RF-18 Fuso do desafio | `dataSP()` + reset meia-noite SP |

---

## 13. Riscos técnicos

| ID | Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|---|
| R-01 | Resposta visível no código-fonte (sem servidor) | Alta | Médio | Aceito no MVP; ofuscar listas/gerar sob demanda não resolve de fato; documentar limitação; v2: endpoint diário |
| R-02 | `clipboard` bloqueado (iOS/iframe/http) | Média | Médio | Fallback `execCommand` já especificado (§6.5) + teste manual |
| R-03 | Lista de respostas com palavra obscura | Média | Alto | Curadoria dupla (revisão humana + frequência lexical) e teste com usuários |
| R-04 | Divergência de palavra entre jogadores | Baixa | Alto | Hash determinístico + `Intl` com timezone fixo + teste em 2 navegadores |
| R-05 | `localStorage` indisponível (modo privado) | Baixa | Médio | Detectar e rodar em memória, avisando que o progresso não será salvo |
| R-06 | Streak quebrado por bug de data | Média | Alto | Comparação por string `YYYY-MM-DD` no fuso SP + suíte de testes de fronteira (23:59/00:01) |
| R-07 | Repetição de palavra em < 90 dias | Baixa | Baixo | Histórico `recentes` + 10 re-hashes (§6.3) |
| R-08 | ES Modules não funcionam em `file://` | Alta | Baixo | Documentar servidor local no README; deploy via Pages |

---

## 14. Anexos

### A. Contrato dos módulos (resumo das APIs)

```js
// game.js
export function iniciar({ modo, palavra }) → GameState
export function podeDigitar(state) → boolean
export function submeter(state, palavra) → { state, evento }
//   evento: { tipo:'invalido', motivo:'tamanho'|'dicionario' }
//          | { tipo:'linha', avaliacao: LetraAvaliada[] }
//          | { tipo:'fim', resultado:'won'|'lost' }

// stats.js
export function vazio() → Stats
export function registrarFim(stats, resumo) → Stats
export function resumo(stats) → { jogos, vitorias, taxa, streak, maxStreak, media, dist }

// a11y.js
export function anunciar(texto, { urgente=false })
export function aplicarTema('padrao'|'daltonico')
export function aplicarMovimento('on'|'off')
export function aprisionarFoco(modalEl) → () => void
```

### B. Estrutura de dados das estatísticas

```js
const Stats = {
  jogos: 0,
  vitorias: 0,
  streak: 0,
  maxStreak: 0,
  distribuicao: [0, 0, 0, 0, 0, 0], // vitórias com 1..6 tentativas
  ultimoDia: null,                   // 'YYYY-MM-DD'
  primeiraPartidaEm: null
};
```

### C. Checklist de entrega final

- [ ] `index.html` + `css/` + `js/` + `data/` completos e sem dependências
- [ ] Suíte `tests/test.html` 100% verde
- [ ] Checklist manual do PRD §11 e deste documento §10.2 concluído
- [ ] Lighthouse: Acessibilidade ≥ 95, Performance ≥ 90, Best Practices ≥ 95
- [ ] Testado em Chrome, Edge, Firefox e Safari (iOS)
- [ ] Deploy em GitHub Pages com URL pública
- [ ] README com instruções de execução, testes e arquitetura
- [ ] `prototipos/` preservados como referência de design

---

*Documento derivado do PRD v1.0 e dos protótipos “Polegar Primeiro” (UX), “Acessível por Padrão”
(acessibilidade) e “Amanhecer” (visual). Alterações de escopo devem atualizar ambos os documentos.*
