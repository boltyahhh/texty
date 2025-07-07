# 🚀 Deploy VoiceInsight to Vercel

This guide will help you deploy your VoiceInsight frontend to Vercel with full backend functionality.

## 📋 Prerequisites

- ✅ Backend deployed to AWS Lambda
- ✅ GitHub repository with your code
- ✅ Vercel account (free)

## 🎯 Quick Deploy

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/voice-insight&env=VITE_API_URL&envDescription=AWS%20Lambda%20API%20endpoint)

### Option 2: Manual Deploy

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your repository

3. **Configure Environment Variables**
   ```
   VITE_API_URL = https://1treu6p055.execute-api.us-east-1.amazonaws.com/prod
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app is live! 🎉

## ⚙️ Configuration

### Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_URL` | `https://1treu6p055.execute-api.us-east-1.amazonaws.com/prod` | Your AWS Lambda API endpoint |

### Build Settings

Vercel automatically detects these settings:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## 🔧 Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## 📊 Monitoring

Your deployed app includes:

- ✅ **Real-time API status** monitoring
- ✅ **CloudWatch metrics** integration
- ✅ **Error tracking** and logging
- ✅ **Performance monitoring**

## 🐛 Troubleshooting

### Common Issues

**Build Fails**
```bash
# Check your package.json scripts
npm run build
```

**API Connection Issues**
- Verify `VITE_API_URL` is set correctly
- Check AWS Lambda is running
- Ensure CORS is configured

**Environment Variables Not Working**
- Variables must start with `VITE_`
- Redeploy after changing variables
- Check Vercel dashboard settings

### Debug Commands

```bash
# Test build locally
npm run build
npm run preview

# Check environment variables
echo $VITE_API_URL
```

## 🚀 Next Steps

1. **Test your deployment** - Try recording audio and analyzing emotions
2. **Monitor performance** - Check Vercel Analytics
3. **Set up alerts** - Configure CloudWatch alarms
4. **Share your app** - Send the Vercel URL to users

## 📞 Support

- 📧 **Email**: support@voiceinsight.com
- 💬 **Discord**: [Join our community](https://discord.gg/voiceinsight)
- 📖 **Docs**: [Full documentation](https://docs.voiceinsight.com)

---

🎉 **Congratulations!** Your VoiceInsight app is now live on Vercel!