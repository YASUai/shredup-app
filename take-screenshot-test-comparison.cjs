const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('🎨 Lancement capture comparaison TEST -10%...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Viewport large pour voir les deux côte-à-côte
  await page.setViewport({ width: 1600, height: 1000 });

  // Créer une page HTML avec les deux iframes
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      background: #0a0a0a; 
      padding: 40px;
      font-family: 'Inter', sans-serif;
      color: white;
    }
    .comparison-container {
      display: flex;
      gap: 40px;
      justify-content: center;
      align-items: flex-start;
    }
    .comparison-item {
      display: flex;
      flex-direction: column;
      gap: 20px;
      align-items: center;
    }
    .label {
      font-size: 24px;
      font-weight: 700;
      text-align: center;
      padding: 12px 24px;
      border-radius: 8px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }
    .label.test {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      box-shadow: 0 4px 12px rgba(240, 147, 251, 0.3);
    }
    .frame-container {
      border: 4px solid #00ff00;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 255, 0, 0.2);
      position: relative;
    }
    iframe {
      display: block;
      border: none;
      width: 400px;
      height: 800px;
    }
    .dimensions {
      position: absolute;
      bottom: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #00ff00;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="comparison-container">
    <div class="comparison-item">
      <div class="label">✅ ACTUEL (100%)</div>
      <div class="frame-container">
        <iframe src="https://3000-idisowycqqgdrvtdl8cr9-8f57ffe2.sandbox.novita.ai/metronome-scaled"></iframe>
        <div class="dimensions">400×800px</div>
      </div>
    </div>

    <div class="comparison-item">
      <div class="label test">🧪 TEST (-10%)</div>
      <div class="frame-container">
        <iframe src="https://3000-idisowycqqgdrvtdl8cr9-8f57ffe2.sandbox.novita.ai/metronome-scaled-test"></iframe>
        <div class="dimensions">400×800px</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  await page.setContent(html);
  
  // Attendre que les iframes soient chargées
  console.log('⏳ Attente chargement iframes...');
  await page.waitForSelector('iframe', { timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 5000)); // 5 secondes pour charger les métronomes

  // Prendre le screenshot
  console.log('📸 Capture screenshot...');
  await page.screenshot({ 
    path: '/home/user/shredup-app/metronome-test-comparison.png',
    fullPage: false
  });

  console.log('✅ Screenshot sauvegardé: /home/user/shredup-app/metronome-test-comparison.png');

  await browser.close();
})();
