import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import MonthlyChart from '../../components/MonthlyChart/monthlyChart';
import styles from './Dashboard.module.css';
import StatsCard from '../../components/StatsCard/statsCard'
import TestAnalytics from '../../components/TestAnalytics';
import Goals from '../../components/Goals/Goals';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    chartData: {},
    transactions: [],
    loading: true,
    error: null
  });

  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Simulation de données
  useEffect(() => {
    const fetchDashboardData = async () => {
      setDashboardData(prev => ({ ...prev, loading: true }));

      try {
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
      {/* Header avec le nom d'utilisateur */}
      <div className={styles.dashboardHeader}>
        <div className={styles.welcomeSection}>
          <h1>Bonjour {user?.name} ! 👋</h1>
          <p>Voici un aperçu de vos finances</p>
        </div>
        <div className={styles.userActions}>
          <span className={styles.userEmail}>{user?.email}</span>
          <button
            className={styles.logoutBtn}
            onClick={logout}
            title="Se déconnecter"
          >
            🚪 Déconnexion
          </button>
        </div>
      </div>

      {/* Contenu du dashboard */}
      <div className={styles.dashboardContent}>
        <Goals />
        {/* Vous pouvez ajouter d'autres composants ici */}
        {/* <MonthlyChart /> */}
        {/* <StatsCard /> */}
      </div>
    </div>
  );
}
