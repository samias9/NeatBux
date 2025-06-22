// monolith/frontend/src/components/MonthlyChart/monthlyChart.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import analyticsService from '../../services/analyticsService';
import apiService from '../../services/api';
import styles from "./MonthlyChart.module.css";
import Chart from 'chart.js/auto';

const MonthlyChart = ({ chartType = 'bar' }) => {
  const { user } = useAuth();
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [activeChart, setActiveChart] = useState(chartType);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatCurrency = (value) => {
    const currency = user?.currency || 'EUR';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(value);
  };

  // Récupérer les données UNIQUEMENT depuis le service Analytics
  const fetchUserFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Récupération des données Analytics...');

      const currentYear = new Date().getFullYear();

      // Appel au service Analytics - SANS fallback
      const response = await analyticsService.getChartData({ year: currentYear });

      console.log('📊 Données Analytics reçues:', response);

      if (response && response.labels && response.income && response.expenses) {
        setChartData({
          labels: response.labels,
          income: response.income,
          expenses: response.expenses,
          totals: response.totals || {
            income: response.income.reduce((a, b) => a + b, 0),
            expenses: response.expenses.reduce((a, b) => a + b, 0),
            balance: response.income.reduce((a, b) => a + b, 0) - response.expenses.reduce((a, b) => a + b, 0)
          }
        });

        // Vérifier si toutes les données sont à zéro
        if (response.income.every(x => x === 0) && response.expenses.every(x => x === 0)) {
          setError('Aucune transaction trouvée. Synchronisez vos données depuis le monolithe.');
        } else {
          setError(null);
        }

      } else {
        setError('Service Analytics indisponible ou données invalides');
        setChartData(null);
      }

    } catch (err) {
      console.error('❌ Erreur lors de la récupération des données Analytics:', err);
      setError(`Service Analytics: ${err.message}`);
      setChartData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserFinancialData();
    } else {
      setLoading(false);
      setError('Vous devez être connecté pour voir vos données');
    }
  }, [user]);

  const createChart = (type) => {
    if (!chartData || !chartRef.current) return;

    // Détruire le graphique existant
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    const ctx = chartRef.current.getContext('2d');

    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12,
              weight: '500'
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#1e293b',
          bodyColor: '#64748b',
          borderColor: '#e5e7eb',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: '#f1f5f9',
            borderDash: [2, 2]
          },
          ticks: {
            color: '#64748b',
            font: {
              size: 11
            },
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#64748b',
            font: {
              size: 11
            }
          }
        }
      }
    };

    let chartConfig = {
      type: type,
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: 'Revenus',
            data: chartData.income,
            backgroundColor: type === 'line' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.8)',
            borderColor: '#10b981',
            borderWidth: type === 'line' ? 3 : 1,
            borderRadius: type === 'bar' ? 6 : 0,
            fill: type === 'line',
            tension: 0.4,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: type === 'line' ? 6 : 0,
            pointHoverRadius: 8
          },
          {
            label: 'Dépenses',
            data: chartData.expenses,
            backgroundColor: type === 'line' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.8)',
            borderColor: '#ef4444',
            borderWidth: type === 'line' ? 3 : 1,
            borderRadius: type === 'bar' ? 6 : 0,
            fill: type === 'line',
            tension: 0.4,
            pointBackgroundColor: '#ef4444',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: type === 'line' ? 6 : 0,
            pointHoverRadius: 8
          }
        ]
      },
      options: commonOptions
    };

    if (type === 'doughnut') {
      const totalIncome = chartData.totals?.income || chartData.income.reduce((a, b) => a + b, 0);
      const totalExpenses = chartData.totals?.expenses || chartData.expenses.reduce((a, b) => a + b, 0);
      const savings = Math.max(0, totalIncome - totalExpenses);

      chartConfig = {
        type: 'doughnut',
        data: {
          labels: ['Revenus', 'Dépenses', 'Économies'],
          datasets: [{
            data: [totalIncome, totalExpenses, savings],
            backgroundColor: [
              '#10b981',
              '#ef4444',
              '#3b82f6'
            ],
            borderColor: '#ffffff',
            borderWidth: 3,
            hoverOffset: 10
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                padding: 20,
                font: {
                  size: 12,
                  weight: '500'
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              titleColor: '#1e293b',
              bodyColor: '#64748b',
              borderColor: '#e5e7eb',
              borderWidth: 1,
              cornerRadius: 8,
              padding: 12,
              callbacks: {
                label: function(context) {
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                  return `${context.label}: ${formatCurrency(context.parsed)} (${percentage}%)`;
                }
              }
            }
          }
        }
      };
    }

    try {
      chartInstance.current = new Chart(ctx, chartConfig);
    } catch (err) {
      console.error('❌ Erreur création graphique:', err);
    }
  };

  useEffect(() => {
    if (chartData && chartRef.current) {
      createChart(activeChart);
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [activeChart, chartData]);

  const handleChartTypeChange = (type) => {
    setActiveChart(type);
  };

  const handleRefresh = () => {
    if (user) {
      fetchUserFinancialData();
    }
  };

  // Synchroniser avec les vraies données du monolithe
  const handleSyncRealData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Synchronisation des vraies données du monolithe...');

      const syncResult = await analyticsService.syncData();

      console.log('📊 Résultat sync vraies données:', syncResult);

      if (syncResult.success) {
        setTimeout(() => {
          fetchUserFinancialData();
        }, 1000);
      } else {
        throw new Error(syncResult.message || 'Erreur de synchronisation');
      }

    } catch (error) {
      console.error('❌ Erreur synchronisation vraies données:', error);
      setError(`Erreur sync: ${error.message}`);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.monthlyChartContainer}>
        <div className={styles.chartHeader}>
          <div className={styles.chartTitle}>
            <h3>Analyse Financière Mensuelle</h3>
            <p>Chargement des données Analytics...</p>
          </div>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#64748b' }}>Récupération depuis le service Analytics...</p>
        </div>
      </div>
    );
  }

  // Si pas de données ou erreur, afficher un message d'invitation à synchroniser
  if (!chartData || error) {
    return (
      <div className={styles.monthlyChartContainer}>
        <div className={styles.chartHeader}>
          <div className={styles.chartTitle}>
            <h3>Analyse Financière Mensuelle</h3>
            <p style={{ color: '#f59e0b' }}>
              {error || 'Aucune donnée disponible'}
            </p>
          </div>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '300px',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '2px dashed #e5e7eb',
          gap: '20px',
          padding: '40px'
        }}>
          <div style={{ fontSize: '48px' }}>📊</div>
          <h4 style={{ margin: 0, color: '#64748b' }}>Aucune donnée financière disponible</h4>
          <p style={{
            textAlign: 'center',
            color: '#64748b',
            margin: 0,
            maxWidth: '400px'
          }}>
            Pour afficher vos graphiques, synchronisez vos données depuis le monolithe ou vérifiez que le service Analytics fonctionne correctement.
          </p>

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button
              onClick={handleSyncRealData}
              style={{
                padding: '12px 24px',
                background: '#3b82f6',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: 'white'
              }}
            >
              📊 Synchroniser Mes Données
            </button>

            <button
              onClick={handleRefresh}
              style={{
                padding: '12px 24px',
                background: '#f8fafc',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: '#475569'
              }}
            >
              🔄 Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calcul des statistiques du mois actuel
  const currentMonth = new Date().getMonth();
  const currentIncome = chartData.income[currentMonth] || 0;
  const currentExpenses = chartData.expenses[currentMonth] || 0;
  const previousIncome = chartData.income[currentMonth - 1] || 0;
  const previousExpenses = chartData.expenses[currentMonth - 1] || 0;

  const incomeChange = previousIncome ? ((currentIncome - previousIncome) / previousIncome * 100) : 0;
  const expenseChange = previousExpenses ? ((currentExpenses - previousExpenses) / previousExpenses * 100) : 0;

  return (
    <div className={styles.monthlyChartContainer}>
      <div className={styles.chartHeader}>
        <div className={styles.chartTitle}>
          <h3>Analyse Financière Mensuelle</h3>
          <p>
            Données réelles du service Analytics pour {new Date().getFullYear()}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleRefresh}
            style={{
              padding: '0.5rem 0.75rem',
              background: '#f8fafc',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#475569'
            }}
            title="Actualiser les données Analytics"
          >
            🔄 Actualiser
          </button>

          <button
            onClick={handleSyncRealData}
            style={{
              padding: '0.5rem 0.75rem',
              background: '#3b82f6',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: 'white'
            }}
            title="Synchroniser avec vos vraies données du monolithe"
          >
            📊 Synchroniser Données
          </button>

          <div className={styles.chartControls}>
            <button
              className={`${styles.chartBtn} ${activeChart === 'bar' ? styles.active : ''}`}
              onClick={() => handleChartTypeChange('bar')}
            >
              📊 Barres
            </button>
            <button
              className={`${styles.chartBtn} ${activeChart === 'line' ? styles.active : ''}`}
              onClick={() => handleChartTypeChange('line')}
            >
              📈 Ligne
            </button>
            <button
              className={`${styles.chartBtn} ${activeChart === 'doughnut' ? styles.active : ''}`}
              onClick={() => handleChartTypeChange('doughnut')}
            >
              🍩 Secteurs
            </button>
          </div>
        </div>
      </div>

      <div className={styles.chartStats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Revenus ce mois</span>
          <span className={`${styles.statValue} ${styles.income}`}>
            {formatCurrency(currentIncome)}
          </span>
          {previousIncome > 0 && (
            <span className={`${styles.statChange} ${incomeChange >= 0 ? styles.positive : styles.negative}`}>
              {incomeChange >= 0 ? '+' : ''}{incomeChange.toFixed(1)}%
            </span>
          )}
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Dépenses ce mois</span>
          <span className={`${styles.statValue} ${styles.expense}`}>
            {formatCurrency(currentExpenses)}
          </span>
          {previousExpenses > 0 && (
            <span className={`${styles.statChange} ${expenseChange <= 0 ? styles.positive : styles.negative}`}>
              {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(1)}%
            </span>
          )}
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Solde mensuel</span>
          <span className={`${styles.statValue} ${currentIncome - currentExpenses >= 0 ? styles.income : styles.expense}`}>
            {formatCurrency(currentIncome - currentExpenses)}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total année</span>
          <span className={`${styles.statValue} ${
            (chartData.totals?.income || chartData.income.reduce((a, b) => a + b, 0)) -
            (chartData.totals?.expenses || chartData.expenses.reduce((a, b) => a + b, 0)) >= 0 ? styles.income : styles.expense
          }`}>
            {formatCurrency(
              (chartData.totals?.income || chartData.income.reduce((a, b) => a + b, 0)) -
              (chartData.totals?.expenses || chartData.expenses.reduce((a, b) => a + b, 0))
            )}
          </span>
        </div>
      </div>

      <div className={styles.chartWrapper}>
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default MonthlyChart;
