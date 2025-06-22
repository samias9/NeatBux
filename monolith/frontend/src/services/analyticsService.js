// monolith/frontend/src/services/analyticsService.js
import apiService from './api';

const ANALYTICS_SERVICE_URL = 'http://localhost:3002';

class AnalyticsService {
  constructor() {
    this.baseURL = ANALYTICS_SERVICE_URL;
  }

  // Méthode générique pour les appels au service Analytics
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = apiService.getToken();

    console.log('🔑 Token récupéré:', token ? `${token.substring(0, 20)}...` : 'AUCUN TOKEN');

    if (!token) {
      throw new Error('Aucun token d\'authentification trouvé. Veuillez vous connecter.');
    }

    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // Assurer le format Bearer
      },
      ...options,
    };

    console.log('📤 Requête Analytics:', { url, headers: config.headers });

    try {
      const response = await fetch(url, config);

      console.log('📥 Réponse Analytics:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Erreur réponse Analytics:', data);
        throw new Error(data.message || data.error || 'Erreur service Analytics');
      }

      return data;
    } catch (error) {
      console.error('Analytics Service Request failed:', error);
      throw error;
    }
  }

  // Obtenir les statistiques - UNIQUEMENT DEPUIS LE SERVICE
  async getStats(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/analytics/stats${queryString ? `?${queryString}` : ''}`;
    const response = await this.request(endpoint);
    return response.data;
  }

  // Obtenir les tendances - UNIQUEMENT DEPUIS LE SERVICE
  async getTrends(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/analytics/trends${queryString ? `?${queryString}` : ''}`;
    const response = await this.request(endpoint);
    return response.data;
  }

  // Obtenir les prévisions - UNIQUEMENT DEPUIS LE SERVICE
  async getForecast(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/analytics/forecast${queryString ? `?${queryString}` : ''}`;
    const response = await this.request(endpoint);
    return response.data;
  }

  // Obtenir les données pour les graphiques - UNIQUEMENT DEPUIS LE SERVICE
  async getChartData(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/analytics/chart-data${queryString ? `?${queryString}` : ''}`;
    const response = await this.request(endpoint);
    return response.data;
  }

  // Synchroniser les données
  async syncData() {
    const response = await this.request('/analytics/sync', {
      method: 'POST'
    });
    return response;
  }

  // Obtenir le statut de synchronisation
  async getSyncStatus() {
    const response = await this.request('/analytics/sync-status');
    return response.data;
  }

  // Vérifier la santé du service
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      const data = await response.json();
      return data;
    } catch (error) {
      return { status: 'ERROR', message: error.message };
    }
  }
}

export default new AnalyticsService();
