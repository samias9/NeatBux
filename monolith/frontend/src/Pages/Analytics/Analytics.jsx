// monolith/frontend/src/pages/Analytics/Analytics.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import analyticsService from '../../services/analyticsService';
import apiService from '../../services/api';
import styles from './Analytics.module.css';

const Analytics = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
      checkSyncStatus();
    }
  }, [user]);

  // Récupérer les données depuis le vrai service Analytics
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Récupération des données depuis le service Analytics...');

      // Appels parallèles au service Analytics
      const [statsData, trendsData, forecastData] = await Promise.all([
        analyticsService.getStats().catch(err => {
          console.warn('Stats failed:', err.message);
          return null;
        }),
        analyticsService.getTrends().catch(err => {
          console.warn('Trends failed:', err.message);
          return null;
        }),
        analyticsService.getForecast().catch(err => {
          console.warn('Forecast failed:', err.message);
          return null;
        })
      ]);

      console.log('📊 Données reçues:', { statsData, trendsData, forecastData });

      // Utiliser uniquement les données réelles du service
      setStats(statsData || {
        totalIncome: 0,
        totalExpenses: 0,
        netBalance: 0,
        transactionCount: 0,
        averageTransaction: 0
      });

      setTrends(trendsData || {});

      setForecast(forecastData || {
        nextMonthPrediction: 0,
        confidence: 'low'
      });

      // Si aucune donnée réelle n'est disponible
      if (!statsData || (statsData.totalIncome === 0 && statsData.totalExpenses === 0)) {
        setError('Aucune donnée réelle trouvée. Synchronisez vos données depuis le monolithe.');
      }

    } catch (err) {
      console.error('❌ Erreur récupération Analytics:', err);
      setError(`Erreur service Analytics: ${err.message}`);

      // Pas de données de fallback - uniquement les vraies données
      setStats({
        totalIncome: 0,
        totalExpenses: 0,
        netBalance: 0,
        transactionCount: 0,
        averageTransaction: 0
      });
      setTrends({});
      setForecast({ nextMonthPrediction: 0, confidence: 'low' });
    } finally {
      setLoading(false);
    }
  };

  // Vérifier le statut de synchronisation
  const checkSyncStatus = async () => {
    try {
      const status = await analyticsService.getSyncStatus();
      setSyncStatus(status);
      console.log('📋 Statut sync:', status);
    } catch (error) {
      console.warn('Impossible de récupérer le statut de sync:', error.message);
    }
  };

  // Synchroniser avec les vraies données du monolithe UNIQUEMENT
  const handleSyncRealData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Synchronisation des vraies données depuis le monolithe...');

      const token = apiService.getToken();
      if (!token) {
        throw new Error('Vous devez être connecté pour synchroniser');
      }

      // Appel direct au service Analytics pour sync des vraies données
      const response = await fetch('http://localhost:3002/analytics/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      console.log('📊 Résultat sync:', result);

      if (result.success) {
        // Attendre un peu puis recharger les données
        setTimeout(() => {
          fetchAnalyticsData();
          checkSyncStatus();
        }, 2000);
      } else {
        throw new Error(result.message || 'Erreur de synchronisation');
      }

    } catch (error) {
      console.error('❌ Erreur synchronisation:', error);
      setError(`Erreur sync: ${error.message}`);
      setLoading(false);
    }
  };

  // Tester la connexion au service Analytics
  const handleTestConnection = async () => {
    try {
      setError(null);
      console.log('🔍 Test de connexion au service Analytics...');

      const health = await analyticsService.healthCheck();
      console.log('🏥 Health check:', health);

      if (health.status === 'OK') {
        setError('✅ Service Analytics connecté et fonctionnel !');
      } else {
        setError('⚠️ Service Analytics répond mais avec des erreurs');
      }
    } catch (error) {
      setError(`❌ Service Analytics inaccessible: ${error.message}`);
    }
  };

  const formatCurrency = (amount) => {
    const currency = user?.currency || 'EUR';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className={styles.analyticsContainer}>
        <div className={styles.loading}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Chargement des analytics depuis le service...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.analyticsContainer}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Tableau de Bord Analytics</h1>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleTestConnection}
            style={{
              padding: '8px 16px',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔍 Test Connexion
          </button>

          <button
            onClick={handleSyncRealData}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📊 Synchroniser Données
          </button>

          <button
            onClick={fetchAnalyticsData}
            style={{
              padding: '8px 16px',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 Actualiser
          </button>
        </div>
      </div>

      {/* Messages d'erreur ou de statut */}
      {error && (
        <div style={{
          padding: '15px',
          background: error.includes('✅') ? '#d1fae5' : error.includes('⚠️') ? '#fef3c7' : '#fee2e2',
          color: error.includes('✅') ? '#065f46' : error.includes('⚠️') ? '#92400e' : '#991b1b',
          borderRadius: '8px',
          marginBottom: '20px',
          fontWeight: '500'
        }}>
          {error}
        </div>
      )}

      {/* Section Statistiques */}
      <div className={styles.section}>
        <h2>Statistiques Générales</h2>
        {stats && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <h3>Nombre de Transactions</h3>
              <p className={styles.statValue}>{stats.transactionCount || 0}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Moyenne par Transaction</h3>
              <p className={styles.statValue}>{formatCurrency(stats.averageTransaction)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Section Prévisions */}
      <div className={styles.section}>
        <h2>Prévisions</h2>
        {forecast ? (
          <div className={styles.forecastCard}>
            <h3>Prédiction Mois Prochain</h3>
            <p className={styles.forecastValue}>
              {formatCurrency(forecast.nextMonthPrediction)}
            </p>
            {forecast.confidence && (
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '10px' }}>
                Confiance: {forecast.confidence}
                {forecast.basedOnTransactions && ` (basé sur ${forecast.basedOnTransactions} transactions)`}
              </p>
            )}
          </div>
        ) : (
          <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
            Aucune prévision disponible. Ajoutez plus de transactions pour générer des prévisions.
          </p>
        )}
      </div>
    </div>
  );
};

export default Analytics;
