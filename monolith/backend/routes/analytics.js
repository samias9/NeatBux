const express = require('express');
const axios = require('axios');
const router = express.Router();

const ANALYTICS_URL = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3003';

// Proxy vers le service Analytics
router.get('/stats/:userId', async (req, res) => {
  try {
    const response = await axios.get(`${ANALYTICS_URL}/analytics/stats/${req.params.userId}`);
    res.json(response.data);
  } catch (error) {
    console.error('Analytics service error:', error.message);
    res.status(500).json({ error: 'Analytics service unavailable' });
  }
});

router.get('/trends/:userId/:period', async (req, res) => {
  try {
    const response = await axios.get(`${ANALYTICS_URL}/analytics/trends/${req.params.userId}/${req.params.period}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Analytics service unavailable' });
  }
});

router.get('/categories/:userId', async (req, res) => {
  try {
    const response = await axios.get(`${ANALYTICS_URL}/analytics/categories/${req.params.userId}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Analytics service unavailable' });
  }
});

module.exports = router;
