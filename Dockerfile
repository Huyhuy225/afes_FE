# Giai đoạn 1: Build code React
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=http://localhost:8080/api

RUN npm run build

# Giai đoạn 2: Dùng Nginx phục vụ code đã build
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Mở cổng 80 cho web (Bo truy cập qua http://localhost)
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]