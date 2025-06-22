// MicroService/Analytique/src/models/UserProfile.js
const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  name: String,
  email: String,
  currency: {
    type: String,
    default: 'EUR'
  },
  monthlyIncome: {
    type: Number,
    default: 0
  },
  lastSyncedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserProfile', userProfileSchema);
