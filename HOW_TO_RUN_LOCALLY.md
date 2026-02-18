# How to Run My Stickies Website Locally

This guide will help you set up and run the My Stickies e-commerce platform on your local machine.

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MongoDB** - [Download here](https://www.mongodb.com/try/download/community)
- **Git** (optional, for cloning the repository)

To check if Node.js and npm are installed:
```bash
node --version
npm --version
```

## Project Structure

```
my-stickies-store/
├── backend/              # Express.js API server
│   ├── server.js        # Main server file
│   ├── package.json     # Backend dependencies
│   └── ...
├── frontend/            # React application
│   ├── src/
│   ├── package.json     # Frontend dependencies
│   └── ...
└── docker-compose.yml   # Docker configuration (optional)
```

## Step 1: Set Up MongoDB

### Option A: Local MongoDB Installation
1. Install MongoDB Community Edition from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Start MongoDB service:
   - **Windows**: MongoDB should start automatically after installation, or start it from Services
   - **Mac/Linux**: Run `mongod` in terminal
3. Verify connection: The default connection is `mongodb://localhost:27017`

### Option B: Using Docker (if you have Docker installed)
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Option C: MongoDB Atlas (Cloud Database)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster and get your connection string
3. You'll use this connection string in the `.env` file

## Step 2: Set Up Backend

### Navigate to Backend Directory
```bash
cd my-stickies-store/backend
```

### Install Dependencies
```bash
npm install
```

### Create Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/my-stickies

# JWT Secret (use a strong random string for production)
JWT_SECRET=your_secret_key_here_change_in_production

# Email Service (for order notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_specific_password

# WhatsApp Service (optional)
WHATSAPP_API_KEY=your_whatsapp_api_key_here

# Admin Credentials (initial setup)
ADMIN_EMAIL=admin@mystickies.com
ADMIN_PASSWORD=your_secure_password_here
```

### Start Backend Server
```bash
npm start
```

You should see:
```
Server running on port 5000
MongoDB connected!
```

The API will be available at `http://localhost:5000`

## Step 3: Set Up Frontend

### Open New Terminal Window

Navigate to Frontend Directory:
```bash
cd my-stickies-store/frontend
```

### Install Dependencies
```bash
npm install
```

### Create Environment Configuration

Create a `.env` file in the `frontend/` directory:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api

# Optional: Google Drive ID for fallback images
REACT_APP_FALLBACK_DRIVE_ID=your_drive_file_id_here
```

### Start Frontend Development Server
```bash
npm start
```

The frontend will automatically open in your browser at `http://localhost:3000`

## Accessing the Website

### Customer Site
- **Home**: http://localhost:3000
- **Products**: http://localhost:3000/products
- **E-Services**: http://localhost:3000/e-services
- **Shopping Cart**: http://localhost:3000/cart

### Admin Panel
- **Admin Login**: http://localhost:3000/admin
- Default credentials: Use the `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your `.env`

## Available Scripts

### Backend
```bash
npm start              # Start the server
npm run dev           # Start with nodemon (auto-reload)
npm test              # Run tests (if configured)
```

### Frontend
```bash
npm start             # Start development server
npm run build         # Create production build
npm test              # Run tests
npm eject             # Eject from Create React App (irreversible!)
```

## Troubleshooting

### Issue: "Cannot find module" errors

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json  # On Windows: rmdir /s /q node_modules && del package-lock.json
npm install
```

### Issue: MongoDB Connection Error

**Check if MongoDB is running:**
- Windows: Open Services and look for "MongoDB Server"
- Mac/Linux: Run `mongod` in terminal

**Update MONGODB_URI in .env:**
```env
# If using MongoDB Atlas, use:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/my-stickies
```

### Issue: Port Already in Use

If port 5000 or 3000 is already in use:

**Backend (change port):**
```env
PORT=5001
```

**Frontend (change port):**
```bash
PORT=3001 npm start
```

### Issue: CORS Error

If you see CORS errors, ensure in `backend/server.js` you have:
```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### Issue: Images Not Loading

1. Check `REACT_APP_FALLBACK_DRIVE_ID` in frontend `.env`
2. Ensure product images have valid URLs in the database
3. Check browser console for specific error messages

## Performance Tips

1. **Development Mode**: Frontend and backend auto-reload on file changes
2. **Disable Console Logs**: Set `NODE_ENV=production` for faster loading
3. **Clear Browser Cache**: If seeing old styles/content

## Database Seeding

To add sample data, create an admin user through the admin panel or:

1. Create categories first
2. Create products with proper image URLs
3. For Google Drive images, use the sharing ID from the URL

## Using Docker (Alternative)

If you prefer to use Docker, a `docker-compose.yml` file is included:

```bash
# Start all services (MongoDB, Backend, Frontend)
docker-compose up

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

## Next Steps

- **Customize**: Modify colors, branding, and content in frontend components
- **Add Products**: Use the admin panel to add products and e-services
- **Setup Payments**: Integrate with a payment gateway (Stripe, PayPal, etc.)
- **Deploy**: Follow deployment docs for production setup

## Additional Resources

- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the [PROJECT_INDEX.md](PROJECT_INDEX.md) for architecture details
3. Check browser console and terminal output for error messages

---

**Happy developing! 🎨**
