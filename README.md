# My Stickies - Online Store Platform

A complete, modern online store website for "My Stickies" - a small business selling stickers, posters, brooches, and similar items.

## Features

### Customer Features
- **Browse Products**: View all products with images, descriptions, and prices
- **Search & Filter**: Search by product name and filter by categories
- **Shopping Cart**: Add unlimited items to cart and manage quantities
- **Checkout**: Simple checkout with customer information form
- **Order Confirmation**: Automatic email notifications for customers

### Admin Features
- **Secure Dashboard**: Role-based access control with JWT authentication
- **Product Management**: Add, edit, delete products and set prices/discounts
- **Category Management**: Create and manage product categories
- **Order Management**: View all customer orders with detailed information
- **Order Status**: Update order status (pending, confirmed, processing, shipped, delivered, cancelled)
- **Email Notifications**: Automatic email alerts for new orders

### Technical Features
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Modern Styling**: Beautiful UI with smooth animations using brand colors (#C4E9FE, #70B0F0, #047DCB)
- **Database**: MongoDB for scalable data storage
- **Email Integration**: Automatic order notifications via Nodemailer
- **Production Ready**: Optimized for online hosting

## Project Structure

```
my-stickies-store/
├── backend/
│   ├── models/
│   │   ├── Admin.js
│   │   ├── Category.js
│   │   ├── Product.js
│   │   └── Order.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── categories.js
│   │   └── orders.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── categoryController.js
│   │   └── orderController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── utils/
│   │   └── emailService.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Header.js
    │   │   ├── Home.js
    │   │   ├── Products.js
    │   │   └── Cart.js
    │   ├── admin/
    │   │   ├── AdminLogin.js
    │   │   └── AdminDashboard.js
    │   ├── styles/
    │   │   ├── Header.css
    │   │   ├── Home.css
    │   │   ├── Products.css
    │   │   ├── Cart.css
    │   │   ├── Admin.css
    │   │   └── AdminDashboard.css
    │   ├── utils/
    │   │   └── api.js
    │   ├── App.js
    │   └── index.js
    ├── public/
    │   └── index.html
    └── package.json
```

## Installation & Setup

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create .env file** (copy from .env.example):
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/my-stickies
   JWT_SECRET=your_secret_key_here
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password_here
   ADMIN_EMAIL=admin@mystickies.com
   PORT=5000
   NODE_ENV=development
   ```

   **Important**: 
   - Replace MongoDB URI with your actual connection string
   - Set JWT_SECRET to a random secure string
   - For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833), not your regular password

4. **Start the backend server:**
   ```bash
   npm run dev
   ```
   The server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create .env file** (optional, for custom API URL):
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. **Start the frontend:**
   ```bash
   npm start
   ```
   The app will open at `http://localhost:3000`

## First Time Setup

### Create Initial Admin Account

1. Go to `http://localhost:3000/admin`
2. Click "Don't have an account? Register"
3. Fill in username, email, and password
4. Click Register to create your admin account

### Add Sample Data (Optional)

After logging in to admin dashboard:

1. **Create Categories:**
   - Go to Categories tab
   - Click "+ Add Category"
   - Add categories like "Stickers", "Posters", "Brooches"

2. **Add Products:**
   - Go to Products tab
   - Click "+ Add Product"
   - Fill in product details with image URLs
   - Set prices and optional discounts

**Note**: You can use placeholder image URLs for testing:
- `https://via.placeholder.com/300x300?text=Sticker+1`
- `https://via.placeholder.com/300x300?text=Poster+1`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new admin
- `POST /api/auth/login` - Admin login
- `GET /api/auth/me` - Get current admin (protected)

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (admin only)
- `PUT /api/categories/:id` - Update category (admin only)
- `DELETE /api/categories/:id` - Delete category (admin only)

### Orders
- `POST /api/orders` - Create order (public)
- `GET /api/orders` - Get all orders (admin only)
- `GET /api/orders/:id` - Get order by ID (admin only)
- `PUT /api/orders/:id` - Update order status (admin only)
- `DELETE /api/orders/:id` - Delete order (admin only)

## Database Schema

### Products
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  price: Number,
  discount: Number (0-100),
  image: String (URL),
  category: ObjectId (ref: Category),
  stock: Number (-1 for unlimited),
  active: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Orders
```javascript
{
  _id: ObjectId,
  orderNumber: String (unique),
  customer: {
    fullName: String,
    phoneNumber: String,
    city: String,
    email: String
  },
  items: [
    {
      product: ObjectId,
      productName: String,
      quantity: Number,
      price: Number,
      discount: Number
    }
  ],
  totalAmount: Number,
  status: String (pending|confirmed|processing|shipped|delivered|cancelled),
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Deployment Guide

### Deploy Backend (Node.js Server)

**Option 1: Heroku**
1. Install Heroku CLI
2. `heroku login`
3. `heroku create my-stickies-backend`
4. Set environment variables: `heroku config:set MONGODB_URI=...`
5. `git push heroku main`

**Option 2: AWS EC2**
1. Launch EC2 instance (Ubuntu)
2. SSH into instance
3. Install Node.js and npm
4. Clone repository
5. Set environment variables in .env
6. Install PM2: `npm install -g pm2`
7. Start with PM2: `pm2 start server.js`

**Option 3: DigitalOcean App Platform**
1. Push code to GitHub
2. Connect DigitalOcean to GitHub
3. Create new app from repository
4. Set environment variables in dashboard
5. Deploy

### Deploy Frontend (React App)

**Option 1: Vercel (Recommended)**
1. Push code to GitHub
2. Connect Vercel to GitHub
3. Set `REACT_APP_API_URL` to your backend URL
4. Deploy

**Option 2: Netlify**
1. Run `npm run build`
2. Drag & drop `build` folder to Netlify
3. Set environment variables in Netlify dashboard

**Option 3: Custom Server**
1. Build: `npm run build`
2. Upload `build` folder to your server
3. Configure web server (Nginx/Apache) to serve React app

## Email Configuration

### Gmail Setup
1. Enable 2-factor authentication on Google account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate new app password for Mail
4. Copy the 16-character password
5. Use this password in `.env` as `EMAIL_PASSWORD`

### Other Email Services
Update `backend/utils/emailService.js` to use your email service (SendGrid, Mailgun, etc.)

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Tips

1. **Optimize Images**: Use compressed images or CDN for product images
2. **Database Indexing**: Add indexes to frequently queried fields
3. **Caching**: Enable caching headers for static assets
4. **CDN**: Use CDN for static files and images
5. **Database**: Use MongoDB Atlas for better performance

## Security Considerations

1. **HTTPS**: Always use HTTPS in production
2. **JWT**: Tokens expire in 7 days, implement refresh tokens for longer sessions
3. **CORS**: Configure CORS properly for your domain
4. **Validation**: All inputs are validated server-side
5. **Environment Variables**: Never commit .env file
6. **Password**: Use bcrypt for password hashing (bcryptjs)

## Troubleshooting

### Backend won't start
- Check if MongoDB is connected
- Verify environment variables
- Check if port 5000 is available

### Frontend API calls failing
- Ensure backend is running
- Check `REACT_APP_API_URL` in .env
- Check browser console for CORS errors

### Emails not sending
- Verify email credentials in .env
- Check Gmail App Passwords (not regular password)
- Enable "Less secure apps" if using non-Gmail service

### MongoDB connection issues
- Verify connection string is correct
- Check IP whitelist in MongoDB Atlas
- Ensure network connectivity

## Future Enhancements

- [ ] Add payment gateway integration (Stripe, PayPal)
- [ ] Implement inventory management
- [ ] Add product reviews and ratings
- [ ] Implement user accounts for customers
- [ ] Add SMS notifications
- [ ] Create mobile app
- [ ] Add analytics dashboard
- [ ] Implement wishlists
- [ ] Add discount codes system
- [ ] Multi-language support

## Support

For issues or questions, refer to the documentation or contact the development team.

## License

This project is proprietary to My Stickies. All rights reserved.
