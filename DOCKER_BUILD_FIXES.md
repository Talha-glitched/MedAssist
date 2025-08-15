# Docker Build Fixes

## Problem
The Docker builds were failing with the error:
```
sh: tsc: not found
```

This occurred because:
1. TypeScript (`tsc`) was in `devDependencies`
2. Docker builds were using `npm ci --only=production` which excludes dev dependencies
3. The build script `npm run build` requires TypeScript to compile the code

## Solution
Implemented multi-stage Docker builds for both backend and root Dockerfiles:

### Backend Dockerfile (`backend/Dockerfile`)
- **Build Stage**: Installs ALL dependencies (including dev dependencies)
- **Production Stage**: Installs only production dependencies and copies built files

### Root Dockerfile (`Dockerfile`)
- **Frontend Build Stage**: Installs all dependencies and builds React app
- **Backend Build Stage**: Installs all dependencies and builds TypeScript
- **Production Stage**: Installs only production dependencies and copies built files

## Key Changes

### 1. Backend Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine AS builder
# ... install ALL dependencies
RUN npm ci
# ... build TypeScript
RUN npm run build

# Production stage  
FROM node:18-alpine AS production
# ... install only production dependencies
RUN npm ci --only=production
# ... copy built files
COPY --from=builder /app/dist ./dist
```

### 2. Root Dockerfile
```dockerfile
# Frontend build stage
FROM node:18-alpine AS frontend-builder
RUN npm ci  # Install all dependencies
RUN npm run build

# Backend build stage
FROM node:18-alpine AS backend-builder
RUN npm ci  # Install all dependencies
RUN npm run build

# Production stage
FROM node:18-alpine AS production
# Install only production dependencies
RUN npm ci --only=production
# Copy built files from both stages
```

## Benefits
1. **Smaller Production Images**: Only production dependencies are included in final image
2. **Faster Builds**: Dependencies are cached in build stages
3. **Security**: Dev dependencies are not included in production
4. **TypeScript Support**: Full TypeScript compilation during build

## Testing
Use the provided test scripts:
- `test-docker-build.sh` (Linux/Mac)
- `test-docker-build.bat` (Windows)

These scripts will test all Docker builds and clean up test images.

## Deployment
The fixes ensure that:
- Render deployment will work correctly
- All TypeScript compilation happens during build
- Production images are optimized
- No dev dependencies leak into production

## Files Modified
- `backend/Dockerfile`
- `Dockerfile` (root)
- Added test scripts for verification
