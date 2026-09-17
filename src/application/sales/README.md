# Vendas

## RF12 — Registro de vendas

O sistema deve permitir criar vendas para clientes, contendo produtos, quantidades, descontos, forma de pagamento, total e usuário responsável.

## RF13 — Baixa de estoque por venda

Ao finalizar uma venda, o sistema deve baixar automaticamente as quantidades vendidas no estoque.

## RF14 — Cancelamento de vendas

O sistema deve permitir cancelar vendas, registrando o motivo e devolvendo os itens ao estoque quando aplicável.

## RF19 — Relatório de vendas

O sistema deve permitir consultar vendas por período, cliente, vendedor e status, com totalizadores.

## Funcionalidades

- Criar venda com cliente opcional, itens, descontos e forma de pagamento.
- Validar produto ativo, quantidade disponível e preço no momento da venda.
- Finalizar venda em transação, baixando estoque e registrando movimentações.
- Cancelar venda com motivo, devolvendo o saldo quando aplicável.
- Consultar vendas e relatórios com totalizadores e itens mais vendidos.

## Rotas previstas

| Método | Rota                | Acesso          | Descrição                                               |
| ------ | ------------------- | --------------- | ------------------------------------------------------- |
| GET    | `/sales`            | ADMIN, VENDEDOR | Lista vendas com filtros e paginação.                   |
| GET    | `/sales/:id`        | ADMIN, VENDEDOR | Consulta venda e seus itens.                            |
| POST   | `/sales`            | ADMIN, VENDEDOR | Cria e finaliza uma venda.                              |
| POST   | `/sales/:id/cancel` | ADMIN, VENDEDOR | Cancela venda; exige motivo.                            |
| GET    | `/sales/reports`    | ADMIN           | Gera relatório por período, cliente, vendedor e status. |
