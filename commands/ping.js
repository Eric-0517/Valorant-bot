const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const os = require('os');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('查看機器人延遲')
    .setDescription('檢測機器人系統狀態與延遲'),

  async execute(interaction) {
    // 1. 先發送暫時的回應以計算 API 延遲 (WS Ping & Roundtrip Ping)
    const sent = await interaction.deferReply({ fetchReply: true, ephemeral: true });

    // --- 計算 Ping ---
    const roundtripPing = sent.createdTimestamp - interaction.createdTimestamp;

    // --- 計算 RAM 使用量 ---
    const memoryUsage = process.memoryUsage();
    const usedRAM = (memoryUsage.heapUsed / 1024 / 1024 / 1024).toFixed(2); // GB
    const totalRAM = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1); // GB

    // --- 計算 CPU 使用率估計 (使用 Load Average) ---
    const cpus = os.cpus();
    const loadAvg = os.loadavg()[0]; // 1分鐘平均負載
    const cpuPercent = Math.min(100, Math.round((loadAvg / cpus.length) * 100));

    // --- 計算伺服器總數 ---
    const totalGuilds = interaction.client.guilds.cache.size;

    // --- 格式化時間 (將毫秒轉為 天/時/分/秒) ---
    const formatUptime = (ms) => {
      const seconds = Math.floor((ms / 1000) % 60);
      const minutes = Math.floor((ms / (1000 * 60)) % 60);
      const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
      const days = Math.floor(ms / (1000 * 60 * 60 * 24));
      return { days, hours, minutes, seconds };
    };

    // Bot 運行時間 (從開機到現在)
    const botUptime = formatUptime(interaction.client.uptime);
    const botUptimeStr = `${botUptime.days}天|${botUptime.hours}時:${botUptime.minutes}分:${botUptime.seconds}秒`;

    // 系統開機時間 (OS Uptime)
    const sysUptime = formatUptime(os.uptime() * 1000);
    const sysUptimeStr = `${sysUptime.days} 天 ${sysUptime.hours} 時 ${sysUptime.minutes} 分 ${sysUptime.seconds} 秒`;

    // --- 建立狀態 Embed 視覺選單 ---
    const statusEmbed = new EmbedBuilder()
      .setColor('#7289DA')
      .setTitle('多功能機器蔥狀態欄')
      .addFields(
        { name: 'Ping', value: `\`${roundtripPing}ms\``, inline: true },
        { name: 'CPU', value: `\`${cpuPercent}%\``, inline: true },
        { name: 'RAM', value: `\`${usedRAM}GB / ${totalRAM}GB\``, inline: true },
        { name: '所在群組總數', value: `\`${totalGuilds}\``, inline: false },
        { name: '多功能機器蔥運行時間', value: `\`${botUptimeStr}\``, inline: false },
        { name: '開機時間 (系統)', value: `\`${sysUptimeStr}\``, inline: false }
      )
      .setFooter({ text: `WebSocket 延遲: ${interaction.client.ws.ping}ms` })
      .setTimestamp();

    // 更新訊息為美化後的 Embed 格式
    await interaction.editReply({ embeds: [statusEmbed] });
  },
};
