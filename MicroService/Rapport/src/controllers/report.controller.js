const pdfService = require("../services/pdf.service");

exports.generateMonthly = async (req, res) => {
  try {
    const buffer = await pdfService.createReport(req.body, "monthly");
    res.set({ "Content-Type": "application/pdf" });
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.generateAnnual = async (req, res) => {
  try {
    const buffer = await pdfService.createReport(req.body, "annual");
    res.set({ "Content-Type": "application/pdf" });
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};