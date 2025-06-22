const statsService = require("../services/stats.service");
const trendsService = require("../services/trends.service");
const forecastService = require("../services/forecast.service");
const { getCached } = require("../cache/redisClient");

exports.getStats = async (req, res) => {
  try {
    const data = await getCached("analytics:stats", statsService.computeStats);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTrends = async (req, res) => {
  try {
    const data = await getCached("analytics:trends", trendsService.getTrends);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getForecast = async (req, res) => {
  try {
    const data = await getCached("analytics:forecast", forecastService.getForecast);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};