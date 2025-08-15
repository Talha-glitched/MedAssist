# MediAssist Deployment Guide

This guide provides comprehensive instructions for deploying the MediAssist healthcare documentation platform across different environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Deployment](#local-development-deployment)
3. [Production Deployment](#production-deployment)
4. [Cloud Deployment](#cloud-deployment)
5. [SSL Certificate Setup](#ssl-certificate-setup)
6. [Monitoring and Logging](#monitoring-and-logging)
7. [Backup and Recovery](#backup-and-recovery)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Operating System**: Linux, macOS, or Windows 10/11
- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **Memory**: Minimum 4GB RAM (8GB recommended for production)
- **Storage**: Minimum 10GB free space
- **Network**: Stable internet connection for AI services

### Required API Keys

For full functionality, you'll need the following API keys:

1. **Hugging Face API Key** (Required)
   - Sign up at: https://huggingface.co/
   - Get your API key from: https://huggingface.co/settings/tokens

2. **ElevenLabs API Key** (Optional - for TTS)
   - Sign up at: https://elevenlabs.io/
   - Get your API key from your account dashboard

3. **Google Cloud API Key** (Optional - for additional TTS)
   - Set up Google Cloud project
   - Enable Text-to-Speech API
   - Create API key

4. **Azure Translator Key** (Optional - for translation)
   - Set up Azure Cognitive Services
   - Create Translator resource
   - Get API key

## Local Development Deployment

### Quick Start (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/mediassist.git
   cd mediassist
   ```

2. **Make deployment script executable**
   ```bash
   chmod +x deploy.sh
   ```

3. **Deploy locally**
   ```bash
   ./deploy.sh local
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Grafana Dashboard: http://localhost:3001 (admin/admin123)
   - Prometheus: http://localhost:9090

### Manual Setup

1. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   cd ..
   ```

2. **Create environment files**
   ```bash
   # Backend environment
   cp backend/env.example backend/.env
   
   # Frontend environment
   cp frontend/env.example frontend/.env
   ```

3. **Update environment variables**
   - Edit `backend/.env` and add your API keys
   - Edit `frontend/.env` and set the API URL

4. **Start MongoDB**
   ```bash
   # Install MongoDB locally or use Docker
   docker run -d --name mongodb -p 27017:27017 mongo:7.0
   ```

5. **Start the application**
   ```bash
   # Development mode
   npm run dev
   
   # Or start separately
   npm run backend:dev
   npm run frontend:dev
   ```

## Production Deployment

### Using Docker Compose (Recommended)

1. **Create production environment file**
   ```bash
   ./deploy.sh production
   ```

2. **Update production configuration**
   ```bash
   # Edit .env.production with your production values
   nano .env.production
   ```

3. **Deploy to production**
   ```bash
   ./deploy.sh production
   ```

### Manual Production Setup

1. **Build production images**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
   ```

2. **Set production environment variables**
   ```bash
   export NODE_ENV=production
   export MONGODB_URI=mongodb://your-production-db
   export JWT_SECRET=your-super-secure-jwt-secret
   export HUGGINGFACE_API_KEY=your-api-key
   ```

3. **Start production services**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

### Production Configuration

#### Environment Variables

Create `.env.production` with the following:

```bash
# Application Configuration
NODE_ENV=production
APP_NAME=MediAssist
APP_VERSION=1.0.0

# Server Configuration
PORT=3000
API_PORT=5000

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mediassist
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=secure-password

# JWT Configuration
JWT_SECRET=your-super-secure-production-jwt-secret-minimum-32-characters
JWT_EXPIRE=7d

# Frontend Configuration
FRONTEND_URL=https://your-domain.com
VITE_API_URL=https://your-domain.com/api

# AI Services Configuration
HUGGINGFACE_API_KEY=your-huggingface-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key
GOOGLE_CLOUD_API_KEY=your-google-cloud-api-key
AZURE_TRANSLATOR_KEY=your-azure-translator-key

# Redis Configuration
REDIS_PASSWORD=secure-redis-password

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50
MAX_FILE_SIZE=52428800

# Monitoring Configuration
ENABLE_MONITORING=true
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=secure-grafana-password
GRAFANA_DOMAIN=your-domain.com
GRAFANA_ROOT_URL=https://your-domain.com/grafana
```

#### SSL Certificate Setup

1. **Generate SSL certificates**
   ```bash
   mkdir -p nginx/ssl
   cd nginx/ssl
   
   # Generate self-signed certificate (for testing)
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout key.pem -out cert.pem \
     -subj "/C=US/ST=State/L=City/O=Organization/CN=your-domain.com"
   ```

2. **For production, use Let's Encrypt**
   ```bash
   # Install certbot
   sudo apt-get install certbot
   
   # Get certificate
   sudo certbot certonly --standalone -d your-domain.com
   
   # Copy certificates
   sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
   sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
   ```

## Cloud Deployment

### AWS Deployment

1. **Prerequisites**
   ```bash
   # Install AWS CLI
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   
   # Configure AWS credentials
   aws configure
   ```

2. **Create ECR repository**
   ```bash
   aws ecr create-repository --repository-name mediassist
   ```

3. **Build and push images**
   ```bash
   # Get ECR login token
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account-id.dkr.ecr.us-east-1.amazonaws.com
   
   # Build and tag images
   docker build -t mediassist:latest .
   docker tag mediassist:latest your-account-id.dkr.ecr.us-east-1.amazonaws.com/mediassist:latest
   
   # Push to ECR
   docker push your-account-id.dkr.ecr.us-east-1.amazonaws.com/mediassist:latest
   ```

4. **Deploy to ECS**
   ```bash
   # Create ECS cluster
   aws ecs create-cluster --cluster-name mediassist-cluster
   
   # Create task definition
   aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json
   
   # Create service
   aws ecs create-service --cluster mediassist-cluster --service-name mediassist-service --task-definition mediassist:1
   ```

### Google Cloud Deployment

1. **Prerequisites**
   ```bash
   # Install Google Cloud SDK
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL
   gcloud init
   ```

2. **Enable required APIs**
   ```bash
   gcloud services enable container.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   ```

3. **Create GKE cluster**
   ```bash
   gcloud container clusters create mediassist-cluster \
     --zone us-central1-a \
     --num-nodes 3 \
     --machine-type e2-medium
   ```

4. **Deploy to GKE**
   ```bash
   # Build and push to Container Registry
   gcloud builds submit --tag gcr.io/your-project-id/mediassist
   
   # Deploy to GKE
   kubectl apply -f k8s/
   ```

### Azure Deployment

1. **Prerequisites**
   ```bash
   # Install Azure CLI
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   az login
   ```

2. **Create Azure Container Registry**
   ```bash
   az acr create --resource-group mediassist-rg --name mediassistacr --sku Basic
   ```

3. **Build and push images**
   ```bash
   # Login to ACR
   az acr login --name mediassistacr
   
   # Build and push
   docker build -t mediassistacr.azurecr.io/mediassist:latest .
   docker push mediassistacr.azurecr.io/mediassist:latest
   ```

4. **Deploy to Azure Container Instances**
   ```bash
   az container create \
     --resource-group mediassist-rg \
     --name mediassist-container \
     --image mediassistacr.azurecr.io/mediassist:latest \
     --dns-name-label mediassist-app \
     --ports 80 443
   ```

### DigitalOcean Deployment

1. **Create Droplet**
   ```bash
   # Using doctl CLI
   doctl compute droplet create mediassist-droplet \
     --size s-2vcpu-4gb \
     --image ubuntu-20-04-x64 \
     --region nyc1
   ```

2. **Install Docker on Droplet**
   ```bash
   ssh root@your-droplet-ip
   
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

3. **Deploy application**
   ```bash
   # Clone repository
   git clone https://github.com/your-username/mediassist.git
   cd mediassist
   
   # Deploy
   ./deploy.sh production
   ```

### Heroku Deployment

1. **Prerequisites**
   ```bash
   # Install Heroku CLI
   curl https://cli-assets.heroku.com/install.sh | sh
   heroku login
   ```

2. **Create Heroku app**
   ```bash
   heroku create mediassist-app
   ```

3. **Set environment variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI=your-mongodb-atlas-uri
   heroku config:set JWT_SECRET=your-jwt-secret
   heroku config:set HUGGINGFACE_API_KEY=your-api-key
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

## SSL Certificate Setup

### Let's Encrypt with Certbot

1. **Install Certbot**
   ```bash
   sudo apt-get update
   sudo apt-get install certbot
   ```

2. **Get SSL certificate**
   ```bash
   sudo certbot certonly --standalone -d your-domain.com
   ```

3. **Auto-renewal setup**
   ```bash
   # Test renewal
   sudo certbot renew --dry-run
   
   # Add to crontab
   echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
   ```

### Self-Signed Certificate (Development)

```bash
mkdir -p nginx/ssl
cd nginx/ssl

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout key.pem -out cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

## Monitoring and Logging

### Prometheus Configuration

Create `monitoring/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'mediassist-backend'
    static_configs:
      - targets: ['backend:5000']
    metrics_path: '/metrics'

  - job_name: 'mediassist-frontend'
    static_configs:
      - targets: ['frontend:80']
    metrics_path: '/metrics'

  - job_name: 'mongodb'
    static_configs:
      - targets: ['mongodb:27017']
    metrics_path: '/metrics'
```

### Grafana Dashboards

1. **Access Grafana**
   - URL: http://localhost:3001 (or your domain/grafana)
   - Username: admin
   - Password: admin123

2. **Import dashboards**
   - Import the provided dashboard JSON files
   - Configure data sources (Prometheus, MongoDB)

### Log Management

1. **View logs**
   ```bash
   # All services
   docker-compose logs -f
   
   # Specific service
   docker-compose logs -f backend
   docker-compose logs -f frontend
   ```

2. **Log rotation**
   ```bash
   # Configure log rotation in docker-compose.yml
   logging:
     driver: "json-file"
     options:
       max-size: "10m"
       max-file: "3"
   ```

## Backup and Recovery

### Database Backup

1. **Create backup script**
   ```bash
   # Create backup directory
   mkdir -p backups
   
   # Backup MongoDB
   docker-compose exec mongodb mongodump --out /data/backup
   docker cp mediassist-mongodb:/data/backup backups/$(date +%Y%m%d_%H%M%S)
   ```

2. **Automated backup**
   ```bash
   # Add to crontab
   echo "0 2 * * * /path/to/mediassist/backup.sh" | crontab -
   ```

### Application Backup

1. **Backup configuration**
   ```bash
   tar -czf mediassist-config-$(date +%Y%m%d).tar.gz \
     .env* docker-compose*.yml nginx/ monitoring/
   ```

2. **Backup uploads**
   ```bash
   tar -czf mediassist-uploads-$(date +%Y%m%d).tar.gz \
     backend/uploads/
   ```

### Recovery Procedures

1. **Database recovery**
   ```bash
   # Stop services
   docker-compose down
   
   # Restore database
   docker cp backups/20231201_120000 mediassist-mongodb:/data/restore
   docker-compose exec mongodb mongorestore /data/restore
   
   # Start services
   docker-compose up -d
   ```

2. **Configuration recovery**
   ```bash
   # Extract backup
   tar -xzf mediassist-config-20231201.tar.gz
   
   # Restart services
   docker-compose down
   docker-compose up -d
   ```

## Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check port usage
   netstat -tulpn | grep :3000
   netstat -tulpn | grep :5000
   
   # Kill process using port
   sudo kill -9 <PID>
   ```

2. **Docker permission issues**
   ```bash
   # Add user to docker group
   sudo usermod -aG docker $USER
   newgrp docker
   ```

3. **MongoDB connection issues**
   ```bash
   # Check MongoDB status
   docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"
   
   # Check logs
   docker-compose logs mongodb
   ```

4. **API key issues**
   ```bash
   # Test API key
   curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api-inference.huggingface.co/models/openai/whisper-large-v3
   ```

### Performance Optimization

1. **Resource limits**
   ```bash
   # Monitor resource usage
   docker stats
   
   # Adjust resource limits in docker-compose.yml
   deploy:
     resources:
       limits:
         memory: 1G
         cpus: '0.5'
   ```

2. **Database optimization**
   ```bash
   # Create indexes
   docker-compose exec mongodb mongosh --eval "
     db.medicalnotes.createIndex({doctorId: 1, createdAt: -1});
     db.users.createIndex({email: 1}, {unique: true});
   "
   ```

3. **Caching**
   ```bash
   # Enable Redis caching
   # Configure in backend services
   ```

### Security Hardening

1. **Update secrets**
   ```bash
   # Generate secure JWT secret
   openssl rand -base64 32
   
   # Update environment variables
   JWT_SECRET=your-generated-secret
   ```

2. **Network security**
   ```bash
   # Configure firewall
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

3. **SSL/TLS configuration**
   ```bash
   # Update SSL configuration in nginx.conf
   ssl_protocols TLSv1.2 TLSv1.3;
   ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
   ```

## Support

For additional support:

- **Documentation**: Check the [README.md](README.md)
- **Issues**: Create an issue on GitHub
- **Discussions**: Join GitHub Discussions
- **Wiki**: Check the project wiki for detailed guides

## Maintenance

### Regular Maintenance Tasks

1. **Update dependencies**
   ```bash
   # Update npm packages
   npm update
   cd frontend && npm update
   cd ../backend && npm update
   ```

2. **Update Docker images**
   ```bash
   # Pull latest images
   docker-compose pull
   
   # Rebuild with latest images
   docker-compose up --build -d
   ```

3. **Clean up resources**
   ```bash
   # Remove unused containers
   docker container prune
   
   # Remove unused images
   docker image prune
   
   # Remove unused volumes
   docker volume prune
   ```

4. **Monitor disk space**
   ```bash
   # Check disk usage
   df -h
   
   # Clean up logs
   sudo journalctl --vacuum-time=7d
   ```

This deployment guide covers all major deployment scenarios. Choose the method that best fits your requirements and infrastructure.
