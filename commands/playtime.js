const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { buttons } = require('../components/buttons');
const { DataType } = require('../constants/types');
const { getArgs } = require('../functions/getArgs');
const { getAuthor } = require('../functions/getAuthor');
const { getData } = require('../api');
const { handleResponse } = require('../functions/handleResponse');

function formatPlaytime(value) {
  if (!value || value === 'N/A') return 'N/A';
  if (typeof value === 'string' && isNaN(Number(value))) return value; 

  let seconds = Number(value);
  if (seconds > 10000000) seconds = Math.floor(seconds / 1000); 

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} 小時 ${minutes} 分鐘`;
  } else if (minutes > 0) {
    return `${minutes} 分鐘`;
  }
  return `${seconds} 秒`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('特戰取得玩家總遊玩時長')
    .setDescription('取得 VALORANT 玩家的總遊玩時間')
    .addStringOption((option) =>
      option
        .setName('玩家名稱-標籤')
        .setDescription('您的 VALORANT 玩家名稱與標籤（例如：eric0517#7632）')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      // 優先獲取輸入框的內容，若無則讀取綁定帳號
      const inputTag = interaction.options.getString('玩家名稱-標籤');
      const rawPlayerID = inputTag ? inputTag.trim() : await getArgs(interaction);

      if (!rawPlayerID) {
        return await interaction.editReply({
          content: '<a:cross:1535233642312507443> 請提供有效的玩家名稱與標籤，或先進行帳號綁定！',
          ephemeral: true,
        });
      }

      const playerID = encodeURIComponent(rawPlayerID);

      // 平行發送 API 請求
      const [trackerProfile, trackerReport] = await Promise.all([
        getData(playerID, DataType.PROFILE),
        getData(playerID, DataType.SEASON_REPORT).catch(() => null),
      ]);

      const dataSources = [trackerProfile];
      if (trackerReport) dataSources.push(trackerReport);

      if (!(await handleResponse(interaction, dataSources))) return;

      const rawProfile = trackerProfile?.data?.data || trackerProfile?.data;
      const author = getAuthor(rawProfile, playerID);

      let matches = 'N/A';
      let rawHours = 'N/A';

      
      if (Array.isArray(trackerReport?.data?.data)) {
        const lifetime = trackerReport.data.data.filter(
          (item) => item.type === 'lifetime-matchmaking-time'
        );

        for (const item of lifetime) {
          matches = item.stats?.matches?.displayValue || item.stats?.matches?.value || matches;
          rawHours = item.stats?.hours?.displayValue || item.stats?.hours?.value || rawHours;
        }
      }

      
      if (rawHours === 'N/A' && rawProfile) {
        // 時長解析
        if (rawProfile.stats?.timePlayed?.displayValue || rawProfile.stats?.timePlayed?.value) {
          rawHours = rawProfile.stats.timePlayed.displayValue || rawProfile.stats.timePlayed.value;
        } else if (rawProfile.stats?.playtime) {
          rawHours = rawProfile.stats.playtime;
        }

        // 場數解析
        if (rawProfile.stats?.matchesPlayed?.displayValue || rawProfile.stats?.matchesPlayed?.value) {
          matches = rawProfile.stats.matchesPlayed.displayValue || rawProfile.stats.matchesPlayed.value;
        } else if (rawProfile.stats?.matches) {
          matches = rawProfile.stats.matches;
        }
      }

      // 格式化最終顯示的遊玩時間
      const displayHours = formatPlaytime(rawHours);

      const playtimeEmbed = new EmbedBuilder()
        .setColor('#11806A')
        .setAuthor(author)
        .addFields(
          {
            name: '總遊玩時間',
            value: `\`\`\`ansi\n\u001b[2;36m${displayHours}\n\`\`\``,
            inline: true,
          },
          {
            name: '對戰場數',
            value: `\`\`\`ansi\n\u001b[2;33m${matches}\n\`\`\``,
            inline: true,
          }
        )
        .setFooter({ text: '由 Eric 開發（包含所有模式數據）' });

      if (author?.iconURL) {
        playtimeEmbed.setThumbnail(author.iconURL);
      }

      return await interaction.editReply({
        embeds: [playtimeEmbed],
        components: [buttons],
      });
    } catch (error) {
      console.error('<a:cross:1535233642312507443> 執行遊玩時長查詢時出錯:', error);
      return await interaction
        .editReply('<a:cross:1535233642312507443> 查詢遊玩時長時發生錯誤，請確認玩家名稱標籤是否正確。')
        .catch(() => {});
    }
  },
};
