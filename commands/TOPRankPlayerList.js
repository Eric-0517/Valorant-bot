const { 
  EmbedBuilder, 
  SlashCommandBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType 
} = require('discord.js');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

// 自動搜尋套件下載或系統中的 Chrome 執行檔
function findInstalledChrome() {
  const possiblePaths = [
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    path.join(process.env.HOME || '/opt/render', '.cache', 'puppeteer'),
    path.join(process.cwd(), '.cache', 'puppeteer')
  ];

  for (const basePath of possiblePaths) {
    if (fs.existsSync(basePath)) {
      if (fs.statSync(basePath).isFile()) return basePath;

      const stack = [basePath];
      while (stack.length > 0) {
        const current = stack.pop();
        try {
          const files = fs.readdirSync(current);
          for (const file of files) {
            const fullPath = path.join(current, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
              stack.push(fullPath);
            } else if (file === 'chrome' && (stat.mode & 0o111)) {
              return fullPath;
            }
          }
        } catch (e) {}
      }
    }
  }
  return null;
}

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

    const fetchRankPage = async (page, serverId) => {
      let browser = null;
      try {
        const chromePath = findInstalledChrome();
        if (!chromePath) {
          throw new Error('無法在系統中找到 Chrome 執行檔！');
        }

        browser = await puppeteer.launch({
          headless: 'new',
          executablePath: chromePath,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-blink-features=AutomationControlled',
            '--disable-infobars',
            '--window-size=1920,1080'
          ]
        });

        const browserPage = await browser.newPage();

        // 反爬蟲偽裝
        await browserPage.evaluateOnNewDocument(() => {
          Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
          Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
          Object.defineProperty(navigator, 'languages', { get: () => ['zh-TW', 'zh', 'en-US', 'en'] });
        });

        await browserPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

        // 先造訪主要排行榜頁面以取得對應驗證 Cookie (Turnstile / Antiforgery)
        await browserPage.goto('https://aovweb.azurewebsites.net/Ranking/TOPRankPlayer', {
          waitUntil: 'networkidle2',
          timeout: 25000
        });

        // 檢查是否卡在防爬/驗證頁面，若是則重整
        let isErrorPage = await browserPage.evaluate(() => {
          return document.body.innerText.includes('發生了某些錯誤') || document.body.innerText.includes('請重新整理');
        });

        let retryCount = 0;
        while (isErrorPage && retryCount < 2) {
          console.log(`[AOV 爬蟲] 觸發防爬頁面，自動嘗試重整 (${retryCount + 1}/2)...`);
          await browserPage.reload({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
          isErrorPage = await browserPage.evaluate(() => {
            return document.body.innerText.includes('發生了某些錯誤');
          });
          retryCount++;
        }

       
        const result = await browserPage.evaluate(async (targetPage, targetServer) => {
          try {
            // 對齊真實抓包格式：GET /Ranking/TOPRankPlayerList?page=X&server=Y
            const targetUrl = `/Ranking/TOPRankPlayerList?page=${targetPage}&server=${targetServer}`;

            const res = await fetch(targetUrl, {
              method: 'GET',
              headers: {
                'Accept': '*/*',
                'X-Requested-With': 'XMLHttpRequest'
              }
            });

            if (!res.ok) return null;

            // 判斷回應是 JSON 還是 HTML 片段
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              return await res.json();
            } else {
              const textData = await res.text();
              try {
                return JSON.parse(textData);
              } catch (e) {
                return { rawText: textData };
              }
            }
          } catch (e) {
            return null;
          }
        }, page, serverId);

        await browser.close();
        return result;

      } catch (error) {
        console.error(`[Puppeteer 抓取失敗] Page ${page}, Server ${serverId}:`, error.message);
        if (browser) await browser.close();
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
              .setDescription('目標網站遠端連線逾時或觸發防爬機制，請稍後再試。'),
          ],
          components: [],
        };
      }

      // 解析相容各式 API 格式
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
        embed.addFields({ name: '無資料', value: '該頁面暫無數據或傳回格式不符。' });
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
