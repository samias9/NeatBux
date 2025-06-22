const express = require("express");
const router = express.Router();
const reportController = require("../controllers/report.controller");

router.post("/monthly", reportController.generateMonthly);
router.post("/annual", reportController.generateAnnual);

module.exports = router;