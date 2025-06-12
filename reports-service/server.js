const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Create temp directory
try {
  if (!fs.existsSync(path.join(__dirname, 'temp'))) {
    fs.mkdirSync(path.join(__dirname, 'temp'));
  }
} catch (err) {
  console.log('Temp directory already exists or cannot create');
}

// Serve static files
app.use('/downloads', express.static(path.join(__dirname, 'temp')));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Reports Service',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

app.post('/reports/monthly/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { month } = req.body;
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Rapport Mensuel - ${month}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 2rem; }
        .header { background: #667eea; color: white; padding: 2rem; text-align: center; }
        .summary { display: flex; justify-content: space-around; margin: 2rem 0; }
        .card { padding: 1rem; background: #f8f9fa; border-radius: 8px; text-align: center; }
        .amount { font-size: 1.5rem; font-weight: bold; }
        .income { color: #28a745; }
        .expense { color: #dc3545; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Rapport Mensuel - ${month}</h1>
        <p>Utilisateur: ${userId}</p>
        <p>Généré le: ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div class="summary">
        <div class="card">
            <h3>Revenus</h3>
            <p class="amount income">3 500,00 €</p>
        </div>
        <div class="card">
            <h3>Dépenses</h3>
            <p class="amount expense">2 800,00 €</p>
        </div>
        <div class="card">
            <h3>Solde</h3>
            <p class="amount">700,00 €</p>
        </div>
    </div>
    
    <button onclick="window.print()" style="margin-top: 2rem; padding: 1rem 2rem; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
        🖨️ Imprimer PDF
    </button>
</body>
</html>
    `;
    
    const filename = `rapport_${userId}_${month}_${Date.now()}.html`;
    const filePath = path.join(__dirname, 'temp', filename);
    
    fs.writeFileSync(filePath, htmlContent);
    
    res.json({
      reportId: filename,
      status: 'completed',
      downloadUrl: `/downloads/${filename}`,
      message: 'Rapport généré avec succès'
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`📊 Reports Service running on port ${PORT}`);
});
