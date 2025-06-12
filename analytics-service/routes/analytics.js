const express = require('express');
const router = express.Router();
const Joi = require('joi');
const AnalyticsData = require('../models/AnalyticsData');
const Transaction = require('../models/Transaction');
const { calculateStats } = require('../services/analyticsService');
const { validateRequest } = require('../middleware/validation');

// Validation schemas
const userIdSchema = Joi.object({
  userId: Joi.string().required()
});

const periodSchema = Joi.object({
  userId: Joi.string().required(),
  period: Joi.string().pattern(/^\d{4}-\d{2}$|^\d{4}$/).required()
});

// GET /analytics/stats/:userId
// Récupère les statistiques générales pour un utilisateur
router.get('/stats/:userId', validateRequest(userIdSchema, 'params'), async (req, res) => {
  try {
    const { userId } = req.params;
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Check cache first
    const cacheKey = `analytics:${userId}:${currentMonth}:stats`;
    const cached = await req.redisClient.get(cacheKey);

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Calculate or fetch from DB
    let stats = await AnalyticsData.findOne({
      userId,
      period: currentMonth,
      periodType: 'monthly'
    });

    if (!stats || new Date() - stats.lastUpdated > 3600000) { // 1 hour
      stats = await calculateStats(userId, currentMonth, 'monthly');
    }

    // Cache for 1 hour
    await req.redisClient.setEx(cacheKey, 3600, JSON.stringify(stats));

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /analytics/trends/:userId/:period
// Analyse des tendances sur une période
router.get('/trends/:userId/:period', validateRequest(periodSchema, 'params'), async (req, res) => {
  try {
    const { userId, period } = req.params;

    const cacheKey = `trends:${userId}:${period}`;
    const cached = await req.redisClient.get(cacheKey);

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Calculate trends for the last 6 months
    const trends = await calculateTrends(userId, period);

    // Cache for 2 hours
    await req.redisClient.setEx(cacheKey, 7200, JSON.stringify(trends));

    res.json(trends);
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// GET /analytics/categories/:userId
// Analyse par catégories
router.get('/categories/:userId', validateRequest(userIdSchema, 'params'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = 'current-month' } = req.query;

    const categoryAnalysis = await analyzeCategoriesSpending(userId, period);
    res.json(categoryAnalysis);
  } catch (error) {
    console.error('Error analyzing categories:', error);
    res.status(500).json({ error: 'Failed to analyze categories' });
  }
});

// GET /analytics/predictions/:userId
// Prévisions et détection d'anomalies
router.get('/predictions/:userId', validateRequest(userIdSchema, 'params'), async (req, res) => {
  try {
    const { userId } = req.params;

    const predictions = await generatePredictions(userId);
    res.json(predictions);
  } catch (error) {
    console.error('Error generating predictions:', error);
    res.status(500).json({ error: 'Failed to generate predictions' });
  }
});

// POST /analytics/refresh/:userId
// Invalide le cache et recalcule
router.post('/refresh/:userId', validateRequest(userIdSchema, 'params'), async (req, res) => {
  try {
    const { userId } = req.params;

    // Clear all cache for this user
    const keys = await req.redisClient.keys(`*${userId}*`);
    if (keys.length > 0) {
      await req.redisClient.del(keys);
    }

    // Trigger recalculation for current month
    const currentMonth = new Date().toISOString().slice(0, 7);
    await calculateStats(userId, currentMonth, 'monthly');

    res.json({ message: 'Analytics refreshed successfully' });
  } catch (error) {
    console.error('Error refreshing analytics:', error);
    res.status(500).json({ error: 'Failed to refresh analytics' });
  }
});

// POST /analytics/sync-transaction
// Endpoint pour synchroniser les transactions depuis le service principal
router.post('/sync-transaction', async (req, res) => {
  try {
    const { transaction } = req.body;

    // Update or create transaction in local cache
    await Transaction.findByIdAndUpdate(
      transaction._id,
      { ...transaction, syncedAt: new Date() },
      { upsert: true }
    );

    // Invalidate relevant cache
    const period = transaction.date.slice(0, 7); // YYYY-MM
    const cacheKeys = [
      `analytics:${transaction.userId}:${period}:stats`,
      `trends:${transaction.userId}:${period}`
    ];

    await req.redisClient.del(cacheKeys);

    res.json({ message: 'Transaction synced successfully' });
  } catch (error) {
    console.error('Error syncing transaction:', error);
    res.status(500).json({ error: 'Failed to sync transaction' });
  }
});

// Helper functions
async function calculateTrends(userId, period) {
  const months = [];
  const baseDate = new Date(period + '-01');

  // Get last 6 months of data
  for (let i = 5; i >= 0; i--) {
    const date = new Date(baseDate);
    date.setMonth(date.getMonth() - i);
    months.push(date.toISOString().slice(0, 7));
  }

  const trendsData = await AnalyticsData.find({
    userId,
    period: { $in: months },
    periodType: 'monthly'
  }).sort({ period: 1 });

  return {
    periods: months,
    income: trendsData.map(d => d.totalIncome),
    expenses: trendsData.map(d => d.totalExpenses),
    balance: trendsData.map(d => d.netBalance),
    averageIncome: trendsData.reduce((sum, d) => sum + d.totalIncome, 0) / trendsData.length,
    averageExpenses: trendsData.reduce((sum, d) => sum + d.totalExpenses, 0) / trendsData.length,
    trend: calculateTrendDirection(trendsData.map(d => d.netBalance))
  };
}

async function analyzeCategoriesSpending(userId, period) {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const data = await AnalyticsData.findOne({
    userId,
    period: currentMonth,
    periodType: 'monthly'
  });

  if (!data) return { categories: [], total: 0 };

  return {
    categories: data.categoriesBreakdown,
    total: data.totalExpenses,
    topCategory: data.trends.topCategory
  };
}

async function generatePredictions(userId) {
  // Get last 3 months of data for predictions
  const months = [];
  for (let i = 2; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    months.push(date.toISOString().slice(0, 7));
  }

  const historicalData = await AnalyticsData.find({
    userId,
    period: { $in: months },
    periodType: 'monthly'
  }).sort({ period: 1 });

  if (historicalData.length < 2) {
    return { message: 'Insufficient data for predictions' };
  }

  const avgIncome = historicalData.reduce((sum, d) => sum + d.totalIncome, 0) / historicalData.length;
  const avgExpenses = historicalData.reduce((sum, d) => sum + d.totalExpenses, 0) / historicalData.length;

  return {
    nextMonthPrediction: {
      expectedIncome: Math.round(avgIncome),
      expectedExpenses: Math.round(avgExpenses),
      expectedBalance: Math.round(avgIncome - avgExpenses)
    },
    budgetStatus: avgExpenses > avgIncome ? 'over' : 'under',
    recommendations: generateRecommendations(historicalData)
  };
}

function calculateTrendDirection(values) {
  if (values.length < 2) return 'stable';

  let increasing = 0;
  let decreasing = 0;

  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[i - 1]) increasing++;
    else if (values[i] < values[i - 1]) decreasing++;
  }

  if (increasing > decreasing) return 'increasing';
  if (decreasing > increasing) return 'decreasing';
  return 'stable';
}

function generateRecommendations(data) {
  const recommendations = [];

  if (data.length > 0) {
    const latest = data[data.length - 1];

    if (latest.totalExpenses > latest.totalIncome) {
      recommendations.push('Vos dépenses dépassent vos revenus ce mois-ci');
    }

    if (latest.trends.topCategory) {
      recommendations.push(`Votre plus grosse catégorie de dépense: ${latest.trends.topCategory}`);
    }
  }

  return recommendations;
}

module.exports = router;
