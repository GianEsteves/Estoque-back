# Fornecedores

## RF06 — Cadastro de fornecedores

O sistema deve permitir cadastrar, editar, listar e inativar fornecedores, incluindo dados de contato e documento fiscal.

## Funcionalidades

- Manter razão social, nome fantasia, CPF/CNPJ, contato e endereço.
- Validar documento fiscal único quando informado.
- Pesquisar fornecedores ativos por nome, documento ou contato.
- Inativar fornecedores preservando entradas já registradas.

## Rotas previstas

| Método | Rota             | Acesso            | Descrição                                   |
| ------ | ---------------- | ----------------- | ------------------------------------------- |
| GET    | `/suppliers`     | ADMIN, ESTOQUISTA | Lista fornecedores com filtros e paginação. |
| GET    | `/suppliers/:id` | ADMIN, ESTOQUISTA | Consulta um fornecedor.                     |
| POST   | `/suppliers`     | ADMIN, ESTOQUISTA | Cria um fornecedor.                         |
| PATCH  | `/suppliers/:id` | ADMIN, ESTOQUISTA | Atualiza ou inativa um fornecedor.          |

## Pré-requisitos atendidos

- Usuário autenticado com papel `ADMIN` ou `ESTOQUISTA`.
- Token CSRF obrigatório nas rotas `POST` e `PATCH` autenticadas por cookie.
- Razão social e endereço obrigatórios; nome fantasia, e-mail e telefone opcionais.
- CPF/CNPJ normalizado e validado por dígitos verificadores quando informado.
- Documento fiscal único no banco e inativação lógica com `isActive`.
- Filtros `search`, `isActive`, `page` e `limit`; a paginação aceita até 100 itens.
- Criação, edição e inativação registradas na auditoria.
