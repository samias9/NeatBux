const mongoose = require('mongoose');

const analyticsDataSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  period: {
    type: String, // format: YYYY-MM ou YYYY
    required: true,
    index: true
  },
  periodType: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: true
  },
  totalIncome: {
    type: Number,
    default: 0
  },
  totalExpenses: {
    type: Number,
    default: 0
  },
  netBalance: {
    type: Number,
    default: 0
  },
  categoriesBreakdown: [{
    category: String,
    amount: Number,
    percentage: Number,
    transactionCount: Number
  }],
  trends: {
    incomeChange: Number, // % change from previous period
    expenseChange: Number,
    topCategory: String,
    averageTransaction: Number
  },
  predictions: {
    nextMonthExpected: Number,
    budgetStatus: String, // 'under', 'over', 'on-track'
    anomalies: [String] // unusual spending patterns
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
analyticsDataSchema.index({ userId: 1, period: 1, periodType: 1 }, { unique: true });

module.exports = mongoose.model('AnalyticsData', analyticsDataSchema);
