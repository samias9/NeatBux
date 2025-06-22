const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

exports.createReport = async (data, type) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const html = generateHTML(data, type);
  await page.setContent(html, { waitUntil: "networkidle0" });

  const buffer = await page.pdf({ format: "A4" });
  await browser.close();

  return buffer;
};

function generateHTML(data, type) {
  const title = type === "monthly" ? "Rapport Mensuel" : "Rapport Annuel";
  const chartData = JSON.stringify(data.chartData);

  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { text-align: center; }
          canvas { display: block; margin: 0 auto; }
        </style>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      </head>
      <body>
        <h1>${title}</h1>
        <canvas id="myChart" width="600" height="400"></canvas>
        <script>
          const ctx = document.getElementById("myChart").getContext("2d");
          new Chart(ctx, {
            type: "bar",
            data: ${chartData},
            options: {
              responsive: false,
              plugins: { legend: { position: 'top' } }
            }
          });
        </script>
      </body>
    </html>
  `;
}