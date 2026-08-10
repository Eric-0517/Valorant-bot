const { EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { buttons } = require('../components/buttons');
const { Overview } = require('../constants/overview');
const { DataType } = require('../constants/types');
const { getAuthor } = require('../functions/getAuthor');
const { getData } = require('../api');
const { getArgs } = require('../functions/getArgs');
const { handleResponse } = require('../functions/handleResponse');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('特戰查詢團隊死鬥模式數據')
    .setDescription('取得 VALORANT 玩家團隊死鬥模式的生涯數據統計')
    .addStringOption((option) =>
      option
        .setName('玩家名稱-標籤')
        .setDescription('您的 VALORANT 玩家名稱與標籤（例如：eric0517#7632）')
        .setRequired(false)
    ),
  async execute(interaction) {
    await interaction.deferReply();

   
    const playerID = await getArgs(interaction);
    if (!playerID) return;

  
    const [trackerProfile, trackerOverview] = await Promise.all([
      getData(playerID, DataType.PROFILE),
      getData(playerID, DataType.DEATHMATCH_OVERVIEW),
    ]);

    const dataSources = [trackerOverview, trackerProfile];
    if (!(await handleResponse(interaction, dataSources))) return;

   
    const profileInfo = trackerProfile?.data?.data || trackerProfile?.data;
    const profileOverview =
      trackerOverview?.data?.data?.[0]?.stats ||
      trackerOverview?.data?.[0]?.stats ||
      trackerOverview?.data?.stats;

    if (!profileOverview) {
      return await interaction.editReply('找不到該玩家的團隊死鬥模式數據！');
    }

    const author = getAuthor(profileInfo, playerID);
    const stats = Overview(profileOverview);

    
    const deathmatchEmbed = new EmbedBuilder()
      .setColor('#11806A')
      .setTitle('團隊死鬥模式 生涯數據統計')
      .setAuthor(author);

    
    if (author?.iconURL && typeof author.iconURL === 'string' && author.iconURL.trim().length > 0) {
      deathmatchEmbed.setThumbnail(author.iconURL);
    }

    deathmatchEmbed.addFields(
      {
        name: 'KD比',
        value: '```ansi\n\u001b[2;36m' + (stats.kdrRatio || 'N/A') + '\n```',
        inline: true,
      },
      {
        name: 'KAD比',
        value: '```ansi\n\u001b[2;36m' + (stats.kadRatio || 'N/A') + '\n```',
        inline: true,
      },
      {
        name: '平均每局擊殺',
        value: '```ansi\n\u001b[2;36m' + (stats.killsPerRound || 'N/A') + '\n```',
        inline: true,
      },
      {
        name: '總擊殺數',
        value: '```ansi\n\u001b[2;36m' + (stats.kills || '0') + '\n```',
        inline: true,
      },
      {
        name: '總死亡數',
        value: '```ansi\n\u001b[2;36m' + (stats.deaths || '0') + '\n```',
        inline: true,
      },
      {
        name: '總助攻數',
        value: '```ansi\n\u001b[2;36m' + (stats.assists || '0') + '\n```',
        inline: true,
      },
      {
        name: '總遊玩時間',
        value: '```ansi\n\u001b[2;36m' + (stats.timePlayed || 'N/A') + '\n```',
        inline: true,
      },
      {
        name: '勝率 - ' + (stats.winRatePct || '0%'),
        value:
          (stats.winRateBar || '') +
          ' ```ansi\n\u001b[2;34m' +
          '    勝: ' +
          (stats.matchesWon || 0) +
          '    \u001b[2;30m|\u001b[2;35m    敗: ' +
          (stats.matchesLost || 0) +
          '\n```',
        inline: false,
      }
    );

    return await interaction.editReply({
      embeds: [deathmatchEmbed],
      components: buttons ? [buttons] : [],
    });
  },
};