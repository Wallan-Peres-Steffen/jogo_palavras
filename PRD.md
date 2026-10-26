# PRD — Palavra do Dia
### Documento de Requisitos do Produto

| Campo | Valor |
|---|---|
| **Produto** | Palavra do Dia |
| **Versão do documento** | 1.0 |
| **Data** | 20/10/2026 |
| **Status** | Aprovado para desenvolvimento (MVP) |
| **Plataforma** | Site web responsivo (mobile-first) |
| **Stack** | HTML, CSS e JavaScript puros (sem frameworks/build) |
| **Idioma do conteúdo** | Português do Brasil (PT-BR) |
| **Monetização** | Sem monetização (projeto acadêmico) |

---

## 1. Visão geral

**Palavra do Dia** é um jogo casual de adivinhação de palavras no navegador. A cada dia
há uma palavra secreta de **5 letras** que o jogador deve descobrir em até **6 tentativas**.
A cada chute, o tabuleiro revela cores: 🟩 letra certa no lugar certo, 🟨 letra
presente em outro lugar, ⬛ letra ausente.

O produto combina dois formatos de sessão:

1. **Desafio diário** — uma única palavra por dia, igual para todos os jogadores,
   que gera hábito e permite comparação social.
2. **Modo prática** — partidas ilimitadas com palavras sorteadas, para quem quer
   jogar mais do que uma vez por dia.

### 1.1 Por que este produto (fundamento na pesquisa)

A pesquisa de mercado do gênero sustenta as decisões deste PRD:

- **Escassez artificial** (1 palavra/dia) é o principal mecanismo de hábito do
  gênero — evita burnout e cria um evento compartilhado (Wordle: 5 bilhões de
  partidas em 1 ano no NYT).
- **Dificuldade desejável** — 5 letras/6 tentativas é o formato comprovadamente
  equilibrado para todos os níveis de habilidade.
- **Compartilhamento sem spoiler** — a grade de emojis é o principal canal de
  crescimento orgânico (especialmente em grupos de WhatsApp no Brasil).
- **Streak + estatísticas** — retêm jogadores a longo prazo sem exigir conteúdo novo.
- **Falha não-punitiva** — ao perder, a resposta é revelada com gentileza.
- **Mercado validado** — jogos de palavras tiveram ~550 M de downloads em 8 meses
  de 2025, com ~21 min/dia por jogador; Termo, Letreco e Contexto comprovam a
  demanda por PT-BR.
- **Onboarding sem atrito** — tutoriais longos causam até 48% de abandono no 1º
  puzzle; o ensino será distribuído nas primeiras partidas.

---

## 2. Objetivos e métricas de sucesso

### 2.1 Objetivos do MVP

| # | Objetivo |
|---|---|
| O1 | Entregar um loop de jogo completo, justo e agradável em até 5 minutos por sessão |
| O2 | Gerar retorno diário (hábito) por meio da palavra do dia e do streak |
| O3 | Permitir que o resultado seja compartilhável sem revelar a resposta |
| O4 | Ensinar as regras sem tela de tutorial longa |
| O5 | Funcionar bem em celulares (maioria do público casual) |

### 2.2 Indicadores (KPIs)

| KPI | Meta |
|---|---|
| Conclusão da 1ª partida (novos jogadores) | ≥ 80% |
| Tempo médio de sessão | 3–5 minutos |
| Dígitos/dia que jogam o desafio diário | Crescente semana a semana |
| Streak médio dos jogadores ativos | ≥ 3 dias |
| Taxa de vitória global | 70–85% (zona de dificuldade desejável) |
| Uso do botão "Compartilhar" | ≥ 20% das partidas encerradas |

> **Observação:** sem backend, as métricas serão coletadas manualmente por
> testes com usuários (aba "Métricas" do plano de testes) ou, opcionalmente,
> via contagem anônima em `localStorage`. Analytics de terceiros ficam fora do MVP.

---

## 3. Público-alvo

