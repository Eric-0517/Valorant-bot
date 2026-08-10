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
    if (executablePath && fs.existsSync(executablePath)) {
      return executablePath;
    }
  }

  throw new Error('未在系統中找到可用的 Chrome，請確認 package.json 是否已配置 postinstall 下載指令。');
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

    // 延遲等待頁面動態渲染密碼內容
    await new Promise((resolve) => setTimeout(resolve, 4500));

    // 除錯日誌
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

    // 驗證數據有效性
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


function isValidCodes(list) {
  if (!list || list.length === 0) return false;
  const firstCode = list[0].code;
  const isAllSame = list.every((item) => item.code === firstCode);
  return !isAllSame;
}


function parsePasswordText(text) {
  if (!text) return [];

  const lines = text
    .split('\n')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  const passwordList = [];
  for (let i = 0; i < lines.length; i += 2) {
    if (lines[i] && lines[i + 1]) {
      passwordList.push({
        map: lines[i],
        code: lines[i + 1],
      });
    }
  }

  return passwordList;
}


module.exports = {
  getDeltaPassword,
  parsePasswordText,
};
