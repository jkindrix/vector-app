# Multi-stage build for optimized production image

# Stage 1: Build frontend
FROM node:18-alpine as frontend-builder

WORKDIR /app

# Copy frontend package files
COPY package*.json ./
COPY tsconfig.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Install dependencies
RUN npm install

# Copy frontend source
COPY public ./public
COPY src ./src

# Build frontend
RUN npm run build

# Stage 2: Build backend
FROM node:18-alpine as backend-builder

WORKDIR /app

# Copy backend package files
COPY server/package*.json ./server/
COPY server/tsconfig.json ./server/

# Install backend dependencies
WORKDIR /app/server
RUN npm install

# Copy backend source
COPY server/src ./src

# Build backend
RUN npm run build

# Stage 3: Production image
FROM node:18-alpine

WORKDIR /app

# Install production dependencies for backend
COPY server/package*.json ./
RUN npm install --production

# Copy built backend
COPY --from=backend-builder /app/server/dist ./dist

# Copy migrations
COPY server/migrations ./migrations

# Copy built frontend
COPY --from=frontend-builder /app/build ./public

# Create data and content directories
RUN mkdir -p /app/data
RUN mkdir -p /app/content

# Expose ports
EXPOSE 3000 3001

# Install nginx and curl for health checks
RUN apk add --no-cache nginx curl

# Create nginx config
RUN echo 'server { \
    listen 3000; \
    root /app/public; \
    index index.html; \
    location /sitemap.xml { \
        proxy_pass http://127.0.0.1:3001/api/sitemap.xml; \
    } \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /health { \
        return 200 "OK"; \
        add_header Content-Type text/plain; \
    } \
}' > /etc/nginx/http.d/default.conf

# Create start script with nginx monitoring
RUN printf '#!/bin/sh\nnginx\n\n# Restart nginx if it dies\n(\n  while true; do\n    sleep 10\n    if ! pgrep -x nginx > /dev/null; then\n      echo "nginx died, restarting..."\n      nginx\n    fi\n  done\n) &\n\nexec node dist/index.js\n' > ./start.sh && \
    chmod +x start.sh

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://127.0.0.1:3001/api/health || exit 1

CMD ["./start.sh"]