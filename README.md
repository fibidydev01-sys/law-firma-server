# 🏛️ Firma Hukum PERARI - API Backend

Sistem Manajemen Firma Hukum Indonesia berbasis NestJS, PostgreSQL, dan Redis.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the App](#running-the-app)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [Docker Deployment](#docker-deployment)
- [Railway Deployment](#railway-deployment)
- [Testing](#testing)
- [Project Structure](#project-structure)

---

## ✨ Features

### 🔐 Authentication & Authorization

- JWT-based authentication
- Role-based access control (Admin, Advokat, Paralegal, Staff, Klien)
- Password hashing dengan bcrypt
- Refresh token mechanism

### 👥 Manajemen Klien

- CRUD klien (perorangan/perusahaan)
- Data lengkap klien dengan alamat Indonesia
- Riwayat perkara per klien
- Search & filter klien

### ⚖️ Manajemen Perkara

- CRUD perkara hukum
- 11 jenis perkara (Perdata, Pidana, Keluarga, dll)
- Status tracking (Aktif, Pending, Selesai, Arsip)
- Tim perkara & assignment
- Statistik perkara

### 📋 Manajemen Tugas

- CRUD tugas per perkara
- Assignment ke tim
- Priority & status tracking
- Billable hours tracking
- Deadline management

### 📅 Jadwal Sidang

- Manajemen jadwal sidang
- Tracking hasil sidang
- Notifikasi sidang mendatang

### 📄 Dokumen Hukum

- Upload/download dokumen
- Kategorisasi (Gugatan, Jawaban, Bukti, dll)
- Version control
- Confidentiality flag

### 📊 Dashboard & Analytics

- Statistik perkara
- Task progress tracking
- Activity logs
- Performance metrics

---

## 🛠️ Tech Stack

- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 15
- **ORM**: Prisma 5.x
- **Cache**: Redis 7
- **Authentication**: JWT + Passport
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI
- **Container**: Docker & Docker Compose

---

## 📦 Prerequisites

- Node.js >= 18.x
- npm >= 9.x
- PostgreSQL >= 15
- Redis >= 7
- Docker & Docker Compose (optional)

---

## 🚀 Installation

### 1. Clone Repository

```bash
git clone https://github.com/your-org/firma-hukum-api.git
cd firma-hukum-api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Install Global Dependencies

```bash
npm install -g @nestjs/cli
npm install -g prisma
```

---

## ⚙️ Configuration

### 1. Create Environment File

```bash
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` file:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/firma_hukum?schema=public"
DIRECT_URL="postgresql://postgres:postgres123@localhost:5432/firma_hukum?schema=public"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""
REDIS_TTL=3600

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="your-refresh-secret-key-change-this-in-production"
JWT_REFRESH_EXPIRES_IN="30d"

# App
NODE_ENV="development"
PORT=3000
API_PREFIX="api/v1"
API_URL="http://localhost:3000"

# Frontend
FRONTEND_URL="http://localhost:3001"
```

---

## 🎯 Running the App

### Development Mode

```bash
# Start with watch mode
npm run start:dev

# Start with debug mode
npm run start:debug
```

### Production Mode

```bash
# Build
npm run build

# Start production
npm run start:prod
```

---

## 💾 Database Setup

### 1. Generate Prisma Client

```bash
npm run prisma:generate
```

### 2. Run Migrations

```bash
# For development (creates migration files)
npm run prisma:migrate

# For production (applies existing migrations)
npx prisma migrate deploy
```

### 3. Push Schema (Alternative for development)

```bash
npm run prisma:push
```

### 4. Seed Database

```bash
npm run prisma:seed
```

**Default Login Credentials:**

- Admin: `admin@perari.id` / `Admin123!`
- Advokat: `advokat@perari.id` / `Admin123!`
- Paralegal: `paralegal@perari.id` / `Admin123!`

### 5. Open Prisma Studio

```bash
npm run prisma:studio
```

Access at: http://localhost:5555

---

## 📚 API Documentation

### Swagger UI

Once the app is running, access Swagger documentation at:

```
http://localhost:3000/api/docs
```

### API Endpoints Overview

#### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/profile` - Get profile
- `POST /api/v1/auth/change-password` - Change password
- `POST /api/v1/auth/refresh` - Refresh token

#### Klien

- `GET /api/v1/klien` - Get all clients (paginated)
- `GET /api/v1/klien/:id` - Get client by ID
- `POST /api/v1/klien` - Create client
- `PATCH /api/v1/klien/:id` - Update client
- `DELETE /api/v1/klien/:id` - Delete client

#### Perkara

- `GET /api/v1/perkara` - Get all cases (paginated)
- `GET /api/v1/perkara/:id` - Get case by ID
- `GET /api/v1/perkara/:id/statistics` - Get case statistics
- `POST /api/v1/perkara` - Create case
- `PATCH /api/v1/perkara/:id` - Update case
- `DELETE /api/v1/perkara/:id` - Delete case

#### Tugas

- `GET /api/v1/tugas` - Get all tasks (paginated)
- `GET /api/v1/tugas/my-tasks` - Get my tasks
- `GET /api/v1/tugas/:id` - Get task by ID
- `POST /api/v1/tugas` - Create task
- `PATCH /api/v1/tugas/:id` - Update task
- `DELETE /api/v1/tugas/:id` - Delete task

---

## 🐳 Docker Deployment

### Local Development with Docker Compose

```bash
# Start all services
npm run docker:dev

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

Services akan berjalan di:

- API: http://localhost:3000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Build Docker Image

```bash
npm run docker:build
```

---

## 🚂 Railway Deployment

### Prerequisites

1. Create Railway account
2. Install Railway CLI (optional)
3. Prepare 3 services in Railway

### Step 1: Create PostgreSQL Database

1. Go to Railway Dashboard
2. New → Database → PostgreSQL
3. Name: `firma-hukum-db`
4. Note the `DATABASE_URL`

### Step 2: Create Redis

1. New → Database → Redis
2. Name: `firma-hukum-redis`
3. Note the connection details

### Step 3: Deploy API

1. New → GitHub Repo
2. Connect your repository
3. Name: `firma-hukum-api`

### Step 4: Configure Environment Variables

Add these variables in Railway API service:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
DIRECT_URL=${{Postgres.DATABASE_URL}}
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}
JWT_SECRET=your-production-secret-very-long-and-secure
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-very-long-and-secure
JWT_REFRESH_EXPIRES_IN=30d
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1
FRONTEND_URL=https://your-frontend-domain.com
```

### Step 5: Configure Build & Deploy

Railway akan otomatis detect NestJS project. Pastikan `railway.json` sudah ada.

**Build Command:**

```bash
npm install && npx prisma generate && npm run build
```

**Start Command:**

```bash
npx prisma migrate deploy && node dist/main
```

### Step 6: Deploy

```bash
# Using Railway CLI
railway up

# Or push to GitHub (auto-deploy)
git push origin main
```

### Verification

1. Check Railway logs
2. Test health endpoint: `https://your-api.railway.app/api/v1/health`
3. Access Swagger: `https://your-api.railway.app/api/docs`

---

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
npm run test:e2e
```

### Test Coverage

```bash
npm run test:cov
```

---

## 📁 Project Structure

```
firma-hukum-api/
├── prisma/
│   ├── schema.prisma          # Prisma schema
│   ├── seed.ts                # Database seeder
│   └── migrations/            # Migration files
├── src/
│   ├── common/                # Shared utilities
│   │   ├── decorators/        # Custom decorators
│   │   ├── filters/           # Exception filters
│   │   ├── guards/            # Auth guards
│   │   ├── interceptors/      # Response interceptors
│   │   ├── pipes/             # Validation pipes
│   │   └── dto/               # Common DTOs
│   ├── config/                # Configuration files
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   └── redis.config.ts
│   ├── modules/               # Feature modules
│   │   ├── auth/              # Authentication
│   │   ├── klien/             # Client management
│   │   ├── perkara/           # Case management
│   │   └── tugas/             # Task management
│   ├── prisma/                # Prisma service
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── app.module.ts          # Root module
│   └── main.ts                # Entry point
├── test/                      # Test files
├── .env.example               # Environment template
├── .gitignore
├── docker-compose.yml         # Docker compose config
├── Dockerfile                 # Docker image config
├── nest-cli.json              # NestJS CLI config
├── package.json
├── railway.json               # Railway config
├── README.md
├── tsconfig.json
└── tsconfig.build.json
```

---

## 🔧 Scripts Reference

```json
{
  "start": "nest start",
  "start:dev": "nest start --watch",
  "start:debug": "nest start --debug --watch",
  "start:prod": "node dist/main",
  "build": "nest build",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:cov": "jest --coverage",
  "test:e2e": "jest --config ./test/jest-e2e.json",
  "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
  "format": "prettier --write \"src/**/*.ts\"",
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev",
  "prisma:push": "prisma db push",
  "prisma:studio": "prisma studio",
  "prisma:seed": "ts-node prisma/seed.ts",
  "docker:dev": "docker-compose up -d",
  "docker:down": "docker-compose down",
  "docker:logs": "docker-compose logs -f api",
  "docker:build": "docker build -t firma-hukum-api ."
}
```

---

## 📊 Database Schema Overview

### Main Tables

- **users** - User accounts (Admin, Advokat, Paralegal, etc)
- **klien** - Client information
- **perkara** - Legal cases
- **tugas** - Tasks/assignments
- **jadwal_sidang** - Court hearing schedules
- **dokumen_hukum** - Legal documents
- **catatan_perkara** - Case notes
- **tim_perkara** - Case team assignments
- **pemeriksaan_konflik** - Conflict checks
- **log_aktivitas** - Activity logs
- **akses_portal_klien** - Client portal access

### Enums

- **UserRole**: admin, advokat, paralegal, staff, klien
- **StatusPerkara**: aktif, pending, selesai, arsip
- **JenisPerkara**: perdata, pidana, keluarga, perusahaan, dll
- **StatusTugas**: belum_mulai, sedang_berjalan, selesai
- **PrioritasTugas**: rendah, sedang, tinggi, mendesak
- **KategoriDokumen**: gugatan, jawaban, bukti, dll
- **JenisSidang**: sidang_pertama, mediasi, putusan, dll

---

## 🔒 Security Best Practices

### Environment Variables

- ✅ Never commit `.env` files
- ✅ Use strong JWT secrets (min 32 characters)
- ✅ Rotate secrets regularly
- ✅ Use different secrets for dev/prod

### Password Security

- ✅ Bcrypt hashing with salt rounds = 10
- ✅ Minimum password length: 8 characters
- ✅ Password complexity validation

### API Security

- ✅ JWT authentication on all endpoints
- ✅ Role-based authorization
- ✅ CORS configuration
- ✅ Helmet for security headers
- ✅ Rate limiting (recommended)
- ✅ Request validation with class-validator

### Database Security

- ✅ Parameterized queries (Prisma)
- ✅ Connection pooling
- ✅ Soft deletes for sensitive data
- ✅ Audit logs for all actions

---

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql $DATABASE_URL

# Check if PostgreSQL is running
pg_isready -h localhost -p 5432
```

### Redis Connection Issues

```bash
# Test Redis connection
redis-cli -h localhost -p 6379 ping

# Check if Redis is running
redis-cli ping
```

### Prisma Issues

```bash
# Reset database (⚠️ CAUTION: deletes all data)
npm run prisma:reset

# Format schema
npx prisma format

# Validate schema
npx prisma validate
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change PORT in .env
```

### Docker Issues

```bash
# Remove all containers and volumes
docker-compose down -v

# Rebuild images
docker-compose build --no-cache

# View container logs
docker-compose logs -f
```

---

## 📈 Performance Optimization

### Caching Strategy

- Redis cache for frequently accessed data
- TTL: 3600 seconds (1 hour)
- Cache invalidation on updates

### Database Optimization

- Proper indexing (unique, foreign keys)
- Connection pooling
- Select only needed fields
- Pagination for large datasets

### API Optimization

- Response compression (gzip)
- Proper HTTP status codes
- Efficient error handling
- Request validation

---

## 🔄 CI/CD Pipeline (Recommended)

### GitHub Actions Example

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm test
```

---

## 📝 API Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Your data here
  },
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

### Error Response

```json
{
  "success": false,
  "statusCode": 400,
  "timestamp": "2024-01-20T10:30:00.000Z",
  "message": "Error message",
  "error": "BadRequest"
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Team

- **Developer**: Your Name
- **Organization**: PERARI (Perkumpulan Pengacara Indonesia)
- **Location**: Sidoarjo, Indonesia

---

## 📞 Support

For support, email support@perari.id or join our Slack channel.

---

## 🎉 Acknowledgments

- NestJS Team
- Prisma Team
- PERARI Organization
- All contributors

---

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Railway Documentation](https://docs.railway.app)
- [Docker Documentation](https://docs.docker.com)

---

## ✅ Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Seed data prepared
- [ ] Security review completed
- [ ] API documentation updated
- [ ] Performance testing done

### Railway Deployment

- [ ] PostgreSQL service created
- [ ] Redis service created
- [ ] API service connected to GitHub
- [ ] Environment variables set
- [ ] Build command configured
- [ ] Start command configured
- [ ] Health check endpoint working
- [ ] Domain configured (optional)

### Post-Deployment

- [ ] Database migrated successfully
- [ ] Seed data loaded
- [ ] API accessible
- [ ] Swagger docs accessible
- [ ] Authentication working
- [ ] All endpoints tested
- [ ] Monitoring setup
- [ ] Backup strategy implemented

---

**Made with ❤️ for PERARI - Perkumpulan Pengacara Indonesia**
