# 🛠️ Development Guide

## Project Setup

### Initial Setup
```bash
# Clone repository
git clone <repo-url>
cd tablesplit

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### Environment Configuration

Create `.env` file in root:
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/tablesplit

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key-here

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=TableSplit <noreply@tablesplit.app>

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:4000

# Environment
NODE_ENV=development
```

### Generate Secrets
```bash
# JWT Secret
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Development Workflow

### Start Development Servers

**Option 1: All at once (root directory)**
```bash
npm run dev
```

**Option 2: Separately**
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

### File Watching
Both servers use hot reload:
- Frontend: Next.js Fast Refresh
- Backend: Nodemon + ts-node

### Docker Development
```bash
# Start services
docker-compose up

# With rebuild
docker-compose up --build

# Detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## Code Organization

### Frontend Structure
```
frontend/src/
├── app/                 # Next.js App Router
│   ├── auth/           # Auth pages
│   ├── groups/         # Group pages
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Landing page
│   └── providers.tsx   # App providers
├── components/         # React components
│   ├── poker/         # Poker table UI
│   ├── forms/         # Form components
│   └── ui/            # Reusable UI
├── lib/               # Utilities
│   ├── api.ts         # Axios instance
│   ├── socket.ts      # Socket.io client
│   └── utils.ts       # Helpers
├── stores/            # Zustand stores
├── types/             # TypeScript types
└── styles/            # Global CSS
```

### Backend Structure
```
backend/src/
├── api/               # REST routes
│   ├── auth.ts
│   ├── groups.ts
│   └── expenses.ts
├── services/          # Business logic
│   ├── auth.service.ts
│   ├── group.service.ts
│   ├── expense.service.ts
│   └── email.service.ts
├── models/            # Mongoose models
├── middleware/        # Express middleware
├── sockets/           # Socket.io handlers
├── config/            # Configuration
└── utils/             # Utilities
```

---

## Database Management

### MongoDB

**Connect to MongoDB**
```bash
# Docker
docker exec -it tablesplit-mongo mongosh

# Local
mongosh tablesplit
```

**Common Operations**
```javascript
// View collections
show collections

// View users
db.users.find().pretty()

// View groups
db.groups.find().pretty()

// View expenses
db.expenses.find().pretty()

// Clear all data (DANGER!)
db.dropDatabase()
```

**Create Indexes**
```javascript
// User email index
db.users.createIndex({ email: 1 }, { unique: true })

// Group members index
db.groups.createIndex({ "members.userId": 1 })

// Expense group index
db.expenses.createIndex({ groupId: 1, createdAt: -1 })

// Balance compound index
db.balances.createIndex({ groupId: 1, userId: 1 }, { unique: true })
```

### Redis

**Connect to Redis**
```bash
# Docker
docker exec -it tablesplit-redis redis-cli

# Local
redis-cli
```

**Common Operations**
```bash
# View all keys
KEYS *

# Get magic link token
GET magic:TOKEN_HERE

# View all sessions
KEYS session:*

# Clear all data (DANGER!)
FLUSHALL
```

---

## API Testing

### Using cURL

**Register/Login**
```bash
# Request magic link
curl -X POST http://localhost:4000/api/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Login with password
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Create Group**
```bash
curl -X POST http://localhost:4000/api/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Test Group","theme":"poker"}'
```

**Add Expense**
```bash
curl -X POST http://localhost:4000/api/expenses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "groupId":"GROUP_ID",
    "description":"Pizza",
    "amount":60,
    "paidBy":"USER_ID",
    "selectedMembers":["USER_ID_1","USER_ID_2"]
  }'
