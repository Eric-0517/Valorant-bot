const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('特戰查詢伺服器維護狀態')
    .setDescription('查詢《特戰英豪》伺服器維護狀態')
    .addStringOption(option =>
      option.setName('區域')
        .setDescription('選擇伺服器區域')
        .setRequired(true)
        .addChoices(
          { name: '亞太區 (AP / TW / KR)', value: 'ap' },
          { name: '北美區 (NA)', value: 'na' },
          { name: '歐洲區 (EU)', value: 'eu' }
        )),

  async execute(interaction) {
    await interaction.deferReply();
    const region = interaction.options.getString('region');

    try {
      const response = await axios.get(`https://api.henrikdev.xyz/valorant/v1/vlr/status/${region}`, {
        headers: { 'Authorization': process.env.HENRIK_API_KEY }
      });

      const data = response.data.data;
      const maintanances = data.maintenances || [];
      const incidents = data.incidents || [];

      const isNormal = maintanances.length === 0 && incidents.length === 0;

      const embed = new EmbedBuilder()
        .setColor(isNormal ? '#00FF99' : '#FF4655')
        .setTitle(`《特戰英豪》伺服器狀態 - [ ${region.toUpperCase()} ]`)
        .setDescription(isNormal ? '🟢 **目前所有伺服器服務運作正常！**' : '⚠️ **伺服器目前有維護或異常事件：**')
        .setTimestamp();

      if (maintanances.length > 0) {
        maintanances.forEach((item) => {
          const title = item.titles.find(t => t.locale === 'zh_TW')?.content || item.titles[0]?.content || '伺服器維護';
          embed.addFields({ name: `模擬維護: ${title}`, value: item.archive_at ? `預計結束時間: ${item.archive_at}` : '進行中' });
        });
      }

      if (incidents.length > 0) {
        incidents.forEach((item) => {
          const title = item.titles.find(t => t.locale === 'zh_TW')?.content || item.titles[0]?.content || '突發異常';
          embed.addFields({ name: `突發事件: ${title}`, value: item.created_at || '調查中' });
        });
      }

      return await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('[Status 指令錯誤]:', error);
      return await interaction.editReply({ content: '<a:cross:1535233642312507443> 無法取得伺服器狀態，請稍後再試！' });
    }
  },
};
