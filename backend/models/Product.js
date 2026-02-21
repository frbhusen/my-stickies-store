const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  price: {
    type: Number
  },
  type: {
    type: String,
    enum: ['product', 'eservice'],
    default: 'product'
  },
  discount: {
    type: Number,
    default: 0
  },
  image: {
    type: String
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  subCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory'
  },
  order: {
    type: Number,
    default: 0,
    index: true
  },
  stock: {
    type: Number,
    default: -1 // -1 means unlimited
  },
  active: {
    type: Boolean,
    default: true
  },
  currency: {
    type: String,
    enum: ['SYP', 'USD', null],
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate final price with discount
productSchema.virtual('finalPrice').get(function() {
  return this.price * (1 - this.discount / 100);
});

productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
