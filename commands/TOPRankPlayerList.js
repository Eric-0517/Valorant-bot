const { 
  EmbedBuilder, 
  SlashCommandBuilder 
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('傳說查詢排位排行榜')
    .setDescription('查詢《傳說對決》全服排位排行榜')
    .addIntegerOption(option =>
      option
        .setName('server')
        .setDescription('選擇伺服器')
        .setRequired(true)
        .addChoices(
          { name: '1服 (聖騎之王)', value: 1 },
          { name: '2服 (純潔之翼)', value: 2 }
        )
    ),

  async execute(interaction) {
    // 建立大紅框停用通知 Embed
    const offlineEmbed = new EmbedBuilder()
      .setColor('#FF0000') // 鮮紅色大邊框
      .setTitle('服務已離線')
      .setDescription('AOV相關服務已關閉並遷移至網站\n👉(https://aovweb.azurewebsites.net/)')
      .setFooter({ text: '系統公告' })
      .setTimestamp();

    // 直接回傳訊息
    return await interaction.reply({ 
      embeds: [offlineEmbed] 
    });
  },
};
