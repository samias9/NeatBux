const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get stored token
  getToken() {
    return localStorage.getItem('neatbux_token');
  }

  // Set token
  setToken(token) {
    localStorage.setItem('neatbux_token', token);
  }

  // Remove token
  removeToken() {
    localStorage.removeItem('neatbux_token');
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (data.token) {
      this.setToken(data.token);
    }

    return data;
  }

  async login(credentials) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (data.token) {
      this.setToken(data.token);
    }

    return data;
  }

  async getCurrentUser() {
    return await this.request('/auth/me');
  }

  logout() {
    this.removeToken();
    window.location.href = '/login';
  }

  // Transaction methods
  async getTransactions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/transactions${queryString ? `?${queryString}` : ''}`;
    return await this.request(endpoint);
  }

  async createTransaction(transactionData) {
    return await this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  }

  async updateTransaction(id, transactionData) {
    return await this.request(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transactionData),
    });
  }

  async deleteTransaction(id) {
    return await this.request(`/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  async getTransactionStats(month, year) {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);

    return await this.request(`/transactions/stats?${params.toString()}`);
  }

  // Budget methods
  async getBudgets() {
    return await this.request('/budgets');
  }

  async createBudget(budgetData) {
    return await this.request('/budgets', {
      method: 'POST',
      body: JSON.stringify(budgetData),
    });
  }

  async updateBudget(id, budgetData) {
    return await this.request(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(budgetData),
    });
  }

  async deleteBudget(id) {
    return await this.request(`/budgets/${id}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck() {
    return await this.request('/health');
  }
}

const apiService = new ApiService();
export default apiService;
