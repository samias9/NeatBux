const AnalyticsData = require('../models/AnalyticsData');
const Transaction = require('../models/Transaction');

async function calculateStats(userId, period, periodType) {
  try {
    // Determine date range based on period type
    let startDate, endDate;

    if (periodType === 'monthly') {
      startDate = new Date(period + '-01');
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (periodType === 'yearly') {
      startDate = new Date(period + '-01-01');
      endDate = new Date(parseInt(period) + 1, 0, 1); // Next year
    }

    // Fetch transactions for the period
    const transactions = await Transaction.find({
      userId,
      date: { $gte: startDate, $lt: endDate }
    });

    if (transactions.length === 0) {
      return createEmptyStats(userId, period, periodType);
    }

    // Calculate basic stats
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Category breakdown
    const categoryMap = new Map();
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        if (categoryMap.has(t.category)) {
          categoryMap.get(t.category).amount += t.amount;
          categoryMap.get(t.category).count += 1;
        } else {
          categoryMap.set(t.category, { amount: t.amount, count: 1 });
        }
      });

    const categoriesBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      amount: data.amount,
      percentage: expenses > 0 ? Math.round((data.amount / expenses) * 100) : 0,
      transactionCount: data.count
    }));

    // Find top category
    const topCategory = categoriesBreakdown.length > 0
      ? categoriesBreakdown.reduce((prev, current) =>
          prev.amount > current.amount ? prev : current
        ).category
      : null;

    // Calculate trends (compare with previous period)
    const previousPeriod = getPreviousPeriod(period, periodType);
    const previousStats = await AnalyticsData.findOne({
      userId,
      period: previousPeriod,
      periodType
    });

    let incomeChange = 0;
    let expenseChange = 0;

    if (previousStats) {
      incomeChange = previousStats.totalIncome > 0
        ? Math.round(((income - previousStats.totalIncome) / previousStats.totalIncome) * 100)
        : 0;
      expenseChange = previousStats.totalExpenses > 0
        ? Math.round(((expenses - previousStats.totalExpenses) / previousStats.totalExpenses) * 100)
        : 0;
    }

    const statsData = {
      userId,
      period,
      periodType,
      totalIncome: income,
      totalExpenses: expenses,
      netBalance: income - expenses,
      categoriesBreakdown: categoriesBreakdown.sort((a, b) => b.amount - a.amount),
      trends: {
        incomeChange,
        expenseChange,
        topCategory,
        averageTransaction: transactions.length > 0
          ? Math.round(transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / transactions.length)
          : 0
      },
      predictions: {
        nextMonthExpected: Math.round((income + expenses) / 2), // Simple prediction
        budgetStatus: expenses > income ? 'over' : income > expenses ? 'under' : 'on-track',
        anomalies: detectAnomalies(transactions, previousStats)
      },
      lastUpdated: new Date()
    };

    // Save to database
    const result = await AnalyticsData.findOneAndUpdate(
      { userId, period, periodType },
      statsData,
      { upsert: true, new: true }
    );

    return result;

  } catch (error) {
    console.error('Error calculating stats:', error);
    throw error;
  }
}

function createEmptyStats(userId, period, periodType) {
  return {
    userId,
    period,
    periodType,
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
    categoriesBreakdown: [],
    trends: {
      incomeChange: 0,
      expenseChange: 0,
      topCategory: null,
      averageTransaction: 0
    },
    predictions: {
      nextMonthExpected: 0,
      budgetStatus: 'on-track',
      anomalies: []
    },
    lastUpdated: new Date()
  };
}

function getPreviousPeriod(period, periodType) {
  if (periodType === 'monthly') {
    const date = new Date(period + '-01');
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().slice(0, 7);
  } else if (periodType === 'yearly') {
    return (parseInt(period) - 1).toString();
  }
  return period;
}

function detectAnomalies(transactions, previousStats) {
  const anomalies = [];

  if (!previousStats) return anomalies;

  // Check for unusually high single transactions
  const avgPreviousTransaction = previousStats.trends?.averageTransaction || 0;
  if (avgPreviousTransaction > 0) {
    transactions.forEach(t => {
      if (Math.abs(t.amount) > avgPreviousTransaction * 3) {
        anomalies.push(`Transaction inhabituelle: ${t.description || t.category} (${t.amount}€)`);
      }
    });
  }

  return anomalies.slice(0, 5); // Limit to 5 anomalies
}

module.exports = {
  calculateStats
};
