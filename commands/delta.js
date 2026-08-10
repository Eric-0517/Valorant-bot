const { EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { getDeltaPassword, parsePasswordText } = require('../functions/getDeltaPassword');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('三角洲今日密碼')
    .setDescription('查詢《三角洲行動》今日密碼'),

  async execute(interaction) {
    
    await interaction.deferReply();

    try {
      // 1. 嘗試從官網爬取密碼
      let passwords = await getDeltaPassword();

      // 2. 如果爬蟲失敗或回傳無效資料，觸發 Fallback 備援
      if (!passwords || passwords.length === 0) {
        console.warn('[三角洲指令] ⚠️ 爬蟲未抓到有效數據，觸發 Fallback 預設文字');
        const fallbackText = "零號大壩\nN/A\n長弓溪谷\nN/A\n巴克什\nN/A\n航天基地\nN/A\n潮汐監獄\nN/A\nAZ3\nN/A";
        passwords = parsePasswordText(fallbackText);
      }

      // 3. 格式化台灣時間
      const todayStr = new Date().toLocaleDateString('zh-TW', {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });

      // 4. 建立高質感 Electric Purple / Mint Green 風格的 Embed 訊息
      const embed = new EmbedBuilder()
        .setColor('#00FF99') // 亮綠色顯示
        .setTitle('《三角洲行動》今日密碼')
        .setDescription(` **更新日期：** \`${todayStr}\` \n [官方頁面](https://www.playdeltaforce.com/events/hq/zh-tw/m/index.html)`)
        .setFooter({ text: 'Data provided by Delta Force HQ' })
        .setTimestamp();

      // 5. 動態組裝地圖與密碼 ANSI 欄位
      passwords.forEach((item) => {
        const codeText = item.code || 'N/A';
        embed.addFields({
          name: ` ${item.map}`,
          value: '```ansi\n\u001b[1;32m' + codeText + '\u001b[0m\n```',
          inline: true,
        });
      });

      return await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('[三角洲指令錯誤]:', error);
      
      // 如果已 defer，使用 editReply 避免 Discord 丟出已有回應的例外
      return await interaction.editReply({
        content: '<a:cross:1535233642312507443> 獲取每日密碼時發生錯誤，請稍後再試！',
      });
    }
  },
};
