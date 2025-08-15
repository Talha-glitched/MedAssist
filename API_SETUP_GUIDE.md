# 🚀 API Setup Guide for Real AI Services

## Required API Keys for Production Use

Your MediAssist app is now configured to use **real AI services** instead of mock data. You need to obtain the following API keys:

### 1. 🔑 Hugging Face API Key (Required for STT & NLP)

**Get it here:** https://huggingface.co/settings/tokens

1. Go to https://huggingface.co/
2. Create an account or sign in
3. Go to Settings → Access Tokens
4. Click "New token"
5. Give it a name like "MediAssist"
6. Select "Read" permissions
7. Copy the generated token

**Cost:** Free tier available (limited requests per month)

### 2. 🎤 ElevenLabs API Key (Optional for TTS)

**Get it here:** https://elevenlabs.io/

1. Go to https://elevenlabs.io/
2. Sign up for free account
3. Go to Profile → API Key
4. Copy your API key

**Cost:** Free tier available (10,000 characters per month)

### 3. 🌐 Google Translate API Key (Optional for Translation)

**Get it here:** https://console.cloud.google.com/

1. Go to Google Cloud Console
2. Create a new project or select existing
3. Enable the "Cloud Translation API"
4. Go to APIs & Services → Credentials
5. Create API Key
6. Restrict the key to "Cloud Translation API"

**Cost:** $20 per million characters (very affordable)

## 📝 Environment Configuration

Create a `.env` file in your `backend` folder with these settings:

```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/mediassist

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# AI Services Configuration (REQUIRED)
HUGGINGFACE_API_KEY=hf_your_actual_api_key_here
HUGGINGFACE_STT_URL=https://api-inference.huggingface.co/models/openai/whisper-large-v3
HUGGINGFACE_NLP_URL=https://api-inference.huggingface.co/models/facebook/bart-large-cnn

# Translation Services (Optional)
GOOGLE_TRANSLATE_API_KEY=your-google-translate-api-key
GOOGLE_TRANSLATE_URL=https://translation.googleapis.com/language/translate/v2

# TTS Service Configuration (Optional)
ELEVENLABS_API_KEY=your-elevenlabs-api-key
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ENABLE_RATE_LIMITING=true

# File Upload Limits
MAX_FILE_SIZE=52428800
```

## 🧪 Testing Your Setup

1. **Start your backend server:**
   ```bash
   cd backend
   npm start
   ```

2. **Upload an audio file** through the frontend

3. **Expected output:**
   ```
   STT Processing: { useMockService: false, hasAPIKey: true, fileSize: 143129 }
   Sending audio to Whisper API: { url: 'https://api-inference.huggingface.co/models/openai/whisper-large-v3' }
   NLP Processing: { useMockService: false, hasAPIKey: true, transcriptLength: 646 }
   Using real NLP model: https://api-inference.huggingface.co/models/facebook/bart-large-cnn
   ```

## 🎯 What You'll Get

✅ **Real Speech-to-Text** - Your actual audio converted to text
✅ **Real SOAP Notes** - AI-generated medical notes from your transcript
✅ **Real Patient Summaries** - Simplified versions for patients
✅ **Real Translation** - Medical text translated to other languages
✅ **Real Text-to-Speech** - Audio versions of patient summaries

## 💰 Cost Estimates

- **Hugging Face:** Free tier (limited requests) or $9/month for more
- **ElevenLabs:** Free tier (10K characters) or $22/month for more
- **Google Translate:** $20 per million characters (very cheap)

## 🚨 Troubleshooting

If you get errors:

1. **"HUGGINGFACE_API_KEY is required"** - Add your API key to `.env`
2. **"Request failed with status code 401"** - Check your API key is correct
3. **"Request failed with status code 429"** - You've hit rate limits, wait or upgrade

## 🔄 Next Steps

1. Get your Hugging Face API key (required)
2. Update your `.env` file
3. Restart your backend server
4. Test with a real audio file
5. Enjoy real AI-powered medical notes! 🎉
