# Estoque API

API Node.js/Express para gestão de estoque, com PostgreSQL, Prisma e Firebase Authentication.

## Desenvolvimento

```bash
npm ci
npm run dev
```

Copie `.env.example` para `.env` e preencha as credenciais. O frontend local usa `http://localhost:5173`.

## Deploy com Docker

Defina estas variáveis no provedor de hospedagem:

- `DATABASE_URL`: conexão PostgreSQL de produção.
- `NODE_ENV=production`
- `PORT`: porta informada pelo provedor (opcional; padrão `6868`).
- `CLIENT_URL`: URL pública exata do frontend, sem barra final.
- `FIREBASE_WEB_API_KEY`: chave da API Web do Firebase.
- `FIREBASE_SERVICE_ACCOUNT_JSON`: JSON completo da conta de serviço Firebase em uma única variável secreta.

O container executa `prisma migrate deploy` antes de iniciar a API. Não envie `.env`, credenciais Firebase ou `node_modules` para o repositório.

```bash
docker build -t estoque-api .
docker run --env-file .env -p 6868:6868 estoque-api
```

O endpoint de verificação é `GET /health`.
