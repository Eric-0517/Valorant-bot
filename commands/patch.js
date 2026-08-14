const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('特戰查詢更新日誌')
    .setDescription('查詢 VALORANT 最新版本更新日誌'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      
      const versionRes = await axios.get('https://valorant-api.com/v1/version');
      const versionData = versionRes.data.data;

      
      const patchVersion = versionData.manifestId.substring(0, 4); 
      const cleanVersion = versionData.version.split('-')[0]; // 版本號

      const embed = new EmbedBuilder()
        .setColor('#FF4655')
        .setTitle(`《特戰英豪》最新修補程式更新 - v${cleanVersion}`)
        .setURL('https://playvalorant.com/zh-tw/news/game-updates/')
        .setDescription(`最新版本號：\`${versionData.version}\`\n發布日期：\`${new Date(versionData.date).toLocaleDateString('zh-TW')}\`\n\n點擊上方連結即可至官方網站閱讀完整改動說明。`)
        .addFields(
          { name: '遊戲客戶端引擎', value: versionData.engineVersion || 'Unreal Engine 4', inline: true },
          { name: '伺服器狀態', value: '運作正常', inline: true }
        )
        .setFooter({ text: '由 Eric 開發' })
        .setTimestamp();

      return await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('[Patch 指令錯誤]:', error.message);
      return await interaction.editReply({ content: '<a:cross:1535233642312507443> 獲取更新日誌時發生錯誤，請稍後再試！' });
    }
  },
};
