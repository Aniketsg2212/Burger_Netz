# Deploy BurgerNetz to Render

## Prerequisites
1. GitHub account
2. Render account (https://render.com)
3. MongoDB Atlas account (free tier: https://www.mongodb.com/cloud/atlas)

## Step 1: Setup MongoDB Atlas
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Create a database user
4. Whitelist all IPs (0.0.0.0/0) for Render access
5. Get your connection string (looks like: mongodb+srv://username:password@cluster.mongodb.net/)

## Step 2: Push to GitHub
```bash
cd /Users/suneethk/Downloads/BurgerNetz-main
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## Step 3: Deploy Backend on Render
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - Name: burgernetz-backend
   - Runtime: Python 3
   - Build Command: `cd backend && pip install -r requirements.txt`
   - Start Command: `cd backend && uvicorn server:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables:
   - MONGO_URL: (your MongoDB Atlas connection string)
   - DB_NAME: burgernetz
   - JWT_SECRET: (generate a random secret)
   - CORS_ORIGINS: * (update after frontend deployment)
6. Click "Create Web Service"
7. Copy the backend URL (e.g., https://burgernetz-backend.onrender.com)

## Step 4: Deploy Frontend on Render
1. Click "New +" → "Static Site"
2. Connect same GitHub repository
3. Configure:
   - Name: burgernetz-frontend
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/build`
4. Add Environment Variable:
   - REACT_APP_API_URL: (your backend URL from Step 3)
5. Click "Create Static Site"

## Step 5: Update CORS
1. Go back to backend service settings
2. Update CORS_ORIGINS environment variable with your frontend URL
3. Save changes (will trigger redeploy)

## Alternative: Use render.yaml (Blueprint)
1. Push render.yaml to your repo
2. Go to Render Dashboard → "New +" → "Blueprint"
3. Connect repository
4. Render will auto-detect render.yaml and deploy both services
5. Add MONGO_URL in environment variables

## Your App URLs
- Backend API: https://burgernetz-backend.onrender.com/api
- Frontend: https://burgernetz-frontend.onrender.com
- API Docs: https://burgernetz-backend.onrender.com/docs

## Notes
- Free tier services sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds
- Upgrade to paid tier for always-on services
