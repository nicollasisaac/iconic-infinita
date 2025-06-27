# ────────────────────────────────────────────────
# 1. ETAPA DE BUILD
# ────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /usr/src/app/backend

# 1.1 Copia package.json / lock
COPY backend/package*.json ./

# 1.2 Copia o schema antes da instalação
COPY backend/prisma ./prisma

# 1.3 Instala dependências (executa postinstall → prisma generate)
RUN npm install --legacy-peer-deps

# 1.4 Copia o restante do código
COPY backend/ ./

# 1.5 (opcional) Gera o Prisma Client de novo — útil se schema mudou depois
RUN npx prisma generate

# 1.6 Compila o projeto Nest
RUN npm run build



# ────────────────────────────────────────────────
# 2. ETAPA DE EXECUÇÃO
# ────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Copia artefatos da etapa de build
COPY --from=builder /usr/src/app/backend/dist         ./dist
COPY --from=builder /usr/src/app/backend/node_modules ./node_modules
COPY --from=builder /usr/src/app/backend/package.json ./package.json

EXPOSE 3000
CMD ["node", "dist/main.js"]