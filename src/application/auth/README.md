# Autenticação

## RF01 — Autenticação de usuários

O sistema deve permitir que usuários façam login com e-mail e senha.

Este módulo concentra registro, login, verificação de e-mail e gerenciamento de sessão.

## Funcionalidades

- Registrar conta, verificar e-mail e autenticar com e-mail e senha.
- Criar e encerrar sessões seguras com cookies.
- Recuperar e alterar senha, revogando sessões quando necessário.
- Expor os dados da sessão atual e proteger rotas privadas.

## Segurança implementada

- Sessão em cookie `HttpOnly`, `Secure` em produção e `SameSite=Lax`.
- Token CSRF obrigatório em mutações autenticadas por cookie.
- Validação de ID token e sessão pelo Firebase Admin SDK, incluindo revogação.
- Limite de tentativas de login, cadastro, recuperação de senha e reenvio de e-mail.
- Recuperação, alteração de senha e logout global com revogação de sessões.
- Papéis `ADMIN`, `VENDEDOR` e `ESTOQUISTA`, contas ativas/inativas e auditoria.

## Configuração obrigatória

Configure `FIREBASE_WEB_API_KEY` e uma credencial do Firebase Admin (`GOOGLE_APPLICATION_CREDENTIALS` ou `FIREBASE_SERVICE_ACCOUNT_JSON`). Depois de aplicar a migration, promova o primeiro administrador com:

```bash
npm run users:promote -- admin@empresa.com
```

MFA exige configuração do segundo fator no Firebase Authentication/Identity Platform. Quando estiver disponível, marque `mfaRequired` para o administrador pela rota administrativa; o middleware recusará sessões sem o segundo fator.

## Rotas

| Método | Rota | Acesso |
| --- | --- | --- |
| POST | `/auth/register` | Público |
| POST | `/auth/login` | Público |
| POST | `/auth/password-reset` | Público |
| POST | `/auth/verify-email` | Público, com ID token Firebase |
| POST | `/auth/resend-code` | Público |
| GET | `/auth/me` | Autenticado |
| POST | `/auth/change-password` | Autenticado |
| POST | `/auth/logout` | Autenticado; revoga as sessões |
| GET | `/users` | ADMIN |
| PATCH | `/users/:id` | ADMIN |

Após o login, o backend envia os cookies `session` e `csrf_token`. O frontend deve usar `credentials: "include"` nas requisições e mandar o valor do cookie `csrf_token` no cabeçalho `X-CSRF-Token` para `POST`, `PATCH`, `PUT` e `DELETE` autenticados.

## Contratos principais

- `POST /auth/register`: recebe `name`, `email`, `password`, `phone` e `profilePhoto` opcional; cria a conta e solicita a verificação do e-mail.
- `POST /auth/login`: recebe `email` e `password`; cria a sessão somente para contas ativas e com e-mail verificado.
- `POST /auth/password-reset`: recebe `email`; sempre retorna uma mensagem genérica, sem informar se a conta existe.
- `POST /auth/change-password`: recebe `currentPassword` e `newPassword`; encerra as sessões após a alteração.
- `POST /auth/logout`: remove cookies e revoga todas as sessões ativas do usuário.
