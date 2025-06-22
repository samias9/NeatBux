// MicroService/Analytique/src/routes/analytics.routes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Appliquer le middleware d'authentification à toutes les routes
router.use(authMiddleware);

// Routes principales analytics
router.get('/stats', analyticsController.getStats);
router.get('/trends', analyticsController.getTrends);
router.get('/forecast', analyticsController.getForecast);

// Nouvelles routes pour les données détaillées
router.get('/chart-data', analyticsController.getChartData);
router.post('/sync', analyticsController.syncData);
router.get('/sync-status', analyticsController.getSyncStatus);
router.post('/recalculate', analyticsController.recalculateAll);

module.exports = router;
