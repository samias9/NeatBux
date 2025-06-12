const fs = require('fs-extra');
const path = require('path');
const handlebars = require('handlebars');

class PDFService {
  constructor() {
    this.templatesPath = path.join(__dirname, '..', 'templates');
    this.outputPath = path.join(__dirname, '..', 'temp');

    fs.ensureDirSync(this.templatesPath);
    fs.ensureDirSync(this.outputPath);

    this.registerHelpers();
  }

  registerHelpers() {
    handlebars.registerHelper('formatCurrency', (amount) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      }).format(amount || 0);
    });

    handlebars.registerHelper('formatDate', (date) => {
      return new Date(date).toLocaleDateString('fr-FR');
    });

    handlebars.registerHelper('formatPercent', (value) => {
      return `${(value || 0).toFixed(1)}%`;
    });

    handlebars.registerHelper('eq', (a, b) => a === b);
    handlebars.registerHelper('gt', (a, b) => a > b);
    handlebars.registerHelper('add', (a, b) => a + b);
  }

  async generatePDF(reportData) {
    try {
      // Pour l'instant, générer un fichier HTML au lieu de PDF
      const template = await this.loadTemplate(reportData.type);
      const html = this.compileTemplate(template, reportData);

      const filename = `report_${reportData.user.id}_${Date.now()}.html`;
      const outputPath = path.join(this.outputPath, filename);

      await fs.writeFile(outputPath, html);

      return `temp/${filename}`;

    } catch (error) {
      console.error('HTML generation error:', error);
      throw error;
    }
  }

  async loadTemplate(type) {
    const templatePath = path.join(this.templatesPath, `${type}.hbs`);

    if (!await fs.pathExists(templatePath)) {
      await this.createDefaultTemplate(type);
    }

    return await fs.readFile(templatePath, 'utf8');
  }

  compileTemplate(template, data) {
    const compiledTemplate = handlebars.compile(template);
    return compiledTemplate(data);
  }

  async createDefaultTemplate(type) {
    let template;

    switch (type) {
      case 'monthly':
        template = this.getMonthlyTemplate();
        break;
      case 'annual':
        template = this.getAnnualTemplate();
        break;
      default:
        template = this.getDefaultTemplate();
    }

    await fs.writeFile(
      path.join(this.templatesPath, `${type}.hbs`),
      template
    );
  }

  getMonthlyTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{title}}</title>
    <style>
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            color: #333;
            line-height: 1.6;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            text-align: center;
        }
        .header h1 { margin: 0; font-size: 2rem; }
        .header p { margin: 0.5rem 0 0 0; opacity: 0.9; }
        .container { padding: 2rem; }
        .summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .summary-card {
            background: #f8f9fa;
            padding: 1.5rem;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #667eea;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .summary-card h3 {
            margin: 0 0 0.5rem 0;
            color: #666;
            font-size: 0.9rem;
            text-transform: uppercase;
            font-weight: 600;
        }
        .summary-card .amount {
            font-size: 1.8rem;
            font-weight: bold;
            margin: 0;
        }
        .income { color: #28a745; }
        .expense { color: #dc3545; }
        .balance { color: #667eea; }
        .section { margin: 2rem 0; }
        .section h2 {
            border-bottom: 2px solid #667eea;
            padding-bottom: 0.5rem;
            color: #333;
            margin-bottom: 1rem;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
            background: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        th, td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid #dee2e6;
        }
        th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #495057;
        }
        tr:hover { background-color: #f8f9fa; }
        .footer {
            background: #f8f9fa;
            padding: 1rem;
            text-align: center;
            color: #666;
            font-size: 0.8rem;
            margin-top: 2rem;
        }
        .print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #667eea;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        }
        .print-btn:hover { background: #5a67d8; }
    </style>
</head>
<body>
    <button class="print-btn no-print" onclick="window.print()">🖨️ Imprimer PDF</button>

    <div class="header">
        <h1>{{title}}</h1>
        <p>Période: {{period}}</p>
        <p>Généré le {{formatDate generatedAt}}</p>
    </div>

    <div class="container">
        <div class="summary">
            <div class="summary-card">
                <h3>Revenus</h3>
                <p class="amount income">{{formatCurrency analytics.totalIncome}}</p>
            </div>
            <div class="summary-card">
                <h3>Dépenses</h3>
                <p class="amount expense">{{formatCurrency analytics.totalExpenses}}</p>
            </div>
            <div class="summary-card">
                <h3>Solde</h3>
                <p class="amount balance">{{formatCurrency analytics.netBalance}}</p>
            </div>
        </div>

        {{#if analytics.categoriesBreakdown}}
        <div class="section">
            <h2>📊 Répartition par Catégorie</h2>
            <table>
                <thead>
                    <tr>
                        <th>Catégorie</th>
                        <th>Montant</th>
                        <th>Pourcentage</th>
                        <th>Nb Transactions</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each analytics.categoriesBreakdown}}
                    <tr>
                        <td>{{category}}</td>
                        <td><strong>{{formatCurrency amount}}</strong></td>
                        <td>{{formatPercent percentage}}</td>
                        <td>{{transactionCount}}</td>
                    </tr>
                    {{/each}}
                </tbody>
            </table>
        </div>
        {{/if}}

        {{#if options.includeDetails}}
        <div class="section">
            <h2>💳 Détail des Transactions</h2>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Catégorie</th>
                        <th>Type</th>
                        <th>Montant</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each transactions}}
                    <tr>
                        <td>{{formatDate date}}</td>
                        <td>{{description}}</td>
                        <td>{{category}}</td>
                        <td>
                            {{#eq type 'income'}}
                                <span style="color: #28a745;">✅ Revenu</span>
                            {{else}}
                                <span style="color: #dc3545;">❌ Dépense</span>
                            {{/eq}}
                        </td>
                        <td class="{{#eq type 'income'}}income{{else}}expense{{/eq}}">
                            <strong>{{formatCurrency amount}}</strong>
                        </td>
                    </tr>
                    {{/each}}
                </tbody>
            </table>
        </div>
        {{/if}}

        <div class="section">
            <h2>📈 Analyse</h2>
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px;">
                <p><strong>Solde net:</strong> {{formatCurrency analytics.netBalance}}</p>
                {{#if analytics.categoriesBreakdown}}
                <p><strong>Catégorie principale:</strong> {{analytics.categoriesBreakdown.0.category}} ({{formatCurrency analytics.categoriesBreakdown.0.amount}})</p>
                {{/if}}
                <p><strong>Nombre total de transactions:</strong> {{transactions.length}}</p>
            </div>
        </div>
    </div>

    <div class="footer">
        <p>📱 Rapport généré par NeatBux - Gestion Financière Intelligente</p>
        <p class="no-print">💡 Astuce: Utilisez Ctrl+P (Cmd+P sur Mac) pour sauvegarder en PDF</p>
    </div>

    <script class="no-print">
        // Auto-print functionality
        function autoPrint() {
            if (window.location.search.includes('print=1')) {
                setTimeout(() => window.print(), 1000);
            }
        }
        autoPrint();
    </script>
</body>
</html>
    `;
  }

  getAnnualTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{title}}</title>
    <style>
        @media print { body { margin: 0; } .no-print { display: none; } }
        body { font-family: 'Segoe UI', sans-serif; margin: 0; color: #333; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; }
        .container { padding: 2rem; }
        .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin: 2rem 0; }
        .summary-card { text-align: center; padding: 1.5rem; background: #f8f9fa; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .amount { font-size: 1.8rem; font-weight: bold; margin: 0.5rem 0; }
        .income { color: #28a745; }
        .expense { color: #dc3545; }
        .balance { color: #667eea; }
        table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        th, td { padding: 0.75rem; text-align: right; border-bottom: 1px solid #dee2e6; }
        th:first-child, td:first-child { text-align: left; }
        th { background-color: #f8f9fa; font-weight: 600; }
        .print-btn { position: fixed; top: 20px; right: 20px; background: #667eea; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
    </style>
</head>
<body>
    <button class="print-btn no-print" onclick="window.print()">🖨️ Imprimer PDF</button>

    <div class="header">
        <h1>{{title}}</h1>
        <p>Année: {{period}}</p>
        <p>Généré le {{formatDate generatedAt}}</p>
    </div>

    <div class="container">
        <div class="summary">
            <div class="summary-card">
                <h3>💰 Revenus Totaux</h3>
                <p class="amount income">{{formatCurrency metadata.totalIncome}}</p>
            </div>
            <div class="summary-card">
                <h3>💸 Dépenses Totales</h3>
                <p class="amount expense">{{formatCurrency metadata.totalExpenses}}</p>
            </div>
            <div class="summary-card">
                <h3>📈 Solde Net</h3>
                <p class="amount balance">{{formatCurrency (add metadata.totalIncome metadata.totalExpenses)}}</p>
            </div>
        </div>

        <h2>📅 Détail Mensuel</h2>
        <table>
            <thead>
                <tr>
                    <th>Mois</th>
                    <th>💰 Revenus</th>
                    <th>💸 Dépenses</th>
                    <th>📊 Solde</th>
                </tr>
            </thead>
            <tbody>
                {{#each monthlyData}}
                <tr>
                    <td><strong>{{month}}</strong></td>
                    <td class="income">{{formatCurrency totalIncome}}</td>
                    <td class="expense">{{formatCurrency totalExpenses}}</td>
                    <td class="balance">{{formatCurrency netBalance}}</td>
                </tr>
                {{/each}}
            </tbody>
        </table>
    </div>

    <div style="background: #f8f9fa; padding: 1rem; text-align: center; margin-top: 2rem;">
        <p>📱 Rapport généré par NeatBux - Gestion Financière</p>
    </div>
</body>
</html>
    `;
  }

  getDefaultTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{title}}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 2rem; }
        .header { text-align: center; margin-bottom: 2rem; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{title}}</h1>
    </div>
    <div class="content">
        <p>Rapport généré le {{formatDate generatedAt}}</p>
    </div>
</body>
</html>
    `;
  }
}

const pdfService = new PDFService();

async function generatePDF(reportData) {
  return await pdfService.generatePDF(reportData);
}

module.exports = { generatePDF };
