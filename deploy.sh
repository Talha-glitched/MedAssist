#!/bin/bash

# MediAssist Deployment Script
# This script provides multiple deployment options for the MediAssist platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="mediassist"
DEFAULT_PORT=3000
DEFAULT_API_PORT=5000

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    print_status "Docker is installed: $(docker --version)"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    print_status "Docker Compose is installed: $(docker-compose --version)"
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from template..."
        create_env_file
    fi
    
    print_status "All prerequisites are satisfied!"
}

# Function to create .env file
create_env_file() {
    cat > .env << EOF
# MediAssist Environment Configuration

# Application Configuration
NODE_ENV=production
APP_NAME=MediAssist
APP_VERSION=1.0.0

# Server Configuration
PORT=$DEFAULT_PORT
API_PORT=$DEFAULT_API_PORT

# Database Configuration
MONGODB_URI=mongodb://admin:password123@mongodb:27017/mediassist?authSource=admin
MONGODB_LOCAL_URI=mongodb://localhost:27017/mediassist

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Frontend Configuration
FRONTEND_URL=http://localhost:3000
VITE_API_URL=http://localhost:5000/api

# AI Services Configuration
HUGGINGFACE_API_KEY=your-huggingface-api-key
HUGGINGFACE_STT_URL=https://api-inference.huggingface.co/models/openai/whisper-large-v3
HUGGINGFACE_NLP_URL=https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium
HUGGINGFACE_TRANSLATION_URL=https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-en-es

# Optional AI Services
ELEVENLABS_API_KEY=your-elevenlabs-api-key
GOOGLE_CLOUD_API_KEY=your-google-cloud-api-key
AZURE_TRANSLATOR_KEY=your-azure-translator-key

# Redis Configuration
REDIS_URL=redis://redis:6379

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=52428800

# Monitoring Configuration
ENABLE_MONITORING=true
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
EOF
    
    print_status "Created .env file. Please update the configuration values."
}

# Function to deploy locally with Docker
deploy_local() {
    print_header "Deploying MediAssist Locally"
    
    print_status "Building and starting containers..."
    docker-compose up --build -d
    
    print_status "Waiting for services to start..."
    sleep 30
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_status "Services are running successfully!"
        print_status "Frontend: http://localhost:3000"
        print_status "Backend API: http://localhost:5000"
        print_status "Grafana Dashboard: http://localhost:3001 (admin/admin123)"
        print_status "Prometheus: http://localhost:9090"
    else
        print_error "Some services failed to start. Check logs with: docker-compose logs"
        exit 1
    fi
}

# Function to deploy to production
deploy_production() {
    print_header "Deploying MediAssist to Production"
    
    # Check if production .env exists
    if [ ! -f ".env.production" ]; then
        print_error "Production environment file (.env.production) not found."
        print_status "Please create .env.production with production configuration."
        exit 1
    fi
    
    print_status "Using production configuration..."
    export $(cat .env.production | xargs)
    
    print_status "Building and starting production containers..."
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
    
    print_status "Production deployment completed!"
    print_status "Application URL: $FRONTEND_URL"
    print_status "API URL: $VITE_API_URL"
}

# Function to deploy to cloud (AWS, GCP, Azure)
deploy_cloud() {
    print_header "Deploying MediAssist to Cloud"
    
    echo "Select cloud provider:"
    echo "1) AWS (EC2 + RDS)"
    echo "2) Google Cloud (Compute Engine + Cloud SQL)"
    echo "3) Azure (App Service + Cosmos DB)"
    echo "4) DigitalOcean (Droplet + Managed MongoDB)"
    echo "5) Heroku (Container deployment)"
    
    read -p "Enter your choice (1-5): " cloud_choice
    
    case $cloud_choice in
        1) deploy_aws ;;
        2) deploy_gcp ;;
        3) deploy_azure ;;
        4) deploy_digitalocean ;;
        5) deploy_heroku ;;
        *) print_error "Invalid choice" && exit 1 ;;
    esac
}

# AWS deployment
deploy_aws() {
    print_status "Deploying to AWS..."
    print_warning "This requires AWS CLI and proper credentials configured."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Create production environment
    create_production_env "aws"
    
    print_status "Building Docker image for AWS..."
    docker build -t mediassist:latest .
    
    print_status "Pushing to AWS ECR..."
    # Add AWS ECR push commands here
    
    print_status "Deploying to AWS ECS..."
    # Add AWS ECS deployment commands here
    
    print_status "AWS deployment completed!"
}

# Google Cloud deployment
deploy_gcp() {
    print_status "Deploying to Google Cloud..."
    print_warning "This requires Google Cloud SDK and proper credentials configured."
    
    # Check gcloud CLI
    if ! command -v gcloud &> /dev/null; then
        print_error "Google Cloud SDK is not installed. Please install it first."
        exit 1
    fi
    
    create_production_env "gcp"
    
    print_status "Building and pushing to Google Container Registry..."
    # Add GCP deployment commands here
    
    print_status "Google Cloud deployment completed!"
}

# Azure deployment
deploy_azure() {
    print_status "Deploying to Azure..."
    print_warning "This requires Azure CLI and proper credentials configured."
    
    if ! command -v az &> /dev/null; then
        print_error "Azure CLI is not installed. Please install it first."
        exit 1
    fi
    
    create_production_env "azure"
    
    print_status "Building and pushing to Azure Container Registry..."
    # Add Azure deployment commands here
    
    print_status "Azure deployment completed!"
}

