const express = require('express');
const axios = require('axios');
const router = express.Router();

const REPORTS_URL = process.env.REPORTS_SERVICE_URL || 'http://localhost:3002';

router.post('/monthly/:userId', async (req, res) => {
  try {
    const response = await axios.post(`${REPORTS_URL}/reports/monthly/${req.params.userId}`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Reports service unavailable' });
  }
});

router.get('/status/:reportId', async (req, res) => {
  try {
    const response = await axios.get(`${REPORTS_URL}/reports/status/${req.params.reportId}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Reports service unavailable' });
  }
});

router.get('/history/:userId', async (req, res) => {
  try {
    const response = await axios.get(`${REPORTS_URL}/reports/history/${req.params.userId}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Reports service unavailable' });
  }
});

module.exports = router;
