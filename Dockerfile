# ============================================================================
# DOCKERFILE - Firma Hukum PERARI Backend - PRODUCTION (PNPM VERSION)
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

# Install dependencies
RUN pnpm install

# Generate Prisma Client BEFORE copying other files
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

# Install ALL dependencies first (not --prod yet)
RUN pnpm install

# Generate Prisma Client
RUN npx prisma generate

# Copy Prisma client from builder (as backup)
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm

# Copy built application
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

# Start application with migrations
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/src/main.js"]