# ============================================================================
# DOCKERFILE - Firma Hukum PERARI Backend - OPTIMIZED
# ============================================================================

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm and OpenSSL
RUN npm config set registry https://registry.npmmirror.com/ \
  && npm install -g pnpm@9.12.2 \
  && apk add --no-cache openssl

# Copy package files
COPY package*.json pnpm-lock.yaml ./

# Copy prisma schema FIRST
COPY prisma ./prisma/

# Configure pnpm
RUN pnpm config set registry https://registry.npmmirror.com/

# Install ALL dependencies (for build)
RUN pnpm install

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build application
RUN pnpm run build

# ============================================================================
# Production stage
FROM node:20-alpine

WORKDIR /app

# Install pnpm, OpenSSL and wget
RUN npm config set registry https://registry.npmmirror.com/ \
  && npm install -g pnpm@9.12.2 \
  && apk add --no-cache openssl wget

# Copy package files
COPY package*.json pnpm-lock.yaml ./

# Copy Prisma schema
COPY --from=builder /app/prisma ./prisma

# Configure pnpm
RUN pnpm config set registry https://registry.npmmirror.com/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Create directories
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

# Start application with migrations and proper error handling
CMD ["sh", "-c", "echo 'Starting Prisma migration...' && npx prisma db push --accept-data-loss --skip-generate && echo 'Migration complete. Starting application...' && node dist/src/main.js"]