import React from 'react';

const AnalyticsStats = ({ analytics }) => {
  if (!analytics) {
    return <div>Chargement des analytics...</div>;
  }

  return (
    <div className="analytics-stats">
      <div className="stats-grid">
        <div className="stat-item">
          <h3>💰 Revenus</h3>
          <p>{analytics.totalIncome?.toLocaleString()} €</p>
        </div>
        <div className="stat-item">
          <h3>💸 Dépenses</h3>
          <p>{analytics.totalExpenses?.toLocaleString()} €</p>
        </div>
        <div className="stat-item">
          <h3>📈 Solde</h3>
          <p>{analytics.netBalance?.toLocaleString()} €</p>
        </div>
      </div>

      {analytics.categoriesBreakdown && (
        <div className="categories">
          <h4>Top Catégories</h4>
          {analytics.categoriesBreakdown.slice(0, 3).map(cat => (
            <div key={cat.category} className="category-item">
              <span>{cat.category}</span>
              <span>{cat.amount?.toLocaleString()} € ({cat.percentage}%)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnalyticsStats;
