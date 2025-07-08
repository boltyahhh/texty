# VoiceInsight Frontend

A modern React application for real-time speech-to-text conversion with advanced emotion detection and sentiment analysis.

## 🚀 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/voice-insight&project-name=voice-insight&repository-name=voice-insight)

## 📋 Environment Variables

Before deploying, you'll need to set these environment variables in your Vercel dashboard:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Your backend API endpoint | `https://your-api.com` |
| `VITE_OPENAI_API_KEY` | OpenAI API key for AI responses | `sk-...` |

## 🛠️ Local Development

1. **Clone and install**
   ```bash
   cd frontend
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your values
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

## 🌐 Deployment Steps

### 1. Prepare Your Repository
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables:
   - `VITE_API_URL`: Your backend API URL
   - `VITE_OPENAI_API_KEY`: Your OpenAI API key
5. Click "Deploy"

### 3. Configure Custom Domain (Optional)
1. Go to your project settings in Vercel
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## 🔧 Build Configuration

The app is configured with:
- **Framework**: Vite + React + TypeScript
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: 18.x

## 📱 Features

- 🎙️ Real-time speech recording
- 📝 Speech-to-text conversion
- 😊 23 precise emotion detection
- 💭 Advanced sentiment analysis
- 🌍 Multi-language support
- 🤖 AI conversation partners
- 📊 Emotion analytics dashboard
- 🧘 Wellness recommendations

## 🛡️ Security

- HTTPS enforced
- Security headers configured
- Environment variables secured
- CORS properly configured

## 📞 Support

- 📧 Email: support@voiceinsight.com
- 💬 GitHub Issues: [Create an issue](https://github.com/your-username/voice-insight/issues)

---

Made with ❤️ using React, TypeScript, and Vite