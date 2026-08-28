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

| Papel | Acesso principal |
| --- | --- |
| ADMIN | Gestão completa, usuários, auditoria, vendas e estoque. |
| VENDEDOR | Clientes, vendas, consulta de produtos e dashboard comercial. |
| ESTOQUISTA | Produtos, categorias, fornecedores, estoque e movimentações. |

Não há rotas públicas de permissões nesta primeira versão. A definição de papel é realizada pelo administrador em `PATCH /users/:id`.
