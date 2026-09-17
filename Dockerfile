FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-bookworm-slim AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json app.js prisma.config.ts ./
COPY prisma ./prisma
COPY scripts ./scripts
COPY src ./src
EXPOSE 6868
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && node app.js"]
