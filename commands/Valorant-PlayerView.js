const {
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const ValorantAPI = require('unofficial-valorant-api');
const { getArgs } = require('../functions/getArgs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const apiKey =
  process.env.HENRIK_API_KEY ||
  process.env.VALORANT_API_KEY;

const VAPI = new ValorantAPI(apiKey);

let assets = {};

try {
  const assetsPath = path.join(
    __dirname,
    '../assets.json'
  );

  if (fs.existsSync(assetsPath)) {
    assets = JSON.parse(
      fs.readFileSync(
        assetsPath,
        'utf8'
      )
    );
  }
} catch (error) {
  console.error(
    '[assets.json 載入錯誤]:',
    error
  );
}

const rankNamesZH = {
  Unrated: '牌階未定',
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
  'Immortal': '神話',
  'Immortal 1': '神話 1',
  'Immortal 2': '神話 2',
  'Immortal 3': '神話 3',
  Radiant: '輻能戰魂'
};

const modeNamesZH = {
  Competitive: '競技模式',
  Unrated: '一般模式',
  'Spike Rush': '輻能搶攻戰',
  Swiftplay: '超速衝點',
  Deathmatch: '死鬥模式',
  'Team Deathmatch': '團隊死鬥',
  Escalation: '超激進戰',
  Premier: 'Premier',
  Replication: '複製模式',
  'Snowball Fight': '雪球大戰'
};

const regionNamesZH = {
  ap: '亞太區',
  na: '北美區',
  eu: '歐洲區',
  kr: '韓國區',
  br: '巴西區',
  latam: '拉丁美洲區'
};

const agentNamesZH = {
  Jett: '婕提',
  Reyna: '蕾娜',
  Raze: '芮茲',
  Phoenix: '菲尼克斯',
  Yoru: '夜戮',
  Neon: '妮虹',
  Iso: '離索',
  Sage: '聖祈',
  Chamber: '錢博爾',
  Cypher: '瑟符',
  Killjoy: '愷宙',
  Deadlock: '蒂羅',
  Vyse: '薇絲',
  Omen: '歐門',
  Brimstone: '布史東',
  Viper: '薇蝮',
  Astra: '亞星卓',
  Harbor: '哈泊',
  Clove: '珂樂芙',
  Sova: '蘇法',
  Breach: '鐵臂',
  Skye: '斯凱',
  'KAY/O': 'KAY/O',
  Fade: '菲德',
  Gekko: '蓋克',
  Tejo: '戴侯',
  Miks: '米克什',
  Waylay: '維蕾',
  Veto: '維托'
};

const agentZHToEnglish = {};

for (const [english, chinese] of Object.entries(
  agentNamesZH
)) {
  agentZHToEnglish[chinese] = english;
}

function getAgentAsset(agentRaw) {
  if (!assets.agents || !agentRaw) {
    return null;
  }

  return assets.agents[agentRaw] || null;
}

function getAgentName(agentRaw) {
  const asset = getAgentAsset(agentRaw);

  if (asset?.name) {
    return asset.name;
  }

  return (
    agentNamesZH[agentRaw] ||
    agentRaw ||
    '未知特務'
  );
}

function getAgentEmoji(agentRaw) {
  const asset = getAgentAsset(agentRaw);

  if (!asset?.name) {
    return '';
  }

  const englishName =
    agentZHToEnglish[asset.name];

  return (
    assets.agentEmojis?.[englishName]
      ?.emoji || ''
  );
}

function getAgentImage(agentRaw) {
  return (
    getAgentAsset(agentRaw)?.img ||
    null
  );
}

function getModeEmoji(modeRaw) {
  return (
    assets.modeEmojis?.[modeRaw]
      ?.emoji || ''
  );
}

function getRankAssetById(tierId) {
  if (
    tierId === undefined ||
    tierId === null
  ) {
    return null;
  }

  return (
    assets.ranks?.[
      String(tierId)
    ] || null
  );
}

function getRankEmoji(rawRank) {
  if (!rawRank) {
    return '';
  }

  return (
    assets.rankEmojis?.[rawRank]
      ?.emoji || ''
  );
}

function findRankAssetByName(
  rankName
) {
  if (!assets.ranks) {
    return null;
  }

  const entries =
    Object.entries(
      assets.ranks
    );

  for (const [, asset] of entries) {
    if (
      asset?.name === rankName
    ) {
      return asset;
    }
  }

  return null;
}

function getCurrentRankInfo(mmr) {
  const current =
    mmr?.current_data || {};

  const tierId =
    current.currenttier ??
    current.currenttier_id ??
    current.tier;

  const rawName =
    current.currenttierpatched ||
    current.currenttier_patched ||
    current.tier_name ||
    'Unrated';

  const zhName =
    rankNamesZH[rawName] ||
    rawName;

  const asset =
    getRankAssetById(
      tierId
    ) ||
    findRankAssetByName(
      zhName
    );

  return {
    rawName,
    zhName,
    asset,
    tierId
  };
}

function getHighestRankInfo(mmr) {
  const highest =
    mmr?.highest_rank || {};

  const tierId =
    highest.tier ||
    highest.tier_id ||
    highest.currenttier;

  const rawName =
    highest.patched_tier ||
    highest.patchedTier ||
    highest.tier_name ||
    'Unrated';

  const zhName =
    rankNamesZH[rawName] ||
    rawName;

  const asset =
    getRankAssetById(
      tierId
    ) ||
    findRankAssetByName(
      zhName
    );

  return {
    rawName,
    zhName,
    asset,
    tierId
  };
}

function getPlayerFromMatch(
  match,
  puuid,
  name,
  tag
) {
  const allPlayers =
    match?.players
      ?.all_players || [];

  return allPlayers.find(
    (player) => {
      if (
        puuid &&
        player.puuid === puuid
      ) {
        return true;
      }

      return (
        String(
          player.name || ''
        ).toLowerCase() ===
          String(
            name || ''
          ).toLowerCase() &&
        String(
          player.tag || ''
        ).toLowerCase() ===
          String(
            tag || ''
          ).toLowerCase()
      );
    }
  );
}

function getTeamWon(
  match,
  player
) {
  if (
    !player ||
    !match?.teams
  ) {
    return null;
  }

  if (
    player.team === 'Red'
  ) {
    return (
      match.teams.red
        ?.has_won === true
    );
  }

  if (
    player.team === 'Blue'
  ) {
    return (
      match.teams.blue
        ?.has_won === true
    );
  }

  return null;
}

function normalizeMatches(
  response
) {
  if (
    Array.isArray(response)
  ) {
    return response;
  }

  if (
    Array.isArray(
      response?.data
    )
  ) {
    return response.data;
  }

  if (
    Array.isArray(
      response?.matches
    )
  ) {
    return response.matches;
  }

  if (
    Array.isArray(
      response?.data?.matches
    )
  ) {
    return response.data.matches;
  }

  return [];
}

function createPageButtons(
  userId
) {
  const pages = [
    {
      id: 'basic',
      label: '基本資料'
    },
    {
      id: 'rank',
      label: '牌階資訊'
    },
    {
      id: 'mode',
      label: '模式勝率'
    },
    {
      id: 'agent',
      label: '特務數據'
    }
  ];

  return new ActionRowBuilder()
    .addComponents(
      pages.map(
        (page) =>
          new ButtonBuilder()
            .setCustomId(
              `valorant_info_${page.id}_${userId}`
            )
            .setLabel(
              page.label
            )
            .setStyle(
              ButtonStyle.Primary
            )
      )
    );
}

function getTopAgents(
  agentStats
) {
  return Object.entries(
    agentStats
  )
    .sort(
      (a, b) =>
        b[1].games -
        a[1].games
    )
    .slice(0, 5);
}

function createAgentButtons(
  userId,
  agentStats
) {
  const agents =
    getTopAgents(
      agentStats
    );

  if (!agents.length) {
    return null;
  }

  return new ActionRowBuilder()
    .addComponents(
      agents.map(
        ([agentRaw]) =>
          new ButtonBuilder()
            .setCustomId(
              `valorant_agent_${agentRaw}_${userId}`
            )
            .setLabel(
              `${getAgentName(agentRaw)} 對戰資料`
            )
            .setStyle(
              ButtonStyle.Secondary
            )
      )
    );
}

function createAllRows(
  userId,
  agentStats
) {
  const rows = [
    createPageButtons(
      userId
    )
  ];

  const agentRow =
    createAgentButtons(
      userId,
      agentStats
    );

  if (agentRow) {
    rows.push(agentRow);
  }

  return rows;
}

function getBasicEmbed(data) {
  const account =
    data.account || {};

  const accountLevel =
    account.account_level ??
    account.data?.account_level ??
    '未知';

  const region =
    regionNamesZH[
      data.region
    ] ||
    String(
      data.region || ''
    ).toUpperCase() ||
    '未知';

  const embed =
    new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(
        `玩家資訊：${data.name}#${data.tag}`
      )
      .addFields(
        {
          name: 'Riot ID',
          value:
            `\`${data.name}#${data.tag}\``,
          inline: true
        },
        {
          name: '區域',
          value:
            `\`${region}\``,
          inline: true
        },
        {
          name: '帳號等級',
          value:
            `\`${accountLevel}\``,
          inline: true
        }
      );

  const avatar =
    account.card?.small ||
    account.data?.card?.small ||
    account.card?.large ||
    account.data?.card?.large;

  if (avatar) {
    embed.setThumbnail(
      avatar
    );
  }

  return embed;
}

function getRankEmbed(data) {
  const current =
    getCurrentRankInfo(
      data.mmr
    );

  const highest =
    getHighestRankInfo(
      data.mmr
    );

  const currentData =
    data.mmr?.current_data ||
    {};

  const highestData =
    data.mmr?.highest_rank ||
    {};

  const elo =
    currentData.elo ??
    '未知';

  const rr =
    currentData.ranking_in_tier ??
    '未知';

  const rrChange =
    currentData.mmr_change_to_last_game;

  const rrChangeText =
    typeof rrChange ===
    'number'
      ? `${
          rrChange >= 0
            ? '+'
            : ''
        }${rrChange}`
      : '未知';

  const currentEmoji =
    getRankEmoji(
      current.rawName
    );

  const highestEmoji =
    getRankEmoji(
      highest.rawName
    );

  const currentDisplay =
    currentEmoji
      ? `${currentEmoji} ${current.zhName}`
      : current.zhName;

  const highestDisplay =
    highestEmoji
      ? `${highestEmoji} ${highest.zhName}`
      : highest.zhName;

  const embed =
    new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(
        `牌階資訊：${data.name}#${data.tag}`
      )
      .addFields(
        {
          name: '目前牌階',
          value:
            `\`${currentDisplay}\``,
          inline: true
        },
        {
          name: 'ELO',
          value:
            `\`${elo}\``,
          inline: true
        },
        {
          name: '競技分數（RR）',
          value:
            `\`${rr} / 100\``,
          inline: true
        },
        {
          name: '上局分數變動',
          value:
            `\`${rrChangeText}\``,
          inline: true
        },
        {
          name: '歷史最高牌階',
          value:
            `\`${highestDisplay}\``,
          inline: true
        },
        {
          name: '最高牌階賽季',
          value:
            `\`${
              highestData.season ??
              '未知'
            }\``,
          inline: true
        }
      );

  if (
    current.asset?.img
  ) {
    embed.setThumbnail(
      current.asset.img
    );
  }

  return embed;
}

function calculateModeStats(
  matches,
  puuid,
  name,
  tag
) {
  const stats = {};

  for (const match of matches) {
    const modeRaw =
      match?.metadata?.mode ||
      match?.metadata?.queue ||
      'Unknown';

    const player =
      getPlayerFromMatch(
        match,
        puuid,
        name,
        tag
      );

    if (!player) {
      continue;
    }

    if (!stats[modeRaw]) {
      stats[modeRaw] = {
        games: 0,
        wins: 0,
        losses: 0,
        kills: 0,
        deaths: 0,
        assists: 0
      };
    }

    const item =
      stats[modeRaw];

    item.games++;

    const result =
      getTeamWon(
        match,
        player
      );

    if (result === true) {
      item.wins++;
    } else if (
      result === false
    ) {
      item.losses++;
    }

    item.kills +=
      Number(
        player.stats
          ?.kills || 0
      );

    item.deaths +=
      Number(
        player.stats
          ?.deaths || 0
      );

    item.assists +=
      Number(
        player.stats
          ?.assists || 0
      );
  }

  return stats;
}

function calculateAgentStats(
  matches,
  puuid,
  name,
  tag
) {
  const stats = {};

  for (const match of matches) {
    const player =
      getPlayerFromMatch(
        match,
        puuid,
        name,
        tag
      );

    if (!player) {
      continue;
    }

    const agentRaw =
      player.character ||
      'Unknown';

    if (!stats[agentRaw]) {
      stats[agentRaw] = {
        games: 0,
        wins: 0,
        losses: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        score: 0
      };
    }

    const item =
      stats[agentRaw];

    item.games++;

    const result =
      getTeamWon(
        match,
        player
      );

    if (result === true) {
      item.wins++;
    } else if (
      result === false
    ) {
      item.losses++;
    }

    item.kills +=
      Number(
        player.stats
          ?.kills || 0
      );

    item.deaths +=
      Number(
        player.stats
          ?.deaths || 0
      );

    item.assists +=
      Number(
        player.stats
          ?.assists || 0
      );

    item.score +=
      Number(
        player.stats
          ?.score || 0
      );
  }

  return stats;
}

function calculateAgentModeStats(
  matches,
  puuid,
  name,
  tag,
  agentRaw
) {
  const stats = {
    Competitive: {
      games: 0,
      wins: 0,
      losses: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      score: 0
    },
    Unrated: {
      games: 0,
      wins: 0,
      losses: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      score: 0
    }
  };

  for (const match of matches) {
    const mode =
      match?.metadata?.mode;

    if (
      mode !== 'Competitive' &&
      mode !== 'Unrated'
    ) {
      continue;
    }

    const player =
      getPlayerFromMatch(
        match,
        puuid,
        name,
        tag
      );

    if (!player) {
      continue;
    }

    if (
      String(
        player.character || ''
      ).toLowerCase() !==
      String(
        agentRaw || ''
      ).toLowerCase()
    ) {
      continue;
    }

    const item =
      stats[mode];

    item.games++;

    const result =
      getTeamWon(
        match,
        player
      );

    if (result === true) {
      item.wins++;
    } else if (
      result === false
    ) {
      item.losses++;
    }

    item.kills +=
      Number(
        player.stats
          ?.kills || 0
      );

    item.deaths +=
      Number(
        player.stats
          ?.deaths || 0
      );

    item.assists +=
      Number(
        player.stats
          ?.assists || 0
      );

    item.score +=
      Number(
        player.stats
          ?.score || 0
      );
  }

  return stats;
}

function formatModeStats(
  stats
) {
  const entries =
    Object.entries(
      stats
    )
      .sort(
        (a, b) =>
          b[1].games -
          a[1].games
      )
      .slice(0, 10);

  if (!entries.length) {
    return '目前沒有可用的模式資料。';
  }

  return entries
    .map(
      ([modeRaw, data]) => {
        const mode =
          modeNamesZH[
            modeRaw
          ] ||
          modeRaw;

        const winRate =
          data.games > 0
            ? (
                (data.wins /
                  data.games) *
                100
              ).toFixed(1)
            : '0.0';

        const kd =
          data.deaths > 0
            ? (
                data.kills /
                data.deaths
              ).toFixed(2)
            : data.kills.toFixed(
                2
              );

        const icon =
          getModeEmoji(
            modeRaw
          );

        const title =
          icon
            ? `${icon} **${mode}**`
            : `**${mode}**`;

        return [
          title,
          `場次：${data.games}　勝率：${winRate}%`,
          `勝：${data.wins}　敗：${data.losses}　K/D：${kd}`
        ].join('\n');
      }
    )
    .join('\n\n');
}

function formatAgentStats(
  stats
) {
  const entries =
    Object.entries(
      stats
    )
      .sort(
        (a, b) =>
          b[1].games -
          a[1].games
      )
      .slice(0, 10);

  if (!entries.length) {
    return '目前沒有可用的特務資料。';
  }

  return entries
    .map(
      ([agentRaw, data]) => {
        const agent =
          getAgentName(
            agentRaw
          );

        const winRate =
          data.games > 0
            ? (
                (data.wins /
                  data.games) *
                100
              ).toFixed(1)
            : '0.0';

        const kd =
          data.deaths > 0
            ? (
                data.kills /
                data.deaths
              ).toFixed(2)
            : data.kills.toFixed(
                2
              );

        const avgScore =
          data.games > 0
            ? Math.round(
                data.score /
                  data.games
              )
            : 0;

        const icon =
          getAgentEmoji(
            agentRaw
          );

        const title =
          icon
            ? `${icon} **${agent}**`
            : `**${agent}**`;

        return [
          title,
          `場次：${data.games}　勝率：${winRate}%`,
          `K/D：${kd}　平均戰鬥分數：${avgScore}`
        ].join('\n');
      }
    )
    .join('\n\n');
}

function formatAgentModeStats(
  modeRaw,
  data
) {
  const mode =
    modeNamesZH[
      modeRaw
    ] ||
    modeRaw;

  const icon =
    getModeEmoji(
      modeRaw
    );

  const title =
    icon
      ? `${icon} **${mode}**`
      : `**${mode}**`;

  if (
    !data ||
    data.games === 0
  ) {
    return [
      title,
      '沒有使用此特務的對戰資料。'
    ].join('\n');
  }

  const winRate =
    (
      (data.wins /
        data.games) *
      100
    ).toFixed(1);

  const kd =
    data.deaths > 0
      ? (
          data.kills /
          data.deaths
        ).toFixed(2)
      : data.kills.toFixed(
          2
        );

  const kda =
    data.deaths > 0
      ? (
          (data.kills +
            data.assists) /
          data.deaths
        ).toFixed(2)
      : (
          data.kills +
          data.assists
        ).toFixed(2);

  const avgKills =
    (
      data.kills /
      data.games
    ).toFixed(1);

  const avgDeaths =
    (
      data.deaths /
      data.games
    ).toFixed(1);

  const avgAssists =
    (
      data.assists /
      data.games
    ).toFixed(1);

  const avgScore =
    Math.round(
      data.score /
        data.games
    );

  return [
    title,
    `場次：${data.games}`,
    `勝：${data.wins}　敗：${data.losses}`,
    `勝率：${winRate}%`,
    `擊殺：${data.kills}　死亡：${data.deaths}　助攻：${data.assists}`,
    `K/D：${kd}　KDA：${kda}`,
    `平均擊殺：${avgKills}　平均死亡：${avgDeaths}　平均助攻：${avgAssists}`,
    `平均戰鬥分數：${avgScore}`
  ].join('\n');
}

function getModeEmbed(data) {
  return new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle(
      `模式勝率：${data.name}#${data.tag}`
    )
    .setDescription(
      formatModeStats(
        data.modeStats
      )
    )
    .setFooter({
      text:
        `統計最近 ${data.matches.length} 場對戰`
    });
}

function getAgentEmbed(data) {
  return new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle(
      `特務數據：${data.name}#${data.tag}`
    )
    .setDescription(
      formatAgentStats(
        data.agentStats
      )
    )
    .setFooter({
      text:
        `統計最近 ${data.matches.length} 場對戰`
    });
}

function getAgentDetailEmbed(
  data,
  agentRaw
) {
  const agentName =
    getAgentName(
      agentRaw
    );

  const modeStats =
    calculateAgentModeStats(
      data.matches,
      data.puuid,
      data.name,
      data.tag,
      agentRaw
    );

  const agentEmoji =
    getAgentEmoji(
      agentRaw
    );

  const title =
    agentEmoji
      ? `${agentEmoji} ${agentName} 對戰資料：${data.name}#${data.tag}`
      : `${agentName} 對戰資料：${data.name}#${data.tag}`;

  const embed =
    new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(title)
      .setDescription(
        [
          formatAgentModeStats(
            'Competitive',
            modeStats.Competitive
       
