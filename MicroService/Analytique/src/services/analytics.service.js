// MicroService/Analytique/src/services/analytics.service.js
const TransactionCopy = require('../models/TransactionCopy');
const AnalyticsData = require('../models/AnalyticsData');
const UserProfile = require('../models/UserProfile');

class AnalyticsService {

  // Calculer les statistiques pour un utilisateur et une période
  async calculateStats(userId, year = new Date().getFullYear(), month = null) {
    try {
      console.log(`📊 Calcul des stats pour ${userId}, ${year}${month ? `/${month}` : ''}`);

      // Construire les filtres de date
      const dateFilter = this.buildDateFilter(year, month);

      // Récupérer les transactions de la période
      const transactions = await TransactionCopy.find({
        userId,
        date: dateFilter,
        status: 'completed'
      }).sort({ date: -1 });

      if (transactions.length === 0) {
        return this.getEmptyStats(userId, year, month);
      }

      // Calculer les totaux
      const totals = this.calculateTotals(transactions);

      // Calculer les catégories
      const categories = this.calculateCategories(transactions);

      // Calculer les tendances
      const trends = await this.calculateTrends(userId, year, month, totals);

      // Calculer la répartition mensuelle (pour l'année complète)
      const monthlyBreakdown = month ? null : await this.calculateMonthlyBreakdown(userId, year);

      const analyticsData = {
        userId,
        period: month ? 'monthly' : 'yearly',
        year,
        month,
        totals,
        categories,
        trends,
        monthlyBreakdown: monthlyBreakdown || [],
        lastCalculated: new Date()
      };

      // Sauvegarder en cache
      await this.saveAnalyticsCache(analyticsData);

      return {
        ...totals,
        categories,
        trends,
        monthlyData: monthlyBreakdown,
        metadata: {
          period: month ? 'monthly' : 'yearly',
          calculatedAt: new Date(),
          transactionCount: transactions.length
        }
      };

    } catch (error) {
      console.error('❌ Erreur calcul analytics:', error);
      throw new Error(`Erreur calcul analytics: ${error.message}`);
    }
  }

