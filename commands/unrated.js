const { SlashCommandBuilder } = require('@discordjs/builders');
const { getData } = require('../api');
const { Overview } = require('../constants/overview');
const { DataType } = require('../constants/types');
const { getAuthor } = require('../functions/getAuthor');
const { getArgs } = require('../functions/getArgs');
const { handlePages } = require('../functions/handlePages');
const { createEmbed } = require('../functions/createEmbed');
const { handleResponse } = require('../functions/handleResponse');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('特戰一般模式數據統計')
    .setDescription('取得 VALORANT 玩家一般模式的生涯數據統計')
    .addStringOption((option) =>
      option
        .setName('玩家名稱-標籤')
        .setDescription('您的 VALORANT 玩家名稱與標籤（例如：eric0517#7632）')
        .setRequired(false)
    ),
  async execute(interaction) {
    await interaction.deferReply();

    try {
      const rawArgs = await getArgs(interaction);
      if (!rawArgs) return;

      const cleanArgs = decodeURIComponent(rawArgs);
      const playerID = encodeURIComponent(cleanArgs);

      const [trackerProfile, trackerOverview] = await Promise.all([
        getData(playerID, DataType.PROFILE),
        getData(playerID, DataType.UNRATED_OVERVIEW),
      ]);

      const dataSources = [trackerOverview, trackerProfile];
      if (!(await handleResponse(interaction, dataSources))) return;

      // 安全取得 Profile 與 Author
      const rawProfile = trackerProfile?.data?.data || trackerProfile?.data;
      const author = getAuthor(rawProfile, playerID);

      // 解析 Overview Stats（加入相容性判斷與防禦機制）
      let profileOverview = null;

      // TRN 官方 API 結構 (data.data[0].stats)
      if (Array.isArray(trackerOverview?.data?.data) && trackerOverview.data.data[0]?.stats) {
        profileOverview = trackerOverview.data.data[0].stats;
      }
      // TRN 物件結構 (data.data.stats)
      else if (trackerOverview?.data?.data?.stats) {
        profileOverview = trackerOverview.data.data.stats;
      }
      // HenrikDev API 結構 (從近幾場一般模式數據匯總)
      else if (Array.isArray(trackerOverview?.data?.data)) {
        const matches = trackerOverview.data.data;
        let totalKills = 0, totalDeaths = 0, totalAssists = 0, totalDamage = 0, totalScore = 0;

        matches.forEach((m) => {
          totalKills += m.stats?.kills || 0;
          totalDeaths += m.stats?.deaths || 0;
          totalAssists += m.stats?.assists || 0;
          totalDamage += m.stats?.damage || 0;
          totalScore += m.stats?.score || 0;
        });

        const totalMatches = matches.length || 1;

        profileOverview = {
          kills: { displayValue: totalKills.toString() },
          deaths: { displayValue: totalDeaths.toString() },
          assists: { displayValue: totalAssists.toString() },
          kDRatio: { displayValue: totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : totalKills.toFixed(2) },
          damagePerRound: { displayValue: Math.round(totalDamage / (totalMatches * 12)).toString() },
          headshotsPercentage: { displayValue: 'N/A' },
          mostKills: { displayValue: 'N/A' },
          timePlayed: { displayValue: `近 ${totalMatches} 場` },
          matchesWinPct: { displayValue: 'N/A' },
          matchesWon: { displayValue: 'N/A' },
          matchesLost: { displayValue: 'N/A' },
          killsPerMatch: { displayValue: (totalKills / totalMatches).toFixed(1) },
          deathsPerMatch: { displayValue: (totalDeaths / totalMatches).toFixed(1) },
          assistsPerMatch: { displayValue: (totalAssists / totalMatches).toFixed(1) },
          avgCombatScore: { displayValue: Math.round(totalScore / totalMatches).toString() },
          avgEconRating: { displayValue: 'N/A' },
          oneVsOneClutches: { displayValue: 'N/A' },
          plantCount: { displayValue: 'N/A' },
          defuseCount: { displayValue: 'N/A' },
          aceCount: { displayValue: 'N/A' },
          firstBloodCount: { displayValue: 'N/A' },
          firstDeathsCount: { displayValue: 'N/A' },
        };
      }

      // 如果依然解析不到任何數據，給予預設值防止 Overview() 報錯
      const stats = Overview(profileOverview || {});

      const embeds = [
        createEmbed(
          '一般模式 生涯數據統計',
          [
            { name: 'KD比', value: '```ansi\n\u001b[2;36m' + (stats.kdrRatio || 'N/A') + '\n```', inline: true },
            {
              name: '每回合傷害 (DMG/R)',
              value: '```ansi\n\u001b[2;36m' + (stats.damagePerRound || 'N/A') + '\n```',
              inline: true,
            },
            {
              name: '爆頭率 %',
              value: '```ansi\n\u001b[2;36m' + (stats.headshotPct || 'N/A') + '\n```',
              inline: true,
            },
            { name: '總擊殺數', value: '```ansi\n\u001b[2;36m' + (stats.kills || '0') + '\n```', inline: true },
            { name: '總死亡數', value: '```ansi\n\u001b[2;36m' + (stats.deaths || '0') + '```', inline: true },
            {
              name: '總助攻數',
              value: '```ansi\n\u001b[2;36m' + (stats.assists || '0') + '\n```',
              inline: true,
            },
            {
              name: '單場最高擊殺',
              value: '```ansi\n\u001b[2;36m' + (stats.mostKills || 'N/A') + '\n```',
              inline: true,
            },
            {
              name: '總遊玩時間',
              value: '```ansi\n\u001b[2;36m' + (stats.timePlayed || 'N/A') + '\n```',
              inline: true,
            },
            {
              name: '勝率 - ' + (stats.winRatePct || 'N/A'),
              value:
                (stats.winRateBar || '') +
                ' ```ansi\n\u001b[2;34m' +
                '    勝: ' +
                (stats.matchesWon || '0') +
                '    \u001b[2;30m|\u001b[2;35m    敗: ' +
                (stats.matchesLost || '0') +
                '\n```',
              inline: false,
            },
          ],
          author
        ),
        createEmbed(
          '一般模式 生涯數據統計',
          [
            {
              name: '平均每局擊殺',
              value: '```ansi\n\u001b[2;36m' + (stats.killsPerMatch || 'N/A') + '\n```',
              inline: true,
            },
            {
              name: '平均每局死亡',
              value: '```ansi\n\u001b[2;36m' + (stats.deathsPerMatch || 'N/A') + '\n```',
              inline: true,
            },
            {
              name: '平均每局助攻',
              value: '```ansi\n\u001b[2;36m' + (stats.assistsPerMatch || 'N/A') + '\n```',
              inline: true,
            },
            {
              name: '平均戰鬥點數 (ACS)',
              value: '```ansi\n\u001b[2;36m' + (stats.avgCombatScore || 'N/A') + '\n```',
              inline: true,
            },
            {
              name: '平均經濟評分',
              value: '```ansi\n\u001b[2;36m' + (stats.avgEconRating || 'N/A') + '\n```',
              inline: true,
            },
            {
              name: '1v1 殘局勝場',
              value: '```ansi\n\u001b[2;36m' + (stats.oneVsOneClutches || 'N/A') + '\n```',
              inline: true,
            },
            {
              name: '成功裝包',
              value: '```ansi\n\u001b[2;36m' + (stats.plantCount || 'N/A') + '\n```',
              inline: true,
            },
            {
              name: '成功拆包',
              value: '```ansi\n\u001b[2;36m' + (stats.defuseCount || 'N/A') + '\n```',
              inline: true,
            },
            { name: '團滅 (Ace)', value: '```ansi\n\u001b[2;36m' + (stats.aceCount || 'N/A') + '\n```', inline: true },
            {
              name: '首殺次數',
              value: '```ansi\n\u001b[2;36m' + (stats.firstBloodCount || 'N/A') + '\n```',
              inline: true,
            },
            {
              name: '首死次數',
              value: '```ansi\n\u001b[2;36m' + (stats.firstDeathsCount || 'N/A') + '\n```',
              inline: true,
            },
          ],
          author
        ),
      ];

      handlePages(interaction, embeds, author);
    } catch (error) {
      console.error('<a:cross:1535233642312507443> 執行一般模式戰績查詢時出錯:', error);
      await interaction.editReply({ content: '<a:cross:1535233642312507443> 查詢戰績時發生錯誤，請確認玩家名稱標籤是否正確或稍後再試。' }).catch(() => {});
    }
  },
};