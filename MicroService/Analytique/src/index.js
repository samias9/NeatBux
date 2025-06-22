// MicroService/Analytique/src/index.js
const express = require("express");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3002;

console.log('🔄 Démarrage du service Analytics...');

// Middleware CORS très simple
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Logging simple
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

// Routes définies de manière très explicite
app.get('/health', (req, res) => {
  console.log('✅ Health check appelé');
  res.json({
    status: 'OK',
    service: 'Analytics',
    timestamp: new Date().toISOString()
  });
});

app.get('/analytics/stats', (req, res) => {
  console.log('📊 Stats appelé');
  const data = {
    total: 1340,
    average: 167.5
  };
  res.json(data);
});

app.get('/analytics/trends', (req, res) => {
  console.log('📈 Trends appelé');
  const data = {
    "2025-01": 370,
    "2025-02": 265,
    "2025-03": 390,
    "2025-04": 315
  };
  res.json(data);
});

app.get('/analytics/forecast', (req, res) => {
  console.log('🔮 Forecast appelé');
  const data = {
    nextMonthPrediction: 335
  };
  res.json(data);
});

// Catch all pour debugging
app.use('*', (req, res) => {
  console.log(`❌ Route non trouvée: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route non trouvée',
    method: req.method,
    path: req.originalUrl,
    message: 'Vérifiez l\'URL et réessayez'
  });
});

// Gestion d'erreurs
app.use((err, req, res, next) => {
  console.error('💥 Erreur:', err.message);
  res.status(500).json({ error: 'Erreur serveur' });
});

app.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('❌ Erreur lors du démarrage:', err);
    process.exit(1);
  }

  console.log(`🚀 Analytics service démarré avec succès !`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 URLs de test:`);
  console.log(`   http://localhost:${PORT}/health`);
  console.log(`   http://localhost:${PORT}/analytics/stats`);
  console.log(`   http://localhost:${PORT}/analytics/trends`);
  console.log(`   http://localhost:${PORT}/analytics/forecast`);
  console.log(`⚡ Service prêt à recevoir des requêtes !`);
});
