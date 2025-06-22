// MicroService/Analytique/src/config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.ANALYTICS_MONGODB_URI || 'mongodb://localhost:27017/analytics_db';

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    const conn = await mongoose.connect(mongoURI, options);

    console.log(`🍃 MongoDB Analytics connecté: ${conn.connection.host}`);
    console.log(`📊 Base de données: ${conn.connection.name}`);

    // Gestion des événements de connexion
    mongoose.connection.on('error', (err) => {
      console.error('❌ Erreur MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB déconnecté');
    });

    // Fermeture propre
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB déconnecté via SIGINT');
      process.exit(0);
    });

    return conn;

  } catch (error) {
    console.error('❌ Erreur connexion MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
