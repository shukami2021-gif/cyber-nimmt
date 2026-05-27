# ビルドステージ: Node.js を使用してプロジェクトをビルド
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# 実行ステージ: 軽量な Nginx イメージを使用して静的ファイルを配信
FROM nginx:stable-alpine

# ビルド済みのファイルを Nginx の公開ディレクトリにコピー
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]