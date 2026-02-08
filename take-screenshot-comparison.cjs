const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Viewport large pour voir le debug info
  await page.setViewport({ width: 1200, height: 900 });
  
  console.log('Navigating to SaaS embed...');
  await page.goto('https://8888-idisowycqqgdrvtdl8cr9-8f57ffe2.sandbox.novita.ai/saas-embed.html', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('Taking screenshot...');
  await page.screenshot({
    path: '/home/user/shredup-app/saas-current-state.png',
    fullPage: false
  });
  
  console.log('Screenshot saved: /home/user/shredup-app/saas-current-state.png');
  
  await browser.close();
})();
