# ① ビルド環境
FROM node:22 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ② 本番実行環境
FROM node:22-slim
WORKDIR /app
COPY --from=builder /app ./

EXPOSE 8080

# Cloud Runで確実に動くように、ここで直接ポートとホストを指定してViteを起動します
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "8080"]