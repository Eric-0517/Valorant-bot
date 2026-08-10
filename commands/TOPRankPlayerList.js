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

    const server = interaction.options.getInteger('server');
    const serverName = server === 1 ? '1服 (聖騎之王)' : '2服 (純潔之翼)';

    // 建立帶有基礎 Header 的 Axios 實例
    const apiClient = axios.create({
      baseURL: 'https://aovweb.azurewebsites.net',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });

    // 修正後的 API 抓取邏輯
    const fetchRankPage = async (page, serverId) => {
      try {
        // Step 1: 預先存取頁面以獲取伺服器 Session / Cookie
        const initRes = await apiClient.get('/Ranking/TOPRankPlayer');
        const setCookieHeader = initRes.headers['set-cookie'];
        
        let cookieString = '';
        if (setCookieHeader) {
          cookieString = setCookieHeader.map(c => c.split(';')[0]).join('; ');
        }

        // Step 2: 將參數封裝為 x-www-form-urlencoded 格式 (修復 400 錯誤關鍵)
        const formData = new URLSearchParams();
        formData.append('page', page.toString());
        formData.append('server', serverId.toString());

        // Step 3: 使用 POST 發送請求並附帶 Ajax 識別與 Referer
        const response = await apiClient.post('/Ranking/TOPRankPlayerList', formData, {
          headers: {
            'Cookie': cookieString,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            'Origin': 'https://aovweb.azurewebsites.net',
            'Referer': 'https://aovweb.azurewebsites.net/Ranking/TOPRankPlayer'
          }
        });

        return response.data;
      } catch (error) {
        if (error.response) {
          console.error(`[AOV API 錯誤] Status ${error.response.status}`);
        } else {
          console.error(`[AOV API 錯誤] Page ${page}, Server ${serverId}:`, error.message);
        }
        return null;
      }
    };

    let currentPage = 1;
    const maxPage = 200;

    const generateRankView = async (page) => {
      const data = await fetchRankPage(page, server);

      if (!data) {
        return {
          embeds: [
            new EmbedBuilder()
              .setColor('#FF4655')
              .setTitle('<a:cross:1535233642312507443> 抓取排位排行榜失敗')
              .setDescription('無法正常從伺服器讀取數據，請確認 API 站台是否正常運作。'),
          ],
          components: [],
        };
      }

      let rawList = data.data || data.list || data.items || (Array.isArray(data) ? data : []);

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
          
          let medal = `**#${rankNum}**`;
          if (rankNum === 1) medal = '<:mainpageplace1:1536384797239414874>';
          else if (rankNum === 2) medal = '<:mainpageplace2:1536384794789941322>';
          else if (rankNum === 3) medal = '<:mainpageplace3:1536384790079606904>';

          const name = player.name || player.player_name || player.username || player.playerName || '匿名玩家';
          const score = player.star || player.stars || player.score || player.points || '0';
          const titleOrHero = player.hero || player.title || player.rank_name || '';

          const extraInfo = titleOrHero ? ` • ${titleOrHero}` : '';
          rankText += `${medal} | **${name}**\n 排位星數/積分: \`${score}\`${extraInfo}\n\n`;
        });

        if (rankText.length > 1020) {
          rankText = rankText.substring(0, 1000) + '...\n*(內容過長已截斷)*';
        }

        embed.addFields({
          name: '排行榜名單',
          value: rankText || '無法解析玩家資料',
        });
      }

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

    const initialView = await generateRankView(currentPage);
    const responseMessage = await interaction.editReply(initialView);

    const collector = responseMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 120000,
    });

    collector.on('collect', async (i) => {
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
      } catch (e) {}
    });
  },
};
