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

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| GET | `/users` | ADMIN | Lista usuários com filtros e paginação. |
| GET | `/users/:id` | ADMIN | Consulta um usuário. |
| POST | `/users` | ADMIN | Cria um usuário administrativo quando necessário. |
| PATCH | `/users/:id` | ADMIN | Atualiza perfil, papel, estado e MFA. |
