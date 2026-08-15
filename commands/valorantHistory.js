const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType
} = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { DataType } = require('../constants/types');
const { getAuthor } = require('../functions/getAuthor');
const { getData } = require('../api');
const { getArgs } = require('../functions/getArgs');
const { handleResponse } = require('../functions/handleResponse');
const assets = require('../assets.json');

// 地圖英中翻譯對照表
const mapNamesZH = {
  'Sunset': '日落之城',
  'Pearl': '深海遺珠',
  'Haven': '遺落境地',
  'Split': '雙塔迷城',
  'Lotus': '蓮華古城',
  'Ascent': '義境空島',
  'Bind': '劫境之地',
  'Breeze': '熱帶樂園',
  'Icebox': '極地寒港',
  'Fracture': '天漠之峽',
  'Abyss': '深窟幽境',
  'Corrode': '晶蝕之地',
};

// 特務英中翻譯對照表
const agentNamesZH = {
  'Jett': '婕提',
  'Reyna': '蕾娜',
  'Raze': '芮茲',
  'Phoenix': '菲尼克斯',
  'Yoru': '夜戮',
  'Neon': '妮虹',
  'Iso': '離索',
  'Sage': '聖祈',
  'Chamber': '錢博爾',
  'Cypher': '瑟符',
  'Killjoy': '愷宙',
  'Deadlock': '蒂羅',
  'Vyse': '薇絲',
  'Omen': '歐門',
  'Brimstone': '布史東',
  'Viper': '薇蝮',
  'Astra': '亞星卓',
  'Harbor': '哈泊',
  'Clove': '珂樂芙',
  'Sova': '蘇法',
  'Breach': '鐵臂',
  'Skye': '斯凱',
  'KAY/O': 'KAY/O',
  'Fade': '菲德',
  'Gekko': '蓋克',
  'Tejo': '戴侯',
  'Miks': '米克什',
};

// 模式英中翻譯對照表
const modeNamesZH = {
  'Competitive': '競技模式',
  'Unrated': '一般模式',
  'Spike Rush': '輻能搶攻戰',
  'Swiftplay': '超速衝點',
  'Deathmatch': '死鬥模式',
  'Escalation': '超激進戰',
  'Team Deathmatch': '團隊死鬥',
};

