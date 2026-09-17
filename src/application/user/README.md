# Usuários

## RF20 — Gestão de usuários

Administradores devem poder cadastrar, editar, ativar, inativar e definir permissões para usuários.

## Funcionalidades

- Listar usuários e seus estados de acesso.
- Alterar papel, ativação da conta e exigência de MFA.
- Revogar sessões ao inativar uma conta.
- Impedir que o administrador remova o próprio acesso administrativo.
- Registrar todas as alterações na auditoria.

## Rotas previstas

| Método | Rota         | Acesso | Descrição                                         |
| ------ | ------------ | ------ | ------------------------------------------------- |
| GET    | `/users`     | ADMIN  | Lista usuários com filtros e paginação.           |
| GET    | `/users/:id` | ADMIN  | Consulta um usuário.                              |
| POST   | `/users`     | ADMIN  | Cria um usuário administrativo quando necessário. |
| PATCH  | `/users/:id` | ADMIN  | Atualiza perfil, papel, estado e MFA.             |

## Pré-requisitos atendidos

- Usuário solicitante autenticado, ativo, com e-mail verificado e papel `ADMIN`.
- Cookies de sessão e CSRF configurados; ações `POST` e `PATCH` exigem `X-CSRF-Token`.
- Firebase Admin configurado para criar, atualizar, desativar e revogar sessões das contas.
- Banco migrado com os campos `role`, `isActive`, `mfaRequired` e tabela `AuditLog`.
- Validação de dados, e-mail único, senha forte e paginação limitada a 100 registros.
- Proteção contra remoção do último administrador ativo ou do próprio acesso administrativo.

## Parâmetros de consulta

`GET /users` aceita `search`, `role`, `isActive`, `page` e `limit`. A resposta inclui `users` e `pagination`.
