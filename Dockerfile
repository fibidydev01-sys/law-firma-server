# ============================================================================
# DOCKERFILE - Firma Hukum PERARI Backend
# Optimized for Development with pnpm + Docker Layer Caching
# STRATEGY: Install as node user from the start (no chown needed!)
# ============================================================================

FROM node:20-alpine

# Install pnpm directly (skip corepack to avoid network issues)
RUN npm config set registry https://registry.npmmirror.com/ \
    && npm install -g pnpm@9.12.2

# Install system dependencies for Prisma & health checks
RUN apk add --no-cache openssl wget bash

# Create app directory with correct ownership from the start
RUN mkdir -p /app && chown -R node:node /app

# Switch to node user BEFORE any work
USER node

WORKDIR /app

# ============================================================================
# LAYER 1: Dependencies (paling jarang berubah = cache layer terbaik)
# ============================================================================
COPY --chown=node:node package.json pnpm-lock.yaml ./

# Configure pnpm to use npmmirror registry
RUN pnpm config set registry https://registry.npmmirror.com/

# Install ALL dependencies (as node user, no permission issues)
RUN pnpm install --frozen-lockfile

# ============================================================================
# LAYER 2: Prisma (berubah kalau schema berubah)
# ============================================================================
COPY --chown=node:node prisma ./prisma/

# Generate Prisma Client
RUN pnpm prisma generate

# ============================================================================
# LAYER 3: Source code (paling sering berubah)
# ============================================================================
# Copy source files
COPY --chown=node:node src ./src/

# Copy config files
COPY --chown=node:node tsconfig.json tsconfig.build.json nest-cli.json .prettierrc ./

# ============================================================================
# LAYER 4: Runtime setup
# ============================================================================
# Create necessary directories (already owned by node)
RUN mkdir -p \
    uploads/dokumen \
    uploads/avatars \
    uploads/documents \
    uploads/temp \
    logs \
    backups/redis

# Expose application port
EXPOSE 3000

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# Start application in development mode with hot reload
CMD ["pnpm", "run", "start:dev"]