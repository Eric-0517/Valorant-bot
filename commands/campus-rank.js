const { 
  EmbedBuilder, 
  SlashCommandBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType 
} = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('傳說查詢校園排行榜')
    .setDescription('查詢《傳說對決》校園排行榜'),

  async execute(interaction) {
    await interaction.deferReply();

    // 抓取 API 資料的獨立函式
    const fetchRankPage = async (page) => {
      try {
        const response = await axios.get(
          'https://campus.moba.garena.tw/v1/api/ranking',
          {
            params: {
              page: page,
              type: 'all_players-ranked',
            },
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Referer: 'https://campus.moba.garena.tw/',
            },
          }
        );
        return response.data;
      } catch (error) {
        console.error(`[Campus API 錯誤] Page ${page}:`, error.message);
        return null;
      }
    };

    let currentPage = 1;
    const maxPage = 10; // 1-100名，共10頁

    // 產生 Embed 與 Buttons 的函式
    const generateRankView = async (page) => {
      const data = await fetchRankPage(page);

      if (!data) {
        return {
          embeds: [
            new EmbedBuilder()
              .setColor('#FF4655')
              .setTitle('<a:cross:1535233642312507443> 抓取校園排行榜失敗')
              .setDescription('<a:cross:1535233642312507443>無法連接至 Garena 校園榜 ，請稍後再試！'),
          ],
          components: [],
        };
      }

      // 提取玩家列表 (相容多種 API 回傳格式)
      let rawList = data.data || data.list || data.items || (Array.isArray(data) ? data : []);

      // 關鍵修復點 1：若 API 一次回傳全榜（100筆），依照頁碼切割；若 API 有分頁，則確保只取前 10 筆
      let list = [];
      if (rawList.length > 10) {
        const startIndex = (page - 1) * 10;
        list = rawList.slice(startIndex, startIndex + 10);
      } else {
        list = rawList.slice(0, 10);
      }

      const startRank = (page - 1) * 10 + 1;
      const endRank = startRank + list.length - 1;

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`《傳說對決》校園英雄榜 - 全國個人榜`)
        .setDescription(`**目前顯示第 ${startRank} - ${endRank} 名** (第 ${page} / ${maxPage} 頁)`)
        .setFooter({ text: '數據來源: Garena 校園榜' })
        .setTimestamp();

      if (list.length === 0) {
        embed.addFields({ name: '無資料', value: '該頁面暫無數據。' });
      } else {
        let rankText = '';
        list.forEach((player, index) => {
          const rankNum = startRank + index;
          
          // 前三名名次圖示
          let medal = `**#${rankNum}**`;
          if (rankNum === 1) medal = '<:mainpageplace1:1536384797239414874>';
          else if (rankNum === 2) medal = '<:mainpageplace2:1536384794789941322>';
          else if (rankNum === 3) medal = '<:mainpageplace3:1536384790079606904>';

          const name = player.name || player.player_name || player.username || '匿名玩家';
          const school = player.school_name || player.school || '未填寫學校';
          const score = player.score || player.points || player.stars || '0';

          rankText += `${medal} | **${name}**\n ${school} • 積分: \`${score}\`\n\n`;
        });

        // 關鍵修復點 2：字數安全保護，確保不超過 Discord 1024 字元限制
        if (rankText.length > 1020) {
          rankText = rankText.substring(0, 1000) + '...\n*(內容過長已截斷)*';
        }

        embed.addFields({
          name: '排行榜名單',
          value: rankText || '無法解析玩家資料',
        });
      }

      // 建立按鈕
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('prev_page')
          .setLabel('◀')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 1), // 第一頁禁用上一頁

        new ButtonBuilder()
          .setCustomId('page_indicator')
          .setLabel(`第 ${page} / ${maxPage} 頁`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true), // 純顯示用的中繼按鈕

        new ButtonBuilder()
          .setCustomId('next_page')
          .setLabel('▶')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === maxPage) // 第十頁禁用下一頁
      );

      return { embeds: [embed], components: [row] };
    };

    // 1. 初次發送第 1 頁訊息
    const initialView = await generateRankView(currentPage);
    const responseMessage = await interaction.editReply(initialView);

    // 2. 建立 Component Collector 監聽按鈕點擊
    const collector = responseMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 120000, // 2 分鐘後按鈕自動失效
    });

    collector.on('collect', async (i) => {
      // 驗證是否為觸發指令的本人
      if (i.user.id !== interaction.user.id) {
        return await i.reply({
          content: '<a:cross:1535233642312507443> 只有下指令的人可以使用分頁按鈕！',
          ephemeral: true,
        });
      }

      // 根據點擊的按鈕更新頁碼
      if (i.customId === 'prev_page' && currentPage > 1) {
        currentPage--;
      } else if (i.customId === 'next_page' && currentPage < maxPage) {
        currentPage++;
      }

      // 刷新頁面
      await i.deferUpdate();
      const updatedView = await generateRankView(currentPage);
      await interaction.editReply(updatedView);
    });

    // 3. 監聽器逾時 (2 分鐘過後停用按鈕)
    collector.on('end', async () => {
      try {
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('prev_page')
            .setLabel('◀')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('page_indicator')
            .setLabel(`選單已過期`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('next_page')
            .setLabel('▶')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true)
        );

        await interaction.editReply({ components: [disabledRow] });
      } catch (e) {
        // 忽視訊息已被刪除等情況
      }
    });
  },
};
