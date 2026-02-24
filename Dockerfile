# 第一阶段：编译构建
FROM docker.xuanyuan.run/node:22-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 第二阶段：生产环境运行
FROM docker.xuanyuan.run/nginx:stable-alpine AS production-stage
# 把编译好的 dist 文件夹复制到 Nginx 目录
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
