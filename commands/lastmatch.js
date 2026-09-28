const { EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { helpButtons } = require('../components/buttons');
const { ErrorType, DataType } = require('../constants/types');
const { getAuthor } = require('../functions/getAuthor');
const { getData } = require('../api');
const { getArgs } = require('../functions/getArgs');
const { handlePages } = require('../functions/handlePages');
const { handleResponse } = require('../functions/handleResponse');
const assets = require('../assets.json');

//地圖
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
  'Summit': '頂峰亭閣',
  'District': '鐵蹄特區',
  'Kasbah': '阿拉伯堡壘',
};

//特務
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

//模式
const modeNamesZH = {
  'Competitive': '競技模式',
  'Unrated': '一般模式',
  'Spike Rush': '輻能搶攻戰',
  'Swiftplay': '超速衝點',
  'Deathmatch': '死鬥模式',
  'Escalation': '超激進戰',
  'Gauntlet: Glitched': '大亂鬥：異常',
  'Team Deathmatch': '團隊死鬥',
};

//牌位
const rankNamesZH = {
  'Unrated': '牌階未定',
  'Iron 1': '鐵牌 1',
  'Iron 2': '鐵牌 2',
  'Iron 3': '鐵牌 3',
  'Bronze 1': '銅牌 1',
  'Bronze 2': '銅牌 2',
  'Bronze 3': '銅牌 3',
  'Silver 1': '銀牌 1',
  'Silver 2': '銀牌 2',
  'Silver 3': '銀牌 3',
  'Gold 1': '金牌 1',
  'Gold 2': '金牌 2',
  'Gold 3': '金牌 3',
  'Platinum 1': '白金 1',
  'Platinum 2': '白金 2',
  'Platinum 3': '白金 3',
  'Diamond 1': '鑽石 1',
  'Diamond 2': '鑽石 2',
  'Diamond 3': '鑽石 3',
  'Ascendant 1': '超凡入聖 1',
  'Ascendant 2': '超凡入聖 2',
  'Ascendant 3': '超凡入聖 3',
  'Immortal 1': '神話 1',
  'Immortal 2': '神話 2',
  'Immortal 3': '神話 3',
  'Radiant': '輻能戰魂'
};

