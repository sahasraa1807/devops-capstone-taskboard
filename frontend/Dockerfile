# ==========================================
# TaskBoard Frontend Dockerfile
# Stage 1: Build React static assets with Node
# Stage 2: Serve via non-root Nginx runtime
# ==========================================

# Stage 1: Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci || npm install

# Build the production bundle
COPY . .
RUN npm run build

# Stage 2: Runtime stage
FROM nginx:alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Support running as unprivileged non-root user
RUN sed -i 's,/run/nginx.pid,/tmp/nginx.pid,g' /etc/nginx/nginx.conf && \
    touch /tmp/nginx.pid && \
    chown -R nginx:nginx /tmp/nginx.pid \
                         /var/cache/nginx \
                         /var/log/nginx \
                         /usr/share/nginx/html \
                         /etc/nginx/conf.d

USER nginx

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
