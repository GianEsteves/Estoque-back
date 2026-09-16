# Movimentações

## RF15 — Histórico de movimentações

O sistema deve registrar todo movimento de estoque, incluindo tipo, produto, quantidade, saldo anterior, saldo posterior, data, usuário responsável e origem da movimentação.

## RF16 — Consulta de movimentações

O sistema deve permitir filtrar e paginar o histórico por período, produto, tipo de movimentação e usuário.

## Funcionalidades

- Registrar entradas, saídas, vendas, cancelamentos e ajustes automaticamente.
- Armazenar saldo anterior, saldo posterior, origem e usuário responsável.
- Permitir filtros por data, produto, tipo, origem e usuário.
- Manter registros imutáveis; correções devem gerar nova movimentação.

## Rotas previstas

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| GET | `/inventory/movements` | ADMIN, ESTOQUISTA | Lista movimentações com filtros e paginação. |
| GET | `/inventory/movements/:id` | ADMIN, ESTOQUISTA | Consulta os detalhes de uma movimentação. |

## Pré-requisitos atendidos

- Histórico persistido no modelo `StockMovement`, sem rotas de edição ou exclusão.
- Cada registro contém produto, usuário responsável, tipo, origem, quantidade, saldo anterior, saldo posterior, motivo, referência e data.
- Serviço interno `recordStockMovement` atualiza o saldo e cria o histórico na mesma transação serializável.
- O serviço rejeita saldo negativo, quantidade zero e tipo de movimentação com sinal incompatível.
- Filtros disponíveis: `productId`, `userId`, `type`, `origin`, `from`, `to`, `page` e `limit`.
- Somente `ADMIN` e `ESTOQUISTA` podem consultar o histórico; paginação limitada a 100 registros.
