# Build stage
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy root package files for monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY prisma ./prisma/
COPY shared ./shared/

# Copy backend package files
COPY apps/backend/package.json ./apps/backend/

# Install dependencies (including all workspace dependencies)
RUN pnpm install --frozen-lockfile

# Build shared package first (needed by other packages)
RUN pnpm --filter @bbd/shared build

# Build stage
FROM base AS builder

# Copy backend source
COPY apps/backend ./apps/backend

# Generate Prisma client (from root)
WORKDIR /app
ENV PATH="/app/node_modules/.bin:$PATH"
RUN npx prisma generate --schema=prisma/schema.prisma

# Build backend (using pnpm filter from root)
RUN pnpm --filter @bbd/backend run build

# Production stage
FROM node:20-alpine AS production

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy necessary files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/shared ./shared

# Set ownership
RUN chown -R nestjs:nodejs /app

USER nestjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/v1/health || exit 1

# Start command
CMD ["node", "dist/main.js"]
