require('dotenv').config();
const fs = require('fs');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');

// --- 防崩潰全域監聽 ---
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

(async () => {
  for (const file of functions) {
    require(`./functions/bot/${file}`)(client);
  }

  // 安全連接 MongoDB
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.warn('⚠️ 警告: 未設定 MONGODB_URI 環境變數，資料庫相關功能將無法運作！');
  } else {
    try {
      // 移除已廢棄的 useNewUrlParser / useUnifiedTopology 參數
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