**Persona principal — "Jogador casual diário"**
Qualquer pessoa, do adolescente ao adulto, que busca um entretenimento
leve e rápido (3–5 min) no celular, geralmente pela manhã ou em intervalos.
Não é jogador hardcore; valoriza simplicidade, progresso visível e poder
compartilhar conquistas.

**Persona secundária — "Competidor do grupo"**
Jogador que leva o streak a sério, compara estatísticas com amigos e usa o
compartilhamento como desafio social.

**Premissas de público:**
- 100% dos textos e palavras em PT-BR.
- Leitura confortável em telas pequenas; suporte a daltonismo.
- Nenhum conhecimento prévio de regras — o jogo deve se explicar sozinho.

---

## 4. Escopo

### 4.1 Dentro do escopo (MVP)

| ID | Requisito | Prioridade |
|---|---|---|
| **RF-01** | Tabuleiro 5 colunas × 6 linhas | Must |
| **RF-02** | Entrada por teclado virtual e teclado físico | Must |
| **RF-03** | Validação do chute: exatamente 5 letras e palavra existente no dicionário (mensagem de erro caso contrário) | Must |
| **RF-04** | Feedback de cores por letra, com regra correta para letras repetidas | Must |
| **RF-05** | **Desafio diário**: palavra determinística derivada da data (mesma para todos, sem servidor) | Must |
| **RF-06** | **Modo prática**: partidas aleatórias ilimitadas | Must |
| **RF-07** | Telas de vitória/derrota com revelação da palavra e resumo | Must |
| **RF-08** | **Sequência (streak)**: dias consecutivos vencendo o desafio diário | Must |
| **RF-09** | **Estatísticas**: total de jogos, vitórias, taxa de vitória, streak atual e máximo, média de tentativas, histograma de tentativas | Must |
| **RF-10** | **Compartilhar**: gerar grade de emojis + texto e copiar para a área de transferência, sem spoiler | Must |
| **RF-11** | Teclado virtual mostra o estado consolidado das letras (usadas/erradas) | Should |
| **RF-12** | Onboarding integrado: 1ª partida ensina as regras no fluxo (sem modal longo) | Should |
| **RF-13** | Persistência: recarregar/navegar não perde a partida em andamento nem o progresso (`localStorage`) | Must |
| **RF-14** | Animações de feedback (flip das casas, shake em erro, confete na vitória) | Could |
| **RF-15** | Layout responsivo mobile-first, utilizável de 320 px a desktop | Must |
| **RF-16** | Acessibilidade: modo de alto contraste/daltonismo, navegação por teclado, leitores de tela (labels nas casas), respeito a `prefers-reduced-motion` | Should |
| **RF-17** | Tela inicial com escolha: *Desafio do Dia* / *Praticar* / *Como jogar* / *Estatísticas* | Must |
| **RF-18** | Definição de fuso horário fixo do desafio diário (America/São_Paulo) para alinhar todos os jogadores | Should |

### 4.2 Fora do escopo do MVP (candidatos a v2)

- Dicas, moedas e power-ups · conquistas/níveis · ranking global · recompensa
  diária de login · desafio entre amigos por link · multijogador · conta e
  sincronização em nuvem · modos alternativos (Connections, forca, semântico) ·
  palavras de 4/6 letras · monetização/anúncios · aplicativo nativo ·
  i18n (outros idiomas).

---

## 5. Regras de jogo (especificação detalhada)

### 5.1 Partida

1. O jogo escolhe uma palavra secreta de **exatamente 5 letras**.
2. O jogador tem **6 tentativas**. Cada tentativa deve ser uma palavra de 5 letras
   aceita pelo dicionário.
3. Após cada chute, o tabuleiro revela para cada posição:
   - 🟩 **Verde** — a letra está na palavra **e** na posição correta.
   - 🟨 **Amarelo** — a letra existe na palavra, mas em **outra** posição.
   - ⬛ **Cinza** — a letra **não** existe na palavra.
