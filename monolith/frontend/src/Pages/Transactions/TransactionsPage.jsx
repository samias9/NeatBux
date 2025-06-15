import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import RecentTransactions from '../../components/RecentTransactions/RecentTransactions';
import TransactionForm from '../../components/TransactionForm/TransactionForm';
import styles from './TransactionsPage.module.css';

const TransactionsPage = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filter, setFilter] = useState({
    type: 'all',
    category: '',
    startDate: '',
    endDate: ''
  });
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    transactionCount: 0
  });

  useEffect(() => {
    loadTransactions();
    loadStats();
  }, [filter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const params = {};

      if (filter.type !== 'all') params.type = filter.type;
      if (filter.category) params.category = filter.category;
      if (filter.startDate) params.startDate = filter.startDate;
      if (filter.endDate) params.endDate = filter.endDate;

      const response = await apiService.getTransactions(params);
      setTransactions(response.transactions || []);
    } catch (error) {
      setError('Erreur lors du chargement des transactions');
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiService.getTransactionStats();
      setStats(response.stats || {});
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleAddTransaction = async (transactionData) => {
    try {
      const response = await apiService.createTransaction(transactionData);
      setTransactions([response.transaction, ...transactions]);
      setShowAddForm(false);
      loadStats(); // Mettre à jour les statistiques
      return { success: true };
    } catch (error) {
      console.error('Error adding transaction:', error);
      return { success: false, message: error.message };
    }
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setShowAddForm(true);
  };

  const handleUpdateTransaction = async (transactionData) => {
    try {
      const response = await apiService.updateTransaction(editingTransaction._id, transactionData);
      setTransactions(transactions.map(t =>
        t._id === editingTransaction._id ? response.transaction : t
      ));
      setEditingTransaction(null);
      setShowAddForm(false);
      loadStats();
      return { success: true };
    } catch (error) {
      console.error('Error updating transaction:', error);
      return { success: false, message: error.message };
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    try {
      await apiService.deleteTransaction(transactionId);
      setTransactions(transactions.filter(t => t._id !== transactionId));
      loadStats();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setError('Erreur lors de la suppression');
    }
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditingTransaction(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: user?.currency || 'EUR'
    }).format(amount);
  };

  if (loading && transactions.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Chargement des transactions...</p>
      </div>
    );
  }

  return (
    <div className={styles.transactionsPage}>
      {/* Header avec statistiques */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1>Mes Transactions</h1>
          <p>Gérez vos revenus et dépenses</p>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>💰</div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Revenus</p>
              <p className={styles.statValue + ' ' + styles.income}>
                {formatCurrency(stats.totalIncome)}
              </p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>💸</div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Dépenses</p>
              <p className={styles.statValue + ' ' + styles.expense}>
                {formatCurrency(stats.totalExpenses)}
              </p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Balance</p>
              <p className={`${styles.statValue} ${stats.balance >= 0 ? styles.income : styles.expense}`}>
                {formatCurrency(stats.balance)}
              </p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📝</div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Transactions</p>
              <p className={styles.statValue}>
                {stats.transactionCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actionsBar}>
        <button
          className={styles.addButton}
          onClick={() => setShowAddForm(true)}
        >
          <span className={styles.addIcon}>➕</span>
          Ajouter une transaction
        </button>

        <div className={styles.filterControls}>
          <select
            value={filter.type}
            onChange={(e) => setFilter({...filter, type: e.target.value})}
            className={styles.filterSelect}
          >
            <option value="all">Tous types</option>
            <option value="income">Revenus</option>
            <option value="expense">Dépenses</option>
          </select>

          <input
            type="date"
            value={filter.startDate}
            onChange={(e) => setFilter({...filter, startDate: e.target.value})}
            className={styles.filterInput}
            placeholder="Date de début"
          />

          <input
            type="date"
            value={filter.endDate}
            onChange={(e) => setFilter({...filter, endDate: e.target.value})}
            className={styles.filterInput}
            placeholder="Date de fin"
          />
        </div>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className={styles.errorMessage}>
          <span className={styles.errorIcon}>⚠️</span>
          {error}
        </div>
      )}

      {/* Formulaire d'ajout/modification */}
      {showAddForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <TransactionForm
              transaction={editingTransaction}
              onSubmit={editingTransaction ? handleUpdateTransaction : handleAddTransaction}
              onCancel={handleCloseForm}
              isEditing={!!editingTransaction}
            />
          </div>
        </div>
      )}

      {/* Liste des transactions */}
      <div className={styles.transactionsContent}>
        <RecentTransactions
          transactions={transactions}
          onEditTransaction={handleEditTransaction}
          onDeleteTransaction={handleDeleteTransaction}
          onViewAll={() => {}} // Déjà sur la page complète
        />
      </div>
    </div>
  );
};

export default TransactionsPage;
