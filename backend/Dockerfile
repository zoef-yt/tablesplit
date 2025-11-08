# Backend Dockerfile - Multi-stage build
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false

# Build TypeScript
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create logs directory
RUN mkdir -p logs

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --production

# Copy built application
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 4000

CMD ["node", "dist/index.js"]
