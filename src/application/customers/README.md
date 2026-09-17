# Clientes

## RF07 — Cadastro de clientes

O sistema deve permitir cadastrar, editar, listar e inativar clientes, incluindo nome, CPF/CNPJ, contato e endereço.

## Funcionalidades

- Manter dados pessoais ou empresariais, contato e endereço.
- Validar CPF/CNPJ único quando informado.
- Pesquisar clientes por nome, documento, telefone ou e-mail.
- Inativar clientes sem apagar o histórico de vendas.

## Rotas previstas

| Método | Rota             | Acesso          | Descrição                               |
| ------ | ---------------- | --------------- | --------------------------------------- |
| GET    | `/customers`     | ADMIN, VENDEDOR | Lista clientes com filtros e paginação. |
| GET    | `/customers/:id` | ADMIN, VENDEDOR | Consulta um cliente.                    |
| POST   | `/customers`     | ADMIN, VENDEDOR | Cria um cliente.                        |
| PATCH  | `/customers/:id` | ADMIN, VENDEDOR | Atualiza ou inativa um cliente.         |

## Pré-requisitos atendidos

- Usuário autenticado com papel `ADMIN` ou `VENDEDOR`.
- Token CSRF obrigatório para criação e alteração por sessão em cookie.
- Nome e endereço obrigatórios; CPF/CNPJ, e-mail e telefone opcionais.
- CPF/CNPJ validado, normalizado e único quando informado.
- Filtros `search`, `isActive`, `page` e `limit`, com máximo de 100 itens por página.
- Inativação lógica preserva o histórico de vendas futuro.
- Criação, edição e inativação registradas na auditoria.
