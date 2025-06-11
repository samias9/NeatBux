import React, { useEffect, useRef, useState } from 'react';
import styles from "./MonthlyChart.module.css";
import Chart from 'chart.js/auto';

const MonthlyChart = ({ chartData, chartType = 'bar' }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [activeChart, setActiveChart] = useState(chartType);

  // Données par défaut si aucune donnée n'est fournie ==> juste test data
  const defaultData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    income: [3000, 3200, 2800, 3500, 3100, 3300, 3400, 3600, 3200, 3800, 3500, 4000],
    expenses: [2200, 2400, 2100, 2800, 2300, 2500, 2600, 2700, 2400, 2900, 2600, 3200]
  };

  const data = chartData || defaultData;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const createChart = (type) => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
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
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
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

    const chartConfig = {
      type: type,
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Revenus',
            data: data.income,
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
            data: data.expenses,
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
      const totalIncome = data.income.reduce((a, b) => a + b, 0);
      const totalExpenses = data.expenses.reduce((a, b) => a + b, 0);

      chartConfig.data = {
        labels: ['Revenus', 'Dépenses', 'Économies'],
        datasets: [{
          data: [totalIncome, totalExpenses, Math.max(0, totalIncome - totalExpenses)],
          backgroundColor: [
            '#10b981',
            '#ef4444',
            '#3b82f6'
          ],
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverOffset: 10
        }]
      };

      chartConfig.options = {
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
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${formatCurrency(context.parsed)} (${percentage}%)`;
              }
            }
          }
        }
      };
    }

    chartInstance.current = new Chart(ctx, chartConfig);
  };

  useEffect(() => {
    createChart(activeChart);

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [activeChart, data]);

  const handleChartTypeChange = (type) => {
    setActiveChart(type);
  };

  // Calcul des statistiques
  const currentMonth = new Date().getMonth();
  const currentIncome = data.income[currentMonth] || 0;
  const currentExpenses = data.expenses[currentMonth] || 0;
  const previousIncome = data.income[currentMonth - 1] || 0;
  const previousExpenses = data.expenses[currentMonth - 1] || 0;

  const incomeChange = previousIncome ? ((currentIncome - previousIncome) / previousIncome * 100) : 0;
  const expenseChange = previousExpenses ? ((currentExpenses - previousExpenses) / previousExpenses * 100) : 0;

  return (
    <div className={styles.monthlyChartContainer}>
      <div className={styles.chartHeader}>
        <div className={styles.chartTitle}>
          <h3>Analyse Financière Mensuelle</h3>
          <p>Évolution de vos revenus et dépenses</p>
        </div>

        <div className={styles.chartControls}>
          <button
            className={`${styles.chartBtn} ${activeChart === 'bar' ? styles.active : ''}`}
            onClick={() => handleChartTypeChange('bar')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="8" width="4" height="13" fill="currentColor" rx="1"/>
              <rect x="10" y="4" width="4" height="17" fill="currentColor" rx="1"/>
              <rect x="17" y="11" width="4" height="10" fill="currentColor" rx="1"/>
            </svg>
            Barres
          </button>
          <button
            className={`${styles.chartBtn} ${activeChart === 'line' ? styles.active : ''}`}
            onClick={() => handleChartTypeChange('line')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M3 12l3-3 4 4 5-5 6 6" stroke="currentColor" strokeWidth="2" fill="none"/>
              <circle cx="3" cy="12" r="2" fill="currentColor"/>
              <circle cx="6" cy="9" r="2" fill="currentColor"/>
              <circle cx="10" cy="13" r="2" fill="currentColor"/>
              <circle cx="15" cy="8" r="2" fill="currentColor"/>
              <circle cx="21" cy="14" r="2" fill="currentColor"/>
            </svg>
            Ligne
          </button>
          <button
            className={`${styles.chartBtn} ${activeChart === 'doughnut' ? styles.active : ''}`}
            onClick={() => handleChartTypeChange('doughnut')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M12 4v8l6 2" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Secteurs
          </button>
        </div>
      </div>

      <div className={styles.chartStats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Revenus ce mois</span>
          <span className={`${styles.statValue} ${styles.income}`}>{formatCurrency(currentIncome)}</span>
          <span className={`${styles.statChange} ${incomeChange >= 0 ? styles.positive : styles.negative}`}>
            {incomeChange >= 0 ? '+' : ''}{incomeChange.toFixed(1)}%
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Dépenses ce mois</span>
          <span className={`${styles.statValue} ${styles.expense}`}>{formatCurrency(currentExpenses)}</span>
          <span className={`${styles.statChange} ${expenseChange <= 0 ? styles.positive : styles.negative}`}>
            {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(1)}%
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Solde mensuel</span>
          <span className={`${styles.statValue} ${currentIncome - currentExpenses >= 0 ? styles.income : styles.expense}`}>
            {formatCurrency(currentIncome - currentExpenses)}
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
