// MicroService/Analytique/src/services/dataSync.service.js
const TransactionCopy = require('../models/TransactionCopy');
const UserProfile = require('../models/UserProfile');
const axios = require('axios');

class DataSyncService {
  constructor() {
    this.monolithBaseURL = process.env.MONOLITH_API_URL || 'http://localhost:3000/api';
    this.syncApiKey = process.env.MONOLITH_API_KEY;
  }

  // Synchroniser les transactions d'un utilisateur
  async syncUserTransactions(userId, jwtToken) {
    try {
      console.log(`🔄 Synchronisation des transactions pour l'utilisateur ${userId}`);

      // Récupérer les transactions depuis le monolithe
      const response = await axios.get(`${this.monolithBaseURL}/transactions`, {
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          limit: 1000 // Récupérer toutes les transactions
        }
      });

      const transactions = response.data.transactions || [];

      if (transactions.length === 0) {
        console.log(`ℹ️ Aucune transaction trouvée pour l'utilisateur ${userId}`);
        return { synced: 0, errors: 0 };
      }

      let syncedCount = 0;
      let errorCount = 0;

      // Synchroniser chaque transaction
      for (const transaction of transactions) {
        try {
          await this.syncSingleTransaction(transaction, userId);
          syncedCount++;
        } catch (error) {
          console.error(`❌ Erreur sync transaction ${transaction._id}:`, error.message);
          errorCount++;
        }
      }

      console.log(`✅ Synchronisation terminée: ${syncedCount} réussies, ${errorCount} échecs`);
      return { synced: syncedCount, errors: errorCount };

    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error.message);
      throw new Error(`Échec de synchronisation: ${error.message}`);
    }
  }

  // Synchroniser une transaction individuelle
  async syncSingleTransaction(transaction, userId) {
    const existingTransaction = await TransactionCopy.findOne({
      originalId: transaction._id,
      userId: userId
    });

    const transactionData = {
      originalId: transaction._id,
      userId: userId,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      date: new Date(transaction.date),
      status: transaction.status,
      lastModified: new Date(transaction.updatedAt || transaction.createdAt)
    };

    if (existingTransaction) {
      // Mettre à jour si modifiée
      const lastModified = new Date(transaction.updatedAt || transaction.createdAt);
      if (lastModified > existingTransaction.lastModified) {
        await TransactionCopy.findByIdAndUpdate(existingTransaction._id, {
          ...transactionData,
          syncedAt: new Date()
        });
        console.log(`🔄 Transaction mise à jour: ${transaction._id}`);
      }
    } else {
      // Créer nouvelle transaction
      await TransactionCopy.create({
        ...transactionData,
        syncedAt: new Date()
      });
      console.log(`➕ Nouvelle transaction ajoutée: ${transaction._id}`);
    }
  }

  // Synchroniser le profil utilisateur
  async syncUserProfile(userId, jwtToken) {
    try {
      const response = await axios.get(`${this.monolithBaseURL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        }
      });

      const user = response.data.user;

      await UserProfile.findOneAndUpdate(
        { userId: userId },
        {
          userId: userId,
          name: user.name,
          email: user.email,
          currency: user.currency,
          monthlyIncome: user.monthlyIncome,
          lastSyncedAt: new Date()
        },
        { upsert: true, new: true }
      );

      console.log(`✅ Profil utilisateur synchronisé: ${userId}`);
      return true;

    } catch (error) {
      console.error('❌ Erreur sync profil utilisateur:', error.message);
      return false;
    }
  }

  // Méthode pour synchronisation complète (appelée périodiquement)
  async fullSync(userId, jwtToken) {
    console.log(`🚀 Début synchronisation complète pour ${userId}`);

    try {
      // Synchroniser le profil utilisateur
      await this.syncUserProfile(userId, jwtToken);

      // Synchroniser les transactions
      const syncResult = await this.syncUserTransactions(userId, jwtToken);

      console.log(`🎉 Synchronisation complète terminée pour ${userId}:`, syncResult);
      return syncResult;

    } catch (error) {
      console.error(`💥 Échec synchronisation complète pour ${userId}:`, error.message);
      throw error;
    }
  }

  // Obtenir les statistiques de synchronisation
  async getSyncStats(userId) {
    const transactionCount = await TransactionCopy.countDocuments({ userId });
    const lastSync = await TransactionCopy.findOne({ userId }).sort({ syncedAt: -1 });
    const userProfile = await UserProfile.findOne({ userId });

    return {
      transactionCount,
      lastSyncAt: lastSync?.syncedAt,
      userProfileSynced: !!userProfile,
      userLastSyncAt: userProfile?.lastSyncedAt
    };
  }
}

module.exports = new DataSyncService();
