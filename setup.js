#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up MediAssist...\n');

// Check if Node.js version is compatible
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion < 18) {
    console.error('❌ Node.js 18+ is required. Current version:', nodeVersion);
    process.exit(1);
}

console.log('✅ Node.js version:', nodeVersion);

// Create backend .env file if it doesn't exist
const backendEnvPath = path.join(__dirname, 'backend', '.env');
if (!fs.existsSync(backendEnvPath)) {
    const backendEnvContent = `# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/mediassist

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# AI Services Configuration (optional for development)
HUGGINGFACE_API_KEY=your-huggingface-api-key
HUGGINGFACE_STT_URL=https://api-inference.huggingface.co/models/openai/whisper-large-v3
HUGGINGFACE_NLP_URL=https://api-inference.huggingface.co/models/google/flan-t5-large
HUGGINGFACE_TRANSLATION_URL=https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-en-es

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Limits
MAX_FILE_SIZE=52428800
`;

    fs.writeFileSync(backendEnvPath, backendEnvContent);
    console.log('✅ Created backend/.env file');
} else {
    console.log('✅ Backend .env file already exists');
}

// Create frontend .env file if it doesn't exist
const frontendEnvPath = path.join(__dirname, 'frontend', '.env');
if (!fs.existsSync(frontendEnvPath)) {
    const frontendEnvContent = `# API Configuration
VITE_API_URL=http://localhost:5000/api

# App Configuration
VITE_APP_NAME=MediAssist
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG_MODE=false
`;

    fs.writeFileSync(frontendEnvPath, frontendEnvContent);
    console.log('✅ Created frontend/.env file');
} else {
    console.log('✅ Frontend .env file already exists');
}

// Install dependencies
console.log('\n📦 Installing dependencies...');

try {
    // Install root dependencies
    console.log('Installing root dependencies...');
    execSync('npm install', { stdio: 'inherit' });

    // Install frontend dependencies
    console.log('Installing frontend dependencies...');
    execSync('cd frontend && npm install', { stdio: 'inherit' });

    // Install backend dependencies
    console.log('Installing backend dependencies...');
    execSync('cd backend && npm install', { stdio: 'inherit' });

    console.log('\n✅ All dependencies installed successfully!');
} catch (error) {
    console.error('❌ Error installing dependencies:', error.message);
    process.exit(1);
}

// Check if MongoDB is running
console.log('\n🔍 Checking MongoDB connection...');
try {
    execSync('mongod --version', { stdio: 'pipe' });
    console.log('✅ MongoDB is installed');
    console.log('⚠️  Make sure MongoDB is running: mongod');
} catch (error) {
    console.log('⚠️  MongoDB not found. Please install MongoDB 6+');
    console.log('   Download from: https://www.mongodb.com/try/download/community');
}

console.log('\n🎉 Setup complete!');
console.log('\nNext steps:');
console.log('1. Start MongoDB: mongod');
console.log('2. Start the development servers: npm run dev');
console.log('3. Open http://localhost:3000 in your browser');
console.log('4. Use demo accounts:');
console.log('   - Doctor: doctor@demo.com / password123');
console.log('   - Patient: patient@demo.com / password123');
console.log('\nFor more information, see README.md');