4. **Regra das letras repetidas** (algoritmo obrigatório):
   - Primeiro passo: marca como verde toda letra que coincide com a posição da
     palavra secreta e "consome" essas ocorrências.
   - Segundo passo: para as letras restantes, marca como amarelo apenas enquanto
     houver ocorrências não consumidas na secreta; caso contrário, cinza.
   - *Exemplo:* secreta = `ARARA`, chute = `RAGUA` → 🟨🟨⬛⬛🟩
     (o R do 1º chute existe — há dois na secreta; o A do 2º chute existe e
     consome 1 dos 3 A disponíveis; o A final está na posição certa).
5. **Vitória**: acertar a palavra em ≤ 6 tentativas.
6. **Derrota**: esgotar as 6 tentativas → revelar a palavra com mensagem
   não-punitiva ("A palavra era XXXXX — tenta de novo amanhã!").
7. Tentativas são **single-player** e sem limite de tempo.

### 5.2 Desafio diário (RF-05)

- A palavra é função **determinística da data** (ex.: `hash(data + seed) %
  tamanho_da_lista`), garantindo que **todos os jogadores do mesmo dia** tenham
  a mesma palavra **sem servidor**.
- Reset às **00:00 (America/São_Paulo)**.
- Não repetir a palavra dentro de um ciclo de ≥ 90 dias (histórico local evita
  repetição; colisões são aceitáveis e documentadas).
- Uma única tentativa de desafio diário por dia (encerrada, só lectura até o
  próximo dia). **Modo prática não afeta o streak.**

### 5.3 Sequência — Streak (RF-08)

- Incrementa ao **vencer** o desafio diário.
- Zera apenas se o jogador **perder** o desafio ou não jogar o dia
  (política sugerida: zerar somente na derrota; dias perdidos por ausência
  **não** quebram a sequência — decisão registrada na §9 como ponto de
  atenuação de frustração; alternativa clássica do Wordle pode ser adotada em v2).
- Streak atual e máximo exibidos na tela de estatísticas e no resumo pós-jogo.

### 5.4 Estatísticas (RF-09)

Painel com: jogos jogados, vitórias, **taxa de vitória %**, streak atual,
streak máximo, média de tentativas nas vitórias e **histograma** distribuído
por nº de tentativas (1–6), além da contagem de vitórias/derrotas atuais.

### 5.5 Compartilhamento (RF-10)

Ao final do desafio diário (vitória ou derrota), o botão copia para a
área de transferência um texto no formato:

```
Palavra do Dia 20/10 3/6

🟩🟨⬛🟩⬛
🟩⬛🟩🟩🟩
🟩🟩🟩🟩🟩
```

- **Sem spoiler**: nunca inclui a palavra.
- Feedback visual de "copiado! ✅".
- No modo prática, o compartilhamento usa o rótulo "Prática".

---

## 6. Fluxos do usuário

### 6.1 Fluxo principal — Desafio do dia

```
Abrir site
  └─ 1ª vez? → partida tutorial (RF-12)
        • linha 1: "Chute uma palavra" (dica inline de 1 linha)
        • após chute 1: tooltip "🟩 no lugar certo · 🟨 na palavra · ⬛ fora"
        • após chute 2: sem novas dicas (evita hand-holding excessivo)
  └─ Escolher [Desafio do Dia]
        └─ Digitar → validação → feedback → até 6 tentativas
              ├─ Venceu → modal de vitória → [Compartilhar] [Ver estatísticas]
              └─ Perdeu → modal com resposta → [Compartilhar] [Praticar]
```

### 6.2 Fluxo de navegação

```
Tela inicial
 ├── ▶ Desafio do Dia
 ├── 🎲 Praticar (partida aleatória imediata)
 ├── 📊 Estatísticas
 ├── ❓ Como jogar (modal curto: regras + exemplo animado)
 └── ⚙️ Ajustes (modo de cor, som/vibração, sobre)
```

---

## 7. Requisitos não funcionais

