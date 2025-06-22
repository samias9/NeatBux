// MicroService/Analytique/src/services/monolithSync.service.js
const TransactionCopy = require('../models/TransactionCopy');
const UserProfile = require('../models/UserProfile');
const axios = require('axios');

class MonolithSyncService {
  constructor() {
    this.monolithBaseURL = process.env.MONOLITH_API_URL || 'http://localhost:3001/api';
  }

  // Synchroniser TOUTES les données d'un utilisateur depuis le monolithe
  async syncUserData(userId, jwtToken) {
    try {
      console.log(`🔄 DEBUT synchronisation complète pour userId: ${userId}`);

      // 1. Synchroniser le profil utilisateur
      await this.syncUserProfile(userId, jwtToken);

      // 2. Synchroniser les transactions
      const syncResult = await this.syncUserTransactions(userId, jwtToken);

      console.log(`✅ FINI synchronisation pour ${userId}:`, syncResult);
      return syncResult;

    } catch (error) {
      console.error(`❌ Erreur sync complète pour ${userId}:`, error.message);
      throw error;
    }
  }

  // Synchroniser le profil utilisateur depuis le monolithe
  async syncUserProfile(userId, jwtToken) {
    try {
      console.log(`👤 Sync profil utilisateur: ${userId}`);

      const response = await axios.get(`${this.monolithBaseURL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      const user = response.data.user || response.data;

      const userProfile = await UserProfile.findOneAndUpdate(
        { userId: userId },
        {
          userId: userId,
          name: user.name,
          email: user.email,
          currency: user.currency || 'EUR',
          monthlyIncome: user.monthlyIncome || 0,
          lastSyncedAt: new Date()
        },
        { upsert: true, new: true }
      );

      console.log(`✅ Profil utilisateur synchronisé:`, {
        userId,
        name: userProfile.name,
        email: userProfile.email
      });

      return userProfile;

    } catch (error) {
      console.error('❌ Erreur sync profil utilisateur:', error.message);

      // Si l'API du monolithe n'est pas disponible, créer un profil par défaut
      const defaultProfile = await UserProfile.findOneAndUpdate(
        { userId: userId },
        {
          userId: userId,
          name: 'Utilisateur',
          email: 'user@example.com',
          currency: 'EUR',
          monthlyIncome: 0,
          lastSyncedAt: new Date()
        },
        { upsert: true, new: true }
      );

      console.log('⚠️ Profil par défaut créé');
      return defaultProfile;
    }
  }

  // Synchroniser les transactions depuis le monolithe
  async syncUserTransactions(userId, jwtToken) {
    try {
      console.log(`💳 Sync transactions pour: ${userId}`);

      // Récupérer TOUTES les transactions de l'utilisateur depuis le monolithe
      const response = await axios.get(`${this.monolithBaseURL}/transactions`, {
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          limit: 1000 // Récupérer toutes les transactions
        },
        timeout: 15000
      });

      console.log('📡 Réponse API monolithe:', {
        status: response.status,
        dataType: typeof response.data,
        dataKeys: Object.keys(response.data || {}),
        transactionCount: response.data?.transactions?.length || 0
      });

      const transactions = response.data.transactions || response.data || [];

      if (transactions.length === 0) {
        console.log(`ℹ️ Aucune transaction trouvée dans le monolithe pour ${userId}`);
        console.log('📊 Données reçues du monolithe:', response.data);
        return { synced: 0, errors: 0, message: 'Aucune transaction à synchroniser', apiResponse: response.data };
      }

      console.log(`📊 ${transactions.length} transactions trouvées dans le monolithe`);
      console.log('📋 Première transaction exemple:', transactions[0]);

      let syncedCount = 0;
      let updatedCount = 0;
      let errorCount = 0;

      // Synchroniser chaque transaction
      for (const transaction of transactions) {
        try {
          // IMPORTANT: Utiliser le userId de la transaction elle-même, pas celui du JWT
          const realUserId = transaction.userId || userId;
          const result = await this.syncSingleTransaction(transaction, realUserId);
          if (result.action === 'created') syncedCount++;
          if (result.action === 'updated') updatedCount++;
        } catch (error) {
          console.error(`❌ Erreur sync transaction ${transaction._id}:`, error.message);
          errorCount++;
        }
      }

      const result = {
        synced: syncedCount,
        updated: updatedCount,
        errors: errorCount,
        total: transactions.length,
        firstTransaction: transactions[0] || null
      };

      console.log(`✅ Synchronisation transactions terminée:`, result);
      return result;

    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation des transactions:', error.message);
      console.error('❌ URL appelée:', `${this.monolithBaseURL}/transactions`);
      console.error('❌ Headers:', { 'Authorization': `Bearer ${jwtToken?.substring(0, 20)}...` });

      // En cas d'erreur, retourner un résultat vide plutôt que de planter
      return {
        synced: 0,
        updated: 0,
        errors: 1,
        total: 0,
        error: error.message,
        details: error.response?.data || null
      };
    }
  }

  // Synchroniser une transaction individuelle
  async syncSingleTransaction(transaction, userId) {
    try {
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
        status: transaction.status || 'completed',
        lastModified: new Date(transaction.updatedAt || transaction.createdAt),
        syncedAt: new Date()
      };

      if (existingTransaction) {
        // Mettre à jour si modifiée
        const lastModified = new Date(transaction.updatedAt || transaction.createdAt);
        if (lastModified > existingTransaction.lastModified) {
          await TransactionCopy.findByIdAndUpdate(existingTransaction._id, transactionData);
          return { action: 'updated', id: transaction._id };
        } else {
          return { action: 'skipped', id: transaction._id };
        }
      } else {
        // Créer nouvelle transaction
        await TransactionCopy.create(transactionData);
        return { action: 'created', id: transaction._id };
      }

    } catch (error) {
      console.error(`❌ Erreur sync transaction individuelle:`, error);
      throw error;
    }
  }

  // Obtenir les statistiques de synchronisation
  async getSyncStats(userId) {
    try {
      const transactionCount = await TransactionCopy.countDocuments({ userId });
      const lastSync = await TransactionCopy.findOne({ userId }).sort({ syncedAt: -1 });
      const userProfile = await UserProfile.findOne({ userId });

      // Statistiques par type
      const stats = await TransactionCopy.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            total: { $sum: '$amount' }
          }
        }
      ]);

      // Statistiques par mois (dernière année)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const monthlyStats = await TransactionCopy.aggregate([
        {
          $match: {
            userId,
            date: { $gte: oneYearAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' }
            },
            count: { $sum: 1 },
            total: { $sum: '$amount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      return {
        userId,
        transactionCount,
        userProfile: !!userProfile,
        userProfileData: userProfile,
        lastSyncAt: lastSync?.syncedAt,
        typeStats: stats,
        monthlyStats
      };

    } catch (error) {
      console.error('❌ Erreur getSyncStats:', error);
      return {
        userId,
        transactionCount: 0,
        userProfile: false,
        lastSyncAt: null,
        error: error.message
      };
    }
  }
}

module.exports = new MonolithSyncService();
