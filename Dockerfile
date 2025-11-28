# ============================================================================
# DOCKERFILE - Firma Hukum PERARI Backend - PRODUCTION (FIXED)
# ============================================================================

FROM node:20-alpine AS builder

# Install pnpm
RUN npm config set registry https://registry.npmmirror.com/ \
  && npm install -g pnpm@9.12.2

# Install build dependencies
RUN apk add --no-cache openssl wget bash

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Configure pnpm
RUN pnpm config set registry https://registry.npmmirror.com/

# Install ALL dependencies (including prisma)
RUN pnpm install --frozen-lockfile

# Copy prisma schema AFTER installing dependencies
COPY prisma ./prisma/

# Generate Prisma Client (now prisma CLI is available)
RUN pnpm prisma generate

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

# Create app directory
RUN mkdir -p /app && chown -R node:node /app

USER node
WORKDIR /app

# Copy package files
COPY --chown=node:node package.json pnpm-lock.yaml ./

# Configure pnpm
RUN pnpm config set registry https://registry.npmmirror.com/

# Install production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy prisma schema
COPY --chown=node:node --from=builder /app/prisma ./prisma/

# Copy generated Prisma Client from builder stage
COPY --chown=node:node --from=builder /app/node_modules/.prisma ./node_modules/.prisma/
COPY --chown=node:node --from=builder /app/node_modules/@prisma ./node_modules/@prisma/

# Copy built application
COPY --chown=node:node --from=builder /app/dist ./dist/

# Create runtime directories
RUN mkdir -p \
  uploads/dokumen \
  uploads/avatars \
  uploads/documents \
  uploads/temp \
  logs \
  backups/redis

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# Start in production mode
CMD ["pnpm", "run", "start:prod"]