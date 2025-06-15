import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
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

  // Données par défaut en cas d'erreur
  const defaultData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    income: [3000, 3200, 2800, 3500, 3100, 3300, 3400, 3600, 3200, 3800, 3500, 4000],
    expenses: [2200, 2400, 2100, 2800, 2300, 2500, 2600, 2700, 2400, 2900, 2600, 3200]
  };

  const formatCurrency = (value) => {
    const currency = user?.currency || 'EUR';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(value);
  };

  // Récupérer et traiter les transactions directement
  const fetchUserFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Récupération des transactions...');

      // Récupérer toutes les transactions de l'année
      const currentYear = new Date().getFullYear();
      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear}-12-31`;

      const response = await apiService.getTransactions({
        startDate,
        endDate,
        limit: 1000 // Récupérer toutes les transactions
      });

      console.log('Transactions récupérées:', response);

      if (response && response.transactions && response.transactions.length > 0) {
        const transactions = response.transactions;

        // Organiser par mois
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        const monthlyData = {
          income: new Array(12).fill(0),
          expenses: new Array(12).fill(0)
        };

        // Traiter chaque transaction
        transactions.forEach(transaction => {
          const date = new Date(transaction.date);
          const month = date.getMonth(); // 0-11
          const amount = parseFloat(transaction.amount) || 0;

          if (transaction.type === 'income') {
            monthlyData.income[month] += amount;
          } else if (transaction.type === 'expense') {
            monthlyData.expenses[month] += amount;
          }
        });

        console.log('Données mensuelles calculées:', monthlyData);

        setChartData({
          labels: months,
          income: monthlyData.income,
          expenses: monthlyData.expenses,
          totals: {
            income: monthlyData.income.reduce((a, b) => a + b, 0),
            expenses: monthlyData.expenses.reduce((a, b) => a + b, 0)
          }
        });

        if (monthlyData.income.every(x => x === 0) && monthlyData.expenses.every(x => x === 0)) {
          setError('Aucune transaction trouvée pour cette année');
        }

      } else {
        console.log('Aucune transaction trouvée, utilisation des données par défaut');
        setChartData(defaultData);
        setError('Aucune transaction trouvée, affichage des données d\'exemple');
      }

    } catch (err) {
      console.error('Erreur lors de la récupération des données:', err);
      setError('Erreur de chargement: ' + err.message);
      setChartData(defaultData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserFinancialData();
    } else {
      setChartData(defaultData);
      setLoading(false);
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
      console.error('Erreur création graphique:', err);
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

  // Calcul des statistiques du mois actuel
  const currentMonth = new Date().getMonth();
  const displayData = chartData || defaultData;
  const currentIncome = displayData.income[currentMonth] || 0;
  const currentExpenses = displayData.expenses[currentMonth] || 0;
  const previousIncome = displayData.income[currentMonth - 1] || 0;
  const previousExpenses = displayData.expenses[currentMonth - 1] || 0;

  const incomeChange = previousIncome ? ((currentIncome - previousIncome) / previousIncome * 100) : 0;
  const expenseChange = previousExpenses ? ((currentExpenses - previousExpenses) / previousExpenses * 100) : 0;

  if (loading) {
    return (
      <div className={styles.monthlyChartContainer}>
        <div className={styles.chartHeader}>
          <div className={styles.chartTitle}>
            <h3>Analyse Financière Mensuelle</h3>
            <p>Chargement de vos données...</p>
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
          <p style={{ color: '#64748b' }}>Récupération de vos transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.monthlyChartContainer}>
      <div className={styles.chartHeader}>
        <div className={styles.chartTitle}>
          <h3>Analyse Financière Mensuelle</h3>
          <p>
            {error ? (
              <span style={{ color: '#f59e0b' }}>⚠️ {error}</span>
            ) : (
              `Évolution de vos revenus et dépenses pour ${new Date().getFullYear()}`
            )}
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
            title="Actualiser les données"
          >
            🔄 Actualiser
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
            (displayData.totals?.income || displayData.income.reduce((a, b) => a + b, 0)) -
            (displayData.totals?.expenses || displayData.expenses.reduce((a, b) => a + b, 0)) >= 0 ? styles.income : styles.expense
          }`}>
            {formatCurrency(
              (displayData.totals?.income || displayData.income.reduce((a, b) => a + b, 0)) -
              (displayData.totals?.expenses || displayData.expenses.reduce((a, b) => a + b, 0))
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
