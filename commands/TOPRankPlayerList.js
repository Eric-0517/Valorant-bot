const {
  EmbedBuilder,
  SlashCommandBuilder
} = require('discord.js');

const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL =
  'https://aovweb.azurewebsites.net/Ranking/TOPRankPlayerList';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('傳說查詢排位排行榜')
    .setDescription('查詢《傳說對決》排位排行榜')
    .addIntegerOption(option =>
      option
        .setName('server')
        .setDescription('選擇伺服器')
        .setRequired(true)
        .addChoices(
          { name: '1服 (聖騎之王)', value: 1 },
          { name: '2服 (純潔之翼)', value: 2 }
        )
    )
    .addIntegerOption(option =>
      option
        .setName('page')
        .setDescription('排行榜頁數')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(200)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const server = interaction.options.getInteger('server');
    const page = interaction.options.getInteger('page') || 1;

    const serverName =
      server === 1
        ? '1服・聖騎之王'
        : '2服・純潔之翼';

    try {
      // ==============================
      // 取得排行榜 HTML
      // ==============================

      const response = await axios.get(BASE_URL, {
        params: {
          page,
          server
        },

        timeout: 15000,

        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) ' +
            'Chrome/151.0.0.0 Safari/537.36',

          'Accept':
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',

          'Accept-Language':
            'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7'
        }
      });

      // ==============================
      // 解析 HTML
      // ==============================

      const $ = cheerio.load(response.data);

      const players = [];

      $('table.table tbody tr').each((index, element) => {
        const cells = $(element).find('td');

        // 排行榜應該固定 5 個欄位
        if (cells.length < 5) {
          return;
        }

        // ==============================
        // 排名 / 分數
        // ==============================

        const rankCell = $(cells[0]);

        const rankText = rankCell
          .clone()
          .children()
          .remove()
          .end()
          .text()
          .trim();

        const rank =
          rankText.match(/#(\d+)/)?.[1] || '?';

        const scoreText =
          rankCell.find('small').text().trim() || '';

        // ==============================
        // 玩家
        // ==============================

        const playerCell = $(cells[1]);

        const avatar =
          playerCell.find('img').attr('src') || null;

        const playerName =
          playerCell
            .clone()
            .children('img, br, small')
            .remove()
            .end()
            .text()
            .trim();

        const uidText =
          playerCell.find('small').text().trim();

        const uid =
          uidText.replace(/^\\(UID:\\s*/, '').replace(/\\)$/, '');

        // ==============================
        // 排位
        // ==============================

        const rankName =
          $(cells[2]).text().trim();

        // ==============================
        // 星數
        // ==============================

        const starText =
          $(cells[3]).text().trim();

        const stars =
          starText.match(/x\\s*(\\d+)/i)?.[1] || '0';

        // ==============================
        // 最後遊玩時間
        // ==============================

        const lastPlay =
          $(cells[4]).text().trim();

        players.push({
          rank,
          score: scoreText,
          name: playerName || '未知玩家',
          uid,
          avatar,
          rankName,
          stars,
          lastPlay
        });
      });

      // ==============================
      // 沒有資料
      // ==============================

      if (players.length === 0) {
        const embed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ 找不到排行榜資料')
          .setDescription(
            [
              `伺服器：**${serverName}**`,
              `頁數：**第 ${page} 頁**`,
              '',
              '網站有回應，但沒有找到排行榜資料。',
              '',
              '可能原因：',
              '• 網站暫時異常',
              '• 頁數不存在',
              '• 網站 HTML 結構發生變化'
            ].join('\\n')
          )
          .setFooter({
            text: '傳說對決排行榜'
          })
          .setTimestamp();

        return await interaction.editReply({
          embeds: [embed]
        });
      }

      // ==============================
      // 建立排行榜
      // ==============================

      const embed = new EmbedBuilder()
        .setColor('#37B7FF')
        .setTitle('🏆 傳說對決・排位排行榜')
        .setDescription(
          [
            `🌐 **${serverName}**`,
            `📄 第 **${page} / 200** 頁`,
            `👥 本頁 **${players.length}** 名玩家`
          ].join('\\n')
        );

      // ==============================
      // 每頁網站有 100 名
      // Discord Embed 最多 25 個 fields
      //
      // 因此這裡只顯示前 20 名
      // ==============================

      const displayPlayers = players.slice(0, 20);

      for (const player of displayPlayers) {
        embed.addFields({
          name:
            `#${player.rank}  ${player.name}`,

          value:
            [
              `🏅 **${player.rankName}**`,
              `⭐ ${player.stars} 星`,
              `📊 ${player.score}`,
              `🆔 UID: \`${player.uid}\``,
              `🕒 ${player.lastPlay}`
            ].join('\\n'),

          inline: false
        });
      }

      // ==============================
      // 頭像
      // ==============================

      if (players[0]?.avatar) {
        embed.setThumbnail(players[0].avatar);
      }

      embed.setFooter({
        text:
          `數據提供：AOV Web ｜ 第 ${page} 頁`
      });

      embed.setTimestamp();

      // ==============================
      // 回覆
      // ==============================

      return await interaction.editReply({
        embeds: [embed]
      });

    } catch (error) {
      console.error(
        '[AOV 排行榜] 抓取失敗：',
        error
      );

      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ 排行榜查詢失敗')
        .setDescription(
          [
            '無法取得排行榜資料。',
            '',
            `🌐 伺服器：${serverName}`,
            `📄 頁數：${page}`,
            '',
            '請稍後再試。'
          ].join('\\n')
        )
        .setFooter({
          text: 'AOV 排行榜服務'
        })
        .setTimestamp();

      return await interaction.editReply({
        embeds: [embed]
      });
    }
  }
};
