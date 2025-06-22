// MicroService/Analytique/src/models/AnalyticsData.js
const mongoose = require('mongoose');

const analyticsDataSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  period: {
    type: String, // 'monthly', 'yearly'
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  month: {
    type: Number, // null pour yearly
    default: null
  },
  // Données agrégées
  totals: {
    income: { type: Number, default: 0 },
    expenses: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 }
  },
  categories: [{
    name: String,
    amount: Number,
    count: Number,
    type: { type: String, enum: ['income', 'expense'] }
  }],
  trends: {
    incomeChange: { type: Number, default: 0 }, // % par rapport à la période précédente
    expenseChange: { type: Number, default: 0 },
    averageTransaction: { type: Number, default: 0 },
    topCategory: String
  },
  // Cache des données mensuelles pour les graphiques
  monthlyBreakdown: [{
    month: Number,
    income: Number,
    expenses: Number,
    balance: Number,
    transactionCount: Number
  }],
  lastCalculated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index pour requêtes rapides
analyticsDataSchema.index({ userId: 1, period: 1, year: 1, month: 1 }, { unique: true });
analyticsDataSchema.index({ userId: 1, lastCalculated: -1 });

module.exports = mongoose.model('AnalyticsData', analyticsDataSchema);
