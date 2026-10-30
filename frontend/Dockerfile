FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG NEXT_PUBLIC_API_URL=http://127.0.0.1:3000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV PORT=3001

RUN npm run build

EXPOSE 3001

CMD ["npx", "next", "start", "-p", "3001", "-H", "0.0.0.0"]
