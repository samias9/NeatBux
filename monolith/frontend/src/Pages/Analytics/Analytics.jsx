// monolith/frontend/src/pages/Analytics/Analytics.jsx
import React, { useState, useEffect } from 'react';
import styles from './Analytics.module.css';

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const ANALYTICS_SERVICE_URL = 'http://localhost:3002';

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Tentative de connexion au service Analytics...');

      // Test de connectivité d'abord
      const healthCheck = await fetch(`${ANALYTICS_SERVICE_URL}/analytics/stats`)
        .catch(err => {
          throw new Error(`Impossible de se connecter au service Analytics sur ${ANALYTICS_SERVICE_URL}. Vérifiez que le service est démarré.`);
        });

      if (!healthCheck.ok) {
        throw new Error(`Service Analytics indisponible (Status: ${healthCheck.status})`);
      }

      // Si le premier appel réussit, on fait les autres
      const [statsResponse, trendsResponse, forecastResponse] = await Promise.all([
        fetch(`${ANALYTICS_SERVICE_URL}/analytics/stats`),
        fetch(`${ANALYTICS_SERVICE_URL}/analytics/trends`),
        fetch(`${ANALYTICS_SERVICE_URL}/analytics/forecast`)
      ]);

      // Vérification détaillée de chaque réponse
      if (!statsResponse.ok) {
        throw new Error(`Erreur stats: ${statsResponse.status} ${statsResponse.statusText}`);
      }
      if (!trendsResponse.ok) {
        throw new Error(`Erreur trends: ${trendsResponse.status} ${trendsResponse.statusText}`);
      }
      if (!forecastResponse.ok) {
        throw new Error(`Erreur forecast: ${forecastResponse.status} ${forecastResponse.statusText}`);
      }

      const statsData = await statsResponse.json();
      const trendsData = await trendsResponse.json();
      const forecastData = await forecastResponse.json();

      console.log('Données reçues:', { statsData, trendsData, forecastData });

      setStats(statsData);
      setTrends(trendsData);
      setForecast(forecastData);
    } catch (err) {
      setError(err.message);
      console.error('Erreur détaillée Analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className={styles.loading}>Chargement des analytics...</div>;
  if (error) return <div className={styles.error}>Erreur: {error}</div>;

  return (
    <div className={styles.analyticsContainer}>
      <h1>Tableau de Bord Analytics</h1>

      {/* Section Statistiques */}
      <div className={styles.section}>
        <h2>Statistiques Générales</h2>
        {stats && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <h3>Total des Transactions</h3>
              <p className={styles.statValue}>{stats.total}€</p>
            </div>
            <div className={styles.statCard}>
              <h3>Moyenne par Transaction</h3>
              <p className={styles.statValue}>{stats.average?.toFixed(2)}€</p>
            </div>
          </div>
        )}
      </div>

      {/* Section Tendances */}
      <div className={styles.section}>
        <h2>Tendances par Mois</h2>
        {trends && (
          <div className={styles.trendsContainer}>
            {Object.entries(trends).map(([month, amount]) => (
              <div key={month} className={styles.trendItem}>
                <span className={styles.month}>{month}</span>
                <span className={styles.amount}>{amount}€</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section Prévisions */}
      <div className={styles.section}>
        <h2>Prévisions</h2>
        {forecast && (
          <div className={styles.forecastCard}>
            <h3>Prédiction Mois Prochain</h3>
            <p className={styles.forecastValue}>
              {forecast.nextMonthPrediction?.toFixed(2)}€
            </p>
          </div>
        )}
      </div>

      <button onClick={fetchAnalyticsData} className={styles.refreshButton}>
        Actualiser les données
      </button>
    </div>
  );
};

export default Analytics;
