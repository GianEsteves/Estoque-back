# Produtos

## RF04 — Cadastro de produtos

O sistema deve permitir cadastrar produtos com nome, código/SKU, categoria, descrição, preço de custo, preço de venda, estoque mínimo e status.

## RF05 — Consulta de produtos

O sistema deve permitir pesquisar, filtrar e paginar produtos por nome, código, categoria e status.

## Funcionalidades

- Cadastrar produto com SKU único, categoria, preços, estoque mínimo e estado.
- Consultar saldo atual e situação de estoque baixo.
- Pesquisar por nome ou SKU e filtrar por categoria e status.
- Editar dados comerciais sem alterar o histórico de movimentações.
- Inativar produtos sem remover seu histórico.

## Rotas previstas

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| GET | `/products` | Autenticado | Lista produtos; aceita `search`, `categoryId`, `status`, `page` e `limit`. |
| GET | `/products/:id` | Autenticado | Consulta os detalhes e o saldo de um produto. |
| POST | `/products` | ADMIN, ESTOQUISTA | Cria um produto. |
| PATCH | `/products/:id` | ADMIN, ESTOQUISTA | Atualiza ou inativa um produto. |

## Pré-requisitos atendidos

- Leitura disponível a qualquer usuário autenticado; escrita limitada a `ADMIN` e `ESTOQUISTA`.
- Categoria persistida no banco e obrigatória; somente categorias ativas podem ser associadas.
- SKU obrigatório, normalizado em maiúsculas e único.
- Preços validados e estoque mínimo inteiro maior ou igual a zero.
- Saldo inicia em zero e não pode ser editado por estas rotas; movimentações futuras serão responsáveis por ele.
- Filtros `search`, `categoryId`, `isActive`, `page` e `limit`, com máximo de 100 itens por página.
- Criação, edição e inativação são auditadas; `POST` e `PATCH` exigem CSRF.
