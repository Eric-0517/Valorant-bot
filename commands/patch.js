const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('特戰查詢更新日誌')
    .setDescription('查詢《特戰英豪》最新版本更新日誌'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      // 抓取繁體中文 (zh-tw) 的最新新聞與 Patch Notes
      const response = await axios.get('https://api.henrikdev.xyz/valorant/v1/website/zh-tw?filter=game_updates', {
        headers: { 'Authorization': process.env.HENRIK_API_KEY }
      });

      const latestPatch = response.data.data[0];

      if (!latestPatch) {
        return await interaction.editReply({ content: '未找到最新的更新日誌！' });
      }

      const embed = new EmbedBuilder()
        .setColor('#FF4655') // VALORANT 經典紅
        .setTitle(`<:unranked:1535208948880121876> ${latestPatch.title}`)
        .setURL(latestPatch.url)
        .setDescription(latestPatch.description || '點擊上方標題觀看官方完整修補程式公告！')
        .setImage(latestPatch.banner_url)
        .setFooter({ text: `發布日期: ${new Date(latestPatch.date).toLocaleDateString('zh-TW')}` })
        .setTimestamp();

      return await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('[Patch 指令錯誤]:', error);
      return await interaction.editReply({ content: '<a:cross:1535233642312507443> 獲取更新日誌時發生錯誤！' });
    }
  },
};
