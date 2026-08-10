const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

function getExecutablePath() {
  // 1. 優先尋找專案本地 .cache 下載好的 Chrome
  const localCachePath = path.join(process.cwd(), '.cache', 'puppeteer');
  if (fs.existsSync(localCachePath)) {
    const findChrome = (dir) => {
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
      return null;
    };
    const cachedChrome = findChrome(localCachePath);
    if (cachedChrome) return cachedChrome;
  }

  // 2. Linux 系統預設安裝路徑
  const linuxPaths = [
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ];

  // 3. Windows 本地開發環境路徑
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

  throw new Error('未在系統中找到可用的 Chrome 或 Edge 瀏覽器，請確認是否已安裝。');
}
