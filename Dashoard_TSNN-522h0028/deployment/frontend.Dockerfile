# ==============================================================================
# Dockerfile cho Frontend (Nginx Static Web Server)
# ==============================================================================

FROM nginx:alpine

# Copy toàn bộ frontend source & static SPA vào thư mục nginx
COPY frontend /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
