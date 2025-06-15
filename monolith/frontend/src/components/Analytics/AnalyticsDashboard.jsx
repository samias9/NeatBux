import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsApi } from '../../services/api';
import styles from './AnalyticsDashboard.module.css';

const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [trends, setTrends] = useState(null);
  const [categories, setCategories] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('2024-12'); // Current month

  useEffect(() => {
    if (user) {
      loadAnalyticsData();
    }
  }, [user, selectedPeriod]);

  const loadAnalyticsData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      // Load all analytics data in parallel
      const [statsData, trendsData, categoriesData] = await Promise.allSettled([
        analyticsApi.getStats(user.id, { period: selectedPeriod, periodType: 'monthly' }),
        analyticsApi.getTrends(user.id, selectedPeriod),
        analyticsApi.getCategories(user.id)
      ]);

      // Handle stats
      if (statsData.status === 'fulfilled') {
        setAnalytics(statsData.value);
      } else {
        console.error('Stats error:', statsData.reason);
      }

      // Handle trends
      if (trendsData.status === 'fulfilled') {
        setTrends(trendsData.value);
      } else {
        console.error('Trends error:', trendsData.reason);
      }

      // Handle categories
      if (categoriesData.status === 'fulfilled') {
        setCategories(categoriesData.value);
      } else {
        console.error('Categories error:', categoriesData.reason);
      }

    } catch (err) {
      setError('Erreur lors du chargement des analytics');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      await analyticsApi.refreshData(user.id);
      await loadAnalyticsData();
    } catch (err) {
      setError('Erreur lors de la mise à jour');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: user?.currency || 'EUR'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Chargement des analytics...</p>
      </div>
    );
  }

  return (
    <div className={styles.analyticsContainer}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h2>📊 Analytics Financières</h2>
          <p>Analyse de vos données financières</p>
        </div>

        <div className={styles.headerActions}>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className={styles.periodSelect}
          >
            <option value="2024-12">Décembre 2024</option>
            <option value="2024-11">Novembre 2024</option>
            <option value="2024-10">Octobre 2024</option>
            <option value="2024-09">Septembre 2024</option>
          </select>

          <button
            onClick={handleRefreshData}
            className={styles.refreshButton}
          >
            🔄 Actualiser
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <span className={styles.errorIcon}>⚠️</span>
          {error}
        </div>
      )}

      {/* Stats principales */}
      {analytics && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>💰</div>
            <div className={styles.statContent}>
              <h3>Revenus</h3>
              <p className={styles.statValue + ' ' + styles.income}>
                {formatCurrency(analytics.totalIncome)}
              </p>
              {analytics.trends?.incomeChange !== undefined && (
                <span className={`${styles.trend} ${analytics.trends.incomeChange >= 0 ? styles.positive : styles.negative}`}>
                  {analytics.trends.incomeChange >= 0 ? '↗️' : '↘️'} {analytics.trends.incomeChange}%
                </span>
              )}
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>💸</div>
            <div className={styles.statContent}>
              <h3>Dépenses</h3>
              <p className={styles.statValue + ' ' + styles.expense}>
                {formatCurrency(analytics.totalExpenses)}
              </p>
              {analytics.trends?.expenseChange !== undefined && (
                <span className={`${styles.trend} ${analytics.trends.expenseChange <= 0 ? styles.positive : styles.negative}`}>
                  {analytics.trends.expenseChange <= 0 ? '↘️' : '↗️'} {Math.abs(analytics.trends.expenseChange)}%
                </span>
              )}
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📈</div>
            <div className={styles.statContent}>
              <h3>Solde Net</h3>
              <p className={`${styles.statValue} ${analytics.netBalance >= 0 ? styles.income : styles.expense}`}>
                {formatCurrency(analytics.netBalance)}
              </p>
              <span className={styles.budgetStatus}>
                {analytics.predictions?.budgetStatus === 'on-track' && '✅ Sur la bonne voie'}
                {analytics.predictions?.budgetStatus === 'over' && '⚠️ Dépassement'}
                {analytics.predictions?.budgetStatus === 'under' && '💰 Économies'}
              </span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statContent}>
              <h3>Transaction Moyenne</h3>
              <p className={styles.statValue}>
                {formatCurrency(analytics.trends?.averageTransaction)}
              </p>
              {analytics.trends?.topCategory && (
                <span className={styles.topCategory}>
                  🏆 {analytics.trends.topCategory}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Répartition par catégories */}
      {analytics?.categoriesBreakdown && analytics.categoriesBreakdown.length > 0 && (
        <div className={styles.categoriesSection}>
          <h3>💳 Répartition par Catégorie</h3>
          <div className={styles.categoriesList}>
            {analytics.categoriesBreakdown.slice(0, 5).map((category, index) => (
              <div key={category.category} className={styles.categoryItem}>
                <div className={styles.categoryInfo}>
                  <span className={styles.categoryName}>{category.category}</span>
                  <span className={styles.categoryTransactions}>
                    {category.transactionCount} transaction{category.transactionCount > 1 ? 's' : ''}
                  </span>
                </div>
                <div className={styles.categoryAmount}>
                  <span className={styles.amount}>{formatCurrency(category.amount)}</span>
                  <span className={styles.percentage}>{category.percentage}%</span>
                </div>
                <div className={styles.categoryBar}>
                  <div
                    className={styles.categoryBarFill}
                    style={{ width: `${category.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anomalies et prédictions */}
      {analytics?.predictions?.anomalies && analytics.predictions.anomalies.length > 0 && (
        <div className={styles.anomaliesSection}>
          <h3>🔍 Transactions Inhabituelles</h3>
          <div className={styles.anomaliesList}>
            {analytics.predictions.anomalies.map((anomaly, index) => (
              <div key={index} className={styles.anomalyItem}>
                <span className={styles.anomalyIcon}>⚠️</span>
                <span className={styles.anomalyText}>{anomaly}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prédiction du mois prochain */}
      {analytics?.predictions?.nextMonthExpected && (
        <div className={styles.predictionSection}>
          <h3>🔮 Prédiction Mois Prochain</h3>
          <div className={styles.predictionCard}>
            <p>
              Dépenses estimées : <strong>{formatCurrency(analytics.predictions.nextMonthExpected)}</strong>
            </p>
            <p className={styles.predictionNote}>
              Basé sur vos habitudes de consommation actuelles
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
