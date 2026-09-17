# Alertas

## RF17 — Alertas de estoque baixo

O sistema deve identificar e exibir produtos cujo estoque atual esteja igual ou abaixo do estoque mínimo configurado.

## Funcionalidades

- Comparar saldo disponível com o estoque mínimo de cada produto ativo.
- Exibir quantidade atual, quantidade mínima e situação do alerta.
- Permitir filtros por categoria e criticidade.
- Atualizar o alerta automaticamente após cada movimentação.

## Rotas previstas

| Método | Rota                | Acesso            | Descrição                               |
| ------ | ------------------- | ----------------- | --------------------------------------- |
| GET    | `/alerts/low-stock` | ADMIN, ESTOQUISTA | Lista produtos com estoque baixo.       |
| GET    | `/alerts/summary`   | ADMIN, ESTOQUISTA | Retorna total de alertas e indicadores. |
