const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Viewport desktop large
  await page.setViewport({ width: 1920, height: 1080 });
  
  console.log('Navigating to SHRED-UP-APP...');
  await page.goto('https://3000-idisowycqqgdrvtdl8cr9-8f57ffe2.sandbox.novita.ai/', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('Taking screenshot...');
  await page.screenshot({
    path: '/home/user/shredup-app/shredup-app-full-view.png',
    fullPage: true
  });
  
  console.log('Screenshot saved: /home/user/shredup-app/shredup-app-full-view.png');
  
  await browser.close();
})();
