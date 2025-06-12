import React, { useState } from 'react';
import { analyticsApi, reportsApi } from '../services/api';

const TestAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const testAnalytics = async () => {
    setLoading(true);
    try {
      const stats = await analyticsApi.getStats('user123');
      setData(stats);
      console.log('Analytics data:', stats);
    } catch (error) {
      console.error('Error:', error);
      setData({ error: error.message });
    }
    setLoading(false);
  };

  const testReport = async () => {
    try {
      const result = await reportsApi.generateMonthly('user123', {
        month: '2024-06'
      });
      console.log('Report result:', result);
      alert('Rapport généré ! Check console');
    } catch (error) {
      console.error('Report error:', error);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h2>🧪 Test API Services</h2>

      <button onClick={testAnalytics} disabled={loading}>
        {loading ? 'Chargement...' : '📊 Test Analytics'}
      </button>

      <button onClick={testReport} style={{ marginLeft: '10px' }}>
        📄 Test Report
      </button>

      {data && (
        <pre style={{ background: '#f5f5f5', padding: '10px', marginTop: '10px' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default TestAnalytics;
