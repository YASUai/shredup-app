const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  console.log('📸 Navigating to metronome module (SCALE version)...');
  await page.goto('https://8888-idisowycqqgdrvtdl8cr9-8f57ffe2.sandbox.novita.ai/index-saas-scale.html', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });
  
  console.log('⏳ Waiting for module to render...');
  await page.waitForSelector('.saas-metronome-module', { timeout: 10000 });
  
  console.log('📷 Taking screenshot...');
  await page.screenshot({ 
    path: '/home/user/shredup-app/metronome-module-screenshot-scale.png',
    fullPage: false
  });
  
  console.log('✅ Screenshot saved: /home/user/shredup-app/metronome-module-screenshot-scale.png');
  
  await browser.close();
})();
