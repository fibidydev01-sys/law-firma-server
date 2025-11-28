# ============================================================================
# Justfile - Firma Hukum PERARI Backend
# Docker Local Development with pnpm
# ============================================================================

default:
    @just --list

# ====================
# 🚀 DEVELOPMENT
# ====================

# Start development environment
dev:
    @echo "🚀 Starting development environment..."
    docker compose up -d
    @echo "✅ Services started!"
    @echo ""
    @echo "📊 API:        http://localhost:3000"
    @echo "🐘 PostgreSQL: localhost:5432"
    @echo "🔴 Redis:      localhost:6379"
    @echo ""
    @just logs-api

# Start with build (rebuild containers)
dev-build:
    @echo "🔨 Building and starting development environment..."
    docker compose up -d --build
    @just logs-api

# Rebuild API only (fast restart for code changes)
api-rebuild:
    @echo "🔨 Rebuilding API container..."
    docker compose up -d --build --no-deps api
    @echo "✅ API rebuilt!"
    @just logs-api

# Restart API only (without rebuild)
api-restart:
    @echo "🔄 Restarting API..."
    docker compose restart api
    @echo "⏳ Waiting for API to be ready..."
    @sleep 3
    @just logs-api

# Stop development environment
dev-stop:
    @echo "⏹️  Stopping development environment..."
    docker compose stop
    @echo "✅ Services stopped!"

# Restart development environment
dev-restart:
    @echo "🔄 Restarting development environment..."
    docker compose restart
    @just logs-api

# ====================
# 📦 PNPM COMMANDS
# ====================

# Install dependencies in container
pnpm-install:
    @echo "📦 Installing dependencies with pnpm..."
    docker compose exec api pnpm install
    @echo "✅ Dependencies installed!"

# Add new dependency
pnpm-add package:
    @echo "➕ Adding {{package}} with pnpm..."
    docker compose exec api pnpm add {{package}}
    @echo "✅ Package added! Rebuild container: just api-rebuild"

# Add dev dependency
pnpm-add-dev package:
    @echo "➕ Adding {{package}} as dev dependency..."
    docker compose exec api pnpm add -D {{package}}
    @echo "✅ Dev package added! Rebuild container: just api-rebuild"

# Remove dependency
pnpm-remove package:
    @echo "➖ Removing {{package}}..."
    docker compose exec api pnpm remove {{package}}
    @echo "✅ Package removed! Rebuild container: just api-rebuild"

# Update dependencies
pnpm-update:
    @echo "🔄 Updating dependencies..."
    docker compose exec api pnpm update
    @echo "✅ Dependencies updated! Rebuild container: just api-rebuild"

# Check outdated packages
pnpm-outdated:
    @echo "📊 Checking outdated packages..."
    docker compose exec api pnpm outdated

# Show pnpm store info
pnpm-store:
    @echo "💾 pnpm store information:"
    docker compose exec api pnpm store status

# ====================
# 🗄️ DATABASE
# ====================

# Generate Prisma Client (in container)
db-generate:
    @echo "🔄 Generating Prisma Client in container..."
    docker compose exec api pnpm exec prisma generate
    @echo "✅ Prisma Client generated!"

# Generate Prisma Client locally (for IDE/VSCode)
db-generate-local:
    @echo "🔄 Generating Prisma Client locally for IDE..."
    pnpm exec prisma generate
    @echo "✅ Local Prisma Client generated! VSCode errors should be fixed."

# Push database schema (tanpa generate karena sudah di-generate saat build)
db-push:
    @echo "🔄 Pushing database schema..."
    docker compose exec api pnpm exec prisma db push --skip-generate
    @echo "✅ Database schema pushed!"

# Run Prisma migrations
db-migrate:
    @echo "🔄 Running Prisma migrations..."
    docker compose exec api pnpm exec prisma migrate dev
    @echo "✅ Migrations completed!"

# Create new migration
db-migrate-create name:
    @echo "📝 Creating new migration: {{name}}"
    docker compose exec api pnpm exec prisma migrate dev --name {{name}}
    @echo "✅ Migration created!"

# Open Prisma Studio
db-studio:
    @echo "🎨 Opening Prisma Studio..."
    docker compose exec api pnpm exec prisma studio

# Seed database with sample data
db-seed:
    @echo "🌱 Seeding database with sample data..."
    docker compose exec api pnpm run prisma:seed
    @echo "✅ Database seeded successfully!"

