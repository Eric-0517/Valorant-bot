require('dotenv').config();
const fs = require('fs');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');

// 全域監聽
process.on('uncaughtException', (err) => {
  console.error('[bot.js 未擷取的錯誤]:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[bot.js 未處理的 Rejection]:', reason);
});

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.commands = new Collection();

const functions = fs.readdirSync('./functions/bot').filter((file) => file.endsWith('.js'));
const eventFiles = fs.readdirSync('./events').filter((file) => file.endsWith('.js'));

// 取得並印出當前外網 IP 的函式
async function printPublicIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    console.log(`🌐 [Render 伺服器 IP]: ${data.ip}`);
  } catch (error) {
    console.warn('⚠️ 無法取得公網 IP:', error.message);
  }
}

(async () => {
  
  await printPublicIP();

  for (const file of functions) {
    require(`./functions/bot/${file}`)(client);
  }

  // 連接 MongoDB
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.warn('⚠️ 警告: 未設定 MONGODB_URI 環境變數，資料庫相關功能將無法運作！');
  } else {
    try {
      await mongoose.connect(mongoURI);
      console.log('✅ 已成功連線至 MongoDB');
    } catch (error) {
      console.error('❌ MongoDB 連線失敗:', error.message);
    }
  }

  client.handleEvents(eventFiles, './events');
  client.handleCommands('./commands');

  const token = process.env.DEV ? process.env.DISCORD_TOKEN_DEV : process.env.DISCORD_TOKEN;
  if (!token) {
    console.error('❌ 錯誤: 未找不到 Discord Bot Token！請檢查 DISCORD_TOKEN 環境變數。');
    process.exit(1);
  }

  await client.login(token);
})();