  // Construire le filtre de date
  buildDateFilter(year, month) {
    if (month) {
      // Mois spécifique
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      return { $gte: startDate, $lte: endDate };
    } else {
      // Année complète
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);
      return { $gte: startDate, $lte: endDate };
    }
  }

  // Calculer les totaux
  calculateTotals(transactions) {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome: income,
      totalExpenses: expenses,
      netBalance: income - expenses,
      balance: income - expenses,
      transactionCount: transactions.length,
      averageTransaction: transactions.length > 0 ? (income + expenses) / transactions.length : 0
    };
  }

  // Calculer les catégories
  calculateCategories(transactions) {
    const categoryMap = new Map();

    transactions.forEach(transaction => {
      const key = `${transaction.category}_${transaction.type}`;

      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          category: transaction.category,
          name: transaction.category,
          amount: 0,
          count: 0,
          type: transaction.type,
          percentage: 0
        });
      }

      const category = categoryMap.get(key);
      category.amount += transaction.amount;
      category.count += 1;
    });

    const categories = Array.from(categoryMap.values());

    // Calculer les pourcentages
    const totalAmount = categories.reduce((sum, cat) => sum + cat.amount, 0);
    categories.forEach(category => {
      category.percentage = totalAmount > 0 ? Math.round((category.amount / totalAmount) * 100) : 0;
    });

    return categories.sort((a, b) => b.amount - a.amount);
  }

  // Calculer les tendances
  async calculateTrends(userId, year, month, currentTotals) {
    let previousPeriodTotals;

    if (month) {
      // Comparer avec le mois précédent
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;

      const prevDateFilter = this.buildDateFilter(prevYear, prevMonth);
      const prevTransactions = await TransactionCopy.find({
        userId,
        date: prevDateFilter,
        status: 'completed'
      });

      previousPeriodTotals = this.calculateTotals(prevTransactions);
    } else {
      // Comparer avec l'année précédente
      const prevDateFilter = this.buildDateFilter(year - 1);
      const prevTransactions = await TransactionCopy.find({
        userId,
        date: prevDateFilter,
        status: 'completed'
      });

      previousPeriodTotals = this.calculateTotals(prevTransactions);
    }

    const incomeChange = previousPeriodTotals.totalIncome > 0
      ? ((currentTotals.totalIncome - previousPeriodTotals.totalIncome) / previousPeriodTotals.totalIncome) * 100
      : 0;

    const expenseChange = previousPeriodTotals.totalExpenses > 0
      ? ((currentTotals.totalExpenses - previousPeriodTotals.totalExpenses) / previousPeriodTotals.totalExpenses) * 100
      : 0;

    // Trouver la catégorie principale
    const transactions = await TransactionCopy.find({
      userId,
      date: this.buildDateFilter(year, month),
      status: 'completed'
    });

    const categories = this.calculateCategories(transactions);
    const topCategory = categories.length > 0 ? categories[0].category : 'Aucune';

    return {
      incomeChange: Math.round(incomeChange * 100) / 100,
      expenseChange: Math.round(expenseChange * 100) / 100,
      averageTransaction: currentTotals.averageTransaction,
      topCategory
    };
  }

  // Calculer la répartition mensuelle pour l'année
  async calculateMonthlyBreakdown(userId, year) {
    const monthlyData = [];

    for (let month = 1; month <= 12; month++) {
      const dateFilter = this.buildDateFilter(year, month);
      const transactions = await TransactionCopy.find({
        userId,
        date: dateFilter,
        status: 'completed'
      });

      const totals = this.calculateTotals(transactions);

      monthlyData.push({
        month,
        income: totals.totalIncome,
        expenses: totals.totalExpenses,
        balance: totals.netBalance,
        transactionCount: totals.transactionCount
      });
    }

    return monthlyData;
  }

  // Générer des prévisions simples
  async generateForecast(userId) {
    try {
      // Récupérer les données des 6 derniers mois
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const recentTransactions = await TransactionCopy.find({
        userId,
        date: { $gte: sixMonthsAgo },
        status: 'completed'
      });

      if (recentTransactions.length === 0) {
        return { nextMonthPrediction: 0, confidence: 'low' };
      }

      // Calculer la moyenne mensuelle
      const monthlyTotals = this.calculateTotals(recentTransactions);
      const averageMonthlyBalance = monthlyTotals.netBalance / 6;

      return {
        nextMonthPrediction: Math.round(averageMonthlyBalance),
        confidence: recentTransactions.length > 20 ? 'high' : 'medium',
        basedOnTransactions: recentTransactions.length
      };

    } catch (error) {
      console.error('❌ Erreur génération prévisions:', error);
      return { nextMonthPrediction: 0, confidence: 'low' };
    }
  }

  // Sauvegarder les données analytics en cache
  async saveAnalyticsCache(analyticsData) {
    try {
      await AnalyticsData.findOneAndUpdate(
        {
          userId: analyticsData.userId,
          period: analyticsData.period,
          year: analyticsData.year,
          month: analyticsData.month
        },
        analyticsData,
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('❌ Erreur sauvegarde cache analytics:', error);
    }
  }

  // Récupérer les données depuis le cache
  async getCachedAnalytics(userId, year, month) {
    try {
      const period = month ? 'monthly' : 'yearly';
      const cached = await AnalyticsData.findOne({
        userId,
        period,
        year,
        month
      });

      // Vérifier si le cache est récent (moins de 1 heure)
      if (cached && cached.lastCalculated > new Date(Date.now() - 60 * 60 * 1000)) {
        return cached;
      }

      return null;
    } catch (error) {
      console.error('❌ Erreur récupération cache:', error);
      return null;
    }
  }

  // Retourner des stats vides
  getEmptyStats(userId, year, month) {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netBalance: 0,
      balance: 0,
      transactionCount: 0,
      averageTransaction: 0,
      categories: [],
      trends: {
        incomeChange: 0,
        expenseChange: 0,
        averageTransaction: 0,
        topCategory: 'Aucune'
      },
      monthlyData: month ? null : Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        income: 0,
        expenses: 0,
        balance: 0,
        transactionCount: 0
      })),
      metadata: {
        period: month ? 'monthly' : 'yearly',
        calculatedAt: new Date(),
        transactionCount: 0
      }
    };
  }
}

module.exports = new AnalyticsService();
