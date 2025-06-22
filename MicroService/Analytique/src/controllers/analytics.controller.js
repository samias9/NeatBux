// MicroService/Analytique/src/controllers/analytics.controller.js
const analyticsService = require('../services/analytics.service');
const dataSyncService = require('../services/dataSync.service');

class AnalyticsController {

  // Obtenir les statistiques générales
  async getStats(req, res) {
    try {
      const { userId } = req.user; // Vient du middleware d'auth
      const { year, month, forceSync } = req.query;

      const currentYear = year ? parseInt(year) : new Date().getFullYear();
      const currentMonth = month ? parseInt(month) : null;

      console.log(`📊 Demande de stats pour userId: ${userId}, année: ${currentYear}, mois: ${currentMonth}`);

      // Synchroniser si demandé ou si pas de données récentes
      if (forceSync === 'true') {
        console.log('🔄 Synchronisation forcée demandée');
        await dataSyncService.fullSync(userId, req.headers.authorization.replace('Bearer ', ''));
      }

      // Vérifier le cache d'abord
      const cached = await analyticsService.getCachedAnalytics(userId, currentYear, currentMonth);
      if (cached && forceSync !== 'true') {
        console.log('✅ Données trouvées en cache');
        return res.json({
          success: true,
          data: {
            total: cached.totals.totalIncome + cached.totals.totalExpenses,
            average: cached.totals.averageTransaction,
            ...cached.totals,
            ...cached.trends,
            categories: cached.categories,
            monthlyData: cached.monthlyBreakdown,
            fromCache: true,
            calculatedAt: cached.lastCalculated
          }
        });
      }

      // Calculer les nouvelles statistiques
      console.log('🔢 Calcul de nouvelles statistiques');
      const stats = await analyticsService.calculateStats(userId, currentYear, currentMonth);

      res.json({
        success: true,
        data: {
          total: stats.totalIncome + stats.totalExpenses,
          average: stats.averageTransaction,
          ...stats,
          fromCache: false
        }
      });

    } catch (error) {
      console.error('❌ Erreur getStats:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors du calcul des statistiques',
        message: error.message
      });
    }
  }

  // Obtenir les tendances
  async getTrends(req, res) {
    try {
      const { userId } = req.user;
      const { year, period = 'monthly' } = req.query;

      const currentYear = year ? parseInt(year) : new Date().getFullYear();

      console.log(`📈 Demande de tendances pour userId: ${userId}, période: ${period}`);

      if (period === 'monthly') {
        // Tendances mensuelles pour l'année
        const yearlyStats = await analyticsService.calculateStats(userId, currentYear);

        res.json({
          success: true,
          data: yearlyStats.monthlyData || {},
          period: 'monthly',
          year: currentYear
        });
      } else {
        // Tendances sur plusieurs années
        const trends = {};
        for (let i = 2; i >= 0; i--) {
          const targetYear = currentYear - i;
          const yearStats = await analyticsService.calculateStats(userId, targetYear);
          trends[targetYear] = yearStats.netBalance;
        }

        res.json({
          success: true,
          data: trends,
          period: 'yearly'
        });
      }

    } catch (error) {
      console.error('❌ Erreur getTrends:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors du calcul des tendances',
        message: error.message
      });
    }
  }

  // Obtenir les prévisions
  async getForecast(req, res) {
    try {
      const { userId } = req.user;

      console.log(`🔮 Demande de prévisions pour userId: ${userId}`);

      const forecast = await analyticsService.generateForecast(userId);

      res.json({
        success: true,
        data: forecast
      });

    } catch (error) {
      console.error('❌ Erreur getForecast:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors du calcul des prévisions',
        message: error.message
      });
    }
  }

  // Obtenir les données pour les graphiques (compatible avec MonthlyChart)
  async getChartData(req, res) {
    try {
      const { userId } = req.user;
      const { year } = req.query;

      const currentYear = year ? parseInt(year) : new Date().getFullYear();

      console.log(`📊 Demande de données graphique pour userId: ${userId}, année: ${currentYear}`);

      // Calculer les données annuelles avec répartition mensuelle
      const yearlyStats = await analyticsService.calculateStats(userId, currentYear);

      console.log(`📊 Stats reçues:`, {
        totalIncome: yearlyStats.totalIncome,
        totalExpenses: yearlyStats.totalExpenses,
        monthlyDataLength: yearlyStats.monthlyData?.length || 0
      });

      // Formater pour MonthlyChart
      const labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      const income = new Array(12).fill(0);
      const expenses = new Array(12).fill(0);

      if (yearlyStats.monthlyData) {
        yearlyStats.monthlyData.forEach(monthData => {
          const index = monthData.month - 1; // month est 1-12, index est 0-11
          if (index >= 0 && index < 12) {
            income[index] = monthData.income || 0;
            expenses[index] = monthData.expenses || 0;
          }
        });
      }

      const responseData = {
        labels,
        income,
        expenses,
        totals: {
          income: yearlyStats.totalIncome,
          expenses: yearlyStats.totalExpenses,
          balance: yearlyStats.netBalance
        },
        year: currentYear,
        calculatedAt: new Date()
      };

      console.log(`✅ Réponse chart-data:`, {
        incomeTotal: responseData.totals.income,
        expensesTotal: responseData.totals.expenses,
        incomeArray: responseData.income.slice(0, 3) // Premiers 3 mois pour debug
      });

      res.json({
        success: true,
        data: responseData
      });

    } catch (error) {
      console.error('❌ Erreur getChartData:', error);
      console.error('❌ Stack trace:', error.stack);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des données graphique',
        message: error.message
      });
    }
  }

  // Synchroniser les données avec le monolithe
  async syncData(req, res) {
    try {
      const { userId } = req.user;
      const token = req.headers.authorization.replace('Bearer ', '');

      console.log(`🔄 Début synchronisation pour userId: ${userId}`);

      const syncResult = await dataSyncService.fullSync(userId, token);

      res.json({
        success: true,
        message: 'Synchronisation terminée',
        data: syncResult
      });

    } catch (error) {
      console.error('❌ Erreur syncData:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la synchronisation',
        message: error.message
      });
    }
  }

  // Obtenir les statistiques de synchronisation
  async getSyncStatus(req, res) {
    try {
      const { userId } = req.user;

      console.log(`ℹ️ Demande statut sync pour userId: ${userId}`);

      const syncStats = await dataSyncService.getSyncStats(userId);

      res.json({
        success: true,
        data: syncStats
      });

    } catch (error) {
      console.error('❌ Erreur getSyncStatus:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération du statut de sync',
        message: error.message
      });
    }
  }

  // Endpoint pour recalculer toutes les analytics
  async recalculateAll(req, res) {
    try {
      const { userId } = req.user;
      const { year } = req.query;

      const currentYear = year ? parseInt(year) : new Date().getFullYear();

      console.log(`🔄 Début recalcul complet pour userId: ${userId}, année: ${currentYear}`);

      // Forcer le recalcul (sans cache)
      const stats = await analyticsService.calculateStats(userId, currentYear);

      // Calculer aussi mois par mois
      const monthlyResults = [];
      for (let month = 1; month <= 12; month++) {
        console.log(`📅 Calcul mois ${month}/${currentYear}`);
        const monthlyStats = await analyticsService.calculateStats(userId, currentYear, month);
        monthlyResults.push({
          month,
          ...monthlyStats
        });
      }

      console.log(`✅ Recalcul terminé pour userId: ${userId}`);

      res.json({
        success: true,
        message: 'Recalcul terminé',
        data: {
          yearly: stats,
          monthly: monthlyResults
        }
      });

    } catch (error) {
      console.error('❌ Erreur recalculateAll:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors du recalcul',
        message: error.message
      });
    }
  }

  // Health check spécifique aux analytics
  async healthCheck(req, res) {
    try {
      const { userId } = req.user;

      // Vérifier la connectivité aux services
      const syncStats = await dataSyncService.getSyncStats(userId);

      res.json({
        success: true,
        service: 'Analytics',
        status: 'OK',
        user: userId,
        timestamp: new Date().toISOString(),
        data: {
          syncStatus: syncStats,
          features: [
            'Calcul de statistiques',
            'Génération de tendances',
            'Prévisions',
            'Synchronisation données',
            'Cache analytics'
          ]
        }
      });

    } catch (error) {
      console.error('❌ Erreur healthCheck:', error);
      res.status(500).json({
        success: false,
        service: 'Analytics',
        status: 'ERROR',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new AnalyticsController();
