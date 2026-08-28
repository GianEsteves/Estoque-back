# Estoque

## RF08 — Entrada de estoque

O sistema deve permitir registrar entradas de produtos, informando fornecedor, produtos, quantidades, custo, data e observações.

## RF09 — Saída manual de estoque

O sistema deve permitir registrar saídas manuais de estoque, como perdas, devoluções ou ajustes, exigindo um motivo.

## RF10 — Atualização automática do saldo

O sistema deve atualizar automaticamente a quantidade disponível de cada produto após toda entrada, saída ou venda.

## RF11 — Impedimento de estoque negativo

O sistema não deve permitir uma saída ou venda cuja quantidade seja maior que o estoque disponível.

## Funcionalidades

- Registrar entradas vinculadas ao fornecedor e aos itens recebidos.
- Registrar saídas manuais por perda, devolução ou ajuste, sempre com motivo.
- Atualizar o saldo em uma transação de banco e criar a movimentação correspondente.
- Bloquear saldo negativo e alterações manuais diretas de quantidade.

## Rotas previstas

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| GET | `/inventory/balances` | Autenticado | Lista saldos por produto e localização futura. |
| GET | `/inventory/balances/:productId` | Autenticado | Consulta o saldo de um produto. |
| POST | `/inventory/entries` | ADMIN, ESTOQUISTA | Registra entrada de estoque. |
| POST | `/inventory/exits` | ADMIN, ESTOQUISTA | Registra saída manual com motivo obrigatório. |
