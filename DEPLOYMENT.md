# Deployment Instructions for My Stickies Store

## 100% Free Deployment (Frontend + Backend + DB)

This guide uses only free tiers: Vercel (frontend), Render (backend API), MongoDB Atlas (database), and Brevo (SMTP). You’ll get free HTTPS subdomains; custom domains are optional and cost money.

### Overview
- Frontend: Vercel builds and hosts React for free.
- Backend: Render free Web Service runs Node/Express; it sleeps when idle (cold starts expected).
- Database: MongoDB Atlas free cluster (shared tier).
- Email: Brevo free plan (SMTP). Gmail works for light use but may be throttled.

### Prerequisites
- GitHub account with this repo pushed.
- Environment values ready: `MONGODB_URI`, `JWT_SECRET` (32+ chars), `EMAIL_USER`, `EMAIL_PASSWORD`, `ADMIN_EMAIL`.

---

### Step 1 — Set up MongoDB Atlas (Free)
1. Create a free Atlas account and a free “Shared” cluster.
2. Create a database user and copy the connection string (replace `<username>`, `<password>`, and default DB name).
3. Network access: allow `0.0.0.0/0` (or add Render’s egress IPs later).
4. Save your URI as `MONGODB_URI`.

---

### Step 2 — Deploy Backend to Render (Free Web Service)
1. Sign up at Render, click “New +” → “Web Service”.
2. Connect your GitHub repo; select the root, then set:
   - Name: `mystickies-api` (any)
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: `Node` → `> 18`
3. Add Environment Variables:
   - `MONGODB_URI` = your Atlas connection string
   - `JWT_SECRET` = a strong 32+ char string
   - `EMAIL_USER` = your Brevo SMTP user (or Gmail address)
   - `EMAIL_PASSWORD` = Brevo SMTP key (or Gmail app password)
   - `ADMIN_EMAIL` = `admin@mystickies.com` (or your email)
   - `PORT` = `5000`
   - `NODE_ENV` = `production`
4. Deploy. After build, Render gives you a URL like `https://mystickies-api.onrender.com`.
5. Verify health:
```powershell
# Replace with your Render URL
curl https://mystickies-api.onrender.com/api/health
```

Note: Free services sleep after inactivity; first request is slower (cold start).

---

### Step 3 — Deploy Frontend to Vercel (Free)
1. Sign up/Login to Vercel → “New Project” → import your GitHub repo.
2. Project settings:
   - Framework: `Create React App` or `React` (auto-detected)
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Output Directory: `build`
3. Add Environment Variable:
   - `REACT_APP_API_URL` = your Render backend URL (e.g., `https://mystickies-api.onrender.com`)
4. Deploy. Vercel gives a URL like `https://my0stickies.vercel.app`.

---

### Step 4 — Configure CORS (allow your frontend)
In your backend, ensure CORS allows the Vercel domain and localhost during dev. If your server uses `cors`, verify it’s configured. Example (for reference):
```js
// Example only; place in your Express server setup
import cors from 'cors';
const allowed = [
  'http://localhost:3000',
  'https://my0stickies.vercel.app'
];
app.use(cors({ origin: allowed, credentials: true }));
```

If CORS is already implemented, update the allowed origins to include your Vercel URL.

---

### Step 5 — Email (Brevo Free SMTP)
1. Create a free Brevo account.
2. Generate an SMTP key.
3. Use `EMAIL_USER` (your Brevo login email) and `EMAIL_PASSWORD` (SMTP key).

For very light testing, Gmail with an app password can work; set `EMAIL_USER` to your Gmail and `EMAIL_PASSWORD` to the app password.

---

### Step 6 — Optional: Reduce Cold Starts (Free)
Use UptimeRobot (free) to ping your Render URL every 5 minutes.
1. Create a monitor → type “HTTP(s)” → URL: your Render backend.
2. This keeps the service warmer and reduces first-request delays.

---

### Step 7 — End-to-End Test
1. Open your Vercel URL.
2. Browse products and cart; switch language; verify images load.
3. Access admin: `https://my-stickies-store.vercel.app/admin` → login (admin token stored on success).
4. Create/edit products and categories; confirm images display in admin (Drive links normalized).
5. Place a test order and verify it appears in the admin; try Export/Print.

---

### Common Fixes
- Backend sleeping: expect cold starts; add UptimeRobot.
- CORS errors: ensure your exact Vercel URL is allowed (including protocol and subdomain).
- Env vars missing: set them in Render and Vercel; redeploy if needed.
- MongoDB network: if access denied, check Atlas IP allowlist.
- Images from Google Drive: use share links and rely on the app’s normalization.

---

### TL;DR Commands (local checks)
```powershell
# From Windows PowerShell in project root
# Frontend
cd frontend
npm install
npm start

# Backend
cd ../backend
npm install
npm run dev

# Health check (update URL)
curl https://mystickies-api.onrender.com/api/health
```

All hosting above is free on subdomains; no credit card required. Custom domains and advanced resources may incur costs.

## Quick Start with Docker

### Prerequisites
- Docker
- Docker Compose

### Steps

1. **Clone the repository and navigate to project root**
   ```bash
   cd my-stickies-store
   ```

