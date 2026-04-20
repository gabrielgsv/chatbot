# Build stage for backend
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build


# Production stage
FROM node:22-alpine

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install --only=production

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Change ownership
RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3001

# Try main.js first, fallback to main.mjs
CMD ["sh", "-c", "node dist/main.js 2>/dev/null || node dist/main.mjs 2>/dev/null || node dist/src/main.js 2>/dev/null || echo 'Build output not found' && ls -la dist/ && exit 1"]
