# Categorias

## RF03 — Cadastro de categorias

O sistema deve permitir cadastrar, editar, listar e inativar categorias de produtos.

## Funcionalidades

- Cadastrar categoria com nome e descrição opcional.
- Consultar categorias ativas ou inativas.
- Editar nome, descrição e estado da categoria.
- Impedir inativação quando a regra de negócio não permitir produtos vinculados.

## Rotas previstas

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| GET | `/categories` | Autenticado | Lista categorias com filtros e paginação. |
| GET | `/categories/:id` | Autenticado | Consulta uma categoria. |
| POST | `/categories` | ADMIN, ESTOQUISTA | Cria uma categoria. |
| PATCH | `/categories/:id` | ADMIN, ESTOQUISTA | Atualiza ou inativa uma categoria. |
