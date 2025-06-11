import { useState, useEffect } from 'react';
import apiService from '../services/api';

export const useTransactions = (params = {}) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await apiService.getTransactions(params);
      setTransactions(data.transactions);
      setPagination({
        totalPages: data.totalPages,
        currentPage: data.currentPage,
        total: data.total
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transactionData) => {
    try {
      const data = await apiService.createTransaction(transactionData);
      setTransactions(prev => [data.transaction, ...prev]);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateTransaction = async (id, transactionData) => {
    try {
      const data = await apiService.updateTransaction(id, transactionData);
      setTransactions(prev =>
        prev.map(t => t._id === id ? data.transaction : t)
      );
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await apiService.deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t._id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [JSON.stringify(params)]);

  return {
    transactions,
    loading,
    error,
    pagination,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: fetchTransactions
  };
};
