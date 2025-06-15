import { useState, useEffect } from 'react';
import apiService, { analyticsApi } from '../services/api';

export const useTransactions = (userId) => {
  const [transactions, setTransactions] = useState([]);
  const [analytics, setAnalytics] = useState(null); // NOUVEAU
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Vos transactions existantes
      const transactionsData = await apiService.getTransactions();
      setTransactions(transactionsData.transactions || []);

      // NOUVEAU: Analytics
      const analyticsData = await analyticsApi.getStats(userId);
      setAnalytics(analyticsData);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  return {
    transactions,
    analytics, // NOUVEAU
    loading,
    refetch: loadData
  };
};
