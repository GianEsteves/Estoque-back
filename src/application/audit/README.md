# Auditoria

## RF21 — Auditoria básica

O sistema deve manter registro de ações relevantes, como criação, edição, exclusão lógica, cancelamento de venda e ajustes de estoque.

## Funcionalidades

- Registrar ator, ação, entidade, identificador, data e metadados seguros.
- Auditar autenticação, alteração de permissões, produtos, estoque e vendas.
- Preservar logs: nenhuma rota deve editar ou excluir auditorias.
- Permitir busca por período, usuário, entidade e ação.

## Rotas previstas

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| GET | `/audit-logs` | ADMIN | Lista auditorias com filtros e paginação. |
| GET | `/audit-logs/:id` | ADMIN | Consulta o detalhe de um registro de auditoria. |
