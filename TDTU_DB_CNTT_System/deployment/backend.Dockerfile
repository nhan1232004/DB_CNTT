# ==============================================================================
# Dockerfile cho Backend Node.js 22 (Native SQLite & Clean Architecture)
# ==============================================================================

FROM node:22-alpine AS runtime

WORKDIR /app

# Copy cấu hình package
COPY backend/package.json ./package.json

# Copy toàn bộ mã nguồn backend
COPY backend/src ./src

# Biến môi trường mặc định
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/src/data/db_cntt.sqlite

# Tạo thư mục data và phân quyền ghi cho SQLite
RUN mkdir -p /app/src/data

# Mở cổng 3000 cho backend API
EXPOSE 3000

# Khởi chạy máy chủ Backend
CMD ["node", "src/server.ts"]
