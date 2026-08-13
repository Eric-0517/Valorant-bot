const { EmbedBuilder } = require('discord.js');
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
  'Pearl': '深海珍珠',
  'Haven': '劫境之地',
  'Split': '義境空島',
  'Lotus': '蓮華古城',
  'Ascent': '遺落境地',
  'Bind': '雙塔迷城',
  'Breeze': '熱帶樂園',
  'Icebox': '極地寒港',
  'Fracture': '裂破峽谷',
  'Abyss': '深窟幽境',
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
};

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
        const rawMapName = metadata.map || 'Unknown';
        const rawAgentName = targetPlayer?.character || 'Unknown';
        
        // 🔹 轉換成中文地圖與特務名稱（若找不到對照則顯示原名）
        const mapNameZH = mapNamesZH[rawMapName] || rawMapName;
        const agentNameZH = agentNamesZH[rawAgentName] || rawAgentName;

        // Emoji 依然使用英文原名做 lookup
        const agentEmoji = assets.agentEmojis[rawAgentName]?.emoji || '<:unranked:1535208948880121876>';

        // 隊伍與勝負數據
        const playerTeam = targetPlayer?.team?.toLowerCase() || 'red';
        const redScore = match.teams?.red?.rounds_won || 0;
        const blueScore = match.teams?.blue?.rounds_won || 0;
        const roundsWon = playerTeam === 'red' ? redScore : blueScore;
        const roundsLost = playerTeam === 'red' ? blueScore : redScore;

        let resultTag = '平手';
        if (roundsWon > roundsLost) resultTag = '<:greenline:1535208594809557022>勝利';
        else if (roundsWon < roundsLost) resultTag = '<:redline:1535208157352300544>戰敗';

        // 戰績數據
        const kills = targetStats.kills || 0;
        const deaths = targetStats.deaths || 0;
        const assists = targetStats.assists || 0;
        const score = targetStats.score || 0;
        const kdRatio = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2);

        historyEmbed.addFields({
          name: `#${index + 1} | ${mapNameZH} (${resultTag}) - ${roundsWon} : ${roundsLost}`,
          value:
            `**使用特務：** ${agentEmoji} ${agentNameZH}\n` +
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
