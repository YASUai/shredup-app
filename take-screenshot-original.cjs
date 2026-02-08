const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Viewport mobile standard (plus grand que 400x725)
  await page.setViewport({ width: 414, height: 896 }); // iPhone 11 Pro Max
  
  console.log('Navigating to ORIGINAL metronome...');
  await page.goto('https://7777-idisowycqqgdrvtdl8cr9-8f57ffe2.sandbox.novita.ai/', {
    waitUntil: 'networkidle0',
    timeout: 30000
  });
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('Taking screenshot...');
  await page.screenshot({
    path: '/home/user/shredup-app/metronome-original-mobile.png',
    fullPage: true
  });
  
  console.log('Screenshot saved: /home/user/shredup-app/metronome-original-mobile.png');
  
  await browser.close();
})();
