# Dashboard

## RF18 — Dashboard gerencial

O sistema deve disponibilizar um dashboard com indicadores como vendas do período, produtos com estoque baixo, quantidade de produtos em estoque e itens mais vendidos.

## Funcionalidades

- Consolidar vendas, estoque, alertas e produtos mais vendidos.
- Permitir seleção de período para os indicadores de venda.
- Mostrar valores, quantidades e comparativos básicos do período.
- Respeitar as permissões: vendedor vê dados comerciais; administrador vê todos os indicadores.

## Rotas previstas

| Método | Rota                       | Acesso            | Descrição                                        |
| ------ | -------------------------- | ----------------- | ------------------------------------------------ |
| GET    | `/dashboard`               | ADMIN, VENDEDOR   | Retorna os indicadores permitidos para o perfil. |
| GET    | `/dashboard/top-products`  | ADMIN, VENDEDOR   | Lista produtos mais vendidos no período.         |
| GET    | `/dashboard/stock-summary` | ADMIN, ESTOQUISTA | Retorna resumo e alertas de estoque.             |
