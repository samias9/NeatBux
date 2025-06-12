const fs = require('fs-extra');
const path = require('path');

class ChartService {
  constructor() {
    this.chartsPath = path.join(__dirname, '..', 'temp', 'charts');
    fs.ensureDirSync(this.chartsPath);
  }

  async generateChart(config) {
    try {
      // Pour l'instant, retourne une image placeholder
      // à implémenter plus tard ou utiliser une autre lib
      const placeholder = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      return placeholder;
    } catch (error) {
      console.error('Chart generation error:', error);
      return null;
    }
  }
}

const chartService = new ChartService();

async function generateChart(config) {
  return await chartService.generateChart(config);
}

module.exports = { generateChart };
