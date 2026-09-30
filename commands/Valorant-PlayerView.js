const {
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const ValorantAPI = require('unofficial-valorant-api');
const { getArgs } = require('../functions/getArgs');
const assets = require('../assets.json');
require('dotenv').config();

const apiKey =
  process.env.HENRIK_API_KEY ||
  process.env.VALORANT_API_KEY;

const VAPI = new ValorantAPI(apiKey);

const rankNamesZH = {
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
  'Gauntlet: Glitched': '大亂鬥：異常',
  Snowball: '雪球大戰'
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
  Vyse: '維斯',
  Omen: '歐門',
  Brimstone: '布史東',
  Viper: '薇蝮',
  Astra: '亞星卓',
  Harbor: '哈泊',
  Clove: '科芙',
  Sova: '蘇法',
  Breach: '叛奇',
  Skye: '斯凱',
  'KAY/O': 'KAY/O',
  Fade: '菲德',
  Gekko: '蓋克',
  Tejo: '戴侯',
  Miks: '米克什',
  Waylay: '維蕾'
};

function getApiData(response) {
  if (!response) return null;

  if (
    response.data &&
    typeof response.data === 'object' &&
    response.data.data !== undefined
  ) {
    return response.data.data;
  }

  if (response.data !== undefined) {
    return response.data;
  }

  return response;
}

function getAssetUrl(type, key) {
  if (!key) return null;

  const normalizedKey = String(key).trim();
  const lowerKey = normalizedKey.toLowerCase();

  const groups = [];

  if (assets && typeof assets === 'object') {
    if (assets[type]) groups.push(assets[type]);
    if (assets[type?.toLowerCase()]) {
      groups.push(assets[type.toLowerCase()]);
    }

    if (type === 'agent' && assets.agents) {
      groups.push(assets.agents);
    }

    if (type === 'mode' && assets.modes) {
      groups.push(assets.modes);
    }

    if (type === 'rank' && assets.ranks) {
      groups.push(assets.ranks);
    }
  }

  groups.push(assets);

  for (const group of groups) {
    if (!group || typeof group !== 'object') continue;

    const possibleKeys = [
      normalizedKey,
      lowerKey,
      normalizedKey.replace(/\s+/g, ''),
      lowerKey.replace(/\s+/g, '')
    ];

    for (const possibleKey of possibleKeys) {
      if (group[possibleKey]) {
        const value = group[possibleKey];

        if (typeof value === 'string') {
          return value;
        }

        if (value && typeof value === 'object') {
          return (
            value.icon ||
            value.iconUrl ||
            value.image ||
            value.imageUrl ||
            value.displayIcon ||
            value.small ||
            value.large ||
            null
          );
        }
      }
    }
  }

  return null;
}

function getAgentIcon(agentRaw) {
  return getAssetUrl('agent', agentRaw);
}

function getModeIcon(modeRaw) {
  return getAssetUrl('mode', modeRaw);
}

function getRankIcon(mmr) {
  const currentData =
    mmr?.current_data ||
    mmr?.currentData ||
    {};

  if (currentData.images) {
    return (
      currentData.images.small ||
      currentData.images.large ||
      currentData.images.icon ||
      null
    );
  }

  return (
    getAssetUrl('rank', currentData.currenttierpatched) ||
    getAssetUrl('rank', currentData.currenttier)
  );
}

function getPlayerAvatar(account) {
  return (
    account?.card?.small ||
    account?.data?.card?.small ||
    account?.card?.large ||
    account?.data?.card?.large ||
    null
  );
}

function getRankName(mmr) {
  return (
    mmr?.current_data?.currenttierpatched ||
    mmr?.current_data?.currenttier ||
    mmr?.currenttierpatched ||
    mmr?.currenttier ||
    '未定級'
  );
}

function getElo(mmr) {
  return (
    mmr?.current_data?.elo ??
    mmr?.current_data?.mmr ??
    mmr?.elo ??
    '未知'
  );
}

function getRR(mmr) {
  return (
    mmr?.current_data?.ranking_in_tier ??
    mmr?.current_data?.rankingInTier ??
    mmr?.ranking_in_tier ??
    '未知'
  );
}

function getLastRRChange(mmr) {
  return (
    mmr?.current_data?.last_change ??
    mmr?.current_data?.lastChange ??
    mmr?.last_change ??
    '未知'
  );
}

function getHighestRank(mmr) {
  const highest =
    mmr?.highest_rank ||
    mmr?.highestRank ||
    mmr?.highest_rank_tier ||
    null;

  return highest || '未知';
}

function getHighestSeason(mmr) {
  return (
    mmr?.highest_rank?.season ||
    mmr?.highestRank?.season ||
    mmr?.highest_rank_season ||
    '未知'
  );
}

function getPlayerName(account) {
  const name =
    account?.name ||
    account?.data?.name ||
    '未知';

  const tag =
    account?.tag ||
    account?.data?.tag ||
    '';

  return tag ? `${name}#${tag}` : name;
}

function getRegion(account, fallbackRegion) {
  return (
    account?.region ||
    account?.data?.region ||
    fallbackRegion ||
    '未知'
  ).toLowerCase();
}

function getMatchData(match) {
  return (
    match?.data ||
    match
  );
}

function getMatchPlayer(match, puuid) {
  const data = getMatchData(match);

  const players =
    data?.players ||
    data?.players?.all_players ||
    data?.players?.allPlayers ||
    [];

  if (!Array.isArray(players)) return null;

  return (
    players.find(player =>
      player?.puuid === puuid
    ) ||
    players.find(player =>
      player?.subject === puuid
    ) ||
    null
  );
}

function getMatchMode(match) {
  const data = getMatchData(match);

  return (
    data?.metadata?.mode ||
    data?.metadata?.game_mode ||
    data?.metadata?.queue ||
    data?.mode ||
    'Unknown'
  );
}

function getMatchWinner(match) {
  const data = getMatchData(match);

  return (
    data?.teams ||
    {}
  );
}

function getPlayerKills(player) {
  return Number(
    player?.stats?.kills ??
    player?.kills ??
    0
  );
}

function getPlayerDeaths(player) {
  return Number(
    player?.stats?.deaths ??
    player?.deaths ??
    0
  );
}

function getPlayerAssists(player) {
  return Number(
    player?.stats?.assists ??
    player?.assists ??
    0
  );
}

function getPlayerScore(player) {
  return Number(
    player?.stats?.score ??
    player?.score ??
    0
  );
}

function getPlayerAgent(player) {
  return (
    player?.character ||
    player?.agent ||
    player?.character_name ||
    player?.agent_name ||
    'Unknown'
  );
}

function isPlayerWin(match, player) {
  const data = getMatchData(match);

  const team =
    player?.team?.toLowerCase();

  if (!team) return false;

  const teams =
    data?.teams ||
    {};

  const teamData =
    teams[team];

  if (teamData?.won !== undefined) {
    return Boolean(teamData.won);
  }

  if (teamData?.win !== undefined) {
    return Boolean(teamData.win);
  }

  return false;
}

function calculateModeStats(matches, puuid) {
  const stats = {};

  for (const match of matches || []) {
    const player = getMatchPlayer(match, puuid);

    if (!player) continue;

    const modeRaw = getMatchMode(match);
    const mode = modeNamesZH[modeRaw] || modeRaw;

    if (!stats[modeRaw]) {
      stats[modeRaw] = {
        name: mode,
        games: 0,
        wins: 0,
        losses: 0,
        kills: 0,
        deaths: 0,
        assists: 0
      };
    }

    const item = stats[modeRaw];

    item.games++;

    if (isPlayerWin(match, player)) {
      item.wins++;
    } else {
      item.losses++;
    }

    item.kills += getPlayerKills(player);
    item.deaths += getPlayerDeaths(player);
    item.assists += getPlayerAssists(player);
  }

  return stats;
}

function calculateAgentStats(matches, puuid) {
  const stats = {};

  for (const match of matches || []) {
    const player = getMatchPlayer(match, puuid);

    if (!player) continue;

    const agentRaw = getPlayerAgent(player);

    if (!stats[agentRaw]) {
      stats[agentRaw] = {
        name: agentNamesZH[agentRaw] || agentRaw,
        games: 0,
        wins: 0,
        losses: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        score: 0
      };
    }

    const item = stats[agentRaw];

    item.games++;

    if (isPlayerWin(match, player)) {
      item.wins++;
    } else {
      item.losses++;
    }

    item.kills += getPlayerKills(player);
    item.deaths += getPlayerDeaths(player);
    item.assists += getPlayerAssists(player);
    item.score += getPlayerScore(player);
  }

  return stats;
}

function calculateAgentModeStats(matches, puuid, agentRaw) {
  const stats = {};

  for (const match of matches || []) {
    const player = getMatchPlayer(match, puuid);

    if (!player) continue;

    const currentAgent = getPlayerAgent(player);

    if (
      String(currentAgent).toLowerCase() !==
      String(agentRaw).toLowerCase()
    ) {
      continue;
    }

    const modeRaw = getMatchMode(match);

    if (
      modeRaw !== 'Competitive' &&
      modeRaw !== 'Unrated'
    ) {
      continue;
    }

    if (!stats[modeRaw]) {
      stats[modeRaw] = {
        name:
          modeNamesZH[modeRaw] ||
          modeRaw,
        games: 0,
        wins: 0,
        losses: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        score: 0
      };
    }

    const item = stats[modeRaw];

    item.games++;

    if (isPlayerWin(match, player)) {
      item.wins++;
    } else {
      item.losses++;
    }

    item.kills += getPlayerKills(player);
    item.deaths += getPlayerDeaths(player);
    item.assists += getPlayerAssists(player);
    item.score += getPlayerScore(player);
  }

  return stats;
}

function getWinRate(item) {
  if (!item || !item.games) return 0;

  return (
    item.wins /
    item.games *
    100
  );
}

function getKD(item) {
  if (!item || !item.deaths) {
    if (item?.kills > 0) {
      return item.kills.toFixed(2);
    }

    return '0.00';
  }

  return (
    item.kills /
    item.deaths
  ).toFixed(2);
}

function getKDA(item) {
  if (!item || !item.games) {
    return '0.00';
  }

  return (
    (item.kills +
      item.assists) /
    Math.max(item.deaths, 1)
  ).toFixed(2);
}

function getAverage(item, key) {
  if (!item || !item.games) {
    return 0;
  }

  return (
    item[key] /
    item.games
  );
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-US');
}

function formatModeStats(stats) {
  const entries = Object.entries(stats || {});

  if (!entries.length) {
    return '目前沒有可用的模式資料。';
  }

  return entries
    .sort((a, b) =>
      b[1].games - a[1].games
    )
    .map(([raw, item]) => {
      const icon =
        getModeIcon(raw);

      const title = icon
        ? `${icon} **${item.name}**`
        : `**${item.name}**`;

      return [
        title,
        `場次：${item.games}`,
        `勝率：${getWinRate(item).toFixed(1)}%`,
        `勝：${item.wins}　敗：${item.losses}`,
        `K/D：${getKD(item)}`
      ].join('\n');
    })
    .join('\n\n');
}

function formatAgentStats(stats) {
  const entries = Object.entries(stats || {});

  if (!entries.length) {
    return '目前沒有可用的特務資料。';
  }

  return entries
    .sort((a, b) =>
      b[1].games - a[1].games
    )
    .map(([raw, item]) => {
      const icon =
        getAgentIcon(raw);

      const title = icon
        ? `${icon} **${item.name}**`
        : `**${item.name}**`;

      return [
        title,
        `場次：${item.games}`,
        `勝率：${getWinRate(item).toFixed(1)}%`,
        `勝：${item.wins}　敗：${item.losses}`,
        `K/D：${getKD(item)}`,
        `平均戰鬥分數：${Math.round(getAverage(item, 'score'))}`
      ].join('\n');
    })
    .join('\n\n');
}

function formatAgentModeStats(stats) {
  const entries = Object.entries(stats || {});

  if (!entries.length) {
    return '目前沒有此特務的競技模式或一般模式資料。';
  }

  return entries
    .sort((a, b) =>
      b[1].games - a[1].games
    )
    .map(([raw, item]) => {
      const icon =
        getModeIcon(raw);

      const title = icon
        ? `${icon} **${item.name}**`
        : `**${item.name}**`;

      return [
        title,
        `場次：${item.games}`,
        `勝率：${getWinRate(item).toFixed(1)}%`,
        `勝：${item.wins}　敗：${item.losses}`,
        `擊殺：${item.kills}`,
        `死亡：${item.deaths}`,
        `助攻：${item.assists}`,
        `K/D：${getKD(item)}`,
        `KDA：${getKDA(item)}`,
        `平均擊殺：${getAverage(item, 'kills').toFixed(2)}`,
        `平均死亡：${getAverage(item, 'deaths').toFixed(2)}`,
        `平均助攻：${getAverage(item, 'assists').toFixed(2)}`,
        `平均戰鬥分數：${Math.round(getAverage(item, 'score'))}`
      ].join('\n');
    })
    .join('\n\n');
}
function createPageButtons(userId) {
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

  return new ActionRowBuilder().addComponents(
    pages.map(page =>
      new ButtonBuilder()
        .setCustomId(
          `valorant_info_${page.id}_${userId}`
        )
        .setLabel(page.label)
        .setStyle(ButtonStyle.Primary)
    )
  );
}

function createAgentButtons(agentStats, userId) {
  const topAgents = Object.entries(
    agentStats || {}
  )
    .sort((a, b) =>
      b[1].games - a[1].games
    )
    .slice(0, 5);

  if (!topAgents.length) {
    return null;
  }

  return new ActionRowBuilder().addComponents(
    topAgents.map(([agentRaw, item]) =>
      new ButtonBuilder()
        .setCustomId(
          `valorant_agent_${encodeURIComponent(agentRaw)}_${userId}`
        )
        .setLabel(
          `${agentNamesZH[agentRaw] || agentRaw} 對戰資料`
        )
        .setStyle(ButtonStyle.Secondary)
    )
  );
}

function createAllRows(agentStats, userId) {
  const rows = [
    createPageButtons(userId)
  ];

  const agentRow =
    createAgentButtons(
      agentStats,
      userId
    );

  if (agentRow) {
    rows.push(agentRow);
  }

  return rows;
}

function getBasicEmbed(
  account,
  mmr,
  region
) {
  const playerName =
    getPlayerName(account);

  const puuid =
    account?.puuid ||
    account?.data?.puuid ||
    '未知';

  const avatar =
    getPlayerAvatar(account);

  const rankName =
    getRankName(mmr);

  const rankZH =
    rankNamesZH[rankName] ||
    rankName;

  const rankIcon =
    getRankIcon(mmr);

  const regionRaw =
    getRegion(
      account,
      region
    );

  const regionZH =
    regionNamesZH[regionRaw] ||
    regionRaw.toUpperCase();

  const embed =
    new EmbedBuilder()
      .setTitle('特戰查詢玩家資訊')
      .setDescription(
        `**${playerName}**`
      )
      .addFields(
        {
          name: '區域',
          value: regionZH,
          inline: true
        },
        {
          name: '目前牌位',
          value: rankZH,
          inline: true
        },
        {
          name: 'PUUID',
          value: `\`${puuid}\``,
          inline: false
        }
      );

  if (avatar) {
    embed.setThumbnail(avatar);
  }

  if (rankIcon) {
    embed.setImage(rankIcon);
  }

  return embed;
}

function getRankEmbed(
  account,
  mmr
) {
  const playerName =
    getPlayerName(account);

  const rankName =
    getRankName(mmr);

  const rankZH =
    rankNamesZH[rankName] ||
    rankName;

  const elo =
    getElo(mmr);

  const rr =
    getRR(mmr);

  const lastRR =
    getLastRRChange(mmr);

  const highest =
    getHighestRank(mmr);

  const highestZH =
    rankNamesZH[highest] ||
    highest;

  const highestSeason =
    getHighestSeason(mmr);

  const rankIcon =
    getRankIcon(mmr);

  const embed =
    new EmbedBuilder()
      .setTitle('牌階資訊')
      .setDescription(
        `**${playerName}**`
      )
      .addFields(
        {
          name: '目前牌位',
          value: rankZH,
          inline: true
        },
        {
          name: 'ELO',
          value: String(elo),
          inline: true
        },
        {
          name: 'RR',
          value: String(rr),
          inline: true
        },
        {
          name: '上場 RR 變化',
          value: String(lastRR),
          inline: true
        },
        {
          name: '最高牌位',
          value: highestZH,
          inline: true
        },
        {
          name: '最高牌位賽季',
          value: String(highestSeason),
          inline: true
        }
      );

  if (rankIcon) {
    embed.setThumbnail(rankIcon);
  }

  return embed;
}

function getModeEmbed(
  account,
  modeStats
) {
  const playerName =
    getPlayerName(account);

  return new EmbedBuilder()
    .setTitle('模式勝率')
    .setDescription(
      `**${playerName}**\n\n${formatModeStats(modeStats)}`
    );
}

function getAgentEmbed(
  account,
  agentStats
) {
  const playerName =
    getPlayerName(account);

  return new EmbedBuilder()
    .setTitle('特務數據')
    .setDescription(
      `**${playerName}**\n\n${formatAgentStats(agentStats)}`
    );
}

function getAgentDetailEmbed(
  account,
  agentRaw,
  agentModeStats
) {
  const playerName =
    getPlayerName(account);

  const agentName =
    agentNamesZH[agentRaw] ||
    agentRaw;

  const agentIcon =
    getAgentIcon(agentRaw);

  const title =
    agentIcon
      ? `${agentIcon} ${agentName} 對戰資料`
      : `${agentName} 對戰資料`;

  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(
      `**${playerName}**\n\n${formatAgentModeStats(agentModeStats)}`
    );
}

function getEmbed(
  page,
  account,
  mmr,
  modeStats,
  agentStats,
  region
) {
  switch (page) {
    case 'rank':
      return getRankEmbed(
        account,
        mmr
      );

    case 'mode':
      return getModeEmbed(
        account,
        modeStats
      );

    case 'agent':
      return getAgentEmbed(
        account,
        agentStats
      );

    case 'basic':
    default:
      return getBasicEmbed(
        account,
        mmr,
        region
      );
  }
}

async function getAccountData(
  name,
  tag
) {
  const response =
    await VAPI.getAccount({
      name,
      tag
    });

  return getApiData(response);
}

async function getMMRData(
  account,
  region,
  name,
  tag
) {
  const puuid =
    account?.puuid ||
    account?.data?.puuid;

  let response;

  if (puuid) {
    response =
      await VAPI.getMMRByPUUID({
        version: 'v2',
        region,
        puuid
      });
  } else {
    response =
      await VAPI.getMMR({
        version: 'v2',
        region,
        name,
        tag
      });
  }

  return getApiData(response);
}

async function getMatchesData(
  account,
  region,
  name,
  tag
) {
  const puuid =
    account?.puuid ||
    account?.data?.puuid;

  let response;

  if (puuid) {
    response =
      await VAPI.getMatchesByPUUID({
        region,
        puuid,
        size: 20
      });
  } else {
    response =
      await VAPI.getMatches({
        region,
        name,
        tag,
        size: 20
      });
  }

  const data =
    getApiData(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.matches)) {
    return data.matches;
  }

  return [];
}

