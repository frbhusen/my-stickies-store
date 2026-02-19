const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String
  },
  image: {
    type: String
  },
  defaultPrice: {
    type: Number
  },
  type: {
    type: String,
    enum: ['product', 'eservice'],
    default: 'product'
  },
  defaultDiscount: {
    type: Number,
    default: 0
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  currency: {
    type: String,
    enum: ['SYP', 'USD', null],
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Category', categorySchema);
