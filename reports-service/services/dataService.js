const axios = require('axios');

const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3001';
const MAIN_APP_URL = process.env.MAIN_APP_URL || 'http://localhost:3000';

async function fetchAnalyticsData(userId, period) {
  try {
    const response = await axios.get(`${ANALYTICS_SERVICE_URL}/analytics/stats/${userId}`, {
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching analytics data:', error.message);
    // Return empty data structure if analytics service is unavailable
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netBalance: 0,
      categoriesBreakdown: [],
      trends: {}
    };
  }
}

async function fetchTransactions(userId, period, type = 'monthly') {
  try {
    let url;

    if (type === 'monthly') {
      url = `${MAIN_APP_URL}/api/transactions?userId=${userId}&month=${period}`;
    } else if (type === 'yearly') {
      url = `${MAIN_APP_URL}/api/transactions?userId=${userId}&year=${period}`;
    } else if (typeof period === 'object') {
      // Custom period with startDate, endDate, category
      const params = new URLSearchParams({
        userId,
        startDate: period.startDate,
        endDate: period.endDate
      });

      if (period.category) {
        params.append('category', period.category);
      }

      url = `${MAIN_APP_URL}/api/transactions?${params}`;
    }

    const response = await axios.get(url, {
      timeout: 15000
    });

    return response.data.transactions || [];
  } catch (error) {
    console.error('Error fetching transactions:', error.message);
    return [];
  }
}

module.exports = {
  fetchAnalyticsData,
  fetchTransactions
};
