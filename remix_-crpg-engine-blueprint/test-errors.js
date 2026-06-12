import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  await page.goto('http://localhost:5001');
  await new Promise(r => setTimeout(r, 2000));
  
  // Find and click the Play button
  const playButton = await page.$('text/New Game'); // or whatever starts the game
  if (playButton) {
    console.log("Clicking New Game...");
    await playButton.click();
    await new Promise(r => setTimeout(r, 3000));
  } else {
    // try to find just a button that says Play
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.toLowerCase().includes('play')) {
        console.log("Clicking", text);
        await b.click();
        await new Promise(r => setTimeout(r, 3000));
        break;
      }
    }
  }
  
  await browser.close();
})();
