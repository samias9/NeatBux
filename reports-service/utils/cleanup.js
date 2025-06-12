const cron = require('node-cron');
const fs = require('fs-extra');
const path = require('path');
const Report = require('../models/Report');

// Cleanup expired reports and files every day at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('🧹 Starting cleanup of expired reports...');

  try {
    // Find expired reports
    const expiredReports = await Report.find({
      expiresAt: { $lt: new Date() }
    });

    // Delete associated files
    for (const report of expiredReports) {
      if (report.filePath) {
        const filePath = path.join(__dirname, '..', report.filePath);
        await fs.remove(filePath).catch(err =>
          console.log(`File already deleted: ${filePath}`)
        );
      }
    }

    // Delete expired reports from database
    const result = await Report.deleteMany({
      expiresAt: { $lt: new Date() }
    });

    console.log(`🗑️ Cleaned up ${result.deletedCount} expired reports`);

    // Clean up orphaned chart files older than 24 hours
    const chartsPath = path.join(__dirname, '..', 'temp', 'charts');
    if (await fs.pathExists(chartsPath)) {
      const files = await fs.readdir(chartsPath);
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(chartsPath, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime.getTime() < oneDayAgo) {
          await fs.remove(filePath);
        }
      }
    }

  } catch (error) {
    console.error('Cleanup error:', error);
  }
});

module.exports = {};
