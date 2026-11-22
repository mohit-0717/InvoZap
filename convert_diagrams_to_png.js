const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const diagramDir = path.join(__dirname, 'report_diagrams');

const edgePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
];

let browserPath = edgePaths.find(p => fs.existsSync(p));
if (!browserPath) {
  console.error('No suitable browser found for headless rendering.');
  process.exit(1);
}

const filesToConvert = [
  // SVG Architecture & Design Diagrams
  { file: 'Figure_3.1_System_Architecture.svg', out: 'Figure_3.1_System_Architecture.png', type: 'svg', width: 900 },
  { file: 'Figure_3.2_Database_Design_ER_Diagram.svg', out: 'Figure_3.2_Database_Design_ER_Diagram.png', type: 'svg', width: 900 },
  { file: 'Figure_3.3_System_Use_Case_Diagram.svg', out: 'Figure_3.3_System_Use_Case_Diagram.png', type: 'svg', width: 900 },
  { file: 'Figure_3.4_Invoicing_Lifecycle_Workflow_Diagram.svg', out: 'Figure_3.4_Invoicing_Lifecycle_Workflow_Diagram.png', type: 'svg', width: 900 },
  { file: 'Figure_3.5_Module_Design_Dataflow_Diagram.svg', out: 'Figure_3.5_Module_Design_Dataflow_Diagram.png', type: 'svg', width: 900 },
  { file: 'Figure_5.7_NPCI_Vector_UPI_QR_Code.svg', out: 'Figure_5.7_NPCI_Vector_UPI_QR_Code.png', type: 'svg', width: 400 },

  // HTML UI Walkthrough Figures
  { file: 'Figure_5.1_Landing_Workspace_Portal.html', out: 'Figure_5.1_Landing_Workspace_Portal.png', type: 'html', width: 900 },
  { file: 'Figure_5.2_Authentication_Login.html', out: 'Figure_5.2_Authentication_Login.png', type: 'html', width: 900 },
  { file: 'Figure_5.3_Invoice_Authoring_GST.html', out: 'Figure_5.3_Invoice_Authoring_GST.png', type: 'html', width: 900 },
  { file: 'Figure_5.6_Invoice_Ledger_Export.html', out: 'Figure_5.6_Invoice_Ledger_Export.png', type: 'html', width: 900 },
  { file: 'Figure_5.8_Quality_Audit_Verification.html', out: 'Figure_5.8_Quality_Audit_Verification.png', type: 'html', width: 900 }
];

async function convertAll() {
  console.log(`Launching headless browser from: ${browserPath}`);
  const browser = await puppeteer.launch({
    executablePath: browserPath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  for (const item of filesToConvert) {
    const inputPath = path.join(diagramDir, item.file);
    const outputPath = path.join(diagramDir, item.out);

    if (!fs.existsSync(inputPath)) {
      console.warn(`File not found: ${inputPath}, skipping...`);
      continue;
    }

    console.log(`Rendering ${item.file} -> ${item.out}...`);

    if (item.type === 'svg') {
      const svgRaw = fs.readFileSync(inputPath, 'utf8');
      const htmlWrap = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 20px;
      background: #ffffff;
      display: inline-block;
    }
    #container {
      background: #ffffff;
      display: inline-block;
    }
  </style>
</head>
<body>
  <div id="container">${svgRaw}</div>
</body>
</html>`;
      await page.setViewport({ width: item.width + 100, height: 800, deviceScaleFactor: 2.5 });
      await page.setContent(htmlWrap, { waitUntil: 'domcontentloaded' });

      const container = await page.$('#container');
      if (container) {
        await container.screenshot({ path: outputPath, type: 'png' });
      } else {
        await page.screenshot({ path: outputPath, type: 'png', fullPage: true });
      }
    } else {
      // HTML file
      await page.setViewport({ width: item.width + 100, height: 1200, deviceScaleFactor: 2.5 });
      const fileUrl = 'file:///' + inputPath.replace(/\\/g, '/');
      await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });

      // Look for the main container or body
      const card = (await page.$('.figure-card')) || (await page.$('.card')) || (await page.$('body > div'));
      if (card) {
        await card.screenshot({ path: outputPath, type: 'png' });
      } else {
        await page.screenshot({ path: outputPath, type: 'png', fullPage: true });
      }
    }

    const stats = fs.statSync(outputPath);
    console.log(`  ✓ Successfully generated ${item.out} (${Math.round(stats.size / 1024)} KB)`);
  }

  await browser.close();
  console.log('\nAll diagrams converted to PNG successfully!');
}

convertAll().catch(err => {
  console.error('Conversion failed:', err);
  process.exit(1);
});
