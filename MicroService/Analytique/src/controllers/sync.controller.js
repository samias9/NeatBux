// MicroService/Analytique/src/controllers/sync.controller.js
const TransactionCopy = require('../models/TransactionCopy');
const UserProfile = require('../models/UserProfile');
const monolithSyncService = require('../services/monolithSync.service');

class SyncController {

  // Synchronisation avec les VRAIES données du monolithe
  async syncRealData(req, res) {
    try {
      const { userId } = req.user;
      const token = req.headers.authorization.replace('Bearer ', '');

      console.log(`🔄 Synchronisation VRAIES données pour ${userId}`);

      const syncResult = await monolithSyncService.syncUserData(userId, token);

      res.json({
        success: true,
        message: 'Synchronisation des vraies données terminée',
        data: syncResult
      });

    } catch (error) {
      console.error('❌ Erreur sync vraies données:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la synchronisation des vraies données',
        message: error.message
      });
    }
  }

  // Synchronisation manuelle avec données mockées (pour tester)
  async syncMockData(req, res) {
    try {
      const { userId } = req.user;

      console.log(`🔄 Synchronisation de données test pour ${userId}`);

      // Supprimer les anciennes données
      await TransactionCopy.deleteMany({ userId });
      await UserProfile.deleteOne({ userId });

      // Créer un profil utilisateur
      await UserProfile.create({
        userId: userId,
        name: 'Test User',
        email: 'test@example.com',
        currency: 'EUR',
        monthlyIncome: 3500,
        lastSyncedAt: new Date()
      });

      // Créer des transactions de test pour l'année 2025
      const mockTransactions = [];
      const categories = ['Salaire', 'Freelance', 'Alimentation', 'Transport', 'Logement', 'Loisirs', 'Santé'];

      // Générer des transactions pour chaque mois
      for (let month = 0; month < 12; month++) {
        // Revenus mensuels
        mockTransactions.push({
          originalId: `income_${month}_${userId}`,
          userId: userId,
          description: `Salaire ${new Date(2025, month).toLocaleDateString('fr-FR', { month: 'long' })}`,
          amount: 3000 + Math.random() * 500, // 3000-3500€
          type: 'income',
          category: 'Salaire',
          date: new Date(2025, month, 1),
          status: 'completed',
          syncedAt: new Date(),
          lastModified: new Date()
        });

        // Dépenses mensuelles (5-8 transactions par mois)
        const expenseCount = 5 + Math.floor(Math.random() * 4);
        for (let i = 0; i < expenseCount; i++) {
          const day = 1 + Math.floor(Math.random() * 28);
          const category = categories[2 + Math.floor(Math.random() * 5)]; // Exclure Salaire et Freelance
          const amount = category === 'Logement' ? 800 + Math.random() * 400 : 50 + Math.random() * 300;

          mockTransactions.push({
            originalId: `expense_${month}_${i}_${userId}`,
            userId: userId,
            description: `${category} - ${new Date(2025, month).toLocaleDateString('fr-FR', { month: 'long' })}`,
            amount: amount,
            type: 'expense',
            category: category,
            date: new Date(2025, month, day),
            status: 'completed',
            syncedAt: new Date(),
            lastModified: new Date()
          });
        }
      }

      // Insérer toutes les transactions
      await TransactionCopy.insertMany(mockTransactions);

      console.log(`✅ ${mockTransactions.length} transactions de test créées pour ${userId}`);

      res.json({
        success: true,
        message: 'Données de test synchronisées avec succès',
        data: {
          transactionsCreated: mockTransactions.length,
          userId: userId,
          year: 2025
        }
      });

    } catch (error) {
      console.error('❌ Erreur sync mock data:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la synchronisation des données test',
        message: error.message
      });
    }
  }

  // Vérifier les données synchronisées
  async checkSyncStatus(req, res) {
    try {
      const { userId } = req.user;

      const syncStats = await monolithSyncService.getSyncStats(userId);

      res.json({
        success: true,
        data: syncStats
      });

    } catch (error) {
      console.error('❌ Erreur check sync status:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la vérification du statut',
        message: error.message
      });
    }
  }

  // Nettoyer toutes les données
  async clearData(req, res) {
    try {
      const { userId } = req.user;

      const deletedTransactions = await TransactionCopy.deleteMany({ userId });
      const deletedProfile = await UserProfile.deleteOne({ userId });

      res.json({
        success: true,
        message: 'Données supprimées avec succès',
        data: {
          transactionsDeleted: deletedTransactions.deletedCount,
          profileDeleted: deletedProfile.deletedCount
        }
      });

    } catch (error) {
      console.error('❌ Erreur clear data:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la suppression',
        message: error.message
      });
    }
  }
}

module.exports = new SyncController();
