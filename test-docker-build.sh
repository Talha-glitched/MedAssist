#!/bin/bash

echo "Testing Docker builds..."

# Test backend build
echo "Building backend..."
cd backend
docker build -t mediassist-backend-test .
if [ $? -eq 0 ]; then
    echo "✅ Backend build successful"
else
    echo "❌ Backend build failed"
    exit 1
fi
cd ..

# Test frontend build
echo "Building frontend..."
cd frontend
docker build -t mediassist-frontend-test .
if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi
cd ..

# Test root build
echo "Building root application..."
docker build -t mediassist-root-test .
if [ $? -eq 0 ]; then
    echo "✅ Root build successful"
else
    echo "❌ Root build failed"
    exit 1
fi

echo "🎉 All Docker builds successful!"
echo "Cleaning up test images..."
docker rmi mediassist-backend-test mediassist-frontend-test mediassist-root-test

echo "✅ Docker build test completed successfully"
