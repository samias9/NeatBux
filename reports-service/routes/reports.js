const express = require('express');
const router = express.Router();
const Joi = require('joi');
const Report = require('../models/Report');
const { validateRequest } = require('../middleware/validation');
const { generatePDF } = require('../services/pdfService');
const { fetchAnalyticsData, fetchTransactions } = require('../services/dataService');
const path = require('path');

// Validation schemas
const monthlyReportSchema = Joi.object({
  userId: Joi.string().required(),
  month: Joi.string().pattern(/^\d{4}-\d{2}$/).required(),
  includeCharts: Joi.boolean().default(true),
  includeDetails: Joi.boolean().default(true)
});

const annualReportSchema = Joi.object({
  userId: Joi.string().required(),
  year: Joi.string().pattern(/^\d{4}$/).required(),
  includeCharts: Joi.boolean().default(true),
  includeDetails: Joi.boolean().default(true)
});

const categoryReportSchema = Joi.object({
  userId: Joi.string().required(),
  category: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  includeCharts: Joi.boolean().default(true)
});

// POST /reports/monthly/:userId
// Génère un rapport mensuel
router.post('/monthly/:userId', validateRequest(monthlyReportSchema), async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, includeCharts, includeDetails } = req.body;

    // Create report record
    const report = new Report({
      userId,
      reportType: 'monthly',
      title: `Rapport Mensuel - ${month}`,
      period: {
        startDate: new Date(month + '-01'),
        endDate: new Date(new Date(month + '-01').setMonth(new Date(month + '-01').getMonth() + 1))
      },
      parameters: { includeCharts, includeDetails },
      status: 'generating'
    });

    await report.save();

    // Start generation in background
    generateMonthlyReport(report._id, userId, month, { includeCharts, includeDetails })
      .catch(err => {
        console.error('Report generation failed:', err);
        Report.findByIdAndUpdate(report._id, { status: 'failed' }).exec();
      });

    res.json({
      reportId: report._id,
      status: 'generating',
      message: 'Rapport en cours de génération'
    });
  } catch (error) {
    console.error('Error creating monthly report:', error);
    res.status(500).json({ error: 'Failed to create monthly report' });
  }
});

// POST /reports/annual/:userId
// Génère un rapport annuel
router.post('/annual/:userId', validateRequest(annualReportSchema), async (req, res) => {
  try {
    const { userId } = req.params;
    const { year, includeCharts, includeDetails } = req.body;

    const report = new Report({
      userId,
      reportType: 'annual',
      title: `Rapport Annuel - ${year}`,
      period: {
        startDate: new Date(year + '-01-01'),
        endDate: new Date(parseInt(year) + 1, 0, 1)
      },
      parameters: { includeCharts, includeDetails },
      status: 'generating'
    });

    await report.save();

    generateAnnualReport(report._id, userId, year, { includeCharts, includeDetails })
      .catch(err => {
        console.error('Annual report generation failed:', err);
        Report.findByIdAndUpdate(report._id, { status: 'failed' }).exec();
      });

    res.json({
      reportId: report._id,
      status: 'generating',
      message: 'Rapport annuel en cours de génération'
    });
  } catch (error) {
    console.error('Error creating annual report:', error);
    res.status(500).json({ error: 'Failed to create annual report' });
  }
});

// POST /reports/category/:userId/:category
// Génère un rapport par catégorie
router.post('/category/:userId/:category', validateRequest(categoryReportSchema), async (req, res) => {
  try {
    const { userId, category } = req.params;
    const { startDate, endDate, includeCharts } = req.body;

    const report = new Report({
      userId,
      reportType: 'category',
      title: `Rapport Catégorie: ${category}`,
      period: { startDate: new Date(startDate), endDate: new Date(endDate) },
      parameters: { categories: [category], includeCharts },
      status: 'generating'
    });

    await report.save();

    generateCategoryReport(report._id, userId, category, startDate, endDate, { includeCharts })
      .catch(err => {
        console.error('Category report generation failed:', err);
        Report.findByIdAndUpdate(report._id, { status: 'failed' }).exec();
      });

    res.json({
      reportId: report._id,
      status: 'generating',
      message: 'Rapport par catégorie en cours de génération'
    });
  } catch (error) {
    console.error('Error creating category report:', error);
    res.status(500).json({ error: 'Failed to create category report' });
  }
});

// GET /reports/status/:reportId
// Vérifie le statut d'un rapport
router.get('/status/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ error: 'Rapport non trouvé' });
    }

    res.json({
      reportId: report._id,
      status: report.status,
      title: report.title,
      generatedAt: report.generatedAt,
      downloadUrl: report.status === 'completed' ? `/reports/download/${reportId}` : null
    });
  } catch (error) {
    console.error('Error checking report status:', error);
    res.status(500).json({ error: 'Failed to check report status' });
  }
});

