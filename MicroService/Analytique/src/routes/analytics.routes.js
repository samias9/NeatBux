const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics.controller");

router.get("/stats", analyticsController.getStats);
router.get("/trends", analyticsController.getTrends);
router.get("/forecast", analyticsController.getForecast);

module.exports = router;