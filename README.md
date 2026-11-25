# Pilar

Seus dois pilares: treino e alimentação. App de celular (PWA) para acompanhar treino, alimentação e peso. Feito para Android: abra o link no Chrome e use "Adicionar à tela inicial".

## O que tem
- **Hoje:** anéis do dia (treino, refeições, pesagem), próximo treino, próxima refeição.
- **Treino:** plano para emagrecimento (gerado ou personalizado), registro de carga e repetições com a coluna "Anterior", timer de descanso.
- **Dieta:** plano da nutricionista, com cada opção de refeição em seu próprio card. Dentro da refeição: registrar, diário alimentar (foto) e humor; os alimentos com medida caseira e gramas; substituição para qualquer alimento, em tela própria, calculada por equivalência calórica; observações da nutricionista. Ainda: "fora do plano" com cálculo de calorias por foto (IA), lista de compras e receitas.
- **Progresso:** peso, carga por exercício, histórico.
- **Perfil:** dados pessoais, IMC com faixa saudável, configuração da IA, backup.

## Como funciona
- Tudo fica salvo no próprio celular (sem servidor). Use **Perfil › Exportar backup** de vez em quando.
- Funciona offline, exceto o cálculo de calorias com IA.
- A IA usa a API da Anthropic com a chave que você coloca em **Perfil › Assistente IA**; a chave fica só no aparelho.

## Arquivos
`index.html`, `style.css`, `app.js` (todo o app), `sw.js` (offline), `manifest.webmanifest`, ícones e `fonts/` (Archivo, licença OFL em `fonts/OFL.txt`).

## APK para Android
A cada envio para a `main`, a Action **APK Android** (`.github/workflows/android.yml`) embala o app com o [Capacitor](https://capacitorjs.com) e publica o arquivo em **Releases**.

- Baixar: aba **Releases** do repositório, arquivo `Pilar-1.0.N.apk`.
- O app web continua na raiz (GitHub Pages); `npm run build` copia esses arquivos para `www/`, que o Capacitor coloca dentro do projeto `android/`.
- A assinatura usa os Secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` e `ANDROID_KEY_PASSWORD`. Sem eles o APK sai com chave temporária e não atualiza por cima.
- Gerar manualmente: aba **Actions** › APK Android › **Run workflow**.
