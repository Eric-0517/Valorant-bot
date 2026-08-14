const { EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { buttons } = require('../components/buttons');
const { Overview } = require('../constants/overview');
const { DataType } = require('../constants/types');
const { getAuthor } = require('../functions/getAuthor');
const { getData } = require('../api');
const { getArgs } = require('../functions/getArgs');
const { handleResponse } = require('../functions/handleResponse');
const { handleNoVote } = require('../functions/handleNoVote');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('特戰查詢超速衝點戰績')
    .setDescription('取得 VALORANT 玩家超速衝點模式的生涯數據統計')
    .addStringOption((option) =>
      option
        .setName('使用者名稱-標籤')
        .setDescription('您的 VALORANT 玩家名稱與標籤（例如：eric0517#7632）')
        .setRequired(false)
    ),
  async execute(interaction, client) {
    const hasVoted = await client.topgg.hasVoted(interaction.user.id);
    if (!hasVoted) {
      handleNoVote(interaction);
      return;
    }

    await interaction.deferReply();
    const playerID = encodeURIComponent(await getArgs(interaction));
    if (!playerID) return;

    const [trackerProfile, trackerOverview] = await Promise.all([
      getData(playerID, DataType.PROFILE),
      getData(playerID, DataType.SWIFTPLAY_OVERVIEW),
    ]);

    const dataSources = [trackerOverview, trackerProfile];
    if (!(await handleResponse(interaction, dataSources))) return;

    const author = getAuthor(trackerProfile.data.data, playerID);
    const profileOverview = trackerOverview.data.data[0].stats;
    const stats = Overview(profileOverview);

    const replicationEmbed = new EmbedBuilder()
      .setColor('#11806A')
      .setTitle(`超速衝點模式 生涯數據統計`)
      .setAuthor(author)
      .setThumbnail(author.iconURL)
      .addFields(
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
        { name: '總助攻數', value: '```ansi\n\u001b[2;36m' + stats.assists + '\n```', inline: true },
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
        }
      );

    return await interaction.editReply({
      embeds: [replicationEmbed],
      components: [buttons],
    });
  },
};
