# ============================================================================
# DOCKERFILE: Hệ thống Quản lý Thực tập & Dashboard TSNN (Khoa CNTT - TDTU)
# Multi-stage / Lightweight Node.js 24 Alpine image with native node:sqlite
# ============================================================================

FROM node:24-alpine AS base

RUN apk add --no-cache curl tzdata
ENV TZ=Asia/Ho_Chi_Minh

WORKDIR /app

COPY package.json ./
COPY TDTU_DB_CNTT_System/ ./TDTU_DB_CNTT_System/
COPY Adapter_Code/ ./Adapter_Code/
COPY docs/ ./docs/

# Ensure data directory exists
RUN mkdir -p /app/TDTU_DB_CNTT_System/backend/src/data

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/TDTU_DB_CNTT_System/backend/src/data/db_cntt.sqlite

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/students/summary || exit 1

CMD ["node", "--experimental-strip-types", "TDTU_DB_CNTT_System/backend/src/server.ts"]