// GET /reports/download/:reportId
// Télécharge un rapport généré
router.get('/download/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findById(reportId);
    if (!report || report.status !== 'completed') {
      return res.status(404).json({ error: 'Rapport non disponible' });
    }

    const filePath = path.join(__dirname, '..', report.filePath);

    // Increment download count
    report.downloadCount += 1;
    await report.save();

    res.download(filePath, `${report.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({ error: 'Failed to download report' });
  }
});

// GET /reports/history/:userId
// Récupère l'historique des rapports d'un utilisateur
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const reports = await Report.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-filePath'); // Don't expose file paths

    const total = await Report.countDocuments({ userId });

    res.json({
      reports,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page * limit < total
      }
    });
  } catch (error) {
    console.error('Error fetching report history:', error);
    res.status(500).json({ error: 'Failed to fetch report history' });
  }
});

// DELETE /reports/:reportId
// Supprime un rapport
router.delete('/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ error: 'Rapport non trouvé' });
    }

    // Delete file if exists
    if (report.filePath) {
      const fs = require('fs-extra');
      const filePath = path.join(__dirname, '..', report.filePath);
      await fs.remove(filePath).catch(err => console.log('File already deleted:', err.message));
    }

    await Report.findByIdAndDelete(reportId);

    res.json({ message: 'Rapport supprimé avec succès' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// Background generation functions
async function generateMonthlyReport(reportId, userId, month, options) {
  try {
    // Fetch data from analytics service
    const analyticsData = await fetchAnalyticsData(userId, month);
    const transactions = await fetchTransactions(userId, month, 'monthly');

    const reportData = {
      title: `Rapport Mensuel - ${month}`,
      period: month,
      type: 'monthly',
      user: { id: userId },
      analytics: analyticsData,
      transactions: transactions,
      options
    };

    const filePath = await generatePDF(reportData);

    await Report.findByIdAndUpdate(reportId, {
      status: 'completed',
      filePath,
      generatedAt: new Date(),
      metadata: {
        totalTransactions: transactions.length,
        totalIncome: analyticsData.totalIncome,
        totalExpenses: analyticsData.totalExpenses,
        chartsGenerated: options.includeCharts ? ['monthly-overview', 'categories'] : []
      }
    });

  } catch (error) {
    await Report.findByIdAndUpdate(reportId, { status: 'failed' });
    throw error;
  }
}

async function generateAnnualReport(reportId, userId, year, options) {
  try {
    // Fetch 12 months of data
    const monthlyData = [];
    for (let month = 1; month <= 12; month++) {
      const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
      const data = await fetchAnalyticsData(userId, monthStr);
      monthlyData.push({ month: monthStr, ...data });
    }

    const transactions = await fetchTransactions(userId, year, 'yearly');

    const reportData = {
      title: `Rapport Annuel - ${year}`,
      period: year,
      type: 'annual',
      user: { id: userId },
      monthlyData,
      transactions,
      options
    };

    const filePath = await generatePDF(reportData);

    const totalIncome = monthlyData.reduce((sum, m) => sum + (m.totalIncome || 0), 0);
    const totalExpenses = monthlyData.reduce((sum, m) => sum + (m.totalExpenses || 0), 0);

    await Report.findByIdAndUpdate(reportId, {
      status: 'completed',
      filePath,
      generatedAt: new Date(),
      metadata: {
        totalTransactions: transactions.length,
        totalIncome,
        totalExpenses,
        chartsGenerated: options.includeCharts ? ['annual-trends', 'monthly-comparison'] : []
      }
    });

  } catch (error) {
    await Report.findByIdAndUpdate(reportId, { status: 'failed' });
    throw error;
  }
}

async function generateCategoryReport(reportId, userId, category, startDate, endDate, options) {
  try {
    const transactions = await fetchTransactions(userId, { startDate, endDate, category });

    const reportData = {
      title: `Rapport Catégorie: ${category}`,
      period: `${startDate} - ${endDate}`,
      type: 'category',
      category,
      user: { id: userId },
      transactions,
      options
    };

    const filePath = await generatePDF(reportData);

    const totalAmount = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    await Report.findByIdAndUpdate(reportId, {
      status: 'completed',
      filePath,
      generatedAt: new Date(),
      metadata: {
        totalTransactions: transactions.length,
        totalAmount,
        chartsGenerated: options.includeCharts ? ['category-timeline'] : []
      }
    });

  } catch (error) {
    await Report.findByIdAndUpdate(reportId, { status: 'failed' });
    throw error;
  }
}

module.exports = router;
