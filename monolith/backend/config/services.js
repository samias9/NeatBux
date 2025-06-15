const axios = require('axios');

const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3001';
const REPORTS_SERVICE_URL = process.env.REPORTS_SERVICE_URL || 'http://localhost:3002';

// Create axios instances with default configs
const analyticsAPI = axios.create({
  baseURL: ANALYTICS_SERVICE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

const reportsAPI = axios.create({
  baseURL: REPORTS_SERVICE_URL,
  timeout: 30000, // Reports can take longer
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptors for logging
analyticsAPI.interceptors.request.use(
  config => {
    console.log(`📊 Analytics API: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  error => Promise.reject(error)
);

reportsAPI.interceptors.request.use(
  config => {
    console.log(`📋 Reports API: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  error => Promise.reject(error)
);

// Add response interceptors for error handling
const handleServiceError = (serviceName) => (error) => {
  console.error(`❌ ${serviceName} Service Error:`, error.message);

  if (error.code === 'ECONNREFUSED') {
    throw new Error(`${serviceName} service is unavailable`);
  }

  if (error.response) {
    throw new Error(error.response.data?.message || `${serviceName} service error`);
  }

  throw new Error(`${serviceName} service connection failed`);
};

analyticsAPI.interceptors.response.use(
  response => response,
  handleServiceError('Analytics')
);

reportsAPI.interceptors.response.use(
  response => response,
  handleServiceError('Reports')
);

module.exports = {
  analyticsAPI,
  reportsAPI,
  ANALYTICS_SERVICE_URL,
  REPORTS_SERVICE_URL
};
