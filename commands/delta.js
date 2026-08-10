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
      console.log('[三角洲指令] 收到查詢請求，開始即時線上抓取...');

      // 1. 現場發送 Request 抓取最新密碼
      let passwords = await getDeltaPassword();

      // 2. 爬取失敗時的回退機制
      if (!passwords || passwords.length === 0) {
        console.warn('[三角洲指令] 抓取結果為空或失敗，觸發 Fallback 預設文字');
        const fallbackText = "零號大壩\n\nN/A\n\n長弓溪谷\n\nN/A\n\n巴克什\n\nN/A\n\n航天基地\n\nN/A\n\n潮汐監獄\n\nN/A\n\nAZ3\n\nN/A";
        passwords = parsePasswordText(fallbackText);
      }

      // 3. 取得台灣時間字串
      const todayStr = new Date().toLocaleDateString('zh-TW', {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });

      const embed = new EmbedBuilder()
        .setColor('#00FF99')
        .setTitle('《三角洲行動》今日密碼')
        .setDescription(` **更新日期：** \`${todayStr}\` \n [官方頁面](https://www.playdeltaforce.com/events/hq/zh-tw/)`)
        .setFooter({ text: 'Data provided by Delta Force HQ' })
        .setTimestamp();

      // 4. 組合 Embed 欄位
      passwords.forEach((item) => {
        embed.addFields({
          name: ` ${item.map}`,
          value: '```ansi\n\u001b[1;32m' + item.code + '\u001b[0m\n```',
          inline: true,
        });
      });

      return await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('[三角洲指令錯誤]:', error);
      return await interaction.editReply({
        content: '<a:cross:1535233642312507443> 獲取每日密碼時發生錯誤，請稍後再試！',
      });
    }
  },
};
