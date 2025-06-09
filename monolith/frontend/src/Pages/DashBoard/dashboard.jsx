import React, { useState, useEffect } from 'react';
import Header from '../../components/Header/header';
import StatsCard from '../../components/StatsCard/statsCard';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    chartData: {},
    transactions: [],
    loading: true,
    error: null
  });

  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Simulation de données (à remplacer par des appels API réels)
  useEffect(() => {
    const fetchDashboardData = async () => {
      setDashboardData(prev => ({ ...prev, loading: true }));

      try {
        // Simulation d'un délai de chargement
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Données simulées
        const mockData = {
          stats: {
            totalIncome: 4300,
            totalExpenses: 2890,
            balance: 1410,
            transactionCount: 23,
            budgetUsed: 2890,
            budgetLimit: 3500
          },
          chartData: {
            labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
            income: [3000, 3200, 2800, 3500, 3100, 4300],
            expenses: [2200, 2400, 2100, 2800, 2300, 2890]
          },
          transactions: [
            {
              id: 1,
              date: '2024-06-07',
              description: 'Salaire mensuel',
              category: 'Salaire',
              type: 'income',
              amount: 3500,
              status: 'completed'
            },
            {
              id: 2,
              date: '2024-06-06',
              description: 'Épicerie Metro',
              category: 'Alimentation',
              type: 'expense',
              amount: 127.45,
              status: 'completed'
            },
            {
              id: 3,
              date: '2024-06-05',
              description: 'Paiement loyer',
              category: 'Logement',
              type: 'expense',
              amount: 1200,
              status: 'completed'
            }
          ]
        };

        setDashboardData({
          stats: mockData.stats,
          chartData: mockData.chartData,
          transactions: mockData.transactions,
          loading: false,
          error: null
        });

      } catch (error) {
        setDashboardData(prev => ({
          ...prev,
          loading: false,
          error: 'Erreur lors du chargement des données'
        }));
      }
    };

    fetchDashboardData();
  }, [selectedPeriod]);

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  const handleViewAllTransactions = () => {
    // Navigation vers la page des transactions
    console.log('Navigation vers /transactions');
    // Ici vous pouvez utiliser react-router pour naviguer
    // navigate('/transactions');
  };

  const handleEditTransaction = (transaction) => {
    console.log('Éditer la transaction:', transaction);
    // Ouvrir un modal d'édition ou naviguer vers le formulaire
  };

  const handleDeleteTransaction = (transactionId) => {
    console.log('Supprimer la transaction:', transactionId);
    // Appel API pour supprimer la transaction
    setDashboardData(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== transactionId)
    }));
  };

  const handleRefreshData = () => {
    setDashboardData(prev => ({ ...prev, loading: true }));
    // Relancer le chargement des données
    window.location.reload();
  };

  if (dashboardData.loading) {
    return (
      <div className={styles.dashboardContainer}>
        <div className={styles.dashboardLoading}>
          <div className={styles.loadingSpinner}></div>
          <p>Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (dashboardData.error) {
    return (
      <div className={styles.dashboardContainer}>
        <div className={styles.dashboardError}>
          <div className={styles.errorIcon}>⚠️</div>
          <h3>Erreur de chargement</h3>
          <p>{dashboardData.error}</p>
          <button className={styles.retryBtn} onClick={handleRefreshData}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
        <Header />
        <StatsCard />
        {/* En-tête du tableau de bord */}
      <div className={styles.dashboardHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerTitle}>
            <h1>Tableau de bord</h1>
            <p>Bienvenue ! Voici un aperçu de vos finances.</p>
          </div>

          <div className={styles.headerActions}>
            <div className={styles.periodSelector}>
              <button
                className={`${styles.periodBtn} ${selectedPeriod === 'week' ? styles.active : ''}`}
                onClick={() => handlePeriodChange('week')}
              >
                Semaine
              </button>
              <button
                className={`${styles.periodBtn} ${selectedPeriod === 'month' ? styles.active : ''}`}
                onClick={() => handlePeriodChange('month')}
              >
                Mois
              </button>
              <button
                className={`${styles.periodBtn} ${selectedPeriod === 'year' ? styles.active : ''}`}
                onClick={() => handlePeriodChange('year')}
              >
                Année
              </button>
            </div>

            <button className={styles.refreshBtn} onClick={handleRefreshData} title="Actualiser">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M23 4v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>


    </div>
  );
}
