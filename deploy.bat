@echo off
setlocal enabledelayedexpansion

REM MediAssist Deployment Script for Windows
REM This script provides deployment options for the MediAssist platform

set PROJECT_NAME=mediassist
set DEFAULT_PORT=3000
set DEFAULT_API_PORT=5000

REM Function to print colored output
:print_status
echo [INFO] %~1
goto :eof

:print_warning
echo [WARNING] %~1
goto :eof

:print_error
echo [ERROR] %~1
goto :eof

:print_header
echo ================================
echo %~1
echo ================================
goto :eof

REM Function to check prerequisites
:check_prerequisites
call :print_header "Checking Prerequisites"

REM Check Docker
docker --version >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker is not installed. Please install Docker Desktop first."
    exit /b 1
)
for /f "tokens=*" %%i in ('docker --version') do call :print_status "Docker is installed: %%i"

REM Check Docker Compose
docker-compose --version >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit /b 1
)
for /f "tokens=*" %%i in ('docker-compose --version') do call :print_status "Docker Compose is installed: %%i"

REM Check if .env file exists
if not exist ".env" (
    call :print_warning ".env file not found. Creating from template..."
    call :create_env_file
)

call :print_status "All prerequisites are satisfied!"
goto :eof

REM Function to create .env file
:create_env_file
(
echo # MediAssist Environment Configuration
echo.
echo # Application Configuration
echo NODE_ENV=production
echo APP_NAME=MediAssist
echo APP_VERSION=1.0.0
echo.
echo # Server Configuration
echo PORT=%DEFAULT_PORT%
echo API_PORT=%DEFAULT_API_PORT%
echo.
echo # Database Configuration
echo MONGODB_URI=mongodb://admin:password123@mongodb:27017/mediassist?authSource=admin
echo MONGODB_LOCAL_URI=mongodb://localhost:27017/mediassist
echo.
echo # JWT Configuration
echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
echo JWT_EXPIRE=7d
echo.
echo # Frontend Configuration
echo FRONTEND_URL=http://localhost:3000
echo VITE_API_URL=http://localhost:5000/api
echo.
echo # AI Services Configuration
echo HUGGINGFACE_API_KEY=your-huggingface-api-key
echo HUGGINGFACE_STT_URL=https://api-inference.huggingface.co/models/openai/whisper-large-v3
echo HUGGINGFACE_NLP_URL=https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium
echo HUGGINGFACE_TRANSLATION_URL=https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-en-es
echo.
echo # Optional AI Services
echo ELEVENLABS_API_KEY=your-elevenlabs-api-key
echo GOOGLE_CLOUD_API_KEY=your-google-cloud-api-key
echo AZURE_TRANSLATOR_KEY=your-azure-translator-key
echo.
echo # Redis Configuration
echo REDIS_URL=redis://redis:6379
echo.
echo # Security Configuration
echo RATE_LIMIT_WINDOW_MS=900000
echo RATE_LIMIT_MAX_REQUESTS=100
echo MAX_FILE_SIZE=52428800
echo.
echo # Monitoring Configuration
echo ENABLE_MONITORING=true
echo PROMETHEUS_PORT=9090
echo GRAFANA_PORT=3001
) > .env

call :print_status "Created .env file. Please update the configuration values."
goto :eof

REM Function to deploy locally with Docker
:deploy_local
call :print_header "Deploying MediAssist Locally"

call :print_status "Building and starting containers..."
docker-compose up --build -d

call :print_status "Waiting for services to start..."
timeout /t 30 /nobreak >nul

REM Check if services are running
docker-compose ps | findstr "Up" >nul
if errorlevel 1 (
    call :print_error "Some services failed to start. Check logs with: docker-compose logs"
    exit /b 1
) else (
    call :print_status "Services are running successfully!"
    call :print_status "Frontend: http://localhost:3000"
    call :print_status "Backend API: http://localhost:5000"
    call :print_status "Grafana Dashboard: http://localhost:3001 (admin/admin123)"
    call :print_status "Prometheus: http://localhost:9090"
)
goto :eof

REM Function to deploy to production
:deploy_production
call :print_header "Deploying MediAssist to Production"

REM Check if production .env exists
if not exist ".env.production" (
    call :print_error "Production environment file (.env.production) not found."
    call :print_status "Please create .env.production with production configuration."
    exit /b 1
)

call :print_status "Using production configuration..."

call :print_status "Building and starting production containers..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

call :print_status "Production deployment completed!"
goto :eof

REM Function to stop services
:stop_services
call :print_header "Stopping MediAssist Services"

docker-compose down

call :print_status "Services stopped successfully!"
goto :eof

REM Function to view logs
:view_logs
call :print_header "Viewing Service Logs"

echo Select service to view logs:
echo 1) All services
echo 2) Frontend
echo 3) Backend
echo 4) Database
echo 5) Nginx

set /p log_choice="Enter your choice (1-5): "

if "%log_choice%"=="1" (
    docker-compose logs -f
) else if "%log_choice%"=="2" (
    docker-compose logs -f frontend
) else if "%log_choice%"=="3" (
    docker-compose logs -f backend
) else if "%log_choice%"=="4" (
    docker-compose logs -f mongodb
) else if "%log_choice%"=="5" (
    docker-compose logs -f nginx
) else (
    call :print_error "Invalid choice"
    exit /b 1
)
goto :eof

REM Function to show status
:show_status
call :print_header "MediAssist Service Status"

docker-compose ps

echo.
call :print_status "Service URLs:"
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5000
echo Grafana: http://localhost:3001
echo Prometheus: http://localhost:9090
goto :eof

REM Function to show help
:show_help
call :print_header "MediAssist Deployment Script Help"

echo Usage: %0 [COMMAND]
echo.
echo Commands:
echo   local       Deploy locally using Docker Compose
echo   production  Deploy to production environment
echo   stop        Stop all services
echo   logs        View service logs
echo   status      Show service status
echo   help        Show this help message
echo.
echo Examples:
echo   %0 local        # Deploy locally
echo   %0 production   # Deploy to production
echo   %0 logs         # View logs
echo.
goto :eof

REM Main script logic
if "%1"=="" goto show_help
if "%1"=="help" goto show_help
if "%1"=="--help" goto show_help
if "%1"=="-h" goto show_help

if "%1"=="local" (
    call :check_prerequisites
    call :deploy_local
) else if "%1"=="production" (
    call :check_prerequisites
    call :deploy_production
) else if "%1"=="stop" (
    call :stop_services
) else if "%1"=="logs" (
    call :view_logs
) else if "%1"=="status" (
    call :show_status
) else (
    call :print_error "Unknown command: %1"
    call :show_help
    exit /b 1
)

endlocal
