const { EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { getDeltaPassword, parsePasswordText } = require('../functions/getDeltaPassword');

// 💡 記憶體快取 (In-Memory Cache)：防止每次查詢都重新爬取，加快回應速度
let cachedPasswords = null;
let lastFetchTime = 0;
// 快取有效時間：30 分鐘 (避免頻繁請求官方 API)
const CACHE_DURATION = 30 * 60 * 1000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('三角洲今日密碼')
    .setDescription('查詢《三角洲行動》今日密碼'),

  async execute(interaction) {
    // 💡 第一步：極速 Defer，防止 Discord 3 秒逾時報錯
    // 加上 ephemeral: true (僅自己可見) 有時能加快最初回應
    await interaction.deferReply(); 

    try {
      console.log('[三角洲指令] 收到查詢請求，開始處理...');
      const now = Date.now();
      let passwords = cachedPasswords;

      // 判斷快取是否失效（或第一次查詢）
      const shouldFetchNew = !passwords || passwords.length === 0 || (now - lastFetchTime > CACHE_DURATION);

      if (shouldFetchNew) {
        console.log('[三角洲指令] 快取失效或不存在，開始即時線上抓取...');
        passwords = await getDeltaPassword();

        if (passwords && passwords.length > 0) {
          // 成功抓取，更新快取
          cachedPasswords = passwords;
          lastFetchTime = now;
          console.log('[三角洲指令] ✅ 線上抓取成功，已更新記憶體快取。');
        }
      } else {
        console.log(`[三角洲指令] ⚡ 直接讀取快取資料 (上次更新時間: ${new Date(lastFetchTime).toLocaleTimeString('zh-TW', {timeZone: 'Asia/Taipei'})})`);
      }

      // 3. 解析與 Fallback 備援 (如果線上抓取失敗且無舊快取)
      if (!passwords || passwords.length === 0) {
        console.warn('[三角洲指令] ⚠️ 線上抓取失敗且無可用快取，觸發 Fallback 預設文字');
        const fallbackText = "零號大壩\n\nN/A\n\n長弓溪谷\n\nN/A\n\n巴克什\n\nN/A\n\n航天基地\n\nN/A\n\n潮汐監獄\n\nN/A\n\nAZ3\n\nN/A";
        passwords = parsePasswordText(fallbackText);
      }

      // 4. 取得台灣時間字串
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

      // 5. 組合 Embed 欄位
      passwords.forEach((item) => {
        embed.addFields({
          name: ` ${item.map}`,
          value: '```ansi\n\u001b[1;32m' + item.code + '\u001b[0m\n```',
          inline: true,
        });
      });

      // 💡 最後：使用 editReply 回應 Defer
      return await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('[三角洲指令致命錯誤]:', error);
      return await interaction.editReply({
        content: '<a:cross:1535233642312507443> 獲取每日密碼時發生錯誤，請稍後再試！',
      });
    }
  },
};
