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
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  type: {
    type: String,
    enum: ['eservice'],
    default: 'eservice'
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SubCategory', subCategorySchema);
