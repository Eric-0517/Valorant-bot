const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

function getExecutablePath() {
  const localCachePath = path.join(process.cwd(), '.cache', 'puppeteer');
  if (fs.existsSync(localCachePath)) {
    const findChrome = (dir) => {
      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            const res = findChrome(fullPath);
            if (res) return res;
          } else if (file === 'chrome' || file === 'chrome.exe') {
            return fullPath;
          }
        }
      } catch (e) {
        return null;
      }
      return null;
    };
    const cachedChrome = findChrome(localCachePath);
    if (cachedChrome) return cachedChrome;
  }

  const linuxPaths = [
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ];

  const windowsPaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];

  for (const executablePath of [...linuxPaths, ...windowsPaths]) {
    if (executablePath && fs.existsSync(executablePath)) return executablePath;
  }

  throw new Error('未在系統中找到可用的 Chrome 或 Edge 瀏覽器。');
}

function parsePasswordText(text) {
  const maps = ['零號大壩', '長弓溪谷', '巴克什', '航天基地', '潮汐監獄', 'AZ3'];
  const results = [];

  maps.forEach((map) => {
    
    const regex = new RegExp(`${map}[\\s\\S]*?([0-9]{4,8}|[A-Za-z0-9]{6,8})`, 'i');
    const match = text.match(regex);
    results.push({
      map,
      code: match && match[1] ? match[1] : 'N/A',
    });
  });

  return results;
}

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
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.goto('https://www.playdeltaforce.com/events/hq/zh-tw/', {
      waitUntil: 'domcontentloaded',
      timeout: 25000,
    });

    
    await new Promise((resolve) => setTimeout(resolve, 4000));

    const pageText = await page.evaluate(() => document.body.innerText);

    return parsePasswordText(pageText);
  } catch (error) {
    console.error('[Puppeteer 爬蟲發生錯誤]:', error);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = {
  getDeltaPassword,
  parsePasswordText,
};
