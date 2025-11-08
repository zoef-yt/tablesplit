# Changelog

All notable changes to TableSplit will be documented in this file.

## [1.0.0] - 2024-11-08

### 🎉 Initial MVP Release

#### Features
- ✨ Magic link authentication with JWT
- 👥 Group creation and management (up to 8 members)
- 💸 Expense tracking with equal split
- 🎲 Beautiful poker table UI with Framer Motion animations
- ⚡ Real-time updates via Socket.io
- 🧮 Smart debt simplification algorithm
- 📱 PWA support for mobile/desktop installation
- 🌙 Multiple themes (Poker, Classic, Minimal)
- 🐳 Docker Compose setup for easy deployment
- 🥧 Optimized for Raspberry Pi

#### Technical Highlights
- Next.js 15 with App Router
- Express + TypeScript backend
- MongoDB + Redis for data and caching
- Comprehensive error handling and validation
- Type-safe codebase with TypeScript
- Responsive mobile-first design

## [1.1.0] - 2024-11-08

### 🚀 Major Refactor: TanStack Query + shadcn/ui Integration

#### Breaking Changes
- Completely replaced all `useEffect` hooks with TanStack Query for server state management
- Migrated to shadcn/ui component library with react-hook-form and zod validation

#### New Features
- ✅ **TanStack Query Integration**: Automatic caching, background refetching, and optimistic updates
- ✅ **shadcn/ui Components**: Button, Input, Label, and Form components with consistent styling
- ✅ **Form Validation**: Zod schemas with react-hook-form for type-safe validation
- ✅ **Custom Hooks**: useAuth, useGroups, useExpenses, useRealtimeUpdates
- ✅ **Real-time Updates**: Dedicated hook for Socket.io integration with query invalidation
- ✅ **Zero useEffect**: All data fetching managed by queries and mutations

#### Improvements
- 🎯 Better developer experience with automatic loading/error states
- 🔄 Optimistic UI updates for instant feedback
- 📦 Smaller bundle size with tree-shaking
- 🐛 Fewer bugs from manual state management
- 📝 Better TypeScript support and autocomplete

#### Migration Summary
- `/app/auth/login/page.tsx` - Migrated to useLogin mutation with zod validation
- `/app/auth/verify/[token]/page.tsx` - Migrated to useVerifyMagicLink query
- `/app/groups/page.tsx` - Migrated to useGroups query
- `/app/groups/[id]/page.tsx` - Migrated to useGroup, useBalances, useExpenses queries
- All forms now use shadcn/ui with react-hook-form

### Future Improvements
- [ ] Add percentage & custom splits
- [ ] Implement receipt photo uploads
- [ ] Add expense categories and filtering
- [ ] Currency conversion support
- [ ] Recurring expenses
- [ ] Payment integrations (Venmo, PayPal)
- [ ] Export history (CSV/PDF)
- [ ] Group chat feature
- [ ] Achievements/gamification
