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
    await interaction.deferReply();

    // 取得選擇的伺服器
    const server = interaction.options.getInteger('server');
    const serverName = server === 1 ? '1服 (聖騎之王)' : '2服 (純潔之翼)';

    // 抓取排位 API 資料
    const fetchRankPage = async (page, serverId) => {
      try {
        const response = await axios.get(
          'https://aovweb.azurewebsites.net/Ranking/TOPRankPlayerList',
          {
            params: {
              // 補齊大小寫組合，確保與 .NET API 相容
              page: String(page),
              server: String(serverId),
              Page: String(page),
              Server: String(serverId)
            },
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
              'Referer': 'https://aovweb.azurewebsites.net/',
              'X-Requested-With': 'XMLHttpRequest'
            },
            timeout: 8000
          }
        );
        return response.data;
      } catch (error) {
        if (error.response) {
          // 印出 Azure 詳細 400 錯誤訊息以利對症下藥
          console.error(`[AOV 排位 API 400 錯誤資訊] Page ${page}, Server ${serverId}:`, error.response.data);
        } else {
          console.error(`[AOV 排位 API 網路錯誤] Page ${page}, Server ${serverId}:`, error.message);
        }
        return null;
      }
    };

    let currentPage = 1;
    const maxPage = 200; // API 支援至 200 頁

    // 產生 Embed 畫面與控制元件
    const generateRankView = async (page) => {
      const data = await fetchRankPage(page, server);

      if (!data) {
        return {
          embeds: [
            new EmbedBuilder()
              .setColor('#FF4655')
              .setTitle('抓取排位排行榜失敗')
              .setDescription('<a:cross:1535233642312507443> 無法連接至排位 API，請稍後再試！'),
          ],
          components: [],
        };
      }

      // 相容不同的 API 回傳結構 (data.data, data.list, data.items 或直接為 Array)
      let rawList = data.data || data.list || data.items || (Array.isArray(data) ? data : []);

      // 關鍵防護：若 API 一次回傳超過 10 筆，強制切片當頁的 10 筆資料，避免 Discord Field 1024 字元溢位
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
        .setTitle(`《傳說對決》排位排行榜 - ${serverName}`)
        .setDescription(`**目前顯示第 ${startRank} - ${endRank} 名** (第 ${page} / ${maxPage} 頁)`)
        .setFooter({ text: '數據來源: AOV排行榜' })
        .setTimestamp();

      if (list.length === 0) {
        embed.addFields({ name: '無資料', value: '該頁面暫無數據。' });
      } else {
        let rankText = '';
        list.forEach((player, index) => {
          const rankNum = startRank + index;
          
          // 名次徽章
          let medal = `**#${rankNum}**`;
          if (rankNum === 1) medal = '<:mainpageplace1:1536384797239414874>';
          else if (rankNum === 2) medal = '<:mainpageplace2:1536384794789941322>';
          else if (rankNum === 3) medal = '<:mainpageplace3:1536384790079606904>';

          // 取得玩家欄位 (相容各種 API 命名風格)
          const name = player.name || player.player_name || player.username || player.playerName || '匿名玩家';
          const score = player.star || player.stars || player.score || player.points || '0';
          const titleOrHero = player.hero || player.title || player.rank_name || '';

          const extraInfo = titleOrHero ? ` • ${titleOrHero}` : '';
          rankText += `${medal} | **${name}**\n 排位星數/積分: \`${score}\`${extraInfo}\n\n`;
        });

        // 長度雙重防護 (上限 1024 字元)
        if (rankText.length > 1020) {
          rankText = rankText.substring(0, 1000) + '...\n*(內容過長已截斷)*';
        }

        embed.addFields({
          name: '排行榜名單',
          value: rankText || '無法解析玩家資料',
        });
      }

      // 控制按鈕 (上一頁 / 頁碼 / 下一頁)
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('prev_page')
          .setLabel('◀')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 1),

        new ButtonBuilder()
          .setCustomId('page_indicator')
          .setLabel(`第 ${page} / ${maxPage} 頁`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),

        new ButtonBuilder()
          .setCustomId('next_page')
          .setLabel('▶')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === maxPage)
      );

      return { embeds: [embed], components: [row] };
    };

    // 1. 初次渲染第 1 頁
    const initialView = await generateRankView(currentPage);
    const responseMessage = await interaction.editReply(initialView);

    // 2. 監聽翻頁按鈕
    const collector = responseMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 120000, // 2 分鐘後按鈕自動失效
    });

    collector.on('collect', async (i) => {
      // 驗證觸發者是否為指令發起者
      if (i.user.id !== interaction.user.id) {
        return await i.reply({
          content: '<a:cross:1535233642312507443> 只有下指令的人可以使用分頁按鈕！',
          ephemeral: true,
        });
      }

      if (i.customId === 'prev_page' && currentPage > 1) {
        currentPage--;
      } else if (i.customId === 'next_page' && currentPage < maxPage) {
        currentPage++;
      }

      await i.deferUpdate();
      const updatedView = await generateRankView(currentPage);
      await interaction.editReply(updatedView);
    });

    // 3. 逾時處理 (停用按鈕)
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
        // 忽略訊息已被刪除等情況
      }
    });
  },
};
