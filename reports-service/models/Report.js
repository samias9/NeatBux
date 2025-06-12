const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  reportType: {
    type: String,
    enum: ['monthly', 'annual', 'category', 'custom'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  period: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  parameters: {
    categories: [String],
    includeCharts: {
      type: Boolean,
      default: true
    },
    includeDetails: {
      type: Boolean,
      default: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'generating', 'completed', 'failed'],
    default: 'pending'
  },
  filePath: String,
  fileSize: Number,
  downloadCount: {
    type: Number,
    default: 0
  },
  generatedAt: Date,
  expiresAt: {
    type: Date,
    // Reports expire after 30 days
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  },
  metadata: {
    totalTransactions: Number,
    totalIncome: Number,
    totalExpenses: Number,
    chartsGenerated: [String]
  }
}, {
  timestamps: true
});

// Index for cleanup of expired reports
reportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Report', reportSchema);
