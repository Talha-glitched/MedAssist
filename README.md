# MediAssist - AI-Powered Healthcare Documentation Platform

MediAssist is a comprehensive healthcare documentation platform that leverages AI to automate medical note generation from audio consultations. The platform provides speech-to-text transcription, natural language processing for SOAP note generation, translation services, and text-to-speech capabilities.

## Features

- 🎤 **Audio Recording & Transcription**: Record medical consultations and convert to text
- 📝 **AI-Powered SOAP Notes**: Automatically generate structured medical notes
- 🌍 **Multi-language Support**: Translate medical summaries and notes
- 🔊 **Text-to-Speech**: Convert medical summaries to audio for patients
- 📊 **Analytics Dashboard**: Monitor usage, performance, and trends
- 🔐 **Role-based Access**: Separate interfaces for doctors and patients
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

### Backend
- **Node.js** with **TypeScript**
- **Express.js** for API server
- **MongoDB** with **Mongoose** for database
- **JWT** for authentication
- **Multer** for file uploads
- **Rate limiting** and security middleware

### Frontend
- **React 18** with **TypeScript**
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Hook Form** for form handling
- **Recharts** for data visualization
- **Lucide React** for icons

### AI Services
- **Speech-to-Text**: OpenAI Whisper (via Hugging Face)
- **Natural Language Processing**: Flan-T5 for SOAP note generation
- **Translation**: Helsinki-NLP models
- **Text-to-Speech**: Mock service (extensible to cloud providers)

## Prerequisites

- Node.js 18+ 
- MongoDB 6+
- npm or yarn

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd project
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install
```

### 3. Environment Setup

#### Backend Environment
Create `backend/.env` file:
```bash
# Server Configuration
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
```

#### Frontend Environment
Create `frontend/.env` file:
```bash
# API Configuration
VITE_API_URL=http://localhost:5000/api

# App Configuration
VITE_APP_NAME=MediAssist
VITE_APP_VERSION=1.0.0
```

### 4. Start MongoDB
```bash
# Start MongoDB service
mongod
```

### 5. Run the Application

#### Development Mode
```bash
# From root directory - runs both frontend and backend
npm run dev

# Or run separately:
# Backend only
npm run backend:dev

# Frontend only  
npm run frontend:dev
```

#### Production Build
```bash
# Build both frontend and backend
npm run build

# Start production server
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Audio Processing
- `POST /api/upload-audio` - Upload and process audio
- `GET /api/transcript/:id` - Get transcript
- `GET /api/transcript/:id/status` - Get processing status

### Medical Notes
- `POST /api/generate-notes` - Generate SOAP notes
- `GET /api/notes` - Get all notes
- `GET /api/notes/:id` - Get specific note
- `PUT /api/notes/:id` - Update note
- `GET /api/notes/:id/pdf` - Export as PDF

### Translation
- `POST /api/translate` - Translate text
- `GET /api/translate/languages` - Get supported languages

### Text-to-Speech
- `POST /api/tts` - Generate speech
- `GET /api/tts/voices` - Get available voices

### Analytics
- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/analytics/usage` - Usage statistics
- `GET /api/analytics/performance` - Performance metrics

## Demo Accounts

For testing purposes, the system includes demo accounts:

- **Doctor**: `doctor@demo.com` / `password123`
- **Patient**: `patient@demo.com` / `password123`

You can initialize these accounts by calling:
```bash
POST /api/auth/init-demo
```

## Project Structure

```
project/
├── backend/                 # Backend API server
│   ├── src/
│   │   ├── config/         # Database and app configuration
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # AI service integrations
│   │   └── server.ts       # Main server file
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service functions
│   │   └── main.tsx        # App entry point
│   ├── package.json
│   └── vite.config.ts
├── package.json            # Root package.json
└── README.md
```

## Development

### Code Style
- TypeScript strict mode enabled
- ESLint configuration for code quality
- Prettier for code formatting
- Tailwind CSS for styling

### Testing
```bash
# Run backend tests
cd backend && npm test

# Run frontend tests (when implemented)
cd frontend && npm test
```

### Database
The application uses MongoDB with the following collections:
- `users` - User accounts and profiles
- `transcripts` - Audio transcription data
- `medicalnotes` - Generated SOAP notes

### Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS configuration
- Input validation and sanitization
- Helmet.js for security headers

## Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Environment Variables
Make sure to set appropriate environment variables for production:
- Strong JWT secret
- MongoDB connection string
- AI service API keys
- CORS origins
- Rate limiting settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code examples

## Roadmap

- [ ] Real-time collaboration features
- [ ] Advanced AI model integration
- [ ] Mobile app development
- [ ] HIPAA compliance features
- [ ] Integration with EHR systems
- [ ] Advanced analytics and reporting