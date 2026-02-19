const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  currency: {
    type: String,
    enum: ['SYP', 'USD'],
    default: 'SYP'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Settings', settingsSchema);
