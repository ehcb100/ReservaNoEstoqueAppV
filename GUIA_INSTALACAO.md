# Instalação — GitHub Actions + Firebase Spark (sem Blaze)

## 1. Antes de publicar
O projeto contém a configuração WEB do Firebase (pública), e a chave VAPID pública.
NUNCA envie credenciais de conta de serviço para o repositório, chat ou arquivos públicos.
O sistema de comandas original foi preservado; confirme regras atuais de leitura/gravação.

## 2. Firebase Authentication
Console Firebase > Criação > Authentication > Sign-in method: habilite **E-mail/senha**.
Crie manualmente usuários autorizados na aba Users. Use as credenciais do funcionário no celular ao registrar push.
**Importante:** habilitar autenticação para o push não protege automaticamente o acesso às comandas no site. Revise também as regras existentes da coleção `comandas` antes de uso real.

## 3. Regras do Firestore
Console > Firestore Database > Regras: **adicione** os dois blocos `match /pushTokens` e `match /pushClaims` do arquivo `firestore.rules` DENTRO do seu bloco existente `/databases/{database}/documents`.
**NÃO substitua as regras completas**, pois isso poderia bloquear as comandas existentes.
Publique e teste.

## 4. Credencial de servidor (NUNCA compartilhe)
Firebase Console > Configurações do projeto > Contas de serviço > Gerar nova chave privada.
Abra o JSON SOMENTE no seu computador, copie seu conteúdo e no GitHub entre em:
Settings > Secrets and variables > Actions > New repository secret.
Nome: `FIREBASE_SERVICE_ACCOUNT`; valor: conteúdo COMPLETO do JSON.
Não coloque o JSON no ZIP, nos arquivos do GitHub, em Issues ou em conversas.
O GitHub Actions usa essa credencial exclusivamente no runner. Restrinja acesso ao repositório.

## 5. GitHub Pages
Faça upload de todos os arquivos do ZIP **incluindo a pasta `.github/workflows/alertas.yml`**.
No GitHub, pastas iniciadas por ponto podem não aparecer no seletor: extraia o ZIP e use Git no PC, ou crie o arquivo pelo editor web no caminho `.github/workflows/alertas.yml`.
Verifique Actions > Alertas de comandas > Run workflow para teste manual.
O cron roda aproximadamente a cada 5 minutos e pode atrasar; novas comandas NÃO são notificadas imediatamente.

## 6. Android
Abra https://ehcb100.github.io/ReservaNoEstoqueAppV/ no Chrome do Android.
Instale como app pelo menu. Abra o aplicativo > Alertas > Ativar notificações / Registrar celular para push.
Entre com e-mail/senha de funcionário cadastrado. Permita notificações.
Teste com comanda de teste; confira logs em Actions.

## Observações importantes
- GitHub Actions tem cotas gratuitas e agendamento sem garantia de pontualidade.
- Se não houver token cadastrado no momento da primeira execução, a notificação será tentada na execução seguinte.
- O envio é **pelo menos uma tentativa por tipo**; se falhar após reservar a deduplicação, o log indicará falha, mas não há reenvio automático. Para operação crítica, implemente fila confiável.
- Firestore Spark tem limites gratuitos; confira uso e permissões.
- A autenticação no cadastro de push exige regras apropriadas; não é um sistema completo de controle de acesso de funcionários.
- Para notificações com app fechado no Android, use Chrome/PWA compatível e permita notificações; o sistema operacional pode limitar entrega.
- O histórico anterior a 24h não gera notificações retroativas.
