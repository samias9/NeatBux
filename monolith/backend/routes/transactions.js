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

router.get('/stats', auth, async (req, res) => {
    try {
        const { month, year } = req.query;
        const userId = req.user.id;

        // Construire le filtre de date
        let dateFilter = { userId: userId };

        if (year) {
            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year, 11, 31, 23, 59, 59);
            dateFilter.date = { $gte: startDate, $lte: endDate };
        }

        if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);
            dateFilter.date = { $gte: startDate, $lte: endDate };
        }

        // Récupérer toutes les transactions de l'utilisateur pour la période
        const transactions = await Transaction.find(dateFilter);

        // Calculer les statistiques mensuelles
        const monthlyData = [];

        for (let i = 1; i <= 12; i++) {
            const monthStart = new Date(year || new Date().getFullYear(), i - 1, 1);
            const monthEnd = new Date(year || new Date().getFullYear(), i, 0, 23, 59, 59);

            const monthTransactions = transactions.filter(t =>
                t.date >= monthStart && t.date <= monthEnd
            );

            const income = monthTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);

            const expenses = monthTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            monthlyData.push({
                month: i,
                income: income,
                expenses: expenses,
                balance: income - expenses,
                transactionCount: monthTransactions.length
            });
        }

        // Calculer les totaux
        const totalIncome = monthlyData.reduce((sum, m) => sum + m.income, 0);
        const totalExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0);
        const totalBalance = totalIncome - totalExpenses;
        const totalTransactions = transactions.length;

        res.json({
            success: true,
            data: {
                monthlyData,
                totals: {
                    income: totalIncome,
                    expenses: totalExpenses,
                    balance: totalBalance,
                    transactionCount: totalTransactions
                },
                period: {
                    month: month ? parseInt(month) : null,
                    year: year ? parseInt(year) : new Date().getFullYear()
                }
            }
        });

    } catch (error) {
        console.error('Transaction stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques'
        });
    }
});

// Route alternative avec données simulées pour les tests
router.get('/mock-stats', auth, async (req, res) => {
    try {
        const { year } = req.query;
        const currentYear = year || new Date().getFullYear();

        // Données simulées basées sur la devise de l'utilisateur
        const monthlyData = [
            { month: 1, income: 3000, expenses: 2200, balance: 800, transactionCount: 15 },
            { month: 2, income: 3200, expenses: 2400, balance: 800, transactionCount: 18 },
            { month: 3, income: 2800, expenses: 2100, balance: 700, transactionCount: 12 },
            { month: 4, income: 3500, expenses: 2800, balance: 700, transactionCount: 20 },
            { month: 5, income: 3100, expenses: 2300, balance: 800, transactionCount: 16 },
            { month: 6, income: 3300, expenses: 2500, balance: 800, transactionCount: 17 },
            { month: 7, income: 3400, expenses: 2600, balance: 800, transactionCount: 19 },
            { month: 8, income: 3600, expenses: 2700, balance: 900, transactionCount: 21 },
            { month: 9, income: 3200, expenses: 2400, balance: 800, transactionCount: 18 },
            { month: 10, income: 3800, expenses: 2900, balance: 900, transactionCount: 23 },
            { month: 11, income: 3500, expenses: 2600, balance: 900, transactionCount: 20 },
            { month: 12, income: 4000, expenses: 3200, balance: 800, transactionCount: 25 }
        ];

        const totalIncome = monthlyData.reduce((sum, m) => sum + m.income, 0);
        const totalExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0);

        res.json({
            success: true,
            data: {
                monthlyData,
                totals: {
                    income: totalIncome,
                    expenses: totalExpenses,
                    balance: totalIncome - totalExpenses,
                    transactionCount: monthlyData.reduce((sum, m) => sum + m.transactionCount, 0)
                },
                period: {
                    month: null,
                    year: parseInt(currentYear)
                }
            }
        });

    } catch (error) {
        console.error('Mock stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la génération des statistiques simulées'
        });
    }
});

module.exports = router;

module.exports = router;
