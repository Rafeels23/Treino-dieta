# Revisão do Pilar — madrugada de 25 para 26/11/2026

Pesquisa de UI/UX, funcionalidades e segurança, testes do sistema inteiro, desempenho e ferramentas para revisar código feito com IA.

## Resumo

- **27 de 27 testes automáticos passando**: dados vazios e pesados (500 treinos, 6 meses de dieta), 3 tamanhos de tela, tema claro e escuro, dados corrompidos, dados do app antigo, sem internet e de volta, toques repetidos e dia futuro.
- **Desempenho**: o código principal caiu de 222 KB para 149 KB (gzip). Lighthouse no celular: desempenho 86, acessibilidade 100 e boas práticas 100. A troca de aba leva de 4 a 41 ms no navegador.
- **Segurança**: o banco está fechado para quem não tem login, e cada pessoa só vê os próprios dados. As 5 tentativas de abuso nas funções do servidor foram bloqueadas. `npm audit` não achou nenhuma vulnerabilidade.
- **Bugs corrigidos nesta madrugada**: 6, listados abaixo.
- **Novo**: 3 agentes revisores em `.claude/agents/` e os comandos prontos em [`docs/COMANDOS-REVISAO.md`](COMANDOS-REVISAO.md).

## 1. Testes feitos

| Área | O que foi testado | Resultado |
|---|---|---|
| Primeiro uso | app vazio, todas as abas e janelas | OK |
| Muito uso | 500 treinos, 200 atividades, 180 dias de dieta, 12 refeições, 15 hábitos e nomes enormes | OK, nada vaza da tela |
| Telas | Pixel 7, iPhone 14 e iPad Mini, claro e escuro | OK |
| Dados ruins | localStorage corrompido; formato do app antigo | abre do zero; converte |
| Sem internet | abas ainda não abertas, aviso, sincroniza ao voltar | OK (corrigido nesta noite) |
| Toques rápidos | 5 toques em "começar treino"; 2 em "Pausa" | 1 treino e 1 série |
| Datas | Dieta não avança para amanhã | OK |
| Campos | repetições só número; "8 a 12" vira "8-12"; carga com vírgula | OK (corrigido) |
| Alvos de toque | todos os botões de todas as abas | nenhum abaixo de 24 px (mínimo do WCAG 2.2). Os 3 botões de texto com 33 px ganharam área de toque maior |
| Console | erros de JavaScript em todos os fluxos | nenhum |

## 2. Bugs corrigidos nesta madrugada

1. **Sem internet, as abas ainda não abertas não carregavam.** Isso aparecia depois da divisão do código. Agora todas as abas baixam em segundo plano e, se algo falhar, aparece uma tela de "tentar de novo" em vez de tela branca.
2. **Nome muito longo vazava no Perfil e nos títulos.** Agora o texto corta com "…".
3. **"8 a 12" virava "812"** no campo de repetições. Corrigido.
4. **No treino focado, apagar o número fazia a sugestão voltar.** Agora tocar no campo seleciona o número, e o que você digitar substitui.
5. **Contraste:** o texto dos botões ficava branco sobre laranja claro no tema escuro. O laranja, o verde e a cor da Dieta foram escurecidos no tema claro.
6. **Botões de texto pequenos** ("Atualizar", "Ver todos") ganharam área de toque maior, sem mudar o desenho.

O `pg_net` também foi movido para o schema `extensions`, como recomenda o Supabase.

## 3. Segurança

**O que está bem:**
- RLS em todas as tabelas `pilar_*`. A chave pública não lê nem grava nada sem login.
- `pilar_dados` e `pilar_lembretes`: cada pessoa só acessa as próprias linhas. `pilar_config`, `pilar_ia_uso`, `pilar_envios` e `pilar_membros` só são acessadas pelo servidor.
- As chaves (Gemini, senha de app do Gmail, VAPID) ficam só no servidor. Nenhum segredo no repositório.
- Tentativas testadas e bloqueadas:
  - IA sem login;
  - código para e-mail não liberado;
  - e-mail inválido;
  - token do cron errado;
  - pedir chave sem login.