async function disableButtons(
  message,
  userId
) {
  try {
    const disabledPageRow =
      new ActionRowBuilder().addComponents(
        [
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
        ].map(page =>
          new ButtonBuilder()
            .setCustomId(
              `valorant_info_${page.id}_${userId}`
            )
            .setLabel(page.label)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true)
        )
      );

    const rows = [
      disabledPageRow
    ];

    const components =
      message.components || [];

    if (components.length > 1) {
      const oldAgentRow =
        components[1];

      const disabledAgentButtons =
        oldAgentRow.components.map(
          button =>
            new ButtonBuilder()
              .setCustomId(
                button.customId
              )
              .setLabel(
                button.label
              )
              .setStyle(
                ButtonStyle.Secondary
              )
              .setDisabled(true)
        );

      rows.push(
        new ActionRowBuilder()
          .addComponents(
            disabledAgentButtons
          )
      );
    }

    await message.edit({
      components: rows
    });
  } catch (error) {
    console.error(
      '[VALORANT 按鈕停用錯誤]:',
      error
    );
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('特戰查詢玩家資訊')
    .setDescription(
      '查詢 VALORANT 玩家資訊、牌階、模式勝率與特務數據'
    )
    .addStringOption(option =>
      option
        .setName('玩家名稱-標籤')
        .setDescription(
          '例如：eric0517#7632'
        )
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('region')
        .setDescription(
          '選擇 VALORANT 區域'
        )
        .setRequired(false)
        .addChoices(
          {
            name: '亞太區',
            value: 'ap'
          },
          {
            name: '北美區',
            value: 'na'
          },
          {
            name: '歐洲區',
            value: 'eu'
          },
          {
            name: '韓國區',
            value: 'kr'
          }
        )
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      if (!apiKey) {
        return await interaction.editReply({
          content:
            '<a:cross:1535233642312507443> 尚未設定 VALORANT API Key。'
        });
      }

      let input =
        interaction.options.getString(
          '玩家名稱-標籤'
        );

      const region =
        interaction.options.getString(
          'region'
        ) || 'ap';

      if (!input) {
        const args =
          getArgs(interaction);

        if (
          Array.isArray(args) &&
          args.length
        ) {
          input = args.join(' ');
        }
      }

      if (!input) {
        return await interaction.editReply({
          content:
            '<a:cross:1535233642312507443> 請輸入玩家名稱與標籤，例如：`eric0517#7632`'
        });
      }

      input =
        String(input)
          .trim()
          .replace(/^["']|["']$/g, '');

      const separatorIndex =
        input.lastIndexOf('#');

      if (separatorIndex <= 0) {
        return await interaction.editReply({
          content:
            '<a:cross:1535233642312507443> 玩家名稱格式錯誤，請使用 `玩家名稱#標籤`，例如：`eric0517#7632`'
        });
      }

      const name =
        input
          .slice(0, separatorIndex)
          .trim();

      const tag =
        input
          .slice(separatorIndex + 1)
          .trim();

      if (!name || !tag) {
        return await interaction.editReply({
          content:
            '<a:cross:1535233642312507443> 玩家名稱格式錯誤，請使用 `玩家名稱#標籤`，例如：`eric0517#7632`'
        });
      }

      const account =
        await getAccountData(
          name,
          tag
        );

      if (!account) {
        return await interaction.editReply({
          content:
            '<a:cross:1535233642312507443> 找不到此 Riot ID，請確認玩家名稱與標籤是否正確。'
        });
      }

      const accountName =
        account.name ||
        account.data?.name ||
        name;

      const accountTag =
        account.tag ||
        account.data?.tag ||
        tag;

      const puuid =
        account.puuid ||
        account.data?.puuid;

      if (!puuid) {
        return await interaction.editReply({
          content:
            '<a:cross:1535233642312507443> 無法取得此玩家的 PUUID。'
        });
      }

      const mmr =
        await getMMRData(
          account,
          region,
          accountName,
          accountTag
        );

      const matches =
        await getMatchesData(
          account,
          region,
          accountName,
          accountTag
        );

      const modeStats =
        calculateModeStats(
          matches,
          puuid
        );

      const agentStats =
        calculateAgentStats(
          matches,
          puuid
        );

      const embed =
        getEmbed(
          'basic',
          account,
          mmr,
          modeStats,
          agentStats,
          region
        );

      const rows =
        createAllRows(
          agentStats,
          interaction.user.id
        );

      const message =
        await interaction.editReply({
          embeds: [embed],
          components: rows
        });

      const collector =
        message.createMessageComponentCollector({
          time: 15 * 60 * 1000,

          filter: buttonInteraction =>
            buttonInteraction.user.id ===
            interaction.user.id
        });

      collector.on(
        'collect',
        async buttonInteraction => {
          try {
            const customId =
              buttonInteraction.customId;

            if (
              customId.startsWith(
                'valorant_info_'
              )
            ) {
              const parts =
                customId.split('_');

              const page =
                parts[2];

              await buttonInteraction.deferUpdate();

              const newEmbed =
                getEmbed(
                  page,
                  account,
                  mmr,
                  modeStats,
                  agentStats,
                  region
                );

              await buttonInteraction.message.edit({
                embeds: [newEmbed],
                components:
                  createAllRows(
                    agentStats,
                    interaction.user.id
                  )
              });

              return;
            }

            if (
              customId.startsWith(
                'valorant_agent_'
              )
            ) {
              const prefix =
                'valorant_agent_';

              const content =
                customId.slice(
                  prefix.length
                );

              const lastUnderscore =
                content.lastIndexOf('_');

              if (
                lastUnderscore === -1
              ) {
                return;
              }

              const encodedAgent =
                content.slice(
                  0,
                  lastUnderscore
                );

              const agentUserId =
                content.slice(
                  lastUnderscore + 1
                );

              if (
                agentUserId !==
                interaction.user.id
              ) {
                return;
              }

              const agentRaw =
                decodeURIComponent(
                  encodedAgent
                );

              await buttonInteraction.deferUpdate();

              const agentModeStats =
                calculateAgentModeStats(
                  matches,
                  puuid,
                  agentRaw
                );

              const newEmbed =
                getAgentDetailEmbed(
                  account,
                  agentRaw,
                  agentModeStats
                );

              await buttonInteraction.message.edit({
                embeds: [newEmbed],
                components:
                  createAllRows(
                    agentStats,
                    interaction.user.id
                  )
              });
            }
          } catch (error) {
            console.error(
              '[VALORANT 按鈕錯誤]:',
              error
            );

            try {
              if (
                !buttonInteraction.replied &&
                !buttonInteraction.deferred
              ) {
                await buttonInteraction.reply({
                  content:
                    '<a:cross:1535233642312507443> 載入資料時發生錯誤。',
                  ephemeral: true
                });
              }
            } catch {}
          }
        }
      );

      collector.on(
        'end',
        async () => {
          await disableButtons(
            message,
            interaction.user.id
          );
        }
      );
    } catch (error) {
      console.error(
        '[特戰查詢玩家資訊錯誤]:',
        error
      );

      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        '未知錯誤';

      try {
        await interaction.editReply({
          content:
            `<a:cross:1535233642312507443> 查詢玩家資料時發生錯誤。\n\`${errorMessage}\``,
          embeds: [],
          components: []
        });
      } catch (replyError) {
        console.error(
          '[特戰查詢玩家資訊回覆錯誤]:',
          replyError
        );
      }
    }
  }
};
