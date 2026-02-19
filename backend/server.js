const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database Connection
const mongooseOptions = {
  retryWrites: true,
  w: 'majority',
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/my-stickies', mongooseOptions)
  .then(() => console.log('✓ MongoDB connected successfully'))
  .catch(err => {
    console.error('✗ MongoDB connection error:', err.message);
    console.error('Connection string (first 50 chars):', process.env.MONGODB_URI?.substring(0, 50) + '...');
    process.exit(1);
  });

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/subcategories', require('./routes/subcategories'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/orders', require('./routes/orders'));

// Root endpoint for quick uptime checks
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running', health: '/api/health' });
});

// API root helper
app.get('/api', (req, res) => {
  res.json({ status: 'ok', message: 'API root', health: '/api/health' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Default to 8000 to align with hosts that fix health checks to that port (e.g., Koyeb)
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
