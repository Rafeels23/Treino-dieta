# Treino & Dieta

App de celular (PWA) para acompanhar treino, alimentação e peso. Feito para Android: abra o link no Chrome e use "Adicionar à tela inicial".

## O que tem
- **Hoje:** anéis do dia (treino, refeições, pesagem), próximo treino, próxima refeição.
- **Treino:** plano para emagrecimento (gerado ou personalizado), registro de carga e repetições com a coluna "Anterior", timer de descanso.
- **Dieta:** plano da nutricionista com opções, substituições e observações; suplementos; "fora do plano" com cálculo de calorias por foto (IA); lista de compras; receitas.
- **Progresso:** peso, carga por exercício, histórico.
- **Perfil:** dados pessoais, IMC com faixa saudável, configuração da IA, backup.

## Como funciona
- Tudo fica salvo no próprio celular (sem servidor). Use **Perfil › Exportar backup** de vez em quando.
- Funciona offline, exceto o cálculo de calorias com IA.
- A IA usa a API da Anthropic com a chave que você coloca em **Perfil › Assistente IA**; a chave fica só no aparelho.

## Arquivos
`index.html`, `style.css`, `app.js` (todo o app), `sw.js` (offline), `manifest.webmanifest`, ícones e `fonts/` (Archivo, licença OFL em `fonts/OFL.txt`).
