import React from 'react';
import styles from './statsCard.module.css';

export default function StatsCard({ statsData }) {
  const {
    totalIncome = 0,
    totalExpenses = 0,
    balance = 0,
    transactionCount = 0,
    budgetUsed = 0,
    budgetLimit = 0
  } = statsData || {};

  const budgetPercentage = budgetLimit > 0 ? (budgetUsed / budgetLimit) * 100 : 0;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const getBalanceColor = (balance) => {
    if (balance > 0) return 'positive';
    if (balance < 0) return 'negative';
    return 'neutral';
  };

  const getBudgetColor = (percentage) => {
    if (percentage >= 90) return 'danger';
    if (percentage >= 75) return 'warning';
    return 'success';
  };

  return (
    <div className={styles.statsCardsContainer}>
      {/* Revenus totaux */}
      <div className={`${styles.statCard} ${styles.incomeCard}`}>
        <div className={styles.statIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M7 14l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className={styles.statContent}>
          <h3>Revenus</h3>
          <p className={styles.statAmount}>{formatCurrency(totalIncome)}</p>
          <span className={styles.statLabel}>Ce mois</span>
        </div>
      </div>

      {/* Dépenses totales */}
      <div className={`${styles.statCard} ${styles.expenseCard}`}>
        <div className={styles.statIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M17 10l-5 5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className={styles.statContent}>
          <h3>Dépenses</h3>
          <p className={styles.statAmount}>{formatCurrency(totalExpenses)}</p>
          <span className={styles.statLabel}>Ce mois</span>
        </div>
      </div>

      {/* Solde */}
      <div className={`${styles.statCard} ${styles.balanceCard} ${styles[getBalanceColor(balance)]}`}>
        <div className={styles.statIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M7 8h10M7 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div className={styles.statContent}>
          <h3>Solde</h3>
          <p className={styles.statAmount}>{formatCurrency(balance)}</p>
          <span className={styles.statLabel}>Revenus - Dépenses</span>
        </div>
      </div>

      {/* Nombre de transactions */}
      <div className={`${styles.statCard} ${styles.transactionsCard}`}>
        <div className={styles.statIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>
        <div className={styles.statContent}>
          <h3>Transactions</h3>
          <p className={styles.statAmount}>{transactionCount}</p>
          <span className={styles.statLabel}>Ce mois</span>
        </div>
      </div>

      {/* Budget utilisé */}
      <div className={`${styles.statCard} ${styles.budgetCard} ${styles[getBudgetColor(budgetPercentage)]}`}>
        <div className={styles.statIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className={styles.statContent}>
          <h3>Budget</h3>
          <p className={styles.statAmount}>{budgetPercentage.toFixed(1)}%</p>
          <span className={styles.statLabel}>
            {formatCurrency(budgetUsed)} / {formatCurrency(budgetLimit)}
          </span>
          <div className={styles.budgetProgress}>
            <div
              className={styles.budgetProgressBar}
              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Économies potentielles */}
      <div className={`${styles.statCard} ${styles.savingsCard}`}>
        <div className={styles.statIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>
        <div className={styles.statContent}>
          <h3>Économies</h3>
          <p className={styles.statAmount}>{formatCurrency(Math.max(0, totalIncome - totalExpenses))}</p>
          <span className={styles.statLabel}>Disponibles</span>
        </div>
      </div>
    </div>
  );
};
