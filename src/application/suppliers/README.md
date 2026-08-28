# Fornecedores

## RF06 — Cadastro de fornecedores

O sistema deve permitir cadastrar, editar, listar e inativar fornecedores, incluindo dados de contato e documento fiscal.

## Funcionalidades

- Manter razão social, nome fantasia, CPF/CNPJ, contato e endereço.
- Validar documento fiscal único quando informado.
- Pesquisar fornecedores ativos por nome, documento ou contato.
- Inativar fornecedores preservando entradas já registradas.

## Rotas previstas

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| GET | `/suppliers` | ADMIN, ESTOQUISTA | Lista fornecedores com filtros e paginação. |
| GET | `/suppliers/:id` | ADMIN, ESTOQUISTA | Consulta um fornecedor. |
| POST | `/suppliers` | ADMIN, ESTOQUISTA | Cria um fornecedor. |
| PATCH | `/suppliers/:id` | ADMIN, ESTOQUISTA | Atualiza ou inativa um fornecedor. |
