@echo off
echo Testing Docker builds...

REM Test backend build
echo Building backend...
cd backend
docker build -t mediassist-backend-test .
if %errorlevel% neq 0 (
    echo ❌ Backend build failed
    exit /b 1
)
echo ✅ Backend build successful
cd ..

REM Test frontend build
echo Building frontend...
cd frontend
docker build -t mediassist-frontend-test .
if %errorlevel% neq 0 (
    echo ❌ Frontend build failed
    exit /b 1
)
echo ✅ Frontend build successful
cd ..

REM Test root build
echo Building root application...
docker build -t mediassist-root-test .
if %errorlevel% neq 0 (
    echo ❌ Root build failed
    exit /b 1
)
echo ✅ Root build successful

echo 🎉 All Docker builds successful!
echo Cleaning up test images...
docker rmi mediassist-backend-test mediassist-frontend-test mediassist-root-test

echo ✅ Docker build test completed successfully
