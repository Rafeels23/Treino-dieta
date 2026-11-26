# Comandos de revisão para o Claude

Prompts prontos para colar no Claude Code (no terminal, no app ou em claude.ai/code) com o repositório aberto.
Eles servem para qualquer sistema feito com IA, mas os exemplos citam o Pilar.

## Agentes já prontos neste repositório

Os arquivos em `.claude/agents/` são revisores que o Claude Code carrega sozinho. Digite `/agents` para ver a lista.

| Agente | Para quê | Como chamar |
|---|---|---|
| `revisor-bugs` | bugs reais, com passo a passo para reproduzir | "Use o revisor-bugs no que mudou hoje" |
| `revisor-seguranca` | Supabase, chaves, funções do servidor, cabeçalhos | "Use o revisor-seguranca antes de eu publicar" |
| `revisor-ux` | telas, toque, contraste, textos, com prints | "Use o revisor-ux nas telas de Dieta" |

Os três só leem e testam: não mudam nenhum arquivo. Depois você decide o que corrigir.
Para rodar os três juntos: "Rode o revisor-bugs, o revisor-seguranca e o revisor-ux em paralelo e junte o resultado numa lista só, do mais grave ao menos grave."

## Comandos embutidos do Claude Code

- `/code-review` revisa o que mudou atrás de bugs. Ex.: `/code-review high`.
- `/security-review` revisa a segurança das mudanças da branch.
- `/simplify` procura código repetido ou complicado e simplifica.

## 1. Varredura geral de bugs

```
Faça uma varredura de bugs neste projeto. Ele foi feito em boa parte com IA, então
desconfie de: funções que parecem certas mas não tratam lista vazia, null ou dados
antigos; estado que muda sem salvar; efeitos sem limpeza; datas e fuso horário;
números com vírgula; chamadas de rede sem tratamento de erro; código duplicado que
divergiu. Rode o build e os testes primeiro. Para cada bug, prove com arquivo:linha e
passo a passo para reproduzir. Não corrija ainda: me mostre a lista do mais grave
ao menos grave, e descarte o que não conseguir provar.
```

## 2. Código que a IA costuma errar

```
Procure os erros típicos de código gerado por IA:
- funções ou imports que não existem (alucinados) ou pacotes que não estão no package.json;
- TODO, "placeholder", dados de exemplo ou senhas fixas esquecidas;
- tratamento de erro que engole a falha (catch vazio) e esconde o problema;
- validação só no aparelho, sem conferir no servidor;
- duas versões da mesma lógica em lugares diferentes;
- comentários que dizem uma coisa e o código faz outra.
Liste com arquivo:linha e diga se é bug, risco ou só limpeza.
```

## 3. Segurança (Supabase e chaves)

```
Revise a segurança como se fosse um invasor:
1. Procure segredos no código e no histórico do git (sem me mostrar os valores).
2. Liste as tabelas e confirme que todas têm RLS e que cada usuário só vê as próprias linhas.
   Tente ler e gravar dados de outro usuário usando só a chave pública.
3. Para cada função do servidor: quem pode chamar, o que acontece sem login,
   com entrada gigante, com e-mail inválido e com chamadas repetidas.
4. Confira CSP e cabeçalhos de segurança, e qualquer HTML montado com texto do usuário.
5. Rode npm audit.
Me dê gravidade, risco prático e correção para cada achado.
```

## 4. Teste de ponta a ponta com o navegador

```
Suba o app (npm run build && npx vite preview) e use o Playwright para testar
como um usuário: primeiro acesso vazio, uso de 3 meses de dados, sem internet,
toques rápidos repetidos, celular pequeno (360 px) e grande, tema claro e escuro.
Capture erros do console e tire prints. Relate o que quebrou, com o print.
```

## 5. Desempenho

```
Meça o desempenho: tamanho do bundle (gzip), Lighthouse em modo celular,
tempo para trocar de aba e para abrir as janelas mais usadas.
Aponte as 3 maiores oportunidades com o ganho esperado de cada uma.
Não mude nada que piore o funcionamento sem internet.
```

## 6. Revisão de UI e UX

```
Revise a experiência no celular com prints de cada tela: alvo de toque
(mín. 44 px), contraste (4,5:1), textos longos, estados vazios, teclado numérico
nos campos de número e quantos toques levam as tarefas do dia a dia.
Respeite as regras do projeto: visual calmo, cada ação em um lugar só,
textos em português. No máximo 10 sugestões, priorizadas.
```

## 7. Antes de corrigir

```
Corrija só os itens 1, 3 e 5 da lista. Para cada um: explique a causa,
faça a menor mudança possível, rode o build e o teste que prova a correção,
e não mexa em mais nada.
```

## Dicas

- Peça **prova** (arquivo, linha, passo a passo). Sem prova, a IA tende a inventar problemas.
- Peça **lista primeiro, correção depois**. Assim você escolhe o que muda.
- Rode a revisão **depois de cada leva de mudanças**, não só no fim.
- Revise com **outra conversa** (ou um agente) diferente da que escreveu o código: ela não tem o mesmo viés.

Fontes: [Claude Code — subagentes](https://code.claude.com/docs/en/sub-agents),
[Invicti — checklist de segurança para vibe coding](https://www.invicti.com/blog/web-security/vibe-coding-security-checklist-how-to-secure-ai-generated-apps),
[Redwerk — auditoria de código feito por IA](https://redwerk.com/blog/vibe-code-audit/),
[Supabase — checklist de produção](https://supabase.com/docs/guides/security/production-checklist).