2. **Create .env file with your configuration**
   ```bash
   cp backend/.env.example .env
   ```
   Edit `.env` with your actual values:
   - MongoDB URI
   - JWT Secret
   - Email credentials
   - etc.

3. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000
   - MongoDB: mongodb://localhost:27017

5. **Stop the application**
   ```bash
   docker-compose down
   ```

## Production Deployment

### Using Heroku

#### Backend Deployment
1. Create Heroku account and install CLI
2. Create a new app: `heroku create my-stickies-api`
3. Set environment variables:
   ```bash
   heroku config:set MONGODB_URI=your_uri
   heroku config:set JWT_SECRET=your_secret
   heroku config:set EMAIL_USER=your_email
   heroku config:set EMAIL_PASSWORD=your_password
   heroku config:set ADMIN_EMAIL=admin@mystickies.com
   ```
4. Deploy: `git push heroku main`

#### Frontend Deployment on Vercel
1. Push code to GitHub
2. Import project in Vercel
3. Set `REACT_APP_API_URL` to your Heroku backend URL
4. Deploy

### Using AWS

#### EC2 Backend Setup
1. Launch Ubuntu 22.04 EC2 instance
2. SSH into instance and run:
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y nodejs npm mongodb git
   
   git clone your-repo-url
   cd my-stickies-store/backend
   npm install
   
   # Create .env file
   nano .env
   
   # Install PM2
   sudo npm install -g pm2
   pm2 start server.js --name "mystickies-api"
   pm2 startup
   pm2 save
   
   # Setup Nginx as reverse proxy
   sudo apt install -y nginx
   sudo nano /etc/nginx/sites-available/default
   # Configure proxy to localhost:5000
   sudo systemctl restart nginx
   ```

#### S3 + CloudFront for Frontend
1. Build frontend: `npm run build`
2. Create S3 bucket
3. Upload `build` folder contents to S3
4. Setup CloudFront distribution
5. Configure CloudFront to redirect to index.html for React routes

### Using DigitalOcean

#### App Platform
1. Push code to GitHub
2. Connect DigitalOcean to GitHub
3. Create new app from repository
4. Select `backend` for backend service
5. Select `frontend` for frontend service
6. Set environment variables
7. Deploy

#### Droplet + Docker
1. Create Ubuntu droplet
2. SSH and install Docker
3. Deploy using docker-compose file
4. Use Let's Encrypt for SSL certificate

## Environment Variables for Production

```env
# Backend
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/my-stickies
JWT_SECRET=your-very-secret-key-min-32-chars
EMAIL_USER=noreply@mystickies.com
EMAIL_PASSWORD=your-app-password
ADMIN_EMAIL=admin@mystickies.com
PORT=5000
NODE_ENV=production

# Frontend
REACT_APP_API_URL=https://api.mystickies.com
```

## SSL/HTTPS Setup

### Using Let's Encrypt with Nginx
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d yourdomain.com
# Update nginx config to use SSL certificate
sudo systemctl restart nginx
```

### Using AWS Certificate Manager
- Request certificate in ACM
- Validate domain
- Attach to load balancer or CloudFront

## Database Backup

### MongoDB Atlas
- Automated backups are enabled by default
- Access via Atlas dashboard

### Manual Backup
```bash
mongodump --uri "mongodb+srv://user:pass@cluster/db" --out ./backup
mongorestore ./backup
```

## Monitoring

### Application Health Check
```bash
# Backend
curl https://api.mystickies.com/api/health

# Frontend
# Check status page in browser
```

### Logs
- Backend: Check PM2 or Docker logs
- Frontend: Browser console and application logs

## Scaling Considerations

1. **Load Balancing**: Use load balancer for multiple backend instances
2. **Caching**: Implement Redis for session/order caching
3. **CDN**: Use CDN for static assets
4. **Database**: Vertical scaling or sharding for MongoDB
5. **Auto Scaling**: Configure auto-scaling groups

## Security Checklist

- [ ] Enable HTTPS/SSL
- [ ] Update Node.js and dependencies regularly
- [ ] Use strong JWT secret (32+ characters)
- [ ] Enable MongoDB authentication
- [ ] Configure firewall rules
- [ ] Use environment variables for secrets
- [ ] Enable CORS only for your domain
- [ ] Regular security audits
- [ ] Rate limiting on API endpoints
- [ ] Input validation on all endpoints

## Performance Optimization

1. **Compress assets**: Enable gzip in Nginx/Express
2. **Minify**: React build is already minified
3. **Image optimization**: Compress product images
4. **Database indexing**: Add indexes to frequently queried fields
5. **Caching headers**: Configure proper cache headers
6. **CDN**: Serve static files from CDN

## Troubleshooting

### Connection issues
- Check firewall rules
- Verify security groups (AWS)
- Check MongoDB IP whitelist

### Performance issues
- Monitor database query performance
- Check application logs
- Use APM tools (New Relic, DataDog)

### Deployment failures
- Check environment variables
- Verify all secrets are set
- Check application logs
- Ensure database is accessible

## Support

For deployment assistance, consult the main README.md or contact the development team.
