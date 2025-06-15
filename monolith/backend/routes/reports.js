const express = require('express');
const { reportsAPI } = require('../config/services');
const auth = require('../middleware/auth');
const router = express.Router();

// Toutes les routes sont protégées
router.use(auth);

// POST /api/reports/monthly/:userId - Générer rapport mensuel
router.post('/monthly/:userId', async (req, res) => {
  try {
    if (req.params.userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const response = await reportsAPI.post(`/reports/monthly/${req.params.userId}`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Monthly report error:', error);
    res.status(500).json({
      message: 'Erreur lors de la génération du rapport',
      error: error.message
    });
  }
});

// POST /api/reports/annual/:userId - Générer rapport annuel
router.post('/annual/:userId', async (req, res) => {
  try {
    if (req.params.userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const response = await reportsAPI.post(`/reports/annual/${req.params.userId}`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Annual report error:', error);
    res.status(500).json({
      message: 'Erreur lors de la génération du rapport annuel',
      error: error.message
    });
  }
});

// GET /api/reports/status/:reportId - Vérifier le statut d'un rapport
router.get('/status/:reportId', async (req, res) => {
  try {
    const response = await reportsAPI.get(`/reports/status/${req.params.reportId}`);
    res.json(response.data);
  } catch (error) {
    console.error('Report status error:', error);
    res.status(500).json({
      message: 'Erreur lors de la vérification du statut',
      error: error.message
    });
  }
});

// GET /api/reports/history/:userId - Historique des rapports
router.get('/history/:userId', async (req, res) => {
  try {
    if (req.params.userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const response = await reportsAPI.get(`/reports/history/${req.params.userId}`, {
      params: req.query
    });
    res.json(response.data);
  } catch (error) {
    console.error('Reports history error:', error);
    res.json({
      reports: [],
      pagination: { current: 1, total: 0, hasNext: false }
    });
  }
});

// GET /api/reports/download/:reportId - Télécharger un rapport
router.get('/download/:reportId', async (req, res) => {
  try {
    const response = await reportsAPI.get(`/reports/download/${req.params.reportId}`, {
      responseType: 'stream'
    });

    // Forward the file stream
    response.data.pipe(res);
  } catch (error) {
    console.error('Report download error:', error);
    res.status(500).json({
      message: 'Erreur lors du téléchargement',
      error: error.message
    });
  }
});

// DELETE /api/reports/:reportId - Supprimer un rapport
router.delete('/:reportId', async (req, res) => {
  try {
    const response = await reportsAPI.delete(`/reports/${req.params.reportId}`);
    res.json(response.data);
  } catch (error) {
    console.error('Report delete error:', error);
    res.status(500).json({
      message: 'Erreur lors de la suppression',
      error: error.message
    });
  }
});

module.exports = router;
