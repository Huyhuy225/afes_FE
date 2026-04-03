# Giai đoạn 1: Build code React
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Đổi giá trị khi cần ép Docker không dùng layer COPY cũ: --build-arg CACHEBUST=$(Get-Date -UFormat %s)
ARG CACHEBUST=1

ARG VITE_API_URL
ENV VITE_API_URL=http://localhost:8080/api

RUN echo "cachebust=$CACHEBUST" && npm run build

# Giai đoạn 2: Dùng Nginx phục vụ code đã build
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html/afes_FE
COPY nginx-default.conf /etc/nginx/conf.d/default.conf
# Mở cổng 80 cho web (Bo truy cập qua http://localhost)
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]