function getPlayerFields(player, team) {
  const playerName = player.name ? `${player.name}#${player.tag}` : 'Unknown Player';

  const rawAgentName = player.character || 'Unknown';
  const agentName = agentNamesZH[rawAgentName] || rawAgentName;

  const kills = player.stats?.kills || 0;
  const deaths = player.stats?.deaths || 0;
  const assists = player.stats?.assists || 0;
  const score = player.stats?.score || 0;
  const kdRatio = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2);

  const agentEmoji = assets.agentEmojis[rawAgentName]?.emoji || ':white_small_square:';

  const rawRankName = player.currenttierpatched || 'Unrated';
  const rankName = rankNamesZH[rawRankName] || rawRankName;
  const rankEmoji = assets.rankEmojis[rawRankName]?.emoji || '';

  const ansiCode = team === 'red' ? '36m' : '33m';

  return {
    name: `${playerName} ${agentEmoji} ${rankEmoji}`,
    value:
      `\`\`\`ansi\n\u001b[2;${ansiCode}擊殺 / 死亡 / 助攻 / KD比   | 得分\n` +
      `${kills} / ${deaths} / ${assists} / ${kdRatio} | ${score}\n` +
      `\`\`\``,
    inline: true,
  };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('特戰查詢上一場戰績')
    .setDescription('取得 VALORANT 玩家上一場的對戰數據')
    .addStringOption((option) =>
      option
        .setName('玩家名稱-標籤')
        .setDescription('您的 VALORANT 玩家名稱與標籤（例如：eric0517#7632）')
        .setRequired(false)
    ),
  async execute(interaction) {
    await interaction.deferReply();

    // 1. 優先獲取使用者在指令輸入框填寫的選項內容
    const inputTag = interaction.options.getString('玩家名稱-標籤');

    // 2. 如果使用者有輸入就用輸入的，沒輸入才呼叫 getArgs(interaction) 抓綁定帳號
    const rawPlayerID = inputTag || (await getArgs(interaction));

    if (!rawPlayerID) {
      return await interaction.editReply({
        content: '<a:cross:1535233642312507443> 請提供玩家名稱與標籤，或先完成 Discord 帳號綁定！',
        ephemeral: true,
      });
    }

    const playerID = encodeURIComponent(rawPlayerID.trim());

    const [trackerProfile, trackerMatch] = await Promise.all([
      getData(playerID, DataType.PROFILE),
      getData(playerID, DataType.MATCH),
    ]);

    const dataSources = [trackerMatch, trackerProfile];
    if (!(await handleResponse(interaction, dataSources))) return;

    const author = getAuthor(trackerProfile, playerID);

    // 解析 HenrikDev Matches API 回傳的對戰列表
    const rawMatches = trackerMatch?.data?.data || trackerMatch?.data;
    if (!Array.isArray(rawMatches) || rawMatches.length === 0) {
      return await interaction.editReply({
        content: '<a:cross:1535233642312507443> 找不到該玩家最近的對戰紀錄！',
        ephemeral: true,
      });
    }

    const lastMatch = rawMatches[0]; // 取得最新一場對戰
    const metadata = lastMatch.metadata || {};
    const players = lastMatch.players?.all_players || [];
    
    // 找出目標玩家資訊（精準匹配 name#tag 或 name）
    const decodedPlayerID = decodeURIComponent(playerID).toLowerCase().replace('#', '');
    const targetPlayer =
      players.find((p) => {
        const fullTag = `${p.name}${p.tag}`.toLowerCase();
        return fullTag === decodedPlayerID || p.name?.toLowerCase() === decodedPlayerID;
      }) || players[0];

    const targetStats = targetPlayer?.stats || {};

    const lastMap = metadata.map || 'Unknown';
    const mapNameZH = mapNamesZH[lastMap] || lastMap;

    const rawModeName = metadata.mode || 'Competitive';
    const modeName = modeNamesZH[rawModeName] || rawModeName;

    // 比分與勝負判定
    const playerTeam = targetPlayer?.team?.toLowerCase() || 'red';
    const redScore = lastMatch.teams?.red?.rounds_won || 0;
    const blueScore = lastMatch.teams?.blue?.rounds_won || 0;
    const roundsWon = playerTeam === 'red' ? redScore : blueScore;
    const roundsLost = playerTeam === 'red' ? blueScore : redScore;

    const scoreVisualized =
      '<:greenline:1535208594809557022>'.repeat(Math.min(roundsWon, 12)) +
      '\n' +
      '<:redline:1535208157352300544>'.repeat(Math.min(roundsLost, 12));

    const modeEmoji = assets.modeEmojis['Competitive']?.emoji || '';

    const rawRankName = targetPlayer?.currenttierpatched || 'Unrated';
    const rankName = rankNamesZH[rawRankName] || rawRankName;
    const rankEmoji = assets.rankEmojis[rawRankName]?.emoji || '';

    let mapImage = assets.maps[lastMap]?.img || assets.maps['Unknown']?.img || '';
    if (roundsWon > roundsLost) {
      mapImage = assets.maps[lastMap]?.imgWon || mapImage;
    } else if (roundsWon < roundsLost) {
      mapImage = assets.maps[lastMap]?.imgLost || mapImage;
    }

    const totalKills = targetStats.kills || 0;
    const totalDeaths = targetStats.deaths || 0;
    const totalAssists = targetStats.assists || 0;
    const kdRatio = totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : totalKills.toFixed(2);
    
    const headshots = targetStats.headshots || 0;
    const bodyshots = targetStats.bodyshots || 0;
    const legshots = targetStats.legshots || 0;
    const totalShots = headshots + bodyshots + legshots;
    const headshotPct = totalShots > 0 ? Math.round((headshots / totalShots) * 100) : 0;

    const lastMatchEmbed1 = new EmbedBuilder()
      .setColor('#11806A')
      .setTitle('上一場對戰數據 - ' + mapNameZH)
      .setAuthor(author)
      .setThumbnail(targetPlayer?.assets?.agent?.small || '')
      .setDescription(`\`              ${metadata.game_start_patched || '近期對戰'}              \``)
      .addFields(
        {
          name: '模式 ' + modeEmoji,
          value: '```ansi\n\u001b[2;36m' + modeName + '\n```',
          inline: true,
        },
        {
          name: '對戰時間',
          value: '```ansi\n\u001b[2;36m' + (metadata.game_length ? Math.round(metadata.game_length / 60) + ' 分鐘' : 'N/A') + '\n```',
          inline: true,
        },
        {
          name: '牌位' + rankEmoji + '|擊殺 / 死亡 / 助攻|KD比',
          value:
            '```grey\n' +
            rankName +
            '    ' +
            totalKills +
            '/' +
            totalDeaths +
            '/' +
            totalAssists +
            '      ' +
            kdRatio +
            '\n```',
          inline: false,
        },
        {
          name: '總戰鬥得分',
          value: '```ansi\n\u001b[2;36m' + (targetStats.score || 0) + '\n```',
          inline: true,
        },
        {
          name: '平均戰鬥評分 (ACS)',
          value: '```ansi\n\u001b[2;36m' + Math.round((targetStats.score || 0) / (redScore + blueScore || 1)) + '\n```',
          inline: true,
        },
        {
          name: '爆頭率',
          value: '```ansi\n\u001b[2;36m' + headshotPct + '%\n```',
          inline: true,
        },
        {
          name: '比分',
          value:
            scoreVisualized +
            '```ansi\n\u001b[1;34m              ' +
            roundsWon +
            ' \u001b[2;30m-\u001b[2;35m ' +
            roundsLost +
            '\n```',
          inline: false,
        }
      );

    if (mapImage) {
      lastMatchEmbed1.setImage(mapImage);
    }

    const lastMatchEmbed2 = new EmbedBuilder()
      .setColor('#11806A')
      .setTitle(`上一場對戰數據 - ${mapNameZH} | ${roundsWon} - ${roundsLost}`)
      .setAuthor(author)
      .setDescription('```\n                本局對戰玩家列表\n```');

    // 區分紅藍隊玩家
    const redTeam = players.filter((p) => p.team?.toLowerCase() === 'red');
    const blueTeam = players.filter((p) => p.team?.toLowerCase() === 'blue');

    // 依據分數排序
    redTeam.sort((a, b) => (b.stats?.score || 0) - (a.stats?.score || 0));
    blueTeam.sort((a, b) => (b.stats?.score || 0) - (a.stats?.score || 0));

    const maxPlayers = Math.max(redTeam.length, blueTeam.length);
    let count = 0;

    for (let x = 0; x < maxPlayers; x++) {
      const playerA = redTeam[x];
      const playerB = blueTeam[x];

      if (playerA) lastMatchEmbed2.addFields(getPlayerFields(playerA, 'red'));
      if (playerB) lastMatchEmbed2.addFields(getPlayerFields(playerB, 'blue'));

      count++;

      // 雙欄排版輔助
      if (count === 1) {
        lastMatchEmbed2.addFields({ name: '\u200B', value: '\u200B', inline: true });
        count = 0;
      }
    }

    const embeds = [lastMatchEmbed1, lastMatchEmbed2];
    handlePages(interaction, embeds, author);
  },
};
