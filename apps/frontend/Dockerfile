# Build stage
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy root package files for monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY shared ./shared/

# Copy frontend package files
COPY apps/frontend/package.json ./apps/frontend/

# Install dependencies (including all workspace dependencies)
RUN pnpm install --frozen-lockfile

# Build shared package first (needed by other packages)
RUN pnpm --filter @bbd/shared build

# Build stage
FROM base AS builder

# Accept build args
ARG VITE_API_URL=/api/v1

# Set environment variables for build
ENV VITE_API_URL=$VITE_API_URL

# Copy frontend source
COPY apps/frontend ./apps/frontend

# Build frontend (using pnpm filter from root)
WORKDIR /app
ENV PATH="/app/node_modules/.bin:$PATH"
RUN cd apps/frontend && ../../node_modules/.bin/tsc && ../../node_modules/.bin/vite build

# Production stage - Nginx
FROM nginx:alpine AS production

# Copy built assets
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
