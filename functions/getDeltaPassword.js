const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');


function getExecutablePath() {
  // 1. 優先檢查 Render 或 Linux 環境下的 Chrome / Chromium 路徑
  const linuxPaths = [
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ];

  // 檢查 npx puppeteer browsers install chrome 安裝後的預設快取路徑
  const puppeteerCachePath = path.join(process.cwd(), '.cache', 'puppeteer');
  if (fs.existsSync(puppeteerCachePath)) {
    // 遞迴尋找快取資料夾內的 chrome 執行檔
    const findChromeInCache = (dir) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          const res = findChromeInCache(fullPath);
          if (res) return res;
        } else if (file === 'chrome' || file === 'chrome.exe') {
          return fullPath;
        }
      }
      return null;
    };
    const cachedChrome = findChromeInCache(puppeteerCachePath);
    if (cachedChrome) return cachedChrome;
  }

  // 2. 檢查 Windows 本地環境路徑
  const windowsPaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];

  const allPossiblePaths = [...linuxPaths, ...windowsPaths];

  for (const executablePath of allPossiblePaths) {
    if (executablePath && fs.existsSync(executablePath)) {
      return executablePath;
    }
  }

  throw new Error('未在系統中找到可用的 Chrome 或 Edge 瀏覽器，請確認是否已安裝。');
}

/**
 * 使用 puppeteer-core 模擬無頭瀏覽器爬取《三角洲行動》每日地圖密碼
 */
async function getDeltaPassword() {
  let browser = null;
  try {
    const executablePath = getExecutablePath();
    console.log('[Puppeteer] 成功找到瀏覽器執行檔路徑:', executablePath);

    // 1. 啟動無頭瀏覽器
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
        '--single-process', // 在 Render 等限制記憶體的容器環境中極為重要
      ],
    });

    const page = await browser.newPage();

    // 模擬手機端的 User-Agent 與尺寸
    await page.setUserAgent(
      'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
    );
    await page.setViewport({ width: 390, height: 844, isMobile: true });

    // 2. 造訪官方 HQ 手機版活動頁 (加上時間戳記避免 CDN 快取)
    const targetUrl = `https://www.playdeltaforce.com/events/hq/zh-tw/m/index.html?_t=${Date.now()}`;
    await page.goto(targetUrl, {
      waitUntil: 'networkidle2',
      timeout: 20000,
    });

    // 3. 在頁面情境中執行 DOM 擷取
    const passwords = await page.evaluate(() => {
      const mapNames = ['零號大壩', '長弓溪谷', '巴克什', '航天基地', '潮汐監獄', 'AZ3'];
      const results = [];

      const bodyText = document.body.innerText;

      mapNames.forEach((map) => {
        const reg = new RegExp(`${map}[\\s\\S]*?(\\d{4})`, 'i');
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

    // 4. 驗證數據有效性
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

/**
 * 驗證密碼是否全為重複的預設無效值
 */
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

module.exports = { getDeltaPassword, parsePasswordText };
