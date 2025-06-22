// MicroService/Analytique/src/models/TransactionCopy.js
const mongoose = require('mongoose');

const transactionCopySchema = new mongoose.Schema({
  originalId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String, // On stocke l'ID comme string pour éviter les dépendances
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'failed'],
    default: 'completed'
  },
  // Métadonnées pour la synchronisation
  syncedAt: {
    type: Date,
    default: Date.now
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index composés pour les requêtes analytics
transactionCopySchema.index({ userId: 1, date: -1 });
transactionCopySchema.index({ userId: 1, type: 1, date: -1 });
transactionCopySchema.index({ userId: 1, category: 1, date: -1 });
transactionCopySchema.index({ originalId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('TransactionCopy', transactionCopySchema);
