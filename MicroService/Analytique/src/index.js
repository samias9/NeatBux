// MicroService/Analytique/src/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Imports locaux
const connectDB = require('./config/database');
const analyticsRoutes = require('./routes/analytics.routes');

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🚀 Démarrage du service Analytics...');

// Connexion à la base de données
connectDB();

// Middlewares
app.use(cors({
  origin: [
    'http://localhost:5173',  // Frontend Vite
    'http://localhost:3001',  // Backend monolithe
    'http://localhost:3002'   // Service Analytics
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`📥 ${timestamp} - ${req.method} ${req.path}`);

  // Log des headers d'auth pour debug
  if (req.headers.authorization) {
    console.log(`🔑 Token présent: ${req.headers.authorization.substring(0, 20)}...`);
  }

  next();
});

// Routes de santé (sans auth)
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Analytics',
    timestamp: new Date().toISOString(),
    database: 'Connected',
    version: '1.0.0'
  });
});

app.get('/info', (req, res) => {
  res.json({
    service: 'Budget Tracker - Analytics Service',
    version: '1.0.0',
    description: 'Service de calcul et d\'analyse des données financières',
    endpoints: {
      analytics: '/analytics/*',
      health: '/health',
      info: '/info'
    },
    features: [
      'Calcul de statistiques financières',
      'Génération de tendances',
      'Prévisions basiques',
      'Synchronisation avec le monolithe',
      'Cache des données calculées'
    ]
  });
});

// Routes analytics (avec auth)
app.use('/analytics', analyticsRoutes);

// Middleware de gestion d'erreurs globales
app.use((err, req, res, next) => {
  console.error('💥 Erreur globale:', err);

  // Erreur JWT
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Token invalide',
      message: err.message
    });
  }

  // Erreur MongoDB
  if (err.name === 'MongoError' || err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Erreur base de données',
      message: err.message
    });
  }

  // Erreur générique
  res.status(500).json({
    success: false,
    error: 'Erreur interne du serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'
  });
});

// Route 404
app.use('*', (req, res) => {
  console.log(`❌ Route non trouvée: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: 'Route non trouvée',
    path: req.originalUrl,
    availableRoutes: {
      health: 'GET /health',
      info: 'GET /info',
      analytics: {
        stats: 'GET /analytics/stats',
        trends: 'GET /analytics/trends',
        forecast: 'GET /analytics/forecast',
        chartData: 'GET /analytics/chart-data',
        sync: 'POST /analytics/sync',
        syncStatus: 'GET /analytics/sync-status',
        recalculate: 'POST /analytics/recalculate'
      }
    }
  });
});

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎉 Analytics Service démarré avec succès !`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 URLs de test:`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Info: http://localhost:${PORT}/info`);
  console.log(`   Analytics: http://localhost:${PORT}/analytics/*`);
  console.log(`⚡ Service prêt à recevoir des requêtes !`);

  if (process.env.NODE_ENV === 'development') {
    console.log(`\n🔧 Variables d'environnement:`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   ANALYTICS_MONGODB_URI: ${process.env.ANALYTICS_MONGODB_URI || 'Par défaut'}`);
    console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? 'Configuré' : 'NON CONFIGURÉ ⚠️'}`);
  }
});

// Gestion des signaux de fermeture
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM reçu, fermeture du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT reçu, fermeture du serveur...');
  process.exit(0);
});
