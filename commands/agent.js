const { EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { buttons } = require('../components/buttons');
const { DataType } = require('../constants/types');
const { getAuthor } = require('../functions/getAuthor');
const { getArgs } = require('../functions/getArgs');
const { getData } = require('../api');
const { handleResponse } = require('../functions/handleResponse');
const assets = require('../assets.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('特戰查詢常用特務')
    .setDescription('取得 VALORANT 玩家競技模式前 5 名常用特務數據')
    .addStringOption((option) =>
      option
        .setName('玩家名稱-標籤')
        .setDescription('您的 VALORANT 玩家名稱與標籤（例如：eric0517#7632）')
        .setRequired(false)
    ),
  async execute(interaction) {
    await interaction.deferReply();

    try {
      // 優先獲取輸入框內容，若無則讀取綁定帳號
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

      // 安全解析 Profile
      const rawProfile = trackerProfile?.data?.data || trackerProfile?.data;
      const author = getAuthor(rawProfile, playerID);

      let topAgents = [];
      const rawData = trackerOverview?.data?.data;

      if (Array.isArray(rawData)) {
        

        if (agentStats.length > 0) {
          agentStats.sort((a, b) => (b.stats?.timePlayed?.value || 0) - (a.stats?.timePlayed?.value || 0));

          topAgents = agentStats.slice(0, 5).map((agent) => {
            const name = agent.metadata?.name || '未知特務';
            return {
              name,
              timePlayed: agent.stats?.timePlayed?.displayValue || 'N/A',
              winRate: agent.stats?.matchesWinPct?.displayValue || 'N/A',
              kills: agent.stats?.kills?.displayValue || '0',
              deaths: agent.stats?.deaths?.displayValue || '0',
              assists: agent.stats?.assists?.displayValue || '0',
              kdRatio: agent.stats?.kDRatio?.displayValue || '0.00',
              damagePerRound: agent.stats?.damagePerRound?.displayValue || '0',
            };
          });
        } 
        
        else {
          const agentMap = {};

          rawData.forEach((match) => {
            const agentName = match.stats?.character || match.character || '未知特務';
            if (!agentMap[agentName]) {
              agentMap[agentName] = {
                name: agentName,
                matches: 0,
                wins: 0,
                kills: 0,
                deaths: 0,
                assists: 0,
                damage: 0,
              };
            }

            agentMap[agentName].matches += 1;
            agentMap[agentName].kills += match.stats?.kills || 0;
            agentMap[agentName].deaths += match.stats?.deaths || 0;
            agentMap[agentName].assists += match.stats?.assists || 0;
            agentMap[agentName].damage += match.stats?.damage || 0;

            if (match.teams?.red?.has_won || match.teams?.blue?.has_won || match.stats?.result === 'Victory') {
              agentMap[agentName].wins += 1;
            }
          });

          const sorted = Object.values(agentMap).sort((a, b) => b.matches - a.matches);
          topAgents = sorted.slice(0, 5).map((a) => {
            const kd = a.deaths > 0 ? (a.kills / a.deaths).toFixed(2) : a.kills.toFixed(2);
            const winPct = ((a.wins / a.matches) * 100).toFixed(0) + '%';
            return {
              name: a.name,
              timePlayed: `近 ${a.matches} 場`,
              winRate: winPct,
              kills: a.kills,
              deaths: a.deaths,
              assists: a.assists,
              kdRatio: kd,
              damagePerRound: Math.round(a.damage / (a.matches * 12) || 0),
            };
          });
        }
      }

      const maxAgentsToShow = topAgents.length;

      const agentEmbed = new EmbedBuilder()
        .setColor('#11806A')
        .setAuthor(author)
        .setDescription(`\`\`\`grey\n          前 ${maxAgentsToShow} 名 - 特務使用數據\n\`\`\``)
        .setFooter({ text: '由 Eric 開發（僅限競技模式特務數據）' });

      if (author?.iconURL) {
        agentEmbed.setThumbnail(author.iconURL);
      }

      if (maxAgentsToShow === 0) {
        agentEmbed.addFields({
          name: '無特務數據',
          value: '近期對戰紀錄中未找到相關特務使用統計。',
        });
      } else {
        topAgents.forEach((agent) => {
          const agentEmoji = assets.agentEmojis[agent.name]?.emoji || ':white_small_square:';

          agentEmbed.addFields({
            name: `${agent.name} ${agentEmoji}    |    遊玩時間：${agent.timePlayed}    |    勝率：${agent.winRate}`,
            value: `\`\`\`ansi\n\u001b[2;34m擊殺:${agent.kills}\u001b[0;0m / \u001b[2;35m死亡:${agent.deaths}\u001b[0;0m / \u001b[2;36m助攻:${agent.assists}\u001b[0;0m / \u001b[2;32mKD比:${agent.kdRatio}\u001b[0;0m | \u001b[2;33m每回合傷害:${agent.damagePerRound} \n\`\`\``,
            inline: false,
          });
        });
      }

      return await interaction.editReply({
        embeds: [agentEmbed],
        components: [buttons],
      });
    } catch (error) {
      console.error('<a:cross:1535233642312507443> 執行特務數據查詢時出錯:', error);
      return await interaction
        .editReply('<a:cross:1535233642312507443> 查詢常用特務數據時發生錯誤，請確認玩家名稱標籤是否正確或稍後再試。')
        .catch(() => {});
    }
  },
};
