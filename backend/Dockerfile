FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src

ENV DATABASE_URL=postgresql://skillbite:skillbite@database:5432/skillbite
RUN npx prisma generate && npm run build

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
