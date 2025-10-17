# Render Deployment Guide for AInspect Backend

## Prerequisites
- GitHub repository with your backend code
- Render account (free tier available)

## Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Connect your GitHub account

## Step 2: Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select the `ainspect-backend` repository

## Step 3: Configure Web Service
- **Name**: `ainspect-backend`
- **Environment**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Plan**: `Free` (or `Starter` for production)

## Step 4: Create PostgreSQL Database
1. Click "New +" → "PostgreSQL"
2. **Name**: `ainspect-database`
3. **Plan**: `Free` (or `Starter` for production)
4. **Database Name**: `ainspect`
5. **User**: `ainspect_user`

## Step 5: Configure Environment Variables
In your web service settings, add these environment variables:

### Required Variables:
```
NODE_ENV=production
PORT=10000
DATABASE_URL=<provided by Render PostgreSQL service>
JWT_SECRET=<generate a strong secret key>
```

### Optional Variables (add as needed):
```
CORS_ORIGIN=https://your-frontend-domain.com
ANTHROPIC_API_KEY=<if using AI features>
OPENAI_API_KEY=<if using AI features>
GOOGLE_CLOUD_PROJECT_ID=<if using Google Cloud>
```

## Step 6: Deploy
1. Click "Create Web Service"
2. Render will automatically build and deploy your backend
3. Wait for deployment to complete (usually 2-5 minutes)

## Step 7: Test Deployment
1. Your backend will be available at: `https://ainspect-backend.onrender.com`
2. Test the health endpoint: `https://ainspect-backend.onrender.com/api/health`
3. Update your frontend to use the new backend URL

## Step 8: Database Setup
1. After deployment, you may need to run database migrations
2. Use Render's shell feature or add a migration script
3. Run: `npm run db:push` (if you have Drizzle migrations)

## Troubleshooting

### Common Issues:
1. **Build Fails**: Check that all dependencies are in package.json
2. **Database Connection**: Verify DATABASE_URL is set correctly
3. **CORS Issues**: Update CORS_ORIGIN with your frontend URL
4. **Port Issues**: Ensure PORT environment variable is set

### Logs:
- View logs in Render dashboard
- Check build logs for build issues
- Check runtime logs for runtime errors

## Production Considerations:
1. **Upgrade to Starter Plan** for better performance
2. **Set up custom domain** for production
3. **Configure SSL certificates** (automatic on Render)
4. **Set up monitoring** and alerts
5. **Backup database** regularly

## Environment Variables Reference:
See `render-env-template.txt` for a complete list of environment variables you can configure.