| ID | Requisito | Critério de aceite |
|---|---|---|
| **RNF-01** | Responsividade | Funciona de 320 px a ≥ 1280 px sem rolagem horizontal; alvo principal: celular |
| **RNF-02** | Performance | Carrega e é jogável em < 2 s em 3G; assets < 300 KB |
| **RNF-03** | Compatibilidade | Últimas 2 versões de Chrome, Firefox, Edge e Safari (iOS/Android) |
| **RNF-04** | Acessibilidade | Contraste WCAG AA; botão **Modo de cor alternativo** (símbolos ▲/● além de cores); `aria-label` nas casas ("linha 2, coluna 3, verde, letra A"); navegação por Tab/Enter; `prefers-reduced-motion` desliga animações |
| **RNF-05** | Offline | Após a 1ª carga, joga sem conexão (arquivos locais + `localStorage`) |
| **RNF-06** | Privacidade | Zero dados enviados a servidores; tudo local; sem cookies de terceiros |
| **RNF-07** | Disponibilidade | Publicável em hospedagem estática (GitHub Pages) |
| **RNF-08** | Legibilidade PT-BR | Acentuação tratada automaticamente (jogador digita sem acento; comparação normalizada) |

---

## 8. Banco de palavras (curadoria PT-BR)

| Lista | Conteúdo estimado | Uso |
|---|---|---|
| **Respostas** | ~500–1.000 palavras comuns de 5 letras, curadas à mão | Palavra do dia e do modo prática |
| **Palpites válidos** | ~4.000–6.000 palavras de 5 letras | Aceitas como chute |

**Critérios de curadoria das respostas:**
- Palavras comuns do dia a dia; sem jargões, siglas, estrangeirismos ou gírias.
- Sem conteúdo ofensivo, político ou sensível a datas.
- Sem nomes próprios; sem termos que exijam acento na grafia digitável.
- Cobertura equilibrada de vogais/consoantes e de letras repetidas (~40% das
  palavras de 5 letras em PT-BR as possuem — manter essa naturalidade evita
  "palavras artificiais").
- **Fontes possíveis:** dicionário VERO/LibreOffice (como o Letreco), lista do
  IME-USP (~245 mil palavras), filtro manual.

**Estrutura técnica:** arquivo `data/palavras.js` exportando `{ respostas: [], validas: [] }`
com normalização (`toLowerCase`, sem acentos na comparação).

---

## 9. Decisões de design registradas

| # | Decisão | Justificativa |
|---|---|---|
| D1 | 5 letras / 6 tentativas fixos | Formato validado pelo mercado; simplifica MVP |
| D2 | Palavra do dia derivada de hash da data | Permite desafio compartilhado **sem backend** |
| D3 | Streak não quebra por ausência (apenas por derrota) | Reduz frustração; alternativa clássica fica para v2 com dados |
| D4 | Sem monetização/anúncios | Escopo acadêmico; preserva experiência limpa |
| D5 | Teclado virtual sem teclas de acento | PT-BR digita sem acento; jogo insere acentos ao exibir |
| D6 | Modo prática irrelevante para o streak | Protege a integridade do desafio diário |
| D7 | Nome "Palavra do Dia" | Evita conflito com marcas existentes (Termo, Letreco) |

---

## 10. Arquitetura técnica proposta

```
jogo_palavras/
├── index.html            # Shell único (SPA de telas)
├── css/
│   ├── styles.css        # Layout, tema, responsivo
│   └── animations.css    # Flip, shake, confete
├── js/
│   ├── main.js           # Bootstrap e roteamento de telas
│   ├── game.js           # Máquina de estado da partida + regras
│   ├── feedback.js       # Algoritmo de cores (letras repetidas)
│   ├── dictionary.js     # Validação e escolha de palavras
│   ├── daily.js          # Palavra do dia determinística (hash da data)
│   ├── keyboard.js       # Teclado virtual e físico
│   ├── storage.js        # localStorage (partida, streak, stats)
│   ├── stats.js          # Cálculo e render do painel
│   └── share.js          # Geração da grade de emojis + clipboard
├── data/
│   └── palavras.js       # Listas: respostas e válidas
├── assets/               # Ícones, favicon
├── PRD.md
└── README.md
```

