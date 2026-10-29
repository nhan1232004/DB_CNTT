FROM node:24-alpine

WORKDIR /app

# Copy full application source
COPY . .

# Expose HTTP port
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "backend/src/server.ts"]