# Complete setup: Push schema + Seed
db-setup:
    @echo "🚀 Complete database setup..."
    @just db-push
    @just db-seed
    @echo "✅ Database setup complete!"

# Reset database (⚠️ DELETES ALL DATA)
db-reset:
    @echo "⚠️  Resetting database (all data will be lost)..."
    @echo "Press Ctrl+C in 3 seconds to cancel..."
    @sleep 3
    docker compose exec api pnpm exec prisma migrate reset --force
    @echo "✅ Database reset complete!"

# Reset and seed database
db-reset-seed:
    @echo "🔄 Resetting and seeding database..."
    @just db-reset
    @just db-seed
    @echo "✅ Database reset and seeded!"

# ====================
# 📝 LOGS & MONITORING
# ====================

# Show logs for all services
logs:
    docker compose logs -f

# Show logs for API only
logs-api:
    docker compose logs -f api

# Show logs for PostgreSQL
logs-db:
    docker compose logs -f postgres

# Show logs for Redis
logs-redis:
    docker compose logs -f redis

# Show last 50 lines of API logs
logs-tail:
    docker compose logs --tail=50 api

# ====================
# ☢️ NUCLEAR OPTIONS
# ====================

# Nuclear: Stop all containers and remove volumes (⚠️ DELETES ALL DATA)
nuclear:
    @echo "☢️  NUCLEAR OPTION: Destroying all containers and data..."
    @echo "⚠️  This will delete all database data!"
    @echo "Press Ctrl+C in 5 seconds to cancel..."
    @sleep 5
    docker compose down -v --remove-orphans
    @echo "💥 All containers and volumes destroyed!"

# Nuclear clean: Remove everything including images
nuclear-clean:
    @echo "☢️  NUCLEAR CLEAN: Removing everything..."
    @echo "⚠️  This will delete containers, volumes, and images!"
    @echo "Press Ctrl+C in 5 seconds to cancel..."
    @sleep 5
    docker compose down -v --rmi all --remove-orphans
    @echo "💥 Everything cleaned!"

# Reset: Stop, clean volumes, and restart fresh
reset:
    @echo "🔄 Resetting environment..."
    @just nuclear
    @just quickstart
    @echo "✅ Environment reset complete!"

# ====================
# 🐳 CONTAINER MANAGEMENT
# ====================

# Show status of all containers
status:
    @echo "📊 Container Status:"
    @docker compose ps

# Show resource usage
stats:
    docker stats firma-api firma-postgres firma-redis

# Execute bash in API container
shell:
    docker compose exec api sh

# Execute bash in PostgreSQL container
shell-db:
    docker compose exec postgres sh

# Execute psql in PostgreSQL container
psql:
    docker compose exec postgres psql -U postgres -d firma_hukum

# Execute redis-cli in Redis container
shell-redis:
    docker compose exec redis redis-cli

# ====================
# 🏥 HEALTH CHECKS
# ====================

# Check health of all services
health:
    @echo "🏥 Checking service health..."
    @echo ""
    @echo "📊 API Health:"
    @curl -s http://localhost:3000/health | jq '.' 2>/dev/null || curl -s http://localhost:3000/health || echo "❌ API not responding"
    @echo ""
    @echo "🐘 PostgreSQL Health:"
    @docker compose exec postgres pg_isready -U postgres || echo "❌ PostgreSQL not ready"
    @echo ""
    @echo "🔴 Redis Health:"
    @docker compose exec redis redis-cli ping || echo "❌ Redis not responding"

# Quick health check
ping:
    @curl -s http://localhost:3000/health | jq '.' 2>/dev/null || curl -s http://localhost:3000/health || echo "❌ API not responding"

# ====================
# 🔴 REDIS CACHE
# ====================

# Access Redis CLI
cache-cli:
    @echo "💻 Connecting to Redis CLI..."
    @echo "Commands: PING, KEYS *, DBSIZE, INFO, exit"
    @docker exec -it firma-redis redis-cli

# Ping Redis
cache-ping:
    @echo "🏓 Pinging Redis..."
    @docker exec firma-redis redis-cli PING && echo "✅ Redis is alive!"

# Count cached keys
cache-count:
    @echo "🔢 Total keys in Redis:"
    @docker exec firma-redis redis-cli DBSIZE

# Get cache memory usage
cache-memory:
    @echo "💾 Redis Memory Usage:"
    @docker exec firma-redis redis-cli INFO memory | grep -E "used_memory_human|used_memory_peak_human|mem_fragmentation_ratio"

