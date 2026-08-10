<h1 align="center">Valorant Stats Discord Bot</h1>
<p align="center">專為 VALORANT 玩家打造的 Discord 即時戰績與數據查詢機器人</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-v18+-68a063?style=flat-square&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/Discord.js-v14-5865F2?style=flat-square&logo=discord" alt="Discord.js">
  <img src="https://img.shields.io/badge/API-HenrikDev%20%2F%20Tracker.gg-00f2fe?style=flat-square" alt="API">
</p>

---

## 專案簡介 (Introduction)

本專案是一個基於 **Discord.js v14** 開發的 Valorant 戰績查詢機器人。整合了 **HenrikDev Unofficial Valorant API** 與 **Tracker.gg** 數據，提供玩家查詢即時段位、MMR 變動、總遊玩時長以及伺服器運作狀態等功能。

---

## 指令清單 (Commands)

| 指令 (Command) | 說明 (Description) |
| :---: | :--- |
| `/特戰 查詢玩家mmr` | 查詢玩家當前段位、RR 競賽分數、上局分數變動與歷史最高段位 |
| `/特戰取得玩家總遊玩時長` | 查詢 VALORANT 玩家的總累積遊玩時間與總對戰場數 |
| `/三角洲今日密碼` | 查詢三角洲行動今日密碼 |
| `/即刻槍戰` | 查詢遊戲伺服器即時 TCP / HTTP 連線狀態與延遲 |
| `/特戰競技模式數據統計` | 查詢玩家競技模式綜合生涯數據 |
| `/特戰查詢上一場戰績` | 查詢玩家最近一場對戰詳細數據 |
| `/綁定帳號` | 將你的 Valorant 帳號綁定至 Discord ID |
| `/解除綁定` | 解除 Valorant 帳號與 Discord ID 的綁定 |
| `/查看目前綁定的帳號` | 查看當前 Discord 帳號已綁定的 Valorant 帳號 |
| `/查看機器人延遲` | 測試機器人連線延遲狀況 |
| `/help` | 顯示所有可用指令說明 |

---

## 本地開發與安裝 (Getting Started)

### 1. 複製專案與安裝套件
```bash
git clone [https://github.com/Eric-0517/Valorant-bot.git](https://github.com/Eric-0517/Valorant-bot.git)
cd valorant-stats
npm install
