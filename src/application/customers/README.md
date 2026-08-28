# Clientes

## RF07 — Cadastro de clientes

O sistema deve permitir cadastrar, editar, listar e inativar clientes, incluindo nome, CPF/CNPJ, contato e endereço.

## Funcionalidades

- Manter dados pessoais ou empresariais, contato e endereço.
- Validar CPF/CNPJ único quando informado.
- Pesquisar clientes por nome, documento, telefone ou e-mail.
- Inativar clientes sem apagar o histórico de vendas.

## Rotas previstas

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| GET | `/customers` | ADMIN, VENDEDOR | Lista clientes com filtros e paginação. |
| GET | `/customers/:id` | ADMIN, VENDEDOR | Consulta um cliente. |
| POST | `/customers` | ADMIN, VENDEDOR | Cria um cliente. |
| PATCH | `/customers/:id` | ADMIN, VENDEDOR | Atualiza ou inativa um cliente. |