# View Redis logs
cache-logs:
    @echo "📝 Redis logs (last 50 lines):"
    @docker logs firma-redis --tail 50

# Follow Redis logs
cache-logs-follow:
    @echo "📝 Following Redis logs (Ctrl+C to exit)..."
    @docker logs firma-redis --tail 50 --follow

# ====================
# 🚀 QUICKSTART
# ====================

# Complete quickstart with everything
quickstart:
    @echo "╔════════════════════════════════════════════════════════════╗"
    @echo "║          🚀 FIRMA HUKUM PERARI - QUICKSTART               ║"
    @echo "║         Complete Setup with pnpm + Docker                 ║"
    @echo "╚════════════════════════════════════════════════════════════╝"
    @echo ""
    @echo "🔨 Building and starting all services..."
    docker compose up -d --build
    @echo ""
    @echo "⏳ Waiting for PostgreSQL to be ready..."
    @sleep 10
    @docker compose exec postgres pg_isready -U postgres && echo "✅ PostgreSQL is ready!" || echo "⚠️  PostgreSQL may need more time..."
    @echo ""
    @echo "⏳ Waiting for API to be healthy (this may take a minute)..."
    @sleep 30
    @curl -sf http://localhost:3000/health > /dev/null 2>&1 && echo "✅ API is healthy!" || echo "⚠️  API may need more time, check logs: just logs-api"
    @echo ""
    @echo "🗄️  Setting up database..."
    @just db-setup
    @echo ""
    @echo "╔════════════════════════════════════════════════════════════╗"
    @echo "║          🎉 SETUP COMPLETE! 🎉                            ║"
    @echo "╚════════════════════════════════════════════════════════════╝"
    @echo ""
    @echo "📧 Login Credentials:"
    @echo "   Admin:     admin@perari.id / Admin123!"
    @echo "   Partner:   partner@perari.id / Admin123!"
    @echo "   Advokat:   advokat@perari.id / Admin123!"
    @echo "   Paralegal: paralegal@perari.id / Admin123!"
    @echo "   Staff:     staff@perari.id / Admin123!"
    @echo "   Klien:     klien@perari.id / Admin123!"
    @echo ""
    @echo "🌐 Service URLs:"
    @echo "   API:        http://localhost:3000"
    @echo "   API Docs:   http://localhost:3000/api/docs"
    @echo "   Frontend:   http://localhost:3001"
    @echo "   Health:     http://localhost:3000/health"
    @echo ""
    @echo "🗄️  Database:"
    @echo "   Host:       localhost:5432"
    @echo "   Database:   firma_hukum"
    @echo "   User:       postgres"
    @echo "   Password:   postgres123"
    @echo ""
    @echo "🔥 Quick Commands:"
    @echo "   just logs          - View all logs"
    @echo "   just shell         - Enter API container"
    @echo "   just psql          - Open PostgreSQL CLI"
    @echo "   just cache-cli     - Open Redis CLI"
    @echo "   just health        - Check all services"
    @echo "   just pnpm-install  - Install dependencies"
    @echo ""
    @echo "📚 Documentation:"
    @echo "   just --list        - Show all commands"
    @echo ""
    @echo "✨ Happy Coding!"

# ====================
# 🔧 PRISMA UTILITIES
# ====================

# Fix Prisma Client issues
fix-prisma:
    @echo "🔧 Fixing Prisma Client..."
    @echo "1️⃣  Removing old Prisma Client..."
    @docker compose exec api rm -rf node_modules/.prisma node_modules/@prisma/client 2>/dev/null || true
    @echo "2️⃣  Generating new Prisma Client..."
    @docker compose exec api pnpm exec prisma generate
    @echo "3️⃣  Restarting API..."
    @docker compose restart api
    @echo "✅ Prisma Client fixed! Waiting for API..."
    @sleep 5
    @just ping

# ====================
# 📚 ALIASES
# ====================

# Development aliases
alias up := dev
alias down := dev-stop
alias restart := dev-restart
alias rebuild := api-rebuild

# Log aliases
alias log := logs-api
alias logs-follow := logs-api

# Container aliases
alias sh := shell
alias ps := status

# Database aliases
alias migrate := db-migrate
alias seed := db-seed
alias setup := db-setup
alias studio := db-studio

# Cache aliases
alias redis := cache-cli
alias redis-logs := cache-logs-follow

# pnpm aliases
alias install := pnpm-install
alias add := pnpm-add
alias remove := pnpm-remove
alias update := pnpm-update

# Quick start alias
alias start := quickstart