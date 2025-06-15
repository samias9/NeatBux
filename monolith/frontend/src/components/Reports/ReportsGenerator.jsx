import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { reportsApi } from '../../services/api';
import styles from './ReportsGenerator.module.css';

const ReportsGenerator = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatingReports, setGeneratingReports] = useState(new Set());

  useEffect(() => {
    if (user) {
      loadReportsHistory();
    }
  }, [user]);

  const loadReportsHistory = async () => {
    if (!user) return;

    try {
      const response = await reportsApi.getHistory(user.id);
      setReports(response.reports || []);
    } catch (err) {
      console.error('Error loading reports:', err);
    }
  };

  const generateMonthlyReport = async () => {
    if (!user) return;

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    try {
      setLoading(true);
      setError('');

      const response = await reportsApi.generateMonthly(user.id, {
        month: currentMonth,
        includeCharts: true,
        includeDetails: true
      });

      if (response.reportId) {
        setGeneratingReports(prev => new Set([...prev, response.reportId]));

        // Poll for completion
        pollReportStatus(response.reportId);
      }

    } catch (err) {
      setError('Erreur lors de la génération du rapport mensuel');
      console.error('Monthly report error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateAnnualReport = async () => {
    if (!user) return;

    const currentYear = new Date().getFullYear().toString();

    try {
      setLoading(true);
      setError('');

      const response = await reportsApi.generateAnnual(user.id, {
        year: currentYear,
        includeCharts: true,
        includeDetails: true
      });

      if (response.reportId) {
        setGeneratingReports(prev => new Set([...prev, response.reportId]));
        pollReportStatus(response.reportId);
      }

    } catch (err) {
      setError('Erreur lors de la génération du rapport annuel');
      console.error('Annual report error:', err);
    } finally {
      setLoading(false);
    }
  };

  const pollReportStatus = async (reportId) => {
    const checkStatus = async () => {
      try {
        const response = await reportsApi.getStatus(reportId);

        if (response.status === 'completed') {
          setGeneratingReports(prev => {
            const newSet = new Set(prev);
            newSet.delete(reportId);
            return newSet;
          });

          // Refresh reports list
          loadReportsHistory();

        } else if (response.status === 'failed') {
          setGeneratingReports(prev => {
            const newSet = new Set(prev);
            newSet.delete(reportId);
            return newSet;
          });
          setError('Échec de la génération du rapport');

        } else {
          // Still generating, check again in 3 seconds
          setTimeout(checkStatus, 3000);
        }
      } catch (err) {
        console.error('Error checking report status:', err);
        setGeneratingReports(prev => {
          const newSet = new Set(prev);
          newSet.delete(reportId);
          return newSet;
        });
      }
    };

    // Start polling
    setTimeout(checkStatus, 2000);
  };

  const downloadReport = (reportId, title) => {
    const downloadUrl = reportsApi.downloadReport(reportId);

    // Create a temporary link to trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteReport = async (reportId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) {
      return;
    }

    try {
      await reportsApi.deleteReport(reportId);
      setReports(reports.filter(report => report._id !== reportId));
    } catch (err) {
      setError('Erreur lors de la suppression du rapport');
      console.error('Delete report error:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'generating': return '⏳';
      case 'failed': return '❌';
      case 'pending': return '⏸️';
      default: return '📄';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'generating': return 'En cours...';
      case 'failed': return 'Échec';
      case 'pending': return 'En attente';
      default: return 'Inconnu';
    }
  };

  return (
    <div className={styles.reportsContainer}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h2>📋 Générateur de Rapports</h2>
          <p>Créez des rapports détaillés de vos finances</p>
        </div>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <span className={styles.errorIcon}>⚠️</span>
          {error}
        </div>
      )}

      {/* Actions de génération */}
      <div className={styles.generatorSection}>
        <h3>🚀 Générer un Nouveau Rapport</h3>

        <div className={styles.generatorGrid}>
          <div className={styles.generatorCard}>
            <div className={styles.cardIcon}>📅</div>
            <div className={styles.cardContent}>
              <h4>Rapport Mensuel</h4>
              <p>Analyse détaillée de vos finances du mois en cours</p>
              <ul className={styles.featureList}>
                <li>✅ Revenus et dépenses</li>
                <li>✅ Répartition par catégorie</li>
                <li>✅ Tendances et comparaisons</li>
                <li>✅ Liste des transactions</li>
              </ul>
            </div>
            <button
              onClick={generateMonthlyReport}
              disabled={loading}
              className={styles.generateButton}
            >
              {loading ? '⏳ Génération...' : '📄 Générer Rapport Mensuel'}
            </button>
          </div>

          <div className={styles.generatorCard}>
            <div className={styles.cardIcon}>📊</div>
            <div className={styles.cardContent}>
              <h4>Rapport Annuel</h4>
              <p>Vue d'ensemble complète de votre année financière</p>
              <ul className={styles.featureList}>
                <li>✅ Analyse mensuelle</li>
                <li>✅ Évolution des tendances</li>
                <li>✅ Comparaisons annuelles</li>
                <li>✅ Graphiques détaillés</li>
              </ul>
            </div>
            <button
              onClick={generateAnnualReport}
              disabled={loading}
              className={styles.generateButton}
            >
              {loading ? '⏳ Génération...' : '📈 Générer Rapport Annuel'}
            </button>
          </div>
        </div>
      </div>

      {/* Historique des rapports */}
      <div className={styles.historySection}>
        <h3>📚 Historique des Rapports</h3>

        {reports.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📄</div>
            <h4>Aucun rapport généré</h4>
            <p>Commencez par générer votre premier rapport !</p>
          </div>
        ) : (
          <div className={styles.reportsList}>
            {reports.map((report) => (
              <div key={report._id} className={styles.reportItem}>
                <div className={styles.reportIcon}>
                  {getStatusIcon(report.status)}
                </div>

                <div className={styles.reportDetails}>
                  <div className={styles.reportMain}>
                    <h4 className={styles.reportTitle}>{report.title}</h4>
                    <span className={styles.reportType}>
                      {report.reportType === 'monthly' && '📅 Mensuel'}
                      {report.reportType === 'annual' && '📊 Annuel'}
                      {report.reportType === 'category' && '🏷️ Catégorie'}
                    </span>
                  </div>

                  <div className={styles.reportMeta}>
                    <span className={styles.reportDate}>
                      {report.generatedAt ? `Généré le ${formatDate(report.generatedAt)}` : `Créé le ${formatDate(report.createdAt)}`}
                    </span>
                    <span className={`${styles.reportStatus} ${styles[report.status]}`}>
                      {getStatusText(report.status)}
                    </span>
                  </div>

                  {report.metadata && (
                    <div className={styles.reportStats}>
                      <span>📝 {report.metadata.totalTransactions || 0} transactions</span>
                      {report.metadata.totalIncome && (
                        <span>💰 {new Intl.NumberFormat('fr-CA', {
                          style: 'currency',
                          currency: user?.currency || 'EUR'
                        }).format(report.metadata.totalIncome)}</span>
                      )}
                      {report.downloadCount > 0 && (
                        <span>⬇️ {report.downloadCount} téléchargement{report.downloadCount > 1 ? 's' : ''}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className={styles.reportActions}>
                  {report.status === 'completed' && (
                    <button
                      onClick={() => downloadReport(report._id, report.title)}
                      className={styles.downloadButton}
                      title="Télécharger le rapport"
                    >
                      ⬇️ Télécharger
                    </button>
                  )}

                  {generatingReports.has(report._id) && (
                    <div className={styles.generatingIndicator}>
                      <div className={styles.spinner}></div>
                      <span>Génération...</span>
                    </div>
                  )}

                  <button
                    onClick={() => deleteReport(report._id)}
                    className={styles.deleteButton}
                    title="Supprimer le rapport"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status des générations en cours */}
      {generatingReports.size > 0 && (
        <div className={styles.generatingStatus}>
          <div className={styles.generatingContent}>
            <div className={styles.spinner}></div>
            <span>
              {generatingReports.size} rapport{generatingReports.size > 1 ? 's' : ''} en cours de génération...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsGenerator;
