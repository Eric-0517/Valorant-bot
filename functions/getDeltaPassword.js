const puppeteer = require('puppeteer-core');
const fs = require('fs');

/**
 * 自動尋找系統中的 Chrome 或 Edge 執行檔路徑
 */
function getExecutablePath() {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];

  for (const path of possiblePaths) {
    if (fs.existsSync(path)) {
      return path;
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

    // 1. 啟動無頭瀏覽器 (背景執行)
    browser = await puppeteer.launch({
      executablePath,
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();

    // 模擬手機端的 User-Agent 與尺寸 (官網活動頁多以行動端介面渲染)
    await page.setUserAgent(
      'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
    );
    await page.setViewport({ width: 390, height: 844, isMobile: true });

    // 2. 造訪官方 HQ 手機版活動頁
    const targetUrl = 'https://www.playdeltaforce.com/events/hq/zh-tw/m/index.html';
    await page.goto(targetUrl, {
      waitUntil: 'networkidle2', // 等待所有 API 連線完畢
      timeout: 15000,
    });

    // 3. 在頁面情境中執行 DOM 擷取
    const passwords = await page.evaluate(() => {
      const mapNames = ['零號大壩', '長弓溪谷', '巴克什', '航天基地', '潮汐監獄', 'AZ3'];
      const results = [];

      // 取得渲染後的頁面文字
      const bodyText = document.body.innerText;

      mapNames.forEach((map) => {
        // 使用正則匹配地圖名稱後續出現的 4 位數字密碼
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
    return null; // 回傳 null 會自動觸發 delta.js 的 Fallback
  } finally {
    // 5. 關閉瀏覽器實例釋放系統資源
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

/**
 * 寫死文字解析工具 (用於 fallback)
 */
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