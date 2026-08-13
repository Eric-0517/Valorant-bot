const { EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { DataType } = require('../constants/types');
const { getAuthor } = require('../functions/getAuthor');
const { getData } = require('../api');
const { getArgs } = require('../functions/getArgs');
const { handleResponse } = require('../functions/handleResponse');
const assets = require('../assets.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('特戰歷史戰績查詢')
    .setDescription('取得 VALORANT 玩家最近 5 場的競技對戰紀錄摘要')
    .addStringOption((option) =>
      option
        .setName('玩家名稱-標籤')
        .setDescription('您的 VALORANT 玩家名稱與標籤 (例如: eric0517#7632)')
        .setRequired(false)
    ),
  async execute(interaction) {
    await interaction.deferReply();

    try {
      // 1. 優先獲取輸入的選項，若無則拿綁定帳號
      const inputTag = interaction.options.getString('玩家名稱-標籤');
      const rawPlayerID = inputTag || (await getArgs(interaction));

      if (!rawPlayerID) {
        return await interaction.editReply({
          content: '<a:cross:1535233642312507443> 請提供玩家名稱與標籤，或先進行帳號綁定！',
          ephemeral: true,
        });
      }

      const playerID = encodeURIComponent(rawPlayerID.trim());

      // 2. 獲取個人資料與最近對戰紀錄
      const [trackerProfile, trackerMatch] = await Promise.all([
        getData(playerID, DataType.PROFILE),
        getData(playerID, DataType.MATCH),
      ]);

      const dataSources = [trackerMatch, trackerProfile];
      if (!(await handleResponse(interaction, dataSources))) return;

      const author = getAuthor(trackerProfile.data?.data || trackerProfile, playerID);
      const rawMatches = trackerMatch?.data?.data || trackerMatch?.data;

      if (!Array.isArray(rawMatches) || rawMatches.length === 0) {
        return await interaction.editReply({
          content: '<a:cross:1535233642312507443> 找不到該玩家最近的對戰紀錄！',
          ephemeral: true,
        });
      }

      const decodedPlayerID = decodeURIComponent(playerID).toLowerCase().replace('#', '');

      // 3. 建立 Embed
      const historyEmbed = new EmbedBuilder()
        .setColor('#11806A')
        .setTitle('近期 5 場競技模式對戰紀錄')
        .setAuthor(author)
        .setTimestamp();

      // 最多取最近 5 場對戰
      const recentMatches = rawMatches.slice(0, 5);

      recentMatches.forEach((match, index) => {
        const metadata = match.metadata || {};
        const players = match.players?.all_players || [];

        // 搜尋當前玩家
        const targetPlayer =
          players.find((p) => {
            const fullTag = `${p.name}${p.tag}`.toLowerCase();
            return fullTag === decodedPlayerID || p.name?.toLowerCase() === decodedPlayerID;
          }) || players[0];

        const targetStats = targetPlayer?.stats || {};
        const mapName = metadata.map || 'Unknown';
        const agentName = targetPlayer?.character || 'Unknown';
        const agentEmoji = assets.agentEmojis[agentName]?.emoji || '⚔️';

        // 隊伍與勝負數據
        const playerTeam = targetPlayer?.team?.toLowerCase() || 'red';
        const redScore = match.teams?.red?.rounds_won || 0;
        const blueScore = match.teams?.blue?.rounds_won || 0;
        const roundsWon = playerTeam === 'red' ? redScore : blueScore;
        const roundsLost = playerTeam === 'red' ? blueScore : redScore;

        let resultTag = '平手';
        if (roundsWon > roundsLost) resultTag = '勝利';
        else if (roundsWon < roundsLost) resultTag = '敗北(意思就是輸ㄌ)';

        // 戰績數據
        const kills = targetStats.kills || 0;
        const deaths = targetStats.deaths || 0;
        const assists = targetStats.assists || 0;
        const score = targetStats.score || 0;
        const kdRatio = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2);

        historyEmbed.addFields({
          name: `#${index + 1} | ${mapName} (${resultTag}) - ${roundsWon} : ${roundsLost}`,
          value:
            `**使用特務：** ${agentEmoji} ${agentName}\n` +
            `\`\`\`ansi\n\u001b[2;36mK/D/A: ${kills} / ${deaths} / ${assists} (KD: ${kdRatio}) | 得分: ${score}\n\`\`\``,
          inline: false,
        });
      });

      await interaction.editReply({ embeds: [historyEmbed] });
    } catch (error) {
      console.error('<a:cross:1535233642312507443> 執行歷史戰績查詢時出錯:', error);
      await interaction
        .editReply({
          content: '<a:cross:1535233642312507443> 查詢歷史戰績時發生錯誤，請稍後再試！',
        })
        .catch(() => {});
    }
  },
};
