# 🎤 VoiceInsight - AI-Powered Speech Analysis

A modern React application for real-time speech-to-text conversion with advanced emotion detection and sentiment analysis.

## ✨ Features

- **🎙️ Real-time Speech Recording** - Record audio directly in the browser
- **📝 Speech-to-Text** - Convert speech to text with high accuracy
- **😊 Emotion Detection** - Detect 23 precise emotions with confidence scores
- **💭 Sentiment Analysis** - Analyze positive, negative, and neutral sentiment
- **🌍 Multi-language Support** - Enhanced support for South Indian languages
- **🤖 AI Conversations** - Chat with AI personalities based on your emotions
- **📊 Analytics Dashboard** - Track emotional patterns over time
- **🧘 Wellness Features** - Get personalized wellness recommendations

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Modern web browser with microphone access

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API URL
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

## 🌐 Deployment

### Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Set environment variables in Vercel dashboard**
   - `VITE_API_URL`: Your backend API URL

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API endpoint | `https://api.example.com` |

## 🏗️ Architecture

```
Frontend (React + Vite)
├── 🎨 UI Components (Tailwind CSS)
├── 🎙️ Audio Recording (MediaRecorder API)
├── 📡 API Integration (Axios)
├── 🎭 State Management (React Hooks)
├── 📱 Responsive Design (Mobile-first)
└── ☁️ CloudWatch Metrics

Backend (FastAPI + AWS Lambda)
├── 🎤 Speech-to-Text (OpenAI Whisper)
├── 😊 Emotion Analysis (Transformers)
├── 💭 Sentiment Analysis (Multiple models)
├── 🌍 Language Detection
└── 📊 CloudWatch Integration
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Chart.js** - Data visualization
- **Axios** - HTTP client

### Backend
- **FastAPI** - Python web framework
- **OpenAI Whisper** - Speech-to-text
- **Transformers** - Emotion detection
- **AWS Lambda** - Serverless hosting
- **CloudWatch** - Monitoring

## 📱 Browser Support

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## 🔒 Privacy & Security

- **No data storage** - Audio is processed in real-time
- **HTTPS only** - Secure communication
- **CORS protection** - Controlled access
- **Client-side processing** - Sensitive data stays local

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- 📧 Email: support@voiceinsight.com
- 💬 Discord: [Join our community](https://discord.gg/voiceinsight)
- 📖 Docs: [Documentation](https://docs.voiceinsight.com)

---

Made with ❤️ by the VoiceInsight team