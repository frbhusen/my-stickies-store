# My Stickies - Quick Start Guide

This guide will help you get the My Stickies Online Store up and running in minutes.

## Prerequisites

- Node.js 18+ installed
- MongoDB account (free tier available at mongodb.com)
- Gmail account (for email notifications)

## Step 1: MongoDB Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster
4. Get your connection string that looks like:
   ```
   mongodb+srv://username:password@clustername.mongodb.net/my-stickies?retryWrites=true&w=majority
   ```

## Step 2: Gmail App Password Setup

1. Enable 2-factor authentication on your Google account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Select "Mail" and "Windows Computer" (or your device)
4. Google will generate a 16-character password
5. Copy this password - you'll use it in .env

## Step 3: Backend Setup

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend folder:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` with your actual values:
   ```
   MONGODB_URI=mongodb+srv://your_username:your_password@clustername.mongodb.net/my-stickies
   JWT_SECRET=your_very_secure_random_string_min_32_characters
   EMAIL_USER=youremail@gmail.com
   EMAIL_PASSWORD=your_16_char_app_password
   ADMIN_EMAIL=admin@mystickies.com
   PORT=5000
   NODE_ENV=development
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```

   You should see:
   ```
   MongoDB connected
   Server is running on port 5000
   ```

## Step 4: Frontend Setup (New Terminal)

1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend:
   ```bash
   npm start
   ```

   The browser will automatically open to `http://localhost:3000`

## Step 5: Create Your First Admin Account

1. Click the "Admin" link in the navigation
2. Click "Don't have an account? Register"
3. Fill in your details and register
4. You'll be automatically logged in to the admin dashboard

## Step 6: Add Products

1. In the admin dashboard, go to the "Categories" tab
2. Click "+ Add Category" and create categories like:
   - Stickers
   - Posters
   - Brooches

3. Go to the "Products" tab
4. Click "+ Add Product"
5. Fill in the details:
   - **Product Name**: e.g., "Rainbow Sticker Pack"
   - **Description**: e.g., "Beautiful set of 10 colorful stickers"
   - **Price**: e.g., 9.99
   - **Discount**: e.g., 10 (for 10% off)
   - **Image URL**: Use a placeholder like `https://via.placeholder.com/300x300?text=Product+Name`
   - **Category**: Select the category you created
6. Click "Save"

## Step 7: Test the Store

1. Go to "Products" in the main navigation
2. See your products displayed in a beautiful grid
3. Click "Add to Cart" to add items
4. Go to "Cart" to review your order
5. Fill in customer details and place an order
6. Check the admin dashboard to see the order
7. Update the order status to test the system

## Testing Checkout

When you place an order:
- A confirmation email is sent to the admin email
- The order appears in the admin dashboard under "Orders"
- You can update the order status

## Common Issues & Solutions

### "MongoDB connection error"
- Check your connection string in .env
- Verify IP whitelist in MongoDB Atlas (add 0.0.0.0/0 for testing)
- Ensure the database name matches in the connection string

### "CORS error when connecting"
- Make sure the backend is running on port 5000
- Check that REACT_APP_API_URL is correct (should be http://localhost:5000/api)

### "Emails not sending"
- Verify EMAIL_PASSWORD is the 16-character App Password, not your regular password
- Check that 2FA is enabled on your Gmail account
- Try sending a test email through the order form

### "Cannot GET /api/health"
- Make sure backend server is running
- Check that you're accessing the correct port (5000)

## Project Structure

```
my-stickies-store/
├── backend/          # Node.js/Express server
├── frontend/         # React application
├── README.md        # Main documentation
└── DEPLOYMENT.md    # Deployment guide
```

## Next Steps

1. **Customize Styling**: Edit files in `frontend/src/styles/` to match your brand
2. **Add More Products**: Use the admin dashboard to add your actual products
3. **Real Images**: Replace placeholder image URLs with actual product images
4. **Deploy**: Follow the DEPLOYMENT.md guide to deploy online

## Useful Commands

### Backend
```bash
cd backend
npm install          # Install dependencies
npm run dev         # Start with auto-reload
npm start           # Start production mode
```

### Frontend
```bash
cd frontend
npm install          # Install dependencies
npm start           # Start development server
npm run build       # Build for production
```

## Features Checklist

- ✅ Browse products with images and descriptions
- ✅ Filter by categories
- ✅ Search functionality
- ✅ Shopping cart management
- ✅ Checkout with customer form
- ✅ Order confirmation emails
- ✅ Admin dashboard with authentication
- ✅ Product management (CRUD)
- ✅ Category management
- ✅ Order tracking and status updates
- ✅ Responsive design
- ✅ Beautiful animations and styling

## Support

If you encounter any issues:
1. Check the main README.md for detailed documentation
2. Review DEPLOYMENT.md for hosting instructions
3. Check browser console (F12) for errors
4. Check backend console for API errors

Happy selling! 🎨
