const {
  EmbedBuilder,
  SlashCommandBuilder
} = require('discord.js');

const { chromium } = require('playwright');

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

    const server =
      interaction.options.getInteger('server');

    const page =
      interaction.options.getInteger('page') || 1;

    const serverName =
      server === 1
        ? '1服・聖騎之王'
        : '2服・純潔之翼';

    let browser = null;

    try {
      // ==========================================
      // 啟動 Chromium
      // ==========================================

      browser = await chromium.launch({
        headless: true,

        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ]
      });

      const context = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
          'AppleWebKit/537.36 (KHTML, like Gecko) ' +
          'Chrome/151.0.0.0 Safari/537.36',

        locale: 'zh-TW',

        viewport: {
          width: 1366,
          height: 900
        }
      });

      const pageObject =
        await context.newPage();

      // ==========================================
      // 開啟排行榜
      // ==========================================

      const url =
        `${BASE_URL}?page=${page}&server=${server}`;

      console.log(
        `[AOV 排行榜] 開啟：${url}`
      );

      await pageObject.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      // ==========================================
      // 等待排行榜表格
      // ==========================================

      await pageObject.waitForSelector(
        'table.table tbody tr',
        {
          timeout: 20000
        }
      );

      // ==========================================
      // 找「重新整理頁面」
      //
      // 如果網站存在：
      //
      // onclick="location.reload(); return false;"
      //
      // 就實際點擊一次
      // ==========================================

      const refreshLink =
        pageObject.locator(
          '[onclick*="location.reload"]'
        ).first();

      const refreshCount =
        await refreshLink.count();

      if (refreshCount > 0) {
        console.log(
          '[AOV 排行榜] 發現「重新整理頁面」，開始點擊'
        );

        try {
          await Promise.all([
            pageObject.waitForLoadState(
              'domcontentloaded',
              {
                timeout: 20000
              }
            ).catch(() => {}),

            refreshLink.click({
              timeout: 10000
            })
          ]);

          console.log(
            '[AOV 排行榜] 重新整理完成'
          );

        } catch (refreshError) {
          console.log(
            '[AOV 排行榜] 重新整理等待結束：',
            refreshError.message
          );
        }

        // ======================================
        // 重新載入後，再等待排行榜
        // ======================================

        await pageObject.waitForSelector(
          'table.table tbody tr',
          {
            timeout: 20000
          }
        );
      }

      // ==========================================
      // 稍微等待網站 JS 完成
      // ==========================================

      await pageObject.waitForTimeout(500);

      // ==========================================
      // 取得排行榜資料
      // ==========================================

      const players =
        await pageObject.locator(
          'table.table tbody tr'
        ).evaluateAll(rows => {

          return rows
            .map(row => {

              const cells =
                row.querySelectorAll('td');

              if (cells.length < 5) {
                return null;
              }

              // ================================
              // 排名
              // ================================

              const rankCell =
                cells[0];

              const rankText =
                rankCell.innerText.trim();

              const rankMatch =
                rankText.match(/#(\d+)/);

              const rank =
                rankMatch
                  ? rankMatch[1]
                  : '?';

              // ================================
              // 分數
              // ================================

              const scoreElement =
                rankCell.querySelector('small');

              const score =
                scoreElement
                  ? scoreElement.innerText.trim()
                  : '';

              // ================================
              // 玩家
              // ================================

              const playerCell =
                cells[1];

              const avatarElement =
                playerCell.querySelector('img');

              const avatar =
                avatarElement
                  ? avatarElement.src
                  : null;

              // 複製玩家欄位
              // 避免把 UID 算進玩家名稱
              const clone =
                playerCell.cloneNode(true);

              const cloneSmall =
                clone.querySelector('small');

              if (cloneSmall) {
                cloneSmall.remove();
              }

              const cloneImg =
                clone.querySelector('img');

              if (cloneImg) {
                cloneImg.remove();
              }

              const cloneBr =
                clone.querySelector('br');

              if (cloneBr) {
                cloneBr.remove();
              }

              const playerName =
                clone.textContent
                  .replace(/\s+/g, ' ')
                  .trim();

              // ================================
              // UID
              // ================================

              const uidElement =
                playerCell.querySelector('small');

              const uidText =
                uidElement
                  ? uidElement.innerText.trim()
                  : '';

              const uidMatch =
                uidText.match(/UID:\s*(\d+)/i);

              const uid =
                uidMatch
                  ? uidMatch[1]
                  : '';

              // ================================
              // 排位
              // ================================

              const rankName =
                cells[2]
                  .innerText
                  .trim();

              // ================================
              // 星數
              // ================================

              const starText =
                cells[3]
                  .innerText
                  .trim();

              const starMatch =
                starText.match(/x\s*(\d+)/i);

              const stars =
                starMatch
                  ? starMatch[1]
                  : '0';

              // ================================
              // 最後遊玩
              // ================================

              const lastPlay =
                cells[4]
                  .innerText
                  .trim();

              return {
                rank,
                score,
                name:
                  playerName || '未知玩家',
                uid,
                avatar,
                rankName,
                stars,
                lastPlay
              };
            })
            .filter(Boolean);
        });

      console.log(
        `[AOV 排行榜] 成功取得 ${players.length} 名玩家`
      );

      // ==========================================
      // 關閉瀏覽器
      // ==========================================

      await browser.close();
      browser = null;

      // ==========================================
      // 沒有資料
      // ==========================================

      if (players.length === 0) {

        const embed =
          new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ 找不到排行榜資料')
            .setDescription(
              [
                `🌐 伺服器：**${serverName}**`,
                `📄 頁數：**第 ${page} 頁**`,
                '',
                '網站有回應，但沒有找到排行榜資料。',
                '',
                '可能原因：',
                '• 網站暫時異常',
                '• 排行榜尚未更新',
                '• 網站 HTML 結構發生變化'
              ].join('\n')
            )
            .setFooter({
              text: '傳說對決排行榜'
            })
            .setTimestamp();

        return await interaction.editReply({
          embeds: [embed]
        });
      }

      // ==========================================
      // 建立 Embed
      // ==========================================

      const embed =
        new EmbedBuilder()
          .setColor('#37B7FF')
          .setTitle(
            '🏆 傳說對決・排位排行榜'
          )
          .setDescription(
            [
              `🌐 **${serverName}**`,
              `📄 第 **${page} / 200** 頁`,
              `👥 本頁 **${players.length}** 名玩家`
            ].join('\n')
          );

      // ==========================================
      // Discord Embed 最多 25 fields
      // 顯示前 20 名
      // ==========================================

      const displayPlayers =
        players.slice(0, 20);

      for (const player of displayPlayers) {

        const value = [
          `🏅 **${player.rankName}**`,
          `⭐ ${player.stars} 星`,
          `📊 ${player.score}`,
          `🆔 UID: \`${player.uid || '未知'}\``,
          `🕒 ${player.lastPlay}`
        ].join('\n');

        embed.addFields({
          name:
            `#${player.rank}　${player.name}`,

          value,

          inline: false
        });
      }

      // ==========================================
      // 第一名玩家頭像
      // ==========================================

      if (players[0]?.avatar) {
        embed.setThumbnail(
          players[0].avatar
        );
      }

      // ==========================================
      // Footer
      // ==========================================

      embed.setFooter({
        text:
          `數據提供：AOV Web ｜ 第 ${page} 頁`
      });

      embed.setTimestamp();

      // ==========================================
      // Discord 回覆
      // ==========================================

      return await interaction.editReply({
        embeds: [embed]
      });

    } catch (error) {

      console.error(
        '[AOV 排行榜] 抓取失敗：',
        error
      );

      // ==========================================
      // 確保瀏覽器關閉
      // ==========================================

      if (browser) {
        try {
          await browser.close();
        } catch {}
      }

      // ==========================================
      // 錯誤 Embed
      // ==========================================

      const embed =
        new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle(
            '❌ 排行榜查詢失敗'
          )
          .setDescription(
            [
              '無法取得《傳說對決》排行榜資料。',
              '',
              `🌐 伺服器：**${serverName}**`,
              `📄 頁數：**${page}**`,
              '',
              `錯誤：\`${error.message}\``,
              '',
              '請稍後再試。'
            ].join('\n')
          )
          .setFooter({
            text:
              'AOV 排行榜服務'
          })
          .setTimestamp();

      return await interaction.editReply({
        embeds: [embed]
      });
    }
  }
};
