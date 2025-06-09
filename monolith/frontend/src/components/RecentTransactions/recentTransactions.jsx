import React, { useState } from 'react';
import styles from './RecentTransactions.module.css';

export default function RecentTransactions({ transactions = [], onViewAll, onEditTransaction, onDeleteTransaction }) {
  const [filter, setFilter] = useState('all');

  // Données par défaut si aucune transaction n'est fournie
  const defaultTransactions = [
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
    },
    {
      id: 4,
      date: '2024-06-05',
      description: 'Essence Shell',
      category: 'Transport',
      type: 'expense',
      amount: 65.80,
      status: 'completed'
    },
    {
      id: 5,
      date: '2024-06-04',
      description: 'Freelance projet web',
      category: 'Revenus supplémentaires',
      type: 'income',
      amount: 800,
      status: 'pending'
    },
    {
      id: 6,
      date: '2024-06-03',
      description: 'Netflix abonnement',
      category: 'Divertissement',
      type: 'expense',
      amount: 16.99,
      status: 'completed'
    },
    {
      id: 7,
      date: '2024-06-03',
      description: 'Pharmacie Jean Coutu',
      category: 'Santé',
      type: 'expense',
      amount: 45.30,
      status: 'completed'
    },
    {
      id: 8,
      date: '2024-06-02',
      description: 'Restaurant La Banquise',
      category: 'Sorties',
      type: 'expense',
      amount: 78.90,
      status: 'completed'
    }
  ];

  const data = transactions.length > 0 ? transactions : defaultTransactions;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-CA', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const getRelativeDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = today - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return formatDate(dateString);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Salaire': '💼',
      'Revenus supplémentaires': '💰',
      'Alimentation': '🛒',
      'Logement': '🏠',
      'Transport': '⛽',
      'Divertissement': '🎬',
      'Santé': '💊',
      'Sorties': '🍽️',
      'Éducation': '📚',
      'Shopping': '🛍️',
      'Utilities': '⚡',
      'default': '📝'
    };
    return icons[category] || icons.default;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'completed';
      case 'pending': return 'pending';
      case 'failed': return 'failed';
      default: return 'completed';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Complétée';
      case 'pending': return 'En attente';
      case 'failed': return 'Échouée';
      default: return 'Complétée';
    }
  };

  const filteredTransactions = data.filter(transaction => {
    if (filter === 'all') return true;
    return transaction.type === filter;
  });

  const handleEdit = (transaction) => {
    if (onEditTransaction) {
      onEditTransaction(transaction);
    }
  };

  const handleDelete = (transactionId) => {
    if (onDeleteTransaction) {
      if (window.confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
        onDeleteTransaction(transactionId);
      }
    }
  };

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    }
  };

  return (
    <div className={styles.recentTransactionsContainer}>
      <div className={styles.transactionsHeader}>
        <div className={styles.headerTitle}>
          <h3>Transactions Récentes</h3>
          <p>{filteredTransactions.length} transaction{filteredTransactions.length > 1 ? 's' : ''}</p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.filterButtons}>
            <button
              className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
              onClick={() => setFilter('all')}
            >
              Toutes
            </button>
            <button
              className={`${styles.filterBtn} ${filter === 'income' ? styles.active : ''}`}
              onClick={() => setFilter('income')}
            >
              Revenus
            </button>
            <button
              className={`${styles.filterBtn} ${filter === 'expense' ? styles.active : ''}`}
              onClick={() => setFilter('expense')}
            >
              Dépenses
            </button>
          </div>

          <button className={styles.viewAllBtn} onClick={handleViewAll}>
            Voir tout
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.transactionsList}>
        {filteredTransactions.slice(0, 8).map((transaction) => (
          <div key={transaction.id} className={styles.transactionItem}>
            <div className={styles.transactionIcon}>
              <span className={styles.categoryEmoji}>{getCategoryIcon(transaction.category)}</span>
            </div>

            <div className={styles.transactionDetails}>
              <div className={styles.transactionMain}>
                <h4 className={styles.transactionDescription}>{transaction.description}</h4>
                <span className={styles.transactionCategory}>{transaction.category}</span>
              </div>
              <div className={styles.transactionMeta}>
                <span className={styles.transactionDate}>{getRelativeDate(transaction.date)}</span>
                <span className={`${styles.transactionStatus} ${styles[getStatusColor(transaction.status)]}`}>
                  {getStatusText(transaction.status)}
                </span>
              </div>
            </div>

            <div className={styles.transactionAmount}>
              <span className={`${styles.amount} ${styles[transaction.type]}`}>
                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
              </span>
            </div>

            <div className={styles.transactionActions}>
              <button
                className={`${styles.actionBtn} ${styles.editBtn}`}
                onClick={() => handleEdit(transaction)}
                title="Modifier"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button
                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                onClick={() => handleDelete(transaction.id)}
                title="Supprimer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTransactions.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📊</div>
          <h4>Aucune transaction trouvée</h4>
          <p>Commencez par ajouter votre première transaction.</p>
        </div>
      )}

      {filteredTransactions.length > 8 && (
        <div className={styles.transactionsFooter}>
          <button className={styles.loadMoreBtn} onClick={handleViewAll}>
            Voir {filteredTransactions.length - 8} transaction{filteredTransactions.length - 8 > 1 ? 's' : ''} de plus
          </button>
        </div>
      )}
    </div>
  );
}
