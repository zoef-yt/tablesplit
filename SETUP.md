# 🔧 TableSplit Setup Guide

## ⚠️ IMPORTANT: Standalone Projects

This repository contains **TWO INDEPENDENT PROJECTS**:
- **`backend/`** - Express.js API (runs standalone)
- **`frontend/`** - Next.js app (runs standalone)

Each project has its own `node_modules` and can be deployed separately. They communicate via environment variables.

---

## ✅ Fresh Installation

### Prerequisites
- Node.js 20+
- npm 10+
- Docker & Docker Compose (optional for MongoDB/Redis)

### Step 1: Clone Repository

```bash
git clone <your-repo-url>
cd tablesplit
```

### Step 2: Install Dependencies

**Install each project independently:**

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

**OR use the convenience script from root:**

```bash
# From root directory
npm run install:all
```

### Step 3: Backend Environment Setup

```bash
# Navigate to backend
cd backend

# Copy environment template
cp .env.example .env

# Edit .env and set required values
```

**Required backend environment variables:**

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/tablesplit

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secret (IMPORTANT: Generate a secure key!)
JWT_SECRET=<run: openssl rand -base64 32>

# Email (SMTP) - Required for magic links
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM=TableSplit <noreply@tablesplit.app>

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:4000

# Environment
NODE_ENV=development
PORT=4000

# Token expiry (in seconds)
MAGIC_LINK_EXPIRY=900
SESSION_EXPIRY=604800
```

**The backend has comprehensive environment validation!** If you're missing or have invalid variables, you'll see:

```
❌ Environment Variable Validation Failed!

1. JWT_SECRET
   ❌ JWT_SECRET has an invalid value
   Example: Run: openssl rand -base64 32

2. SMTP_USER
   ❌ SMTP_USER has an invalid value
   Example: your-email@gmail.com
```

### Step 4: Frontend Environment Setup

```bash
# Navigate to frontend
cd frontend

# Copy environment template
cp .env.local.example .env.local

# Edit .env.local
```

**Required frontend environment variables:**

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:4000/api

# Socket.io URL (for real-time features)
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000

# Environment
NODE_ENV=development
```

### Step 5: Start Services

#### Option A: Docker (Recommended for MongoDB + Redis)

```bash
# From root directory
docker-compose up -d

# This starts:
# - MongoDB on localhost:27017
# - Redis on localhost:6379
```

#### Option B: Local MongoDB + Redis

```bash
# Terminal 1: Start MongoDB
mongod --dbpath ./data/db

# Terminal 2: Start Redis
redis-server
```

### Step 6: Start Backend

```bash
# Navigate to backend
cd backend

# Start development server
npm run dev

# Backend will run on http://localhost:4000
```

### Step 7: Start Frontend

```bash
# Navigate to frontend (in a new terminal)
cd frontend

# Start development server
npm run dev

# Frontend will run on http://localhost:3000
```

---

## 🚀 Convenience Scripts (from root)

The root `package.json` provides optional convenience scripts:

```bash
# Start both frontend and backend concurrently
npm run dev

# Build both projects
npm run build

# Run tests for both
npm test

# Install dependencies for both
npm run install:all
```

**Note:** These are just shortcuts. You can always run each project independently.

---

## 📦 Project Structure

```
tablesplit/
├── backend/              # Standalone Express.js API
│   ├── .env             # Backend environment variables (gitignored)
│   ├── .env.example     # Backend env template
│   ├── package.json     # Backend dependencies
│   ├── node_modules/    # Backend dependencies (independent)
│   └── src/             # Backend source code
│
├── frontend/            # Standalone Next.js app
│   ├── .env.local       # Frontend environment variables (gitignored)
│   ├── .env.local.example  # Frontend env template
│   ├── package.json     # Frontend dependencies
│   ├── node_modules/    # Frontend dependencies (independent)
│   └── src/             # Frontend source code
│
├── docker-compose.yml   # Optional: MongoDB + Redis
├── package.json         # Root convenience scripts only
└── README.md
```

---

## 🐛 Common Issues

### Issue: "Cannot find module" errors in backend

**Cause**: Missing dependencies

**Fix**:
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Cannot find module" errors in frontend

**Cause**: Missing dependencies

**Fix**:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Issue: Backend env validation errors

**Cause**: Missing or invalid environment variables in `backend/.env`

**Fix**:
1. Ensure `backend/.env` exists (copy from `backend/.env.example`)
2. Replace all placeholders (no "your-", "change-this", etc.)
3. Generate JWT_SECRET: `openssl rand -base64 32`

### Issue: Frontend can't connect to backend

**Cause**: Wrong API URL in `frontend/.env.local`

**Fix**: Ensure `NEXT_PUBLIC_API_URL=http://localhost:4000/api`

### Issue: Database connection errors

**Cause**: MongoDB/Redis not running

**Fix**:
- Docker: `docker-compose up -d`
- Local: Start MongoDB and Redis manually

---

## 🚢 Deployment

### Backend Deployment (e.g., Railway, Render, Heroku)

1. Deploy `backend/` folder
2. Set environment variables in your hosting platform
3. Ensure MongoDB and Redis are accessible
4. Set `FRONTEND_URL` to your frontend domain

### Frontend Deployment (e.g., Vercel, Netlify)

1. Deploy `frontend/` folder
2. Set `NEXT_PUBLIC_API_URL` to your backend domain
3. Set `NEXT_PUBLIC_SOCKET_URL` to your backend domain

**Example production env:**

Backend:
```env
FRONTEND_URL=https://tablesplit.vercel.app
BACKEND_URL=https://api.tablesplit.com
```

Frontend:
```env
NEXT_PUBLIC_API_URL=https://api.tablesplit.com/api
NEXT_PUBLIC_SOCKET_URL=https://api.tablesplit.com
```

---

## 🧪 Verify Installation

### Test Backend

```bash
cd backend
npm run build
# Should compile without errors

# Start backend
npm run dev
# Should show: 🎰 TableSplit backend running on port 4000
```

### Test Frontend

```bash
cd frontend
npm run build
# Should build without errors

# Start frontend
npm run dev
# Should show: ▲ Next.js 15.x.x
```

### Test Connection

1. Open http://localhost:3000
2. Try to sign up or log in
3. Check browser console for API connection
4. Backend should show incoming requests

---

## 💡 Key Differences from Monorepo

❌ **DO NOT** run `npm install` from root (it won't install project dependencies)

✅ **DO** install in each project:
```bash
cd backend && npm install
cd frontend && npm install
```

❌ **DO NOT** expect shared `node_modules`

✅ **DO** expect independent `node_modules` in each folder

❌ **DO NOT** put `.env` in root

✅ **DO** create:
- `backend/.env` for backend
- `frontend/.env.local` for frontend

---

## 🆘 Still Having Issues?

1. Verify Node.js version: `node --version` (should be 20+)
2. Verify npm version: `npm --version` (should be 10+)
3. Check both `.env` files exist with correct values
4. Ensure MongoDB and Redis are running
5. Check backend logs for detailed error messages

**For a complete clean restart:**

```bash
# Clean backend
cd backend
rm -rf node_modules package-lock.json dist
npm install

# Clean frontend
cd ../frontend
rm -rf node_modules package-lock.json .next
npm install
```
