# 🚀 Vercel Deployment Guide

This guide will help you deploy VoiceInsight to Vercel in minutes.

## 📋 Prerequisites

- GitHub account
- Vercel account (free)
- OpenAI API key
- Backend API deployed (optional for frontend-only features)

## 🎯 One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/voice-insight&project-name=voice-insight&repository-name=voice-insight&env=VITE_API_URL,VITE_OPENAI_API_KEY&envDescription=API%20endpoint%20and%20OpenAI%20key&envLink=https://github.com/your-username/voice-insight#environment-variables)

## 📝 Manual Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2. Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your repository
5. Select the `frontend` folder as root directory

### 3. Configure Environment Variables

In your Vercel project settings, add these environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_URL` | `https://your-backend-api.com` | Your backend API endpoint |
| `VITE_OPENAI_API_KEY` | `sk-proj-...` | Your OpenAI API key |

### 4. Deploy
Click "Deploy" and wait for the build to complete.

## ⚙️ Build Settings

Vercel will automatically detect these settings:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Node.js Version**: 18.x

## 🔧 Custom Configuration

### Domain Setup
1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

### Environment Variables
- Set in Vercel Dashboard → Project → Settings → Environment Variables
- Variables starting with `VITE_` are exposed to the browser
- Keep sensitive keys secure

### Build Optimization
The app includes:
- Code splitting for better performance
- Optimized bundle sizes
- Source map generation disabled for production
- Vendor chunk separation

## 🛡️ Security Features

- Security headers configured
- HTTPS enforced
- XSS protection enabled
- Content type sniffing disabled
- Frame options set to DENY

## 📊 Monitoring

After deployment, you can monitor:
- Build logs in Vercel dashboard
- Runtime logs for serverless functions
- Performance metrics
- Error tracking

## 🐛 Troubleshooting

### Build Fails
```bash
# Test build locally
npm run build
npm run preview
```

### Environment Variables Not Working
- Ensure variables start with `VITE_`
- Redeploy after changing variables
- Check Vercel dashboard settings

### API Connection Issues
- Verify `VITE_API_URL` is correct
- Check CORS configuration on backend
- Ensure backend is accessible from browser

### OpenAI Integration Issues
- Verify `VITE_OPENAI_API_KEY` is set
- Check API key permissions
- Monitor usage limits

## 🚀 Next Steps

1. **Test your deployment** - Try all features
2. **Set up monitoring** - Configure alerts
3. **Optimize performance** - Use Vercel Analytics
4. **Scale as needed** - Upgrade plan if necessary

## 📞 Support

- 📧 **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- 📖 **Documentation**: [vercel.com/docs](https://vercel.com/docs)
- 💬 **Community**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)

---

🎉 **Congratulations!** Your VoiceInsight app is now live on Vercel!