- A IA tem limite de 40 usos por dia.
- Cabeçalhos de proteção na Vercel: CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy` e `Permissions-Policy`.

**Falta (precisa ser feito por você, no painel):**
- [ ] Supabase › Authentication › ligar **proteção contra senhas vazadas** (é o único aviso que sobrou).
- [ ] Supabase › Storage: apagar os buckets antigos `documentos` e `fotos` (do projeto anterior).
- [ ] Supabase › Settings: renomear o projeto para "pilar" (só organização).
- [ ] GitHub › Settings › Secrets: as 4 chaves de assinatura do APK, para o APK atualizar sem desinstalar.
- [ ] Testar no celular de verdade: lembretes com ✓/✗ no Android, push no iPhone e a pulseira pelo Saúde Connect.

## 4. Pesquisa de UI e UX

O que os estudos e os apps mais bem avaliados mostram, e como o Pilar está:

| Achado | Fonte | No Pilar |
|---|---|---|
| Registrar uma série precisa ser rápido; os apps mais elogiados repetem a carga da última vez | [Hevy vs Strong](https://repreturn.com/strong-app-vs-hevy/), [Setgraph](https://setgraph.app/ai-blog/hevy-vs-strong) | ✅ já preenche com a última vez |
| O maior motivo de desistir de diário de comida é o trabalho de registrar | [CHI 2015 — Univ. de Washington](https://washington.edu/news/?p=36478), [SnappyMeal (arXiv)](https://arxiv.org/pdf/2511.03907) | ✅ marcar a refeição do plano com um toque; IA por foto só para o que é fora do plano |
| Sequência ("streak") motiva, mas perder tudo num dia ruim faz a pessoa desistir; perdoar um dia ajuda | [INSEAD](https://knowledge.insead.edu/marketing/consumer-streaks-are-motivating-key-keeping-them-alive), [Mobbin — 859 streaks](https://mobbin.com/blog/streaks-are-about-losing-a-study-of-859-streak-designs) | 🟡 o Progresso mostra a constância em grade (sem punir); dá para avaliar o "dia de folga" |
| Alvo de toque: mínimo de 24 px (WCAG 2.2 AA); o ideal é 44 px | [Deque — WCAG 2.2](https://dequeuniversity.com/resources/wcag-2.2), [touch target](https://specification.website/spec/accessibility/touch-target-size/) | ✅ testado nesta noite |
| Interface de academia: botões grandes, uma ação principal por tela, usável com uma mão | [Stormotion — fitness UX](https://stormotion.io/blog/fitness-app-ux/) | ✅ treino focado (um exercício por vez) |
| Personal e aluno pedem progressão sugerida e carga preenchida | [Trainerize — ideias](https://ideas.abcfitness.com/forums/940789-client-gym-members-abc-trainerize/suggestions/5728988-have-sets-and-weights-auto-fill-with-previous-numb) | 🟡 ver sugestão 1 abaixo |
| No iPhone, a notificação pela web só funciona com o app na tela de início, sem botões de ação | [MagicBell — PWA no iOS](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) | ✅ já tratado: no iPhone, tocar abre o app; ✓/✗ só no Android |

## 5. Funcionalidades sugeridas (não implementadas, só se você quiser)

Ficaram de fora de propósito, porque você pediu para não adicionar nada sem combinar. Em ordem de valor:

1. **Sugestão de carga (dupla progressão).** Quando todas as séries chegam ao topo da faixa (ex.: 12, 12, 12 em "8-12"), o treino seguinte sugere +2,5 kg e volta para 8 repetições. Só sugere; você aceita ou não. É o que Boostcamp, Liftosaur e Alpha Progression fazem ([Boostcamp](https://www.boostcamp.app/features/auto-progression), [Legion — double progression](https://legionathletics.com/double-progression)).
2. **Medidas e fotos de progresso** (cintura, quadril, braço), mensais como o peso, com comparação lado a lado. As fotos ficariam só no aparelho. É o que os apps de medidas mais destacam ([exemplo](https://apps.apple.com/us/app/-/id1369905597)).
3. **Resumo da semana** no domingo: treinos feitos, refeições no plano, média de água e sono, em um card.
4. **Dia de folga na constância**: 1 dia por semana que não quebra a sequência.
5. **Descanso por exercício**: hoje é 1:30 fixo no treino focado; o editor já guarda o descanso de cada exercício, então daria para usar o valor dele.

## 6. Desempenho

| Medida | Antes | Depois |
|---|---|---|
| JavaScript principal (gzip) | 222 KB | 149 KB |
| Lighthouse (celular): desempenho / acessibilidade / boas práticas | — | 86 / 100 / 100 |
| Troca de aba (navegador) | — | 4–41 ms |
| Logo na abertura | depois do JavaScript | na hora (já vem no HTML) |

As abas carregam sob demanda e baixam em segundo plano, então continuam funcionando sem internet.

## 7. Revisão de código feito com IA

- **Agentes** em `.claude/agents/`:
  - `revisor-bugs`: bugs com prova;
  - `revisor-seguranca`: Supabase, chaves e servidor;
  - `revisor-ux`: telas, com prints.

  Eles só leem. No Claude Code, digite `/agents` para vê-los.
- **Comandos prontos** em [`COMANDOS-REVISAO.md`](COMANDOS-REVISAO.md): varredura geral, erros típicos de IA (funções inventadas, `catch` vazio, validação só no aparelho), segurança, ponta a ponta com navegador, desempenho, UX e "corrigir só os itens X".
- **Regra de ouro**: peça a lista com prova primeiro e a correção depois, numa conversa diferente da que escreveu o código.

Fontes: [Claude Code — subagentes](https://code.claude.com/docs/en/sub-agents), [Invicti](https://www.invicti.com/blog/web-security/vibe-coding-security-checklist-how-to-secure-ai-generated-apps), [Redwerk](https://redwerk.com/blog/vibe-code-audit/), [Supabase — checklist de produção](https://supabase.com/docs/guides/security/production-checklist), [Supabase — segurança 2025](https://supabase.com/blog/supabase-security-2025-retro).