// 格式化對戰時間（秒 -> 分 秒）
function formatMatchLength(seconds) {
  if (!seconds || isNaN(seconds)) return '未知';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}分 ${secs}秒`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('特戰查詢歷史戰績')
    .setDescription('查詢歷史對戰，並查看詳細玩家數據')
    .addStringOption((option) =>
      option
        .setName('玩家名稱-標籤')
        .setDescription('您的 VALORANT 玩家名稱與標籤 (例如: eric0517#7632)')
        .setRequired(false)
    ),
  async execute(interaction) {
    await interaction.deferReply();

    try {
      //獲取輸入或綁定帳號
      const inputTag = interaction.options.getString('玩家名稱-標籤');
      const rawPlayerID = inputTag || (await getArgs(interaction));

      if (!rawPlayerID) {
        return await interaction.editReply({
          content: '<a:cross:1535233642312507443> 請提供玩家名稱與標籤，或先進行帳號綁定！',
          ephemeral: true,
        });
      }

      const playerID = encodeURIComponent(rawPlayerID.trim());

      //獲取個人資料與對戰紀錄
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
      
      //取25場
      const matches = rawMatches.slice(0, 25);

      const createMatchEmbed = (matchIndex) => {
        const match = matches[matchIndex];
        const metadata = match.metadata || {};
        const players = match.players?.all_players || [];

        //搜尋當前查詢的玩家
        const targetPlayer =
          players.find((p) => {
            const fullTag = `${p.name}${p.tag}`.toLowerCase();
            return fullTag === decodedPlayerID || p.name?.toLowerCase() === decodedPlayerID;
          }) || players[0];

        const rawMapName = metadata.map || 'Unknown';
        const mapNameZH = mapNamesZH[rawMapName] || rawMapName;
        const rawAgentName = targetPlayer?.character || 'Unknown';
        const agentNameZH = agentNamesZH[rawAgentName] || rawAgentName;

        const myTeamColor = targetPlayer?.team?.toLowerCase() || 'red';
        const enemyTeamColor = myTeamColor === 'red' ? 'blue' : 'red';

        const redScore = match.teams?.red?.rounds_won || 0;
        const blueScore = match.teams?.blue?.rounds_won || 0;

        const myScore = myTeamColor === 'red' ? redScore : blueScore;
        const enemyScore = myTeamColor === 'red' ? blueScore : redScore;
        const totalRounds = metadata.rounds_played || (redScore + blueScore) || 1;
        const gameLengthStr = formatMatchLength(metadata.game_length);

        //模式名稱中文翻譯
        const rawMode = metadata.mode || 'Unrated';
        const modeNameZH = modeNamesZH[rawMode] || rawMode;

        let resultTag = '平手';
        let embedColor = '#808080';
        if (myScore > enemyScore) {
          resultTag = '勝利';
          embedColor = '#11806A';
        } else if (myScore < enemyScore) {
          resultTag = '戰敗';
          embedColor = '#C80000';
        }

        const titleStr = `${resultTag} | ${agentNameZH} | ${myScore}:${enemyScore} | ${modeNameZH} | ${mapNameZH}`;
        const descriptionStr = `對戰時間：${gameLengthStr}`;

        const embed = new EmbedBuilder()
          .setColor(embedColor)
          .setAuthor(author)
          .setTitle(titleStr)
          .setDescription(descriptionStr)
          .setFooter({ text: `第 ${matchIndex + 1} / ${matches.length} 場對戰紀錄` })
          .setTimestamp();

        //我方與敵方
        const myTeamPlayers = players.filter((p) => p.team?.toLowerCase() === myTeamColor);
        const enemyTeamPlayers = players.filter((p) => p.team?.toLowerCase() === enemyTeamColor);

        const formatPlayerList = (teamPlayers, teamColorName) => {
          if (teamPlayers.length === 0) return '無資料';
          const teamSquare = teamColorName === 'blue' ? '🟦' : '🟥';

          const formattedText = teamPlayers
            .map((p) => {
              const emoji = assets.agentEmojis?.[p.character]?.emoji || '⬜';
              const stats = p.stats || {};
              const k = stats.kills || 0;
              const d = stats.deaths || 0;
              const a = stats.assists || 0;
              const score = stats.score || 0;
              const acs = Math.round(score / totalRounds);

              //爆頭率
              const headshots = stats.headshots || 0;
              const bodyshots = stats.bodyshots || 0;
              const legshots = stats.legshots || 0;
              const totalHits = headshots + bodyshots + legshots;
              const hsRate = totalHits > 0 ? ((headshots / totalHits) * 100).toFixed(1) : '0.0';

              //KAST%
              const kast = stats.kast ? `${Math.round(stats.kast)}%` : (stats.kast_rate ? `${Math.round(stats.kast_rate * 100)}%` : 'N/A');

              //首殺/首死
              const firstKills = stats.first_kills || stats.firstkills || 0;
              const firstDeaths = stats.first_deaths || stats.firstdeaths || 0;

              //下包/拆包
              const plants = stats.plants || 0;
              const defuses = stats.defuses || 0;

              //殘局獲勝次數
              const clutches = stats.clutches ? (typeof stats.clutches === 'object' ? Object.values(stats.clutches).reduce((acc, curr) => acc + curr, 0) : stats.clutches) : 0;

              //多殺回合數
              const doubleKills = stats.double_kills || 0;
              const tripleKills = stats.triple_kills || 0;
              const quadraKills = stats.quadra_kills || 0;
              const pentaKills = stats.penta_kills || 0;
              const multiKillsStr = `2K:${doubleKills} | 3K:${tripleKills} | 4K:${quadraKills} | 5K:${pentaKills}`;

              //牌位名稱翻譯
              let rawRank = p.currenttier_patched || '牌階未定';
              if (rawRank === 'Unrated' || rawRank === '無牌位') {
                rawRank = '牌階未定';
              }

              const rankData = assets.rankEmojis?.[p.currenttier] || assets.rankEmojis?.[p.currenttier_patched];
              const rankEmoji = typeof rankData === 'object' ? (rankData?.emoji || '') : (rankData || '');
              const rankDisplay = `${rankEmoji} ${rawRank}`.trim();

              const isCurrent = `${p.name}${p.tag}`.toLowerCase() === decodedPlayerID;
              const pointerTag = isCurrent ? ' 👈' : '';

              return (
                `${teamSquare}${emoji}\n` +
                `玩家：**${p.name}#${p.tag}**${pointerTag}\n` +
                `牌位：${rankDisplay}\n` +
                `KDA：**${k}/${d}/${a}**\n` +
                `KAST%：${kast}\n` +
                `ACS：**${acs}**\n` +
                `HS%：**${hsRate}%**\n` +
                `首殺/首死：${firstKills} / ${firstDeaths}\n` +
                `下包/拆包：${plants} / ${defuses}\n` +
                `殘局獲勝次數：${clutches}\n` +
                `多殺回合數：${multiKillsStr}\n` +
                `總得分：${score}`
              );
            })
            .join('\n\n---\n\n');
          return formattedText.length > 1000 ? formattedText.substring(0, 995) + '...' : formattedText;
        };

        embed.addFields(
          { name: `我方隊伍 (${myScore})`, value: formatPlayerList(myTeamPlayers, myTeamColor), inline: false },
          { name: `敵方隊伍 (${enemyScore})`, value: formatPlayerList(enemyTeamPlayers, enemyTeamColor), inline: false }
        );

        return embed;
      };

      const selectOptions = matches.map((match, index) => {
        const metadata = match.metadata || {};
        const players = match.players?.all_players || [];
        const targetPlayer =
          players.find((p) => {
            const fullTag = `${p.name}${p.tag}`.toLowerCase();
            return fullTag === decodedPlayerID || p.name?.toLowerCase() === decodedPlayerID;
          }) || players[0];

        const rawMapName = metadata.map || 'Unknown';
        const mapNameZH = mapNamesZH[rawMapName] || rawMapName;

        const playerTeam = targetPlayer?.team?.toLowerCase() || 'red';
        const redScore = match.teams?.red?.rounds_won || 0;
        const blueScore = match.teams?.blue?.rounds_won || 0;
        const roundsWon = playerTeam === 'red' ? redScore : blueScore;
        const roundsLost = playerTeam === 'red' ? blueScore : redScore;

        let statusText = '平手';
        if (roundsWon > roundsLost) statusText = '勝利';
        else if (roundsWon < roundsLost) statusText = '戰敗';

        const agentNameZH = agentNamesZH[targetPlayer?.character] || targetPlayer?.character || 'Unknown';

        return {
          label: `#${index + 1} ${statusText} | ${mapNameZH} (${roundsWon}:${roundsLost})`,
          description: `特務: ${agentNameZH} | KDA: ${targetPlayer?.stats?.kills || 0}/${targetPlayer?.stats?.deaths || 0}/${targetPlayer?.stats?.assists || 0}`,
          value: index.toString(),
          default: index === 0, 
        };
      });

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_match_history')
        .setPlaceholder('選擇要查看的對戰場次...')
        .addOptions(selectOptions);

      const row = new ActionRowBuilder().addComponents(selectMenu);

      const initialEmbed = createMatchEmbed(0);
      const responseMessage = await interaction.editReply({
        embeds: [initialEmbed],
        components: [row],
      });
 
      const collector = responseMessage.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 300000, 
      });

      collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
          return await i.reply({
            content: '<a:cross:1535233642312507443> 錯誤操作！',
            ephemeral: true,
          });
        }

        const selectedIndex = parseInt(i.values[0], 10);
        const updatedEmbed = createMatchEmbed(selectedIndex);

        const updatedOptions = selectOptions.map((opt, idx) => ({
          ...opt,
          default: idx === selectedIndex,
        }));

        const updatedRow = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('select_match_history')
            .setPlaceholder('選擇要查看的對戰場次...')
            .addOptions(updatedOptions)
        );

        await i.update({
          embeds: [updatedEmbed],
          components: [updatedRow],
        });
      });

    
      collector.on('end', () => {
        const disabledRow = new ActionRowBuilder().addComponents(
          selectMenu.setDisabled(true).setPlaceholder('選單已過期，請重新發送指令')
        );
        interaction.editReply({ components: [disabledRow] }).catch(() => {});
      });

    } catch (error) {
      console.error('執行歷史戰績查詢時出錯:', error);
      await interaction
        .editReply({
          content: '<a:cross:1535233642312507443> 查詢歷史戰績時發生錯誤，請稍後再試！',
        })
        .catch(() => {});
    }
  },
};
