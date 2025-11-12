# 🚀 Quick Start (5 minutes)

## Prerequisites
- Node.js 20+
- Docker (for MongoDB & Redis)

## Setup

### 1. Clone & Install
```bash
git clone <repo-url>
cd tablesplit

# Install backend
cd backend
npm install

# Install frontend
cd ../frontend
npm install
```

### 2. Environment Files

**Backend (.env):**
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
- Change `JWT_SECRET` (run: `openssl rand -base64 32`)
- Set SMTP credentials if you want magic links (or use password auth)

**Frontend (.env.local):**
```bash
cd frontend
cp .env.local.example .env.local
```

The defaults work fine for local dev:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NODE_ENV=development
```

### 3. Start Services

**Terminal 1 - Database:**
```bash
# From root
docker-compose up -d
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
# Should show: ✅ Environment variables validated successfully
#              🎰 TableSplit backend running on port 4000
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
# Should show: ▲ Next.js ready on http://localhost:3000
```

### 4. Test It!

1. Open http://localhost:3000
2. Click **Sign Up**
3. Create account:
   - Name: Test User
   - Email: test@example.com
   - Password: password
4. Click **Create Your First Group**
5. Name it "Test Group"
6. Click **Add Expense**
   - Description: Dinner
   - Amount: 500
7. See your balance update! ✨

## Troubleshooting

### Backend won't start
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
# Check .env file exists and has valid values
```

### Frontend won't start
```bash
cd frontend
rm -rf node_modules package-lock.json .next
npm install
# Check .env.local file exists
```

### Database connection errors
```bash
# Make sure Docker is running
docker-compose ps
# Should show mongo and redis as "Up"

# Restart if needed
docker-compose down
docker-compose up -d
```

## What You Get

✅ Clean dark theme (no weird colors)
✅ Login & Signup pages
✅ Create groups
✅ Add expenses
✅ See balances (who owes whom)
✅ Real-time updates
✅ Fully responsive
✅ Indian Rupees (₹)

Enjoy! 🎉
