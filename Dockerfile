# ============================================================================
# DOCKERFILE - Firma Hukum PERARI Backend - PRODUCTION (SIMPLIFIED)
# ============================================================================

FROM node:20-alpine AS builder

# Install pnpm and build dependencies
RUN npm config set registry https://registry.npmmirror.com/ \
  && npm install -g pnpm@9.12.2 \
  && apk add --no-cache openssl wget bash

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy prisma schema FIRST
COPY prisma ./prisma/

# Configure pnpm registry
RUN pnpm config set registry https://registry.npmmirror.com/

# Install ALL dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
RUN pnpm exec prisma generate

# Copy source code
COPY src ./src/
COPY tsconfig.json tsconfig.build.json nest-cli.json .prettierrc ./

# Build application
RUN pnpm run build

# ============================================================================
# PRODUCTION STAGE
# ============================================================================
FROM node:20-alpine

# Install runtime dependencies
RUN npm config set registry https://registry.npmmirror.com/ \
  && npm install -g pnpm@9.12.2 \
  && apk add --no-cache openssl wget bash

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy Prisma schema
COPY --from=builder /app/prisma ./prisma/

# Configure pnpm
RUN pnpm config set registry https://registry.npmmirror.com/

# Install production dependencies (including @prisma/client)
RUN pnpm install --prod --frozen-lockfile

# Generate Prisma Client (fresh in production)
RUN pnpm exec prisma generate

# Copy built application
COPY --from=builder /app/dist ./dist/

# Create runtime directories
RUN mkdir -p \
  /app/uploads/dokumen \
  /app/uploads/avatars \
  /app/uploads/documents \
  /app/uploads/temp \
  /app/logs \
  /app/backups/redis

# Set ownership
RUN chown -R node:node /app

# Switch to node user
USER node

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# Start application with migrations
CMD ["sh", "-c", "pnpm exec prisma db push --accept-data-loss && node dist/src/main.js"]