**Decisões técnicas:**
- Estado da partida serializado em `localStorage` (chaves versionadas, ex. `pdd:state:v1`).
- Tema claro/escuro via CSS custom properties + `prefers-color-scheme`.
- Sem dependências externas; HTML semântico + CSS Grid no tabuleiro.

---

## 11. Critérios de aceite gerais (DoD do MVP)

- [ ] O jogador consegue completar uma partida do início ao fim sem erros no navegador desktop e mobile.
- [ ] Chute inválido (tamanho ≠ 5 ou palavra inexistente) exibe erro amigável e **não** consome tentativa.
- [ ] O algoritmo de cores está correto para palavras com letras repetidas (suite de testes com ≥ 10 casos).
- [ ] Todos os jogadores no mesmo dia recebem a mesma palavra do desafio; a palavra muda após a meia-noite (fuso SP).
- [ ] Recarregar a página no meio da partida restaura o estado idêntico.
- [ ] Streak e estatísticas persistem entre sessões e são exibidos corretamente.
- [ ] O compartilhamento copia o texto da grade sem conter a palavra.
- [ ] A 1ª partida de um usuário novo ensina as regras sem tela de tutorial longa.
- [ ] Acesso 100% por teclado; anúncios de estado lidos por leitor de tela; modo de cor alternativo disponível.
- [ ] Sem rolagem horizontal em 320 px; tabuleiro centralizado e confortável em ≥ 768 px.

---

## 12. Riscos e mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Jogador vê a resposta inspecionando o código (sem servidor) | Alto | Aceito no MVP (produto acadêmico); comentar como limitação conhecida. v2: endpoint diário |
| Palavra "válida" rejeitada pelo dicionário → frustração | Alto | Listas separadas (respostas × palpites) amplas + teste com usuários; aceitar variações comuns |
| Conteúdo da lista ofensivo/raro | Médio | Curadoria manual documentada (§8) |
| Fuso horário divergente entre jogadores | Médio | Fixar America/São_Paulo e exibir data de referência na UI |
| Streak quebrado por bug de persistência | Médio | Testes de recuperação + versionamento do `localStorage` |
| Clareza das cores para daltônicos | Médio | Modo de cor alternativo com símbolos (RNF-04) |
| Escopo crescer além do MVP | Médio | Seção §4.2 é a lista oficial de "não fazer agora" |

---

## 13. Cronograma sugerido (MVP em 5 semanas)

| Semana | Entregas |
|---|---|
| 1 | Estrutura base, dicionário, tabuleiro, digitação e validação |
| 2 | Algoritmo de cores, teclado virtual, loop completo de partida |
| 3 | Palavra do dia, persistência, streak e estatísticas |
| 4 | Compartilhamento, onboarding, acessibilidade, responsividade |
| 5 | Testes com usuários, correções, polimento visual, publicação (GitHub Pages) |

---

## 14. Anexo — Resumo da pesquisa que embasa o PRD

1. **Referência de mercado:** Wordle (NYT) — 5 bi de partidas/ano, 95% de
   satisfação; no Brasil: Termo, Letreco, Contexto, Stop/Adedonha.
2. **Pilares de design do gênero:** escassez artificial (1/dia), dificuldade
   desejável, compartilhamento sem spoiler, feedback imediato, falha
   não-punitiva, streak + estatísticas.
3. **Variações existentes (v2):** multi-palavra (Quordle), agrupamento
   (Connections), semântico (Contexto), forca, caça-palavras.
4. **Mercado:** 550 M de downloads de jogos de palavras em 8 meses de 2025;
   ~21 min/dia de uso; Brasil = 14% dos downloads de títulos híbridos.
5. **UX comprovada:** tutorial longo gera 48% de abandono → ensinar jogando;
   acessibilidade/daltonismo é reclamação frequente em apps top.
6. **Particularidades PT-BR:** acentuação automática, dígrafos (ch, lh, rr),
   43% das palavras de 5 letras têm letras repetidas, listas separadas de
   respostas (~2,7 mil) e palpites (~5,9 mil).
