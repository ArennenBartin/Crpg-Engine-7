import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1280, height: 720 });
  
  page.on('console', msg => console.log(`[CONSOLE] ${msg.text()}`));
  page.on('pageerror', err => console.log('[PAGE ERROR]', err.message));
  
  await page.goto('http://localhost:5179');
  await new Promise(r => setTimeout(r, 2000));
  
  // 1. Click 'Play' in sidebar
  const playTabs = await page.$$('button');
  for (const b of playTabs) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text === 'Play') {
      await b.click();
      await new Promise(r => setTimeout(r, 2000));
      break;
    }
  }
  
  // 2. Click 'New Game'
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.toLowerCase().includes('new game')) {
      await b.click();
      await new Promise(r => setTimeout(r, 3000));
      break;
    }
  }

  const bodyHTML = await page.evaluate(() => document.body.innerHTML);
  console.log("IS CANVAS PRESENT?", bodyHTML.includes('<canvas'));
  
  await browser.close();
})();
