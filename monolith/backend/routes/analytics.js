const express = require('express');
const { analyticsAPI } = require('../config/services');
const auth = require('../middleware/auth');
const router = express.Router();

// Toutes les routes sont protégées
router.use(auth);

// GET /api/analytics/stats/:userId - Statistiques de l'utilisateur
router.get('/stats/:userId', async (req, res) => {
  try {
    // Vérifier que l'utilisateur accède à ses propres données
    if (req.params.userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const { period, periodType = 'monthly' } = req.query;

    const response = await analyticsAPI.get(`/analytics/stats/${req.params.userId}`, {
      params: { period, periodType }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Analytics stats error:', error);

    // Return default data if analytics service is down
    res.json({
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
      }
    });
  }
});

// GET /api/analytics/trends/:userId/:period - Tendances
router.get('/trends/:userId/:period', async (req, res) => {
  try {
    if (req.params.userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const response = await analyticsAPI.get(`/analytics/trends/${req.params.userId}/${req.params.period}`);
    res.json(response.data);
  } catch (error) {
    console.error('Analytics trends error:', error);
    res.json({
      monthlyTrends: [],
      categoryTrends: [],
      predictions: {}
    });
  }
});

// GET /api/analytics/categories/:userId - Analyse par catégories
router.get('/categories/:userId', async (req, res) => {
  try {
    if (req.params.userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const response = await analyticsAPI.get(`/analytics/categories/${req.params.userId}`);
    res.json(response.data);
  } catch (error) {
    console.error('Analytics categories error:', error);
    res.json({
      categories: [],
      topSpending: [],
      growthCategories: []
    });
  }
});

// POST /api/analytics/refresh/:userId - Forcer la mise à jour des analytics
router.post('/refresh/:userId', async (req, res) => {
  try {
    if (req.params.userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const response = await analyticsAPI.post(`/analytics/refresh/${req.params.userId}`);
    res.json(response.data);
  } catch (error) {
    console.error('Analytics refresh error:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour des analytics',
      error: error.message
    });
  }
});

module.exports = router;
