# Multi-stage build for production optimization

# Frontend build stage
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ ./
RUN npm run build

# Backend build stage
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mediassist -u 1001

# Copy backend build
COPY --from=backend-builder --chown=mediassist:nodejs /app/backend/dist ./backend/dist
COPY --from=backend-builder --chown=mediassist:nodejs /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder --chown=mediassist:nodejs /app/backend/package.json ./backend/

# Copy frontend build
COPY --from=frontend-builder --chown=mediassist:nodejs /app/frontend/dist ./frontend/dist

# Create necessary directories
RUN mkdir -p /app/uploads /app/logs && \
    chown -R mediassist:nodejs /app

# Switch to non-root user
USER mediassist

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Expose port
EXPOSE 5000

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "backend/dist/server.js"]