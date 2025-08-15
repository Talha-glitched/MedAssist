FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache curl dumb-init

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mediassist -u 1001

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Create necessary directories
RUN mkdir -p uploads logs && \
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
CMD ["node", "dist/server.js"]