const { SlashCommandBuilder } = require('@discordjs/builders');
const { getData } = require('../api');
const { Overview } = require('../constants/overview');
const { DataType } = require('../constants/types');
const { getAuthor } = require('../functions/getAuthor');
const { getArgs } = require('../functions/getArgs');
const { handlePages } = require('../functions/handlePages');
const { createEmbed } = require('../functions/createEmbed');
const assets = require('../assets.json');
const { handleResponse } = require('../functions/handleResponse');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('特戰競技模式數據統計')
    .setDescription('取得 VALORANT 玩家競技模式的生涯數據統計')
    .addStringOption((option) =>
      option
        .setName('玩家名稱-標籤')
        .setDescription('您的 VALORANT 玩家名稱與標籤 (例如: eric0517#7632)')
        .setRequired(false)
    ),
  async execute(interaction) {
    await interaction.deferReply();

    try {
      const playerID = encodeURIComponent(await getArgs(interaction));
      if (!playerID) {
        return await interaction.editReply('<a:cross:1535233642312507443>請提供有效的玩家名稱與標籤！');
      }

      const [trackerProfile, trackerOverview, trackerRank] = await Promise.all([
        getData(playerID, DataType.PROFILE),
        getData(playerID, DataType.COMP_OVERVIEW),
        getData(playerID, DataType.RANK),
      ]);

      const dataSources = [trackerOverview, trackerProfile, trackerRank];
      if (!(await handleResponse(interaction, dataSources))) return;

      const profileOverview = trackerOverview.data.data[0].stats;
      const author = getAuthor(trackerProfile.data.data, playerID);
      const stats = Overview(profileOverview);

      let rankName = stats.rankName; // Rank Name

      // Set rank emoji and name if Radiant or Immortal
      const rankEmoji = assets.rankEmojis[rankName]?.emoji || '';
      if (rankName.includes('Immortal') || rankName.includes('Radiant')) {
        rankName =
          rankName +
          ' #' +
          (profileOverview.rank.rank ? profileOverview.rank.rank : '') +
          '\n' +
          profileOverview.rank.value +
          ' RR';
      }

      const embeds = [
        createEmbed(
          'Competitive Career Stats',
          [
            { name: 'KDR', value: '```ansi\n\u001b[2;36m' + stats.kdrRatio + '\n```', inline: true },
            {
              name: 'DMG/R',
              value: '```ansi\n\u001b[2;36m' + stats.damagePerRound + '\n```',
              inline: true,
            },
            { name: '牌位 ' + rankEmoji, value: '```ansi\n\u001b[2;37m' + rankName + '\n```', inline: true },
            { name: '擊殺', value: '```ansi\n\u001b[2;36m' + stats.kills + '\n```', inline: true },
            { name: '死亡', value: '```ansi\n\u001b[2;36m' + stats.deaths + '\n```', inline: true },
            {
              name: '助攻',
              value: '```ansi\n\u001b[2;36m' + stats.assists + '\n```',
              inline: true,
            },
            {
              name: '單場最高擊殺',
              value: '```ansi\n\u001b[2;36m' + stats.mostKills + '\n```',
              inline: true,
            },
            {
              name: '遊玩時長',
              value: '```ansi\n\u001b[2;36m' + stats.timePlayed + '\n```',
              inline: true,
            },
            {
              name: '勝率 - ' + stats.winRatePct,
              value:
                stats.winRateBar +
                ' ```ansi\n\u001b[2;34m' +
                ' 勝利: ' +
                stats.matchesWon +
                '\u001b[2;30m |\u001b[2;35m 失敗: ' +
                stats.matchesLost +
                '\u001b[2;30m |\u001b[2;37m 平手: ' +
                stats.matchesTied +
                '\n```',
              inline: false,
            },
          ],
          author
        ),
        createEmbed(
          'Competitive Career Stats',
          [
            {
              name: '平均擊殺數',
              value: '```ansi\n\u001b[2;36m' + stats.killsPerMatch + '\n```',
              inline: true,
            },
            {
              name: '平均死亡數',
              value: '```ansi\n\u001b[2;36m' + stats.deathsPerMatch + '\n```',
              inline: true,
            },
            {
              name: '平均助攻數',
              value: '```ansi\n\u001b[2;36m' + stats.assistsPerMatch + '\n```',
              inline: true,
            },
            {
              name: '擊殺分數',
              value: '```ansi\n\u001b[2;36m' + stats.avgCombatScore + '\n```',
              inline: true,
            },
            {
              name: '爆頭率 %',
              value: '```ansi\n\u001b[2;36m' + stats.headshotPct + '\n```',
              inline: true,
            },
            {
              name: '1v1 殘局獲勝',
              value: '```ansi\n\u001b[2;36m' + stats.oneVsOneClutches + '\n```',
              inline: true,
            },
            {
              name: '安裝核心',
              value: '```ansi\n\u001b[2;36m' + stats.plantCount + '\n```',
              inline: true,
            },
            {
              name: '拆除核心',
              value: '```ansi\n\u001b[2;36m' + stats.defuseCount + '\n```',
              inline: true,
            },
            {
              name: '經濟評分',
              value: '```ansi\n\u001b[2;36m' + stats.avgEconRating + '\n```',
              inline: true,
            },
            { name: '滅隊次數', value: '```ansi\n\u001b[2;36m' + stats.aceCount + '\n```', inline: true },
            {
              name: '首殺',
              value: '```ansi\n\u001b[2;36m' + stats.firstBloodCount + '\n```',
              inline: true,
            },
            {
              name: '首死',
              value: '```ansi\n\u001b[2;36m' + stats.firstDeathsCount + '\n```',
              inline: true,
            },
          ],
          author
        ),
      ];

      handlePages(interaction, embeds, author);
    } catch (error) {
      console.error('<a:cross:1535233642312507443> 執行數據查詢指令時出錯:', error);
      await interaction.editReply({ content: '<a:cross:1535233642312507443> 查詢數據時發生錯誤，請確認玩家名稱標籤是否正確或稍後再試。' }).catch(() => {});
    }
  },
};