const express = require('express');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const router = express.Router();

// Toutes les routes sont protégées
router.use(auth);

// GET /api/transactions - Récupérer les transactions de l'utilisateur
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, type, category, startDate, endDate } = req.query;

    // Construire le filtre
    const filter = { userId: req.user._id };

    if (type && ['income', 'expense'].includes(type)) {
      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(filter);

    res.json({
      success: true,
      transactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalTransactions: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/transactions - Créer une nouvelle transaction
router.post('/', async (req, res) => {
  try {
    const { description, amount, type, category, date, notes } = req.body;

    // Validation
    if (!description || !amount || !type || !category) {
      return res.status(400).json({
        message: 'Description, montant, type et catégorie sont requis'
      });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({
        message: 'Le type doit être "income" ou "expense"'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        message: 'Le montant doit être positif'
      });
    }

    const transaction = new Transaction({
      userId: req.user._id,
      description,
      amount: parseFloat(amount),
      type,
      category,
      date: date ? new Date(date) : new Date(),
      notes
    });

    await transaction.save();
    res.status(201).json({ success: true, transaction });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/transactions/:id - Modifier une transaction
router.put('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction non trouvée' });
    }

    res.json({ success: true, transaction });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/transactions/:id - Supprimer une transaction
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction non trouvée' });
    }

    res.json({ success: true, message: 'Transaction supprimée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/transactions/stats - Statistiques des transactions
router.get('/stats', async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) - 1 : currentDate.getMonth();
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    const stats = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      totalIncome: 0,
      totalExpenses: 0,
      transactionCount: 0,
      balance: 0
    };

    stats.forEach(stat => {
      if (stat._id === 'income') {
        result.totalIncome = stat.total;
      } else if (stat._id === 'expense') {
        result.totalExpenses = stat.total;
      }
      result.transactionCount += stat.count;
    });

    result.balance = result.totalIncome - result.totalExpenses;

    res.json({ success: true, stats: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/transactions/categories - Récupérer les catégories utilisées
router.get('/categories', async (req, res) => {
  try {
    const categories = await Transaction.distinct('category', {
      userId: req.user._id
    });

    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
