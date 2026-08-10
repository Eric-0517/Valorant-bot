const { ShardingManager } = require('discord.js');
const http = require('http');
require('dotenv').config();


const PORT = process.env.PORT || 3000;
http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Valorant Stats Discord Bot is running!');
  })
  .listen(PORT, () => {
    console.log(`[Web Server] HTTP Web Server 已啟動於 Port: ${PORT}`);
  });


const manager = new ShardingManager('./bot.js', {
  totalShards: 'auto',
  token: process.env.DEV ? process.env.DISCORD_TOKEN_DEV : process.env.DISCORD_TOKEN,
  respawn: true,
});

manager.on('shardCreate', (shard) => {
  console.log(`Launched shard ${shard.id}`);
});

manager.spawn().catch((e) => console.log('[Sharding Error]:', e));
