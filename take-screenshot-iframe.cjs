const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Viewport large pour voir le conteneur + debug info
  await page.setViewport({ width: 1920, height: 1080 });
  
  console.log('Navigating to SaaS embed page...');
  await page.goto('https://8888-idisowycqqgdrvtdl8cr9-8f57ffe2.sandbox.novita.ai/saas-embed.html', {
    waitUntil: 'networkidle0',
    timeout: 30000
  });
  
  // Attendre que l'iframe soit chargé
  console.log('Waiting for iframe to load...');
  await page.waitForSelector('.metronome-iframe', { timeout: 10000 });
  await new Promise(resolve => setTimeout(resolve, 2000)); // Attendre que tout soit rendu
  
  console.log('Taking screenshot...');
  await page.screenshot({
    path: '/home/user/shredup-app/metronome-module-iframe-full.png',
    fullPage: false
  });
  
  console.log('Screenshot saved: /home/user/shredup-app/metronome-module-iframe-full.png');
  
  await browser.close();
})();
