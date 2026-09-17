# Permissões

## RF02 — Controle de permissões

O sistema deve possuir perfis de acesso, como administrador, vendedor e estoquista, restringindo ações conforme a função.

Este módulo será responsável por papéis, permissões e autorização das rotas.

## Funcionalidades

- Aplicar os papéis `ADMIN`, `VENDEDOR` e `ESTOQUISTA`.
- Validar autenticação antes de qualquer rota privada.
- Restringir cada ação conforme o papel do usuário.
- Impedir que um administrador remova seu próprio acesso administrativo.

## Matriz inicial de acesso

| Papel      | Acesso principal                                              |
| ---------- | ------------------------------------------------------------- |
| ADMIN      | Gestão completa, usuários, auditoria, vendas e estoque.       |
| VENDEDOR   | Clientes, vendas, consulta de produtos e dashboard comercial. |
| ESTOQUISTA | Produtos, categorias, fornecedores, estoque e movimentações.  |

## Rotas

| Método | Rota              | Acesso      | Descrição                                                     |
| ------ | ----------------- | ----------- | ------------------------------------------------------------- |
| GET    | `/permissions/me` | Autenticado | Retorna o papel e as permissões efetivas do usuário atual.    |
| GET    | `/permissions`    | ADMIN       | Retorna a matriz completa de permissões por papel.            |
| PATCH  | `/users/:id`      | ADMIN       | Define o papel do usuário; a alteração revoga sessões ativas. |

## Pré-requisitos atendidos

- Papéis persistidos no banco: `ADMIN`, `VENDEDOR` e `ESTOQUISTA`.
- Middleware `authenticate` em todas as rotas privadas.
- Middleware `authorize` para restringir papéis e `authorizePermission` para novas rotas baseadas em permissão.
- Alterações de papel exigem `ADMIN`, token CSRF e são registradas em auditoria.
- A aplicação impede desativar ou rebaixar o último administrador ativo.
