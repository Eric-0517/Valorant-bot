async function getDeltaPassword() {
  let browser = null;
  try {
    const executablePath = getExecutablePath();

    browser = await puppeteer.launch({
      executablePath,
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
      ],
    });

    const page = await browser.newPage();

    // 攔截圖檔與媒體，加速載入
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['image', 'media', 'font'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.setUserAgent(
      'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
    );
    await page.setViewport({ width: 390, height: 844, isMobile: true });

    const targetUrl = 'https://www.playdeltaforce.com/events/hq/zh-tw/m/index.html';
    
    await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 25000,
    });

    
    await new Promise((resolve) => setTimeout(resolve, 4500));

    
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('[Puppeteer 爬蟲除錯] 抓到的頁面內文 (前 400 字):');
    console.log(bodyText.substring(0, 400).replace(/\n+/g, ' '));

    const passwords = await page.evaluate(() => {
      const mapNames = ['零號大壩', '長弓溪谷', '巴克什', '航天基地', '潮汐監獄', 'AZ3'];
      const results = [];
      const bodyText = document.body.innerText;

      mapNames.forEach((map) => {
       
        const reg = new RegExp(`${map}[\\s\\S]*?([A-Za-z0-9]{4,6})`, 'i');
        const match = bodyText.match(reg);
        if (match && match[1]) {
          results.push({
            map: map,
            code: match[1],
          });
        }
      });

      return results;
    });

    console.log('[Puppeteer 爬蟲除錯] 正則解析結果:', JSON.stringify(passwords));

    
    if (passwords && passwords.length > 0 && isValidCodes(passwords)) {
      return passwords;
    }

    console.warn('[Puppeteer 爬蟲除錯] isValidCodes 驗證失敗 (可能全部密碼相同或無效)');
    return null;
  } catch (error) {
    console.error('[puppeteer-core 爬蟲錯誤]:', error.message);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
