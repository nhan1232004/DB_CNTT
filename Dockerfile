# ============================================================================
# DOCKERFILE: Hệ thống Quản lý Thực tập & Dashboard TSNN (Khoa CNTT - TDTU)
# Multi-stage / Lightweight Node.js 24 Alpine image with native node:sqlite
# ============================================================================

FROM node:24-alpine AS base

# Install curl for healthcheck
RUN apk add --no-cache curl tzdata
ENV TZ=Asia/Ho_Chi_Minh

WORKDIR /app

# Copy dependency manifests
COPY package.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Copy source code and data files
COPY packages/ ./packages/
COPY apps/ ./apps/
COPY index.html ./
COPY demo_dashboard/ ./demo_dashboard/
COPY data_sinhvien.csv ./

# Ensure data directory exists and has persistent volume
RUN mkdir -p /app/apps/api/src/data

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/apps/api/src/data/db_cntt.sqlite

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/students/summary || exit 1

CMD ["node", "apps/api/src/main.ts"]
