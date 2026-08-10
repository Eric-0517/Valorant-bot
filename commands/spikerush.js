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
    .setName('特戰查詢輻能搶攻戰模式數據')
    .setDescription('取得 VALORANT 玩家輻能搶攻戰模式的生涯數據統計')
    .addStringOption((option) =>
      option
        .setName('使用者名稱-標籤')
        .setDescription('您的 VALORANT 玩家名稱與標籤（例如：eric0517#7632）')
        .setRequired(false)
    ),
  async execute(interaction, client) {
   
    await interaction.deferReply();
    
    // 取得玩家 ID
    const playerID = await getArgs(interaction);
    if (!playerID) return;

    const [trackerProfile, trackerOverview] = await Promise.all([
      getData(playerID, DataType.PROFILE),
      getData(playerID, DataType.SPIKE_RUSH_OVERVIEW),
    ]);

    const dataSources = [trackerOverview, trackerProfile];
    if (!(await handleResponse(interaction, dataSources))) return;

    const profileInfo = trackerProfile?.data?.data || trackerProfile?.data;
    const profileOverview = trackerOverview?.data?.data?.[0]?.stats || trackerOverview?.data?.[0]?.stats;

    if (!profileOverview) {
      return await interaction.editReply('<a:cross:1535233642312507443>找不到該玩家的輻能搶攻戰數據！');
    }

    const author = getAuthor(profileInfo, playerID);
    const stats = Overview(profileOverview);

    const embeds = [
      createEmbed(
        '輻能搶攻戰模式 生涯數據統計',
        [
          { name: 'KD比', value: '```ansi\n\u001b[2;36m' + stats.kdrRatio + '\n```', inline: true },
          {
            name: '每回合傷害 (DMG/R)',
            value: '```ansi\n\u001b[2;36m' + stats.damagePerRound + '\n```',
            inline: true,
          },
          {
            name: '爆頭率 %',
            value: '```ansi\n\u001b[2;36m' + stats.headshotPct + '\n```',
            inline: true,
          },
          { name: '總擊殺數', value: '```ansi\n\u001b[2;36m' + stats.kills + '\n```', inline: true },
          { name: '總死亡數', value: '```ansi\n\u001b[2;36m' + stats.deaths + '```', inline: true },
          {
            name: '總助攻數',
            value: '```ansi\n\u001b[2;36m' + stats.assists + '\n```',
            inline: true,
          },
          {
            name: '單場最高擊殺',
            value: '```ansi\n\u001b[2;36m' + stats.mostKills + '\n```',
            inline: true,
          },
          {
            name: '總遊玩時間',
            value: '```ansi\n\u001b[2;36m' + stats.timePlayed + '\n```',
            inline: true,
          },
          {
            name: '勝率 - ' + stats.winRatePct,
            value:
              stats.winRateBar +
              ' ```ansi\n\u001b[2;34m' +
              '    勝: ' +
              stats.matchesWon +
              '    \u001b[2;30m|\u001b[2;35m    敗: ' +
              stats.matchesLost +
              '\n```',
            inline: false,
          },
        ],
        author
      ),
      createEmbed(
        '輻能搶攻戰模式 生涯數據統計',
        [
          {
            name: '平均每局擊殺',
            value: '```ansi\n\u001b[2;36m' + stats.killsPerMatch + '\n```',
            inline: true,
          },
          {
            name: '平均每局死亡',
            value: '```ansi\n\u001b[2;36m' + stats.deathsPerMatch + '\n```',
            inline: true,
          },
          {
            name: '平均每局助攻',
            value: '```ansi\n\u001b[2;36m' + stats.assistsPerMatch + '\n```',
            inline: true,
          },
          {
            name: '平均戰鬥點數 (ACS)',
            value: '```ansi\n\u001b[2;36m' + stats.avgCombatScore + '\n```',
            inline: true,
          },
          {
            name: '爆頭率 %',
            value: '```ansi\n\u001b[2;36m' + stats.headshotPct + '\n```',
            inline: true,
          },
          {
            name: '1v1 残局勝場',
            value: '```ansi\n\u001b[2;36m' + stats.oneVsOneClutches + '\n```',
            inline: true,
          },
          {
            name: '成功植彈',
            value: '```ansi\n\u001b[2;36m' + stats.plantCount + '\n```',
            inline: true,
          },
          {
            name: '成功拆彈',
            value: '```ansi\n\u001b[2;36m' + stats.defuseCount + '\n```',
            inline: true,
          },
          { name: '\u200B', value: '```ansi\n\u001b[2;36m' + ' ' + '\n```', inline: true },
          {
            name: '首殺次數',
            value: '```ansi\n\u001b[2;36m' + stats.firstBloodCount + '\n```',
            inline: true,
          },
          {
            name: '首死次數',
            value: '```ansi\n\u001b[2;36m' + stats.firstDeathsCount + '\n```',
            inline: true,
          },
          { name: '\u200B', value: '```ansi\n\u001b[2;36m' + ' ' + '\n```', inline: true },
        ],
        author
      ),
    ];

    handlePages(interaction, embeds, author);
  },
};