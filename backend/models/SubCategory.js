const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
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
  defaultDiscount: {
    type: Number,
    default: 0
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  type: {
    type: String,
    enum: ['eservice','product'],
    default: 'eservice'
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
  order: {
    type: Number,
    default: 0,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SubCategory', subCategorySchema);
