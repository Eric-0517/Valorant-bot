const { EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { buttons } = require('../components/buttons');
const assets = require('../assets.json');
const { DataType } = require('../constants/types');
const { getAuthor } = require('../functions/getAuthor');
const { getArgs } = require('../functions/getArgs');
const { getData } = require('../api');
const { handleResponse } = require('../functions/handleResponse');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('特戰查詢地圖數據')
    .setDescription('取得 VALORANT 玩家地圖數據統計')
    .addStringOption((option) =>
      option
        .setName('玩家名稱-標籤')
        .setDescription('您的 VALORANT 玩家名稱與標籤（例如：eric0517#7632）')
        .setRequired(false)
    ),
  async execute(interaction) {
    await interaction.deferReply();

    try {
      // 1. 優先獲取輸入框的內容，若無則讀取綁定帳號 (getArgs)
      const inputTag = interaction.options.getString('玩家名稱-標籤');
      const rawPlayerID = inputTag ? inputTag.trim() : await getArgs(interaction);

      if (!rawPlayerID) {
        return await interaction.editReply({
          content: '<a:cross:1535233642312507443> 請提供有效的玩家名稱與標籤，或先進行帳號綁定！',
          ephemeral: true,
        });
      }

      const playerID = encodeURIComponent(rawPlayerID);

      const [trackerProfile, trackerOverview] = await Promise.all([
        getData(playerID, DataType.PROFILE),
        getData(playerID, DataType.COMP_OVERVIEW),
      ]);

      const dataSources = [trackerOverview, trackerProfile];
      if (!(await handleResponse(interaction, dataSources))) return;

      const rawProfile = trackerProfile?.data?.data || trackerProfile?.data;
      const author = getAuthor(rawProfile, playerID);

      // 安全過濾並取出 type === 'map' 的資料
      const rawData = trackerOverview?.data?.data;
      const mapObjects = Array.isArray(rawData)
        ? rawData.filter((item) => item.type === 'map')
        : [];

      // 依遊玩時間排序
      mapObjects.sort(
        (a, b) => (b.stats?.timePlayed?.value || 0) - (a.stats?.timePlayed?.value || 0)
      );

      const mapEmbed = new EmbedBuilder()
        .setColor('#11806A')
        .setAuthor(author)
        .setDescription('```grey\n              地圖數據統計\n```')
        .setFooter({ text: '僅限競技模式地圖數據' });

      // 安全設定大頭貼
      if (author?.iconURL) {
        mapEmbed.setThumbnail(author.iconURL);
      }

      if (mapObjects.length === 0) {
        mapEmbed.addFields({
          name: '無地圖數據',
          value: '<a:cross:1535233642312507443> 未找到該玩家在競技模式中的地圖數據。',
        });
      } else {
        mapObjects.forEach((map) => {
          const name = map.metadata?.name || '未知地圖';
          const timePlayed = map.stats?.timePlayed?.displayValue || 'N/A';
          const matchesWon = map.stats?.matchesWon?.displayValue || '0';
          const matchesLost = map.stats?.matchesLost?.displayValue || '0';
          const rawWinPct = map.stats?.matchesWinPct?.value ?? 0;

          // 計算勝率視覺條
          const validWinPct = Math.max(0, Math.min(100, Number(rawWinPct) || 0));
          const greenSquare = Math.round((validWinPct / 100) * 16);
          const redSquare = 16 - greenSquare;

          const winRateVisualized =
            '<:greenline:839562756930797598>'.repeat(greenSquare) +
            '<:redline:839562438760071298>'.repeat(redSquare);

          const mapEmoji = assets.mapEmojis?.[name]?.emoji || '▫️';
          const winRatePct = validWinPct.toFixed(0);

          mapEmbed.addFields({
            name: `${name}  ${mapEmoji}    |    ${timePlayed}    |    勝利/戰敗：${matchesWon}/${matchesLost} - ${winRatePct}%`,
            value: winRateVisualized || '▫️',
            inline: false,
          });
        });
      }

      return await interaction.editReply({
        embeds: [mapEmbed],
        components: [buttons],
      });
    } catch (error) {
      console.error('<a:cross:1535233642312507443> 執行地圖數據查詢時出錯:', error);
      return await interaction
        .editReply('<a:cross:1535233642312507443> 查詢地圖數據時發生錯誤，請確認玩家名稱標籤是否正確或稍後再試。')
        .catch(() => {});
    }
  },
};
