const express = require('express');
const Goal = require('../models/Goal');
const auth = require('../middleware/auth');
const router = express.Router();

// Toutes les routes sont protégées
router.use(auth);

// GET /api/goals - Récupérer les goals de l'utilisateur
router.get('/', async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      goals
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/goals - Créer un nouveau goal
router.post('/', async (req, res) => {
  try {
    const goal = new Goal({
      ...req.body,
      userId: req.user._id
    });

    await goal.save();
    res.status(201).json({ success: true, goal });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/goals/:id - Modifier un goal
router.put('/:id', async (req, res) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    res.json({ success: true, goal });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/goals/:id - Supprimer un goal
router.delete('/:id', async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    res.json({ success: true, message: 'Goal deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