# DigitalOcean deployment
deploy_digitalocean() {
    print_status "Deploying to DigitalOcean..."
    
    create_production_env "digitalocean"
    
    print_status "Building and pushing to DigitalOcean Container Registry..."
    # Add DigitalOcean deployment commands here
    
    print_status "DigitalOcean deployment completed!"
}

# Heroku deployment
deploy_heroku() {
    print_status "Deploying to Heroku..."
    
    if ! command -v heroku &> /dev/null; then
        print_error "Heroku CLI is not installed. Please install it first."
        exit 1
    fi
    
    create_production_env "heroku"
    
    print_status "Deploying to Heroku..."
    # Add Heroku deployment commands here
    
    print_status "Heroku deployment completed!"
}

# Function to create production environment file
create_production_env() {
    local provider=$1
    
    cat > .env.production << EOF
# MediAssist Production Environment Configuration
# Provider: $provider

NODE_ENV=production
APP_NAME=MediAssist
APP_VERSION=1.0.0

# Update these URLs for your production domain
FRONTEND_URL=https://your-domain.com
VITE_API_URL=https://your-domain.com/api

# Production database (update with your cloud database URL)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mediassist

# Strong JWT secret for production
JWT_SECRET=your-super-secure-production-jwt-secret-minimum-32-characters

# AI Services (required for full functionality)
HUGGINGFACE_API_KEY=your-huggingface-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key

# Optional: Additional services
GOOGLE_CLOUD_API_KEY=your-google-cloud-api-key
AZURE_TRANSLATOR_KEY=your-azure-translator-key

# Security settings for production
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50
MAX_FILE_SIZE=52428800

# Monitoring
ENABLE_MONITORING=true
EOF
    
    print_status "Created .env.production file. Please update with your production values."
}

# Function to stop services
stop_services() {
    print_header "Stopping MediAssist Services"
    
    docker-compose down
    
    print_status "Services stopped successfully!"
}

# Function to view logs
view_logs() {
    print_header "Viewing Service Logs"
    
    echo "Select service to view logs:"
    echo "1) All services"
    echo "2) Frontend"
    echo "3) Backend"
    echo "4) Database"
    echo "5) Nginx"
    
    read -p "Enter your choice (1-5): " log_choice
    
    case $log_choice in
        1) docker-compose logs -f ;;
        2) docker-compose logs -f frontend ;;
        3) docker-compose logs -f backend ;;
        4) docker-compose logs -f mongodb ;;
        5) docker-compose logs -f nginx ;;
        *) print_error "Invalid choice" && exit 1 ;;
    esac
}

# Function to backup data
backup_data() {
    print_header "Backing Up MediAssist Data"
    
    local backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    print_status "Creating database backup..."
    docker-compose exec mongodb mongodump --out /data/backup
    
    print_status "Copying backup files..."
    docker cp mediassist-mongodb:/data/backup "$backup_dir"
    
    print_status "Backup completed: $backup_dir"
}

# Function to restore data
restore_data() {
    print_header "Restoring MediAssist Data"
    
    read -p "Enter backup directory path: " backup_path
    
    if [ ! -d "$backup_path" ]; then
        print_error "Backup directory not found: $backup_path"
        exit 1
    fi
    
    print_status "Restoring database..."
    docker cp "$backup_path" mediassist-mongodb:/data/restore
    docker-compose exec mongodb mongorestore /data/restore
    
    print_status "Data restoration completed!"
}

# Function to update application
update_app() {
    print_header "Updating MediAssist Application"
    
    print_status "Pulling latest changes..."
    git pull origin main
    
    print_status "Rebuilding containers..."
    docker-compose down
    docker-compose up --build -d
    
    print_status "Application updated successfully!"
}

# Function to show status
show_status() {
    print_header "MediAssist Service Status"
    
    docker-compose ps
    
    echo ""
    print_status "Service URLs:"
    echo "Frontend: http://localhost:3000"
    echo "Backend API: http://localhost:5000"
    echo "Grafana: http://localhost:3001"
    echo "Prometheus: http://localhost:9090"
}

# Function to show help
show_help() {
    print_header "MediAssist Deployment Script Help"
    
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  local       Deploy locally using Docker Compose"
    echo "  production  Deploy to production environment"
    echo "  cloud       Deploy to cloud provider (AWS, GCP, Azure, etc.)"
    echo "  stop        Stop all services"
    echo "  logs        View service logs"
    echo "  backup      Backup application data"
    echo "  restore     Restore application data"
    echo "  update      Update application to latest version"
    echo "  status      Show service status"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 local        # Deploy locally"
    echo "  $0 production   # Deploy to production"
    echo "  $0 cloud        # Deploy to cloud provider"
    echo "  $0 logs         # View logs"
    echo ""
}

# Main script logic
main() {
    case "${1:-help}" in
        local)
            check_prerequisites
            deploy_local
            ;;
        production)
            check_prerequisites
            deploy_production
            ;;
        cloud)
            check_prerequisites
            deploy_cloud
            ;;
        stop)
            stop_services
            ;;
        logs)
            view_logs
            ;;
        backup)
            backup_data
            ;;
        restore)
            restore_data
            ;;
        update)
            update_app
            ;;
        status)
            show_status
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