```

### Using Postman/Insomnia

Import this collection:
```json
{
  "name": "TableSplit API",
  "requests": [
    {
      "name": "Login",
      "method": "POST",
      "url": "{{baseUrl}}/api/auth/login",
      "body": {
        "email": "test@example.com",
        "password": "password123"
      }
    },
    {
      "name": "Get Groups",
      "method": "GET",
      "url": "{{baseUrl}}/api/groups",
      "headers": {
        "Authorization": "Bearer {{token}}"
      }
    }
  ]
}
```

---

## Debugging

### Frontend Debugging

**Browser DevTools**
- React DevTools extension
- Redux DevTools (for Zustand)
- Network tab for API calls
- Console for errors

**VS Code Launch Config** (`.vscode/launch.json`)
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev",
      "cwd": "${workspaceFolder}/frontend"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### Backend Debugging

**VS Code Launch Config**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "cwd": "${workspaceFolder}/backend",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

**Logging**
```typescript
import { logger } from './utils/logger';

logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message', error);
```

---

## Testing

### Frontend Tests

**Run tests**
```bash
cd frontend
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

**Example test**
```typescript
// components/poker/PokerTable.test.tsx
import { render, screen } from '@testing-library/react';
import { PokerTable } from './PokerTable';

describe('PokerTable', () => {
  it('renders player seats', () => {
    render(<PokerTable members={mockMembers} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
```

### Backend Tests

**Run tests**
```bash
cd backend
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

**Example test**
```typescript
// services/expense.service.test.ts
import { expenseService } from './expense.service';

describe('ExpenseService', () => {
  describe('equalSplit', () => {
    it('splits amount equally', () => {
      const result = expenseService.equalSplit(100, ['user1', 'user2']);
      expect(result[0].amount).toBe(50);
      expect(result[1].amount).toBe(50);
    });
  });
});
```

---

## Performance Optimization

### Frontend

**Bundle Analysis**
```bash
# Install analyzer
npm install --save-dev @next/bundle-analyzer

# Analyze bundle
ANALYZE=true npm run build
```

**Image Optimization**
```tsx
import Image from 'next/image';

<Image
  src="/poker-chip.png"
  width={60}
  height={60}
  alt="Chip"
  loading="lazy"
/>
```

**Code Splitting**
```tsx
import dynamic from 'next/dynamic';

const ExpenseModal = dynamic(() => import('./ExpenseModal'), {
  loading: () => <Loader />,
  ssr: false
});
```

### Backend

**Database Queries**
```typescript
// Bad: N+1 query
const expenses = await Expense.find({ groupId });
for (const expense of expenses) {
  expense.user = await User.findById(expense.userId);
}

// Good: Use populate
const expenses = await Expense.find({ groupId })
  .populate('paidBy')
  .populate('splits.userId');
```

**Redis Caching**
```typescript
// Check cache first
const cached = await redisClient.get(`balances:${groupId}`);
if (cached) return JSON.parse(cached);

// Fetch from DB and cache
const balances = await Balance.find({ groupId });
await redisClient.setEx(`balances:${groupId}`, 600, JSON.stringify(balances));
```

---

## Common Issues

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 PID
```

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
docker ps | grep mongo
# or
brew services list | grep mongodb

# Restart MongoDB
docker-compose restart mongo
```

### TypeScript Errors
```bash
# Clear cache
rm -rf node_modules .next
npm install
```

### Git Hooks (Recommended)

**Install Husky**
```bash
npm install --save-dev husky
npx husky install
```

**Pre-commit hook** (`.husky/pre-commit`)
```bash
#!/bin/sh
npm run lint
npm test
```

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] JWT secret generated and set
- [ ] SMTP credentials configured
- [ ] MongoDB indexes created
- [ ] Redis persistence enabled
- [ ] Docker images built
- [ ] SSL certificates installed (production)
- [ ] Domain configured
- [ ] Backup strategy in place
- [ ] Monitoring setup (logs, metrics)

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Express Documentation](https://expressjs.com/)
- [MongoDB Manual](https://docs.mongodb.com/)
- [Socket.io Documentation](https://socket.io/docs/)
- [Framer Motion](https://www.framer.com/motion/)
- [TailwindCSS](https://tailwindcss.com/)

---

Happy coding! 🎰
