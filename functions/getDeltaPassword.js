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

  throw new Error('未在系統中找到可用的 Chrome');
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

    // 攔截媒體檔加速，但保留 API 數據請求
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

    // 等待 3 秒確保 Vue / React DOM 渲染完成
    await new Promise((resolve) => setTimeout(resolve, 3000));

    
    await page.evaluate(() => {
      const expandTargets = document.querySelectorAll('.password-box, .password-box .btn, .password-list-toggle, [class*="password"]');
      expandTargets.forEach((el) => {
        try { el.click(); } catch (e) {}
      });
    });

    // 點擊後等待 1.5 秒讓展開動畫與內容填入完成
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const passwords = await page.evaluate(() => {
      const mapNames = ['零號大壩', '長弓溪谷', '巴克什', '航天基地', '潮汐監獄', 'AZ3'];
      const results = [];

      // 優先抓取 password-box 或 password-list 區塊，若找不到則退回抓取全頁
      const boxElement = document.querySelector('.password-box') || 
                         document.querySelector('.password-list') || 
                         document.querySelector('[class*="password"]');
      
      const targetText = boxElement ? boxElement.innerText : document.body.innerText;

      mapNames.forEach((map) => {
        // 在鎖定的區塊內尋找地圖名稱後方的 4 位純數字密碼
        const reg = new RegExp(`${map}[\\s\\S]*?(\\d{4})`, 'i');
        const match = targetText.match(reg);
        
        if (match && match[1]) {
          results.push({
            map: map,
            code: match[1],
          });
        }
      });

      return results;
    });

    console.log('[Puppeteer 密碼區塊抓取結果]:', JSON.stringify(passwords));

    // 驗證數據有效性
    if (passwords && passwords.length > 0 && isValidCodes(passwords)) {
      return passwords;
    }

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
  const currentYear = new Date().getFullYear().toString();
  
  // 檢查是否所有地圖都被年份 2026 覆蓋，或是全部重複
  const firstCode = list[0].code;
  if (firstCode === currentYear) return false;

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
