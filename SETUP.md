# 🔧 TableSplit Setup Guide

## ⚠️ IMPORTANT: npm Workspaces Setup

This is a **npm workspaces monorepo**. Dependencies MUST be installed from the root directory only.

---

## 🚨 If You're Getting Module Errors

If you're seeing errors like:
- `Cannot find module 'es-errors/type.js'`
- `Cannot find module 'minimist/index.js'`
- `MODULE_NOT_FOUND` errors

**You have a corrupted workspace setup.** Follow these steps:

### Fix Steps (Windows - Git Bash/PowerShell)

```bash
# 1. Navigate to ROOT directory
cd F:\zoef\synthing\personal-project\tablesplit

# 2. Clean everything
rm -rf node_modules
rm -rf frontend/node_modules
rm -rf backend/node_modules
rm -rf package-lock.json
rm -rf frontend/package-lock.json
rm -rf backend/package-lock.json

# 3. Install from ROOT only
npm install

# 4. Verify installation
npm ls --depth=0
```

### Fix Steps (Linux/Mac)

```bash
# 1. Navigate to ROOT directory
cd /path/to/tablesplit

# 2. Clean everything
rm -rf node_modules frontend/node_modules backend/node_modules
rm -rf package-lock.json frontend/package-lock.json backend/package-lock.json

# 3. Install from ROOT only
npm install

# 4. Verify installation
npm ls --depth=0
```

---

## ✅ Fresh Installation

### Prerequisites
- Node.js 20+
- npm 10+
- Docker & Docker Compose (optional)

### Step 1: Clone Repository

```bash
git clone <your-repo-url>
cd tablesplit
```

### Step 2: Install Dependencies

```bash
# FROM ROOT DIRECTORY ONLY!
npm install
```

**❌ DO NOT DO THIS:**
```bash
cd frontend && npm install  # WRONG!
cd backend && npm install   # WRONG!
```

**✅ ONLY DO THIS:**
```bash
# From root directory
npm install
```

### Step 3: Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env and set required values:
# - JWT_SECRET (generate with: openssl rand -base64 32)
# - SMTP credentials for magic link emails
```

**IMPORTANT**: The backend now has **comprehensive environment validation**. If you're missing or have invalid environment variables, you'll see a detailed error message with:

✅ Which variables are missing/invalid
✅ Current values (sanitized for passwords)
✅ Example values
✅ Quick fix instructions

Example error output:
```
❌ Environment Variable Validation Failed!

1. JWT_SECRET
   ❌ JWT_SECRET has an invalid value
   Example: Run: openssl rand -base64 32

2. SMTP_USER
   ❌ SMTP_USER has an invalid value
   Example: your-email@gmail.com
```

This makes it **crystal clear** what's wrong and how to fix it!

### Step 4: Start Development Environment

#### Option A: Docker (Recommended)

```bash
# Start all services (MongoDB, Redis, Frontend, Backend)
npm run docker:up

# Access at:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:4000
```

#### Option B: Local Development

```bash
# Terminal 1: Start MongoDB
mongod --dbpath ./data/db

# Terminal 2: Start Redis
redis-server

# Terminal 3: Start Backend
npm run dev:backend

# Terminal 4: Start Frontend
npm run dev:frontend

# Or run both concurrently:
npm run dev
```

---

## 📁 Workspace Structure

```
tablesplit/
├── package.json          # Root workspace configuration
├── node_modules/         # Shared dependencies (managed by root)
├── frontend/
│   ├── package.json      # Frontend-specific dependencies
│   └── (no node_modules) # Hoisted to root
└── backend/
    ├── package.json      # Backend-specific dependencies
    └── (no node_modules) # Hoisted to root
```

---

## 🐛 Common Issues

### Issue: "Cannot find module" errors

**Cause**: Running `npm install` inside frontend/backend instead of root

**Fix**: Delete all node_modules and package-lock.json files, then run `npm install` from root only

### Issue: Backend/Frontend won't start

**Cause**: Environment variables not set

**Fix**: Copy `.env.example` to `.env` and fill in required values

### Issue: Database connection errors

**Cause**: MongoDB/Redis not running

**Fix**:
- Docker: `npm run docker:up`
- Local: Start MongoDB and Redis manually

---

## 🧪 Verify Installation

```bash
# Check workspace structure
npm ls --depth=0

# Should show:
# tablesplit@1.0.0
# ├── concurrently@8.2.2
# ├── tablesplit-backend@1.0.0 -> ./backend
# └── tablesplit-frontend@1.0.0 -> ./frontend

# Test frontend build
npm run build:frontend

# Test backend build
npm run build:backend
```

---

## 📚 Available Scripts

From **ROOT directory only**:

```bash
# Development
npm run dev              # Start both frontend & backend
npm run dev:frontend     # Start frontend only
npm run dev:backend      # Start backend only

# Build
npm run build            # Build both
npm run build:frontend   # Build frontend only
npm run build:backend    # Build backend only

# Docker
npm run docker:up        # Start all services
npm run docker:down      # Stop all services
npm run docker:build     # Rebuild and start

# Testing
npm test                 # Run all tests
npm run test:frontend    # Frontend tests
npm run test:backend     # Backend tests
```

---

## 💡 Tips

1. **Always work from root directory** for npm commands
2. **Use `npm run dev`** instead of cd-ing into frontend/backend
3. **If in doubt, clean and reinstall** from root
4. **Check Docker logs** if services fail: `docker-compose logs -f`

---

## 🆘 Still Having Issues?

1. Verify Node.js version: `node --version` (should be 20+)
2. Verify npm version: `npm --version` (should be 10+)
3. Check `.env` file exists and has all required values
4. Ensure MongoDB and Redis are running
5. Check Docker is running (for docker setup)

If all else fails, try a complete clean reinstall:

```bash
rm -rf node_modules frontend/node_modules backend/node_modules
rm -rf package-lock.json frontend/package-lock.json backend/package-lock.json
rm -rf frontend/.next frontend/dist backend/dist
npm cache clean --force
npm install